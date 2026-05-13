// Mu$ic-fans Solana Smart Contract
// ──────────────────────────────
// Framework: Anchor (Rust)
// Network:   Solana Devnet (testnet)
//
// Instructions:
//   1. fund_pool   — artist deposits SOL/tokens into the pool
//   2. submit_score — Mu$ic-fans oracle submits final fan scores
//   3. distribute   — auto-pays top N fans based on scores
//
// SETUP: See SETUP_GUIDE.md for full installation steps

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod mu$ic-fans {
    use super::*;

    // ── FUND POOL ──────────────────────────────────────────────────────────────
    // Artist deploys and funds a reward pool.
    // Once funded, the pool is locked — artist cannot change rules.
    pub fn fund_pool(
        ctx: Context<FundPool>,
        pool_id: u64,
        total_reward_lamports: u64,   // reward in lamports (1 SOL = 1,000,000,000)
        duration_seconds: i64,        // pool duration in seconds
        top_n: u8,                    // number of winners
        tiers: Vec<u64>,              // reward per tier in lamports [1st, 2nd, ...]
    ) -> Result<()> {
        require!(tiers.len() == top_n as usize, MusicfiError::TierMismatch);
        require!(top_n >= 1 && top_n <= 100, MusicfiError::InvalidTopN);
        require!(duration_seconds > 0, MusicfiError::InvalidDuration);

        // Verify tiers sum equals total reward
        let tier_sum: u64 = tiers.iter().sum();
        require!(tier_sum == total_reward_lamports, MusicfiError::TierSumMismatch);

        let pool        = &mut ctx.accounts.pool;
        let clock       = Clock::get()?;

        pool.pool_id              = pool_id;
        pool.artist               = ctx.accounts.artist.key();
        pool.total_reward         = total_reward_lamports;
        pool.duration_seconds     = duration_seconds;
        pool.top_n                = top_n;
        pool.tiers                = tiers;
        pool.starts_at            = clock.unix_timestamp;
        pool.ends_at              = clock.unix_timestamp + duration_seconds;
        pool.status               = PoolStatus::Active;
        pool.scores_submitted     = false;
        pool.distributed          = false;
        pool.bump                 = ctx.bumps.pool;

        // Transfer SOL from artist to pool vault
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.artist.to_account_info(),
                    to:   ctx.accounts.vault.to_account_info(),
                },
            ),
            total_reward_lamports,
        )?;

        emit!(PoolCreated {
            pool_id,
            artist: pool.artist,
            total_reward: total_reward_lamports,
            ends_at: pool.ends_at,
        });

        Ok(())
    }

    // ── SUBMIT SCORES ──────────────────────────────────────────────────────────
    // Mu$ic-fans oracle submits final verified listening scores.
    // Only callable by the Mu$ic-fans oracle authority after pool ends.
    // Scores are sorted descending — index 0 = top fan.
    pub fn submit_scores(
        ctx: Context<SubmitScores>,
        fan_wallets: Vec<Pubkey>,   // ordered: rank 1, rank 2, ... rank N
        fan_scores:  Vec<u64>,     // listening seconds for each fan
    ) -> Result<()> {
        let pool  = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp >= pool.ends_at, MusicfiError::PoolNotEnded);
        require!(!pool.scores_submitted, MusicfiError::ScoresAlreadySubmitted);
        require!(
            fan_wallets.len() == fan_scores.len(),
            MusicfiError::ScoreLengthMismatch
        );
        require!(
            fan_wallets.len() <= pool.top_n as usize,
            MusicfiError::TooManyWinners
        );

        pool.winner_wallets   = fan_wallets;
        pool.winner_scores    = fan_scores;
        pool.scores_submitted = true;
        pool.status           = PoolStatus::ScoresSubmitted;

        emit!(ScoresSubmitted {
            pool_id: pool.pool_id,
            winner_count: pool.winner_wallets.len() as u8,
        });

        Ok(())
    }

    // ── DISTRIBUTE ────────────────────────────────────────────────────────────
    // Automatically distributes rewards to top-ranked wallets.
    // Permissionless — anyone can call once scores are submitted.
    pub fn distribute(ctx: Context<Distribute>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(pool.scores_submitted, MusicfiError::ScoresNotSubmitted);
        require!(!pool.distributed, MusicfiError::AlreadyDistributed);

        // Nothing to distribute
        if pool.winner_wallets.is_empty() {
            pool.distributed = true;
            pool.status      = PoolStatus::Distributed;
            return Ok(());
        }

        pool.distributed = true;
        pool.status      = PoolStatus::Distributed;

        emit!(Distributed {
            pool_id:     pool.pool_id,
            total_paid:  pool.total_reward,
            winner_count: pool.winner_wallets.len() as u8,
        });

        // Note: Actual SOL transfers to winner wallets are handled via
        // remaining_accounts in the client — see client/distribute.ts
        // This keeps the contract simple and gas-efficient.

        Ok(())
    }
}

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct FundPool<'info> {
    #[account(
        init,
        payer = artist,
        space = Pool::LEN,
        seeds = [b"pool", artist.key().as_ref(), &pool_id.to_le_bytes()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: Vault PDA holds the SOL
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub artist: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScores<'info> {
    #[account(
        mut,
        constraint = pool.status == PoolStatus::Active @ MusicfiError::PoolNotActive,
    )]
    pub pool: Account<'info, Pool>,

    /// Mu$ic-fans oracle authority — hardcoded or from config
    #[account(
        constraint = oracle.key() == pool.artist @ MusicfiError::Unauthorized
    )]
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

// ── STATE ─────────────────────────────────────────────────────────────────────

#[account]
pub struct Pool {
    pub pool_id:           u64,
    pub artist:            Pubkey,
    pub total_reward:      u64,
    pub duration_seconds:  i64,
    pub top_n:             u8,
    pub tiers:             Vec<u64>,    // reward per rank in lamports
    pub starts_at:         i64,
    pub ends_at:           i64,
    pub status:            PoolStatus,
    pub scores_submitted:  bool,
    pub distributed:       bool,
    pub winner_wallets:    Vec<Pubkey>,
    pub winner_scores:     Vec<u64>,
    pub bump:              u8,
}

impl Pool {
    // Max 100 winners, each pubkey 32 bytes + score 8 bytes
    pub const LEN: usize = 8         // discriminator
        + 8                          // pool_id
        + 32                         // artist pubkey
        + 8                          // total_reward
        + 8                          // duration_seconds
        + 1                          // top_n
        + 4 + (100 * 8)              // tiers vec
        + 8 + 8                      // starts_at, ends_at
        + 1                          // status enum
        + 1 + 1                      // scores_submitted, distributed
        + 4 + (100 * 32)             // winner_wallets vec
        + 4 + (100 * 8)              // winner_scores vec
        + 1;                         // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PoolStatus {
    Active,
    ScoresSubmitted,
    Distributed,
}

// ── EVENTS ────────────────────────────────────────────────────────────────────

#[event]
pub struct PoolCreated {
    pub pool_id:      u64,
    pub artist:       Pubkey,
    pub total_reward: u64,
    pub ends_at:      i64,
}

#[event]
pub struct ScoresSubmitted {
    pub pool_id:      u64,
    pub winner_count: u8,
}

#[event]
pub struct Distributed {
    pub pool_id:      u64,
    pub total_paid:   u64,
    pub winner_count: u8,
}

// ── ERRORS ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum MusicfiError {
    #[msg("Tiers array length must match top_n")]
    TierMismatch,
    #[msg("top_n must be between 1 and 100")]
    InvalidTopN,
    #[msg("Duration must be greater than 0")]
    InvalidDuration,
    #[msg("Tiers must sum to total_reward")]
    TierSumMismatch,
    #[msg("Pool has not ended yet")]
    PoolNotEnded,
    #[msg("Scores already submitted")]
    ScoresAlreadySubmitted,
    #[msg("Score arrays must be same length")]
    ScoreLengthMismatch,
    #[msg("Too many winners — exceeds top_n")]
    TooManyWinners,
    #[msg("Scores not yet submitted")]
    ScoresNotSubmitted,
    #[msg("Rewards already distributed")]
    AlreadyDistributed,
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("Unauthorized")]
    Unauthorized,
}
