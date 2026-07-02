import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL ?? '';

// --- 3D Tilt Wrapper for Pool Cards ---
const TiltCard = ({ children }: { children: React.ReactNode }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(nx);
    y.set(ny);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ perspective: 1000, position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="pool-card"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default function FanDashboard() {
  const [session, setSession] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [currentPoolId, setCurrentPoolId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Progression & Rank Info
  const [myRankInfo, setMyRankInfo] = useState<any>({ 
    rank: null, 
    totalFans: 0, 
    totalSeconds: 0,
    xpRequired: 10000, 
  });

  useEffect(() => {
    if (API_URL) {
      fetch(`${API_URL}/auth/me`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setSession(data))
        .catch(() => setSession({ displayName: 'Fan' }));
    } else {
      setSession({ displayName: 'Mock Fan' });
    }

    setPools([
      { id: 1, title: 'Summer Drop Reward Campaign', artistName: 'Awesome Artist', artistVerified: true, topN: 10, totalReward: 1.5, currency: 'SOL', participants: 450, endsAt: new Date(Date.now() + 86400000 * 12).toISOString(), rewardType: 'Crypto token' },
      { id: 2, title: 'Early Access NFT Giveaway', artistName: 'Cool Band', artistVerified: false, topN: 50, totalReward: 50, currency: 'NFTs', participants: 1200, endsAt: new Date(Date.now() + 86400000 * 5).toISOString(), rewardType: 'NFT' }
    ]);
  }, []);

  const handleJoinPool = (poolId: number, poolName: string) => {
    setCurrentPoolId(poolId);
    
    // Initial Mock Rankings
    const mockRankings = Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      rank: i + 1,
      displayName: `Fan ${i + 1}`,
      score: 10000 - (i * 500)
    }));
    
    // Make me rank 4
    mockRankings[3].displayName = session?.displayName || 'Mock Fan';
    mockRankings[3].id = 999; // my special ID
    
    setLeaderboard(mockRankings);
    setMyRankInfo({
      rank: 4,
      totalFans: 450,
      totalSeconds: 8500,
      xpRequired: 9000 // score needed for rank 3
    });
  };

  const handleSyncComplete = () => {
    if (!currentPoolId) return alert('Join a pool first to sync listening time.');
    
    // Boost score and re-sort to trigger Overtake animation
    const newScore = myRankInfo.totalSeconds + 1200; // Add 20 minutes
    
    let updatedLb = leaderboard.map(fan => {
      if (fan.id === 999) return { ...fan, score: newScore };
      return fan;
    });

    updatedLb.sort((a, b) => b.score - a.score);
    
    // Update ranks
    let myNewRank = myRankInfo.rank;
    updatedLb = updatedLb.map((fan, i) => {
      fan.rank = i + 1;
      if (fan.id === 999) myNewRank = fan.rank;
      return fan;
    });

    setLeaderboard([...updatedLb]); // Create new array ref to force layout animation

    setMyRankInfo((prev: any) => ({
      ...prev,
      totalSeconds: newScore,
      rank: myNewRank,
      xpRequired: updatedLb[myNewRank - 2]?.score || newScore + 5000 // Next target
    }));
  };

  // --- Hold-to-Sync Logic ---
  const [isHolding, setIsHolding] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    if (!currentPoolId) return alert('Join a pool first.');
    setIsHolding(true);
    syncTimeoutRef.current = setTimeout(() => {
      setIsHolding(false);
      handleSyncComplete();
    }, 1500);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const xpPercentage = Math.min(100, Math.max(0, (myRankInfo.totalSeconds / myRankInfo.xpRequired) * 100)) || 0;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sb-logo">Rankr</div>
        <nav className="sb-nav">
          <a className="sb-link active" href="#">
            <span className="sb-dot"></span> Dashboard
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Live Campaigns
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> My Standings
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Rewards
          </a>
        </nav>
        <div className="sb-footer">
          <div className="sb-profile">
            <img src={session?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${session?.displayName || 'Fan'}`} className="sb-avatar" alt="Avatar" />
            <div>
              <div className="sb-name" id="fanName">{session?.displayName || 'Loading...'}</div>
              <div className="sb-role"><span className="premium-badge">✓ Premium</span></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>Welcome to the Arena, {session?.displayName || 'Challenger'}</h1>
          
          {/* Hold-To-Sync Button */}
          <div className="sync-btn-container" onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} onContextMenu={e => e.preventDefault()}>
            <motion.svg className="sync-progress-svg" viewBox="0 0 100 100">
              <motion.circle
                cx="50" cy="50" r="48"
                className="sync-progress-circle"
                animate={{ strokeDashoffset: isHolding ? 0 : 100 }}
                transition={{ duration: isHolding ? 1.5 : 0.3, ease: 'linear' }}
                pathLength="100"
              />
            </motion.svg>
            <motion.button 
              className="btn btn-green" 
              whileTap={{ scale: 0.95 }}
              style={{ cursor: 'pointer', zIndex: 1 }}
            >
              ⟳ Hold to Secure Rank
            </motion.button>
          </div>

        </div>

        <div className="content">
          <div className="rank-hero">
            <div className="rank-stat">
              <div className="rank-stat-val" id="totalPools">{pools.length}</div>
              <div className="rank-stat-label">Campaigns available</div>
            </div>
            <div className="rank-main">
              <div className="rank-label">Current Standing</div>
              <div className="rank-num" id="bestRank">{myRankInfo.rank ? `#${myRankInfo.rank}` : '—'}</div>
              <div className="rank-sub" id="rankSub">{myRankInfo.rank ? `Top ${Math.max(1, Math.round((myRankInfo.rank / myRankInfo.totalFans) * 100))}% of true fans` : 'Enter a campaign to start'}</div>
            </div>
            
            {/* RPG Progression Bar */}
            <div className="rank-stat">
              <div className="rank-stat-val" id="totalTime">
                {formatTime(myRankInfo.totalSeconds)}
              </div>
              <div className="rank-stat-label">Verified Playtime</div>
              
              {currentPoolId && (
                <div style={{ marginTop: '0.75rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>Progression</span>
                    <span>Distance to overtake: {formatTime(myRankInfo.xpRequired - myRankInfo.totalSeconds)}</span>
                  </div>
                  <div className="rpg-progress-container">
                    <motion.div 
                      className="rpg-progress-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercentage}%` }}
                      transition={{ duration: 1, type: "spring" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-title">Live Campaigns</div>
          <div className="pools-grid" id="poolsGrid">
            {pools.map(pool => {
              const ends = new Date(pool.endsAt);
              const daysLeft = Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <TiltCard key={pool.id}>
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
                      <div className="pool-reward-label">Up for Grabs</div>
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
                    {currentPoolId === pool.id ? 'Viewing Battlefield' : 'Enter the Arena'}
                  </button>
                </TiltCard>
              );
            })}
          </div>

          <div className="section-title">
            The Battlefield — <span id="lbPoolName" style={{ color: 'var(--gold)' }}>{currentPoolId ? pools.find(p=>p.id===currentPoolId)?.title : 'select a campaign'}</span>
          </div>
          <div className="lb-card">
            <div className="lb-header">
              <span className="lb-title">Rankings</span>
              <span className="live-dot">Live</span>
            </div>
            <div id="leaderboard" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem' }}>
                  The board is waiting. Step up and prove your loyalty.
                </div>
              ) : (
                leaderboard.map((fan) => {
                  const maxScore = leaderboard[0]?.score || 1;
                  const isMe = fan.id === 999;
                  const barPct = Math.round((fan.score / maxScore) * 100);

                  return (
                    // motion.div layout enables automatic sliding animations when the array order changes
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={`lb-row ${isMe ? 'is-me' : ''}`} 
                      key={fan.id}
                    >
                      <div className="lb-rank">{fan.rank}</div>
                      <div className="lb-name">
                        {fan.displayName}
                        {isMe && <span className="lb-you">YOU</span>}
                      </div>
                      <div className="lb-time">{formatTime(fan.score)}</div>
                      <div className="lb-bar-wrap">
                        <motion.div 
                          className="lb-bar" 
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </motion.div>
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
