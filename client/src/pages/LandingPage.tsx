import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// --- Canvas Particles Background ---
const CanvasParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Init particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 1) * 0.8 - 0.2,
        color: Math.random() > 0.5 ? 'rgba(29, 185, 84, 0.4)' : 'rgba(200, 168, 75, 0.4)' // Green or Gold
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      });
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.8 }} />;
};

// --- Live Audio Visualizer ---
const AudioVis = () => (
  <span className="audio-visualizer"><span></span><span></span><span></span></span>
);

const SpotifyLogo = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="#1DB954" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicLogo = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="amGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FC3C44"/>
        <stop offset="100%" stopColor="#FF6B6B"/>
      </linearGradient>
    </defs>
    <path fill="url(#amGrad)" d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.156 4.043.328 3.34.71 2.167 1.366 1.379 2.323 1.03 3.63c-.149.552-.202 1.12-.22 1.687-.02.539-.017 1.081-.017 1.622v9.905c0 .554-.003 1.108.017 1.662.018.552.07 1.104.217 1.642.352 1.31 1.14 2.266 2.316 2.923.698.385 1.44.558 2.193.636.74.077 1.485.088 2.23.088h9.92c.555 0 1.11.003 1.665-.017.552-.018 1.104-.07 1.642-.217 1.31-.352 2.266-1.14 2.923-2.316.385-.698.558-1.44.636-2.193.077-.74.088-1.485.088-2.23V7.778c0-.555.003-1.11-.017-1.654zm-5.35 5.896l-5.498 3.146c-.284.162-.596.244-.907.244-.31 0-.623-.082-.907-.244L6.354 12.02a1.815 1.815 0 010-3.164l5.498-3.146c.57-.326 1.244-.326 1.814 0l5.498 3.146a1.815 1.815 0 010 3.164z"/>
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL ?? '';

export default function LandingPage() {
  const [isSwapped, setIsSwapped] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // --- Leaderboard Simulation ---
  const [liveLb, setLiveLb] = useState([
    { id: 1, rank: 1, name: '@phantom_wav', time: 174140, pct: 100, class: 'gold-row' },
    { id: 2, rank: 2, name: '@soulstream', time: 148140, pct: 85, class: 'silver-row' },
    { id: 3, rank: 3, name: '@realnightfm', time: 140040, pct: 79, class: 'bronze-row' },
    { id: 4, rank: 4, name: '@deepcuts_only', time: 112620, pct: 63, class: '' },
    { id: 5, rank: 5, name: '@loophead_99', time: 100920, pct: 56, class: '' },
    { id: 6, rank: 6, name: '@velvet_ears', time: 82080, pct: 46, class: '' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLb(prev => {
        let newLb = [...prev];
        // Pick a random streamer (not #1 to make overtakes possible)
        const idx = Math.floor(Math.random() * 5) + 1;
        newLb[idx].time += Math.floor(Math.random() * 6000) + 1000; // Add 16 to 116 mins
        
        // Re-sort and recalculate percentages
        newLb.sort((a, b) => b.time - a.time);
        const maxTime = newLb[0].time;
        newLb = newLb.map((u, i) => {
          let rowClass = '';
          if (i === 0) rowClass = 'gold-row';
          else if (i === 1) rowClass = 'silver-row';
          else if (i === 2) rowClass = 'bronze-row';
          
          return {
            ...u,
            rank: i + 1,
            pct: Math.floor((u.time / maxTime) * 100),
            class: rowClass
          };
        });
        return newLb;
      });
    }, 4000); // Simulate update every 4s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  // --- Scroll Effects ---
  useEffect(() => {
    const nav = document.getElementById("nav");
    const handleScroll = () => {
      nav?.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("visible"), i * 80);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    reveals.forEach((r) => observer.observe(r));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // --- Tilt Logic for Hero Area ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <>
    <nav id="nav">
      <div className="logo">Rankr</div>
      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#artists">For artists</a>
        <a href="#protocol">Protocol</a>
        <button className="btn-nav" onClick={() => setShowServiceModal(true)}>Launch app</button>
      </div>
    </nav>

    <section className="hero" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="hero-bg">
        <CanvasParticles />
      </div>

      <div className="hero-content" style={{ zIndex: 1 }}>
        <div className="hero-eyebrow">Built on Solana · Verified by Spotify</div>
        <h1>Stream.<br /><em className="shimmer-text">Rank.</em><br />Earn.</h1>
        <p className="hero-sub">
          Artists reward their biggest fans with real money. Stream more, rank
          higher, earn bigger. No gatekeepers. No guessing.
        </p>
        <div className="hero-ctas">
          <motion.button onClick={() => setShowServiceModal(true)} className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Start earning as a fan</motion.button>
          <motion.a href={`${API_URL}/auth/spotify/artist`} className="btn-outline" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Create a reward pool →</motion.a>
        </div>
        <div className="hero-ticker">
          <div className="ticker-item">
            <div className="ticker-val">FREE</div>
            <div className="ticker-label">No platform fee, ever</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-val">LIVE</div>
            <div className="ticker-label">Real-time leaderboard</div>
          </div>
          <div className="ticker-item">
            <div className="ticker-val">YOURS</div>
            <div className="ticker-label">Non-custodial on Solana</div>
          </div>
        </div>
      </div>

      <div className="hero-visual" style={{ perspective: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '-40px' }}>
        
        <div style={{ position: 'relative', width: '320px', height: '420px', transformStyle: 'preserve-3d' }}>
          <motion.div style={{ rotateX, rotateY, width: '100%', height: '100%', position: 'absolute' }}>
            {/* CARD 1 */}
            <motion.div 
              className="mock-card"
              animate={{ 
                zIndex: isSwapped ? 1 : 2,
                scale: isSwapped ? 0.92 : 1,
                rotateZ: isSwapped ? -7 : 9,
                x: isSwapped ? -30 : 0,
                y: isSwapped ? -20 : 0,
                opacity: isSwapped ? 0.6 : 1
              }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <div className="mock-header">
                <div className="mock-live" style={{ color: 'var(--green)' }}><AudioVis /> Live pool</div>
                <div className="mock-ends">3d 14h left</div>
              </div>

              <div className="mock-artist">
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Kendrick" className="mock-avatar" alt="KL" />
                <div>
                  <div className="mock-artist-name">
                    Kendrick Lamar <span className="mock-verified">✓</span>
                  </div>
                  <div className="mock-pool-title">Summer Drop Reward Pool</div>
                </div>
              </div>

              <div className="mock-prize">
                <div className="mock-prize-val">5.0 SOL</div>
                <div className="mock-prize-meta">
                  <div className="mock-prize-label">Total prize</div>
                  <div className="mock-prize-tier">Top 10 win</div>
                </div>
              </div>

              <div className="mock-lb-label">Top listeners this week</div>
              <div className="mock-lb">
                <div className="mock-lb-row rank-1">
                  <span className="mock-rank">01</span>
                  <span className="mock-fan">@superfan.eth</span>
                  <span className="mock-time">14h 22m</span>
                </div>
                <div className="mock-lb-row rank-2">
                  <span className="mock-rank">02</span>
                  <span className="mock-fan">@wavecatcher</span>
                  <span className="mock-time">12h 08m</span>
                </div>
                <div className="mock-lb-row rank-3">
                  <span className="mock-rank">03</span>
                  <span className="mock-fan">@midnight.sol</span>
                  <span className="mock-time">11h 45m</span>
                </div>
              </div>
            </motion.div>

            {/* CARD 2 */}
            <motion.div 
              className="mock-card"
              animate={{ 
                zIndex: isSwapped ? 2 : 1,
                scale: isSwapped ? 1 : 0.92,
                rotateZ: isSwapped ? 9 : -7,
                x: isSwapped ? 0 : -30,
                y: isSwapped ? 0 : -20,
                opacity: isSwapped ? 1 : 0.6
              }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <div className="mock-header">
                <div className="mock-live" style={{ color: 'var(--green)' }}><AudioVis /> Live pool</div>
                <div className="mock-ends">6d 02h left</div>
              </div>

              <div className="mock-artist">
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Tyler" className="mock-avatar" alt="TC" />
                <div>
                  <div className="mock-artist-name">
                    Tyler, the Creator <span className="mock-verified">✓</span>
                  </div>
                  <div className="mock-pool-title">CHROMAKOPIA Fan Reward</div>
                </div>
              </div>

              <div className="mock-prize">
                <div className="mock-prize-val">12.5 SOL</div>
                <div className="mock-prize-meta">
                  <div className="mock-prize-label">Total prize</div>
                  <div className="mock-prize-tier">Top 25 win</div>
                </div>
              </div>

              <div className="mock-lb-label">Top listeners this week</div>
              <div className="mock-lb">
                <div className="mock-lb-row rank-1">
                  <span className="mock-rank">01</span>
                  <span className="mock-fan">@golfwang.sol</span>
                  <span className="mock-time">19h 41m</span>
                </div>
                <div className="mock-lb-row rank-2">
                  <span className="mock-rank">02</span>
                  <span className="mock-fan">@flowerboy</span>
                  <span className="mock-time">17h 55m</span>
                </div>
                <div className="mock-lb-row rank-3">
                  <span className="mock-rank">03</span>
                  <span className="mock-fan">@igor.eth</span>
                  <span className="mock-time">16h 30m</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSwapped(!isSwapped)}
          style={{
            marginTop: '3rem', zIndex: 10, background: 'rgba(255,255,255,0.05)', 
            border: '0.5px solid var(--border)', color: 'var(--gold)', 
            padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6"></path>
            <path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path>
          </svg>
          Swap Cards
        </motion.button>
      </div>
    </section>

    <div className="marquee-wrap">
      <div className="marquee-track" id="marquee">
        <div className="marquee-item">STREAM TO EARN <span>✦</span></div>
        <div className="marquee-item">POWERED BY SOLANA <span>✦</span></div>
        <div className="marquee-item">SPOTIFY PREMIUM VERIFIED <span>✦</span></div>
        <div className="marquee-item">PERMISSIONLESS REWARDS <span>✦</span></div>
        <div className="marquee-item">ON-CHAIN TRANSPARENCY <span>✦</span></div>
        <div className="marquee-item">NO MIDDLEMEN <span>✦</span></div>
        <div className="marquee-item">ARTIST TO FAN DIRECT <span>✦</span></div>
        <div className="marquee-item">STREAM TO EARN <span>✦</span></div>
        <div className="marquee-item">POWERED BY SOLANA <span>✦</span></div>
        <div className="marquee-item">SPOTIFY PREMIUM VERIFIED <span>✦</span></div>
        <div className="marquee-item">PERMISSIONLESS REWARDS <span>✦</span></div>
        <div className="marquee-item">ON-CHAIN TRANSPARENCY <span>✦</span></div>
        <div className="marquee-item">NO MIDDLEMEN <span>✦</span></div>
        <div className="marquee-item">ARTIST TO FAN DIRECT <span>✦</span></div>
      </div>
    </div>

    <section className="how" id="how">
      <div className="section-label">Protocol</div>
      <h2>How <em className="shimmer-text">Rankr</em> works</h2>
      <div className="steps">
        <div className="step reveal">
          <div className="step-num">01</div>
          <h3>Artist creates pool</h3>
          <p>Connect your wallet, fund a reward pool, set the duration and prize tiers. No intermediaries — funds go straight on-chain.</p>
        </div>
        <div className="step reveal">
          <div className="step-num">02</div>
          <h3>Fans connect & join</h3>
          <p>Fans authenticate with Spotify Premium via OAuth, connect their wallet, and agree to the public participation rules.</p>
        </div>
        <div className="step reveal">
          <div className="step-num">03</div>
          <h3>Stream & climb</h3>
          <p>Every verified stream counts. The more you listen, the higher you rank on the live public leaderboard. Updated in real time.</p>
        </div>
        <div className="step reveal">
          <div className="step-num">04</div>
          <h3>Smart contract pays out</h3>
          <p>When the pool ends, the smart contract automatically distributes rewards to top-ranked wallets. No human touches the funds.</p>
        </div>
      </div>
    </section>

    <div className="for-both" id="artists">
      <div className="for-col artist reveal">
        <span className="tag">For artists</span>
        <h2>Reward your<br /><em className="shimmer-text">real</em> fans</h2>
        <p>Create a reward pool in minutes. Set your own prizes, duration, and tiers. Rankr handles the rest — verification, rankings, and automatic distribution.</p>
        <ul className="benefit-list">
          <li>Fund and deploy your pool from any Solana wallet</li>
          <li>Set weekly, monthly, or custom durations</li>
          <li>Choose your reward — tokens, NFTs, merch, or exclusive access</li>
          <li>Live dashboard showing fan activity and top streamers</li>
          <li>Smart contract distributes automatically — you do nothing at end</li>
        </ul>
      </div>
      <div className="for-col fan reveal">
        <span className="tag">For fans</span>
        <h2>Listen more,<br /><em className="shimmer-text">earn</em> more</h2>
        <p>Connect your Spotify Premium account, join active pools from your favourite artists, and start competing. Your listening time is your currency.</p>
        <ul className="benefit-list">
          <li>Spotify Premium required — keeps rankings fair and bot-free</li>
          <li>Every 30+ second stream counts toward your score</li>
          <li>Watch your rank climb on the live leaderboard</li>
          <li>Rewards land in your wallet automatically when the pool ends</li>
          <li>Join multiple artist pools simultaneously</li>
        </ul>
      </div>
    </div>

    <section className="lb-section">
      <div className="section-label">Live rankings</div>
      <div className="lb-wrap">
        <div className="lb-card reveal">
          <div className="lb-header">
            <span className="lb-title">Top streamers</span>
            <span className="lb-live" style={{ color: 'var(--green)' }}><AudioVis /> Live</span>
          </div>
          
          <motion.div layout className="lb-body">
            {liveLb.map(row => (
              <motion.div layout key={row.id} className={`lb-row ${row.class}`} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <div className="lb-rank">{row.rank}</div>
                <div className="lb-name">{row.name}</div>
                <div className="lb-time">{formatTime(row.time)}</div>
                <div className="lb-bar-wrap">
                  <motion.div 
                    className="lb-bar" 
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }} 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
        <div className="lb-text reveal">
          <h3>The leaderboard<br />is the <em className="shimmer-text">game</em></h3>
          <p>Every stream moves you up. Every hour of listening is an entry. The leaderboard is public, live, and identical for everyone — no exceptions, no manipulation.</p>
          <br />
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Powered by Spotify Premium OAuth. Minimum 30 seconds per track. Bot detection always on.</p>
        </div>
      </div>
    </section>

    <section className="protocol" id="protocol">
      <div className="section-label">Why trust it</div>
      <h2>Permissionless.<br /><em className="shimmer-text">Transparent.</em> On-chain.</h2>
      <div className="protocol-grid">
        <div className="protocol-card reveal">
          <div className="protocol-icon">🔒</div>
          <h3>Funds never touch us</h3>
          <p>Artist funds go directly into a Solana smart contract. Rankr has zero custody over any assets at any point in the process.</p>
        </div>
        <div className="protocol-card reveal">
          <div className="protocol-icon">📋</div>
          <h3>Rules set in stone</h3>
          <p>Once a pool is live, no one — not the artist, not Rankr — can change the rules. The smart contract enforces everything automatically.</p>
        </div>
        <div className="protocol-card reveal">
          <div className="protocol-icon">✅</div>
          <h3>Spotify Premium gate</h3>
          <p>Only verified Spotify Premium users can participate. Paid accounts mean real identities — making Sybil attacks economically impractical.</p>
        </div>
        <div className="protocol-card reveal">
          <div className="protocol-icon">⚡</div>
          <h3>Solana speed</h3>
          <p>Sub-second confirmation times and near-zero transaction fees. Reward distribution costs fractions of a cent regardless of pool size.</p>
        </div>
        <div className="protocol-card reveal">
          <div className="protocol-icon">🤖</div>
          <h3>Bot detection</h3>
          <p>Abnormal streaming spikes are automatically flagged. Minimum 30-second rule per track. One verified account per wallet.</p>
        </div>
        <div className="protocol-card reveal">
          <div className="protocol-icon">🔍</div>
          <h3>Fully auditable</h3>
          <p>All scores are submitted on-chain before distribution. Every fan can verify their own score. Every payout is a public transaction.</p>
        </div>
      </div>
    </section>

    <section className="cta-banner">
      <div className="section-label">Get started</div>
      <h2>Ready to reward<br />your <em className="shimmer-text">top fans?</em></h2>
      <p>Create your first reward pool in under 5 minutes. Connect your wallet and go live today.</p>
      <div className="cta-btns">
        <motion.a href={`${API_URL}/auth/spotify/artist`} className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Launch as artist</motion.a>
        <motion.button onClick={() => setShowServiceModal(true)} className="btn-outline" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Join as fan</motion.button>
      </div>
    </section>

    <footer>
      <div className="footer-logo">Rankr</div>
      <div className="footer-links">
        <a href="#">Docs</a>
        <a href="#">Protocol rules</a>
        <a href="#">Terms</a>
        <a href="#">Twitter</a>
      </div>
      <div className="footer-copy">Rankr © 2026</div>
    </footer>

    <AnimatePresence>
      {showServiceModal && (
        <motion.div
          key="service-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowServiceModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5,5,7,0.88)',
            backdropFilter: 'blur(18px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            key="service-modal-card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e0d10',
              border: '0.5px solid #1e1c22',
              borderRadius: '20px',
              padding: '2.5rem',
              width: '460px',
              maxWidth: '92vw',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowServiceModal(false)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'rgba(255,255,255,0.05)', border: '0.5px solid #1e1c22',
                borderRadius: '50%', width: '32px', height: '32px',
                color: '#7a7870', fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >✕</button>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: '0.75rem' }}>
              Connect &amp; earn
            </p>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em', color: '#f5f4f0', marginBottom: '0.5rem', lineHeight: 1.1 }}>
              Choose your platform
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#7a7870', marginBottom: '2rem', lineHeight: 1.6 }}>
              Connect your streaming account to verify plays and start competing.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Spotify — active */}
              <motion.a
                href={`${API_URL}/auth/spotify/fan`}
                whileHover={{ scale: 1.03, borderColor: 'rgba(29,185,84,0.7)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  background: 'rgba(29,185,84,0.07)',
                  border: '0.5px solid rgba(29,185,84,0.35)',
                  borderRadius: '14px',
                  padding: '1.75rem 1.25rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  cursor: 'pointer', textDecoration: 'none',
                }}
              >
                <SpotifyLogo />
                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#f5f4f0' }}>Spotify</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
                  color: '#1db954', textTransform: 'uppercase',
                  background: 'rgba(29,185,84,0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px',
                }}>Connect →</span>
              </motion.a>

              {/* Apple Music — coming soon */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid #1e1c22',
                  borderRadius: '14px',
                  padding: '1.75rem 1.25rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  cursor: 'not-allowed',
                  opacity: 0.38,
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                <AppleMusicLogo />
                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#f5f4f0' }}>Apple Music</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
                  color: '#7a7870', textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '4px',
                }}>Coming soon</span>
              </div>
            </div>

            <p style={{ textAlign: 'center', color: '#7a7870', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginTop: '1.75rem', letterSpacing: '0.06em' }}>
              Spotify Premium required to participate
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
