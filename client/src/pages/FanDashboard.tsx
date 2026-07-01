import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:4000';

export default function FanDashboard() {
  const [session, setSession] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [currentPoolId, setCurrentPoolId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<any>({ rank: null, totalFans: 0, formatted: '0m' });

  useEffect(() => {
    // Mock session
    setSession({ displayName: 'Mock Fan' });

    // Mock pools
    setPools([
      { id: 1, title: 'Summer Drop Reward Campaign', artistName: 'Awesome Artist', artistVerified: true, topN: 10, totalReward: 1.5, currency: 'SOL', participants: 450, endsAt: new Date(Date.now() + 86400000 * 12).toISOString(), rewardType: 'Crypto token' },
      { id: 2, title: 'Early Access NFT Giveaway', artistName: 'Cool Band', artistVerified: false, topN: 50, totalReward: 50, currency: 'NFTs', participants: 1200, endsAt: new Date(Date.now() + 86400000 * 5).toISOString(), rewardType: 'NFT' }
    ]);
    
  }, []);

  const handleJoinPool = (poolId: number, poolName: string) => {
    setCurrentPoolId(poolId);
    
    // Mock leaderboard data
    const mockRankings = Array.from({ length: 10 }).map((_, i) => ({
      rank: i + 1,
      displayName: `Fan ${i + 1}`,
      score: 10000 - (i * 500)
    }));
    
    // Make myself rank 3
    mockRankings[2].displayName = session?.displayName || 'Mock Fan';
    
    setLeaderboard(mockRankings);
    setMyRankInfo({
      rank: 3,
      totalFans: 450,
      formatted: '2h 30m'
    });
  };

  const handleSync = () => {
    if (!currentPoolId) return alert('Join a pool first to sync listening time.');
    // Mock sync
    setMyRankInfo(prev => ({
        ...prev,
        formatted: '3h 15m',
        rank: 2
    }));
    const newLb = [...leaderboard];
    if(newLb[1]) newLb[1].displayName = session?.displayName || 'Mock Fan';
    setLeaderboard(newLb);
  };

  const currentPool = pools.find(p => p.id === currentPoolId);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sb-logo">Rankr</div>
        <nav className="sb-nav">
          <a className="sb-link active" href="#">
            <span className="sb-dot"></span> Dashboard
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Active Pools
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> My Rankings
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Rewards
          </a>
        </nav>
        <div className="sb-footer">
          <div className="sb-profile">
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${session?.displayName || 'Fan'}`} className="sb-avatar" alt="Avatar" />
            <div>
              <div className="sb-name" id="fanName">{session?.displayName || 'Loading...'}</div>
              <div className="sb-role"><span className="premium-badge">✓ Premium</span></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>Fan Dashboard</h1>
          <button className="btn btn-green" onClick={handleSync}>⟳ Sync listening</button>
        </div>

        <div className="content">
          <div className="rank-hero">
            <div className="rank-stat">
              <div className="rank-stat-val" id="totalPools">{pools.length}</div>
              <div className="rank-stat-label">Pools available</div>
            </div>
            <div className="rank-main">
              <div className="rank-label">Your best rank</div>
              <div className="rank-num" id="bestRank">{myRankInfo.rank ? `#${myRankInfo.rank}` : '—'}</div>
              <div className="rank-sub" id="rankSub">{myRankInfo.rank ? `out of ${myRankInfo.totalFans} fans` : 'Join a pool to start'}</div>
            </div>
            <div className="rank-stat">
              <div className="rank-stat-val" id="totalTime">{myRankInfo.formatted}</div>
              <div className="rank-stat-label">Total stream time</div>
            </div>
          </div>

          <div className="section-title">Active pools</div>
          <div className="pools-grid" id="poolsGrid">
            {pools.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '.875rem', padding: '1rem 0' }}>Loading pools...</div>
            ) : (
              pools.map(pool => {
                const ends = new Date(pool.endsAt);
                const daysLeft = Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="pool-card" key={pool.id}>
                    <div className="pool-card-header">
                      <div>
                        <div className="pool-artist">{pool.artistName} {pool.artistVerified && '✓'}</div>
                        <div className="pool-title">{pool.title}</div>
                      </div>
                      <span className="live-dot">Live</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div className="pool-reward">{pool.totalReward} {pool.currency}</div>
                        <div className="pool-reward-label">Total reward pool</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--muted)' }}>
                        Top {pool.topN} win<br/>{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                      </div>
                    </div>
                    <div className="pool-meta">
                      <span>{pool.participants} participants</span>
                      <span>{pool.rewardType}</span>
                    </div>
                    <button className="btn btn-green join-btn" onClick={() => handleJoinPool(pool.id, pool.title)}>
                      {currentPoolId === pool.id ? 'Viewing leaderboard' : 'Join & view leaderboard'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="section-title">
            Live leaderboard — <span id="lbPoolName" style={{ color: 'var(--gold)' }}>{currentPool ? currentPool.title : 'select a pool'}</span>
          </div>
          <div className="lb-card">
            <div className="lb-header">
              <span className="lb-title">Rankings</span>
              <span className="live-dot">Live</span>
            </div>
            <div id="leaderboard">
              {leaderboard.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem' }}>
                  Join a pool to see rankings
                </div>
              ) : (
                leaderboard.map((fan) => {
                  const maxScore = leaderboard[0]?.score || 1;
                  const isMe = fan.rank === myRankInfo.rank;
                  const barPct = Math.round((fan.score / maxScore) * 100);
                  const hrs = Math.floor(fan.score / 3600);
                  const mins = Math.floor((fan.score % 3600) / 60);
                  const time = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                  return (
                    <div className={`lb-row ${isMe ? 'is-me' : ''}`} key={fan.rank}>
                      <div className="lb-rank">{fan.rank}</div>
                      <div className="lb-name">
                        {fan.displayName}
                        {isMe && <span className="lb-you">YOU</span>}
                      </div>
                      <div className="lb-time">{time}</div>
                      <div className="lb-bar-wrap">
                        <div className="lb-bar" style={{ width: `${barPct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
