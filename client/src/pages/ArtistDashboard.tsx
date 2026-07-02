import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const MOCK_POOLS = [
  { id: 1, title: 'Summer Drop Reward Campaign', topN: 10, totalReward: 1.5, currency: 'SOL', participants: 450, endsAt: new Date(Date.now() + 86400000 * 12).toISOString(), status: 'active', trackName: 'HUMBLE.', criteriaType: 'most_played' },
  { id: 2, title: 'Early Access NFT Giveaway', topN: 50, totalReward: 50, currency: 'NFTs', participants: 1200, endsAt: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'active', trackName: 'DNA.', criteriaType: 'first_N' },
];

export default function ArtistDashboard() {
  const [session, setSession] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ active: 0, totalFans: 0, totalRewards: 0, totalStreams: 0 });

  const [formData, setFormData] = useState({
    title: '', description: '', rewardType: 'token', totalReward: '',
    durationDays: '', topN: '', walletAddress: '', rewardDescription: '',
    criteriaType: 'most_played', trackId: '', trackName: '',
  });

  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<any[]>([]);
  const [trackSearching, setTrackSearching] = useState(false);

  useEffect(() => {
    if (API_URL) {
      fetch(`${API_URL}/auth/me`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(setSession)
        .catch(() => setSession({ displayName: 'Artist', artistVerified: false }));

      fetch(`${API_URL}/pools/mine`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((data: any[]) => {
          setPools(data);
          setStats({
            active:       data.filter(p => p.status === 'active').length,
            totalFans:    data.reduce((s, p) => s + (p.participants ?? 0), 0),
            totalRewards: data.reduce((s, p) => s + (p.totalReward ?? 0), 0),
            totalStreams:  0,
          });
        })
        .catch(() => {});
    } else {
      setSession({ displayName: 'Mock Artist', artistVerified: true });
      setPools(MOCK_POOLS);
      setStats({ active: 2, totalFans: 1650, totalRewards: 51.5, totalStreams: 25400 });
    }
  }, []);

  useEffect(() => {
    if (!API_URL || trackQuery.trim().length < 2) { setTrackResults([]); return; }
    const timer = setTimeout(() => {
      setTrackSearching(true);
      fetch(`${API_URL}/auth/spotify/tracks/search?q=${encodeURIComponent(trackQuery)}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(setTrackResults)
        .catch(() => setTrackResults([]))
        .finally(() => setTrackSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [trackQuery]);

  const resetForm = () => {
    setFormData({ title: '', description: '', rewardType: 'token', totalReward: '', durationDays: '', topN: '', walletAddress: '', rewardDescription: '', criteriaType: 'most_played', trackId: '', trackName: '' });
    setTrackQuery('');
    setTrackResults([]);
  };

  const handleClosePool = async (poolId: number) => {
    if (!confirm('Close this pool and finalise winners?')) return;
    if (!API_URL) {
      setPools(p => p.map(pool => pool.id === poolId ? { ...pool, status: 'closed' } : pool));
      return;
    }
    const res = await fetch(`${API_URL}/pools/${poolId}/close`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const updated = await res.json();
      setPools(p => p.map(pool => pool.id === poolId ? updated : pool));
    }
  };

  const handleCreatePool = async () => {
    if (!API_URL) {
      const newPool = { id: Math.random(), title: formData.title || 'New Pool', topN: Number(formData.topN) || 10, totalReward: Number(formData.totalReward) || 0, currency: 'SOL', participants: 0, endsAt: new Date(Date.now() + 86400000 * (Number(formData.durationDays) || 30)).toISOString(), status: 'active', trackName: formData.trackName, criteriaType: formData.criteriaType };
      setPools(p => [...p, newPool]);
      setStats(s => ({ ...s, active: s.active + 1 }));
      setIsModalOpen(false);
      resetForm();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/pools`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, totalReward: Number(formData.totalReward), durationDays: Number(formData.durationDays), topN: Number(formData.topN) }),
      });
      if (res.ok) {
        const pool = await res.json();
        setPools(p => [...p, pool]);
        setStats(s => ({ ...s, active: s.active + 1 }));
        setIsModalOpen(false);
        resetForm();
      }
    } catch (e) {
      console.error('Failed to create pool', e);
    }
  };

  return (
    <>
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sb-logo">Rankr</div>
        <nav className="sb-nav">
          <a className="sb-link active" href="#"><span className="sb-dot"></span> Dashboard</a>
          <a className="sb-link" href="#"><span className="sb-dot"></span> My Pools</a>
          <a className="sb-link" href="#"><span className="sb-dot"></span> Leaderboard</a>
          <a className="sb-link" href="#"><span className="sb-dot"></span> Analytics</a>
          <a className="sb-link" href="#"><span className="sb-dot"></span> Settings</a>
        </nav>
        <div className="sb-footer">
          <div className="sb-profile">
            <img src={session?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${session?.displayName || 'Artist'}`} className="sb-avatar" alt="Avatar" />
            <div>
              <div className="sb-name">{session?.displayName || 'Loading...'}</div>
              <div className="sb-role">Artist {session?.artistVerified && <span className="verified-badge">✓ Verified</span>}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>Artist Dashboard</h1>
          <button className="btn btn-gold" onClick={() => setIsModalOpen(true)}>+ Create Pool</button>
        </div>

        <div className="content">
          {session && !session.artistVerified && (
            <div className="verify-banner">
              <div className="verify-icon">⚠️</div>
              <div>
                <strong>Verify your Spotify artist profile</strong>
                <p>Connect your official Spotify artist account so fans can trust your pools are legitimate.</p>
              </div>
              <button className="btn btn-outline">Connect Spotify</button>
            </div>
          )}

          <div className="stats-row">
            <div className="stat-card"><div className="stat-label">Active pools</div><div className="stat-val">{stats.active}</div><div className="stat-sub">Running now</div></div>
            <div className="stat-card"><div className="stat-label">Total fans</div><div className="stat-val">{stats.totalFans}</div><div className="stat-sub">Across all pools</div></div>
            <div className="stat-card"><div className="stat-label">Rewards given</div><div className="stat-val">{stats.totalRewards}</div><div className="stat-sub">SOL distributed</div></div>
            <div className="stat-card"><div className="stat-label">Total streams</div><div className="stat-val">{stats.totalStreams}</div><div className="stat-sub">Verified plays</div></div>
          </div>

          <div className="section-title">Active pools</div>
          <div className="pool-table">
            <div className="pool-row header">
              <span>Pool name</span>
              <span style={{ textAlign: 'right' }}>Track</span>
              <span style={{ textAlign: 'right' }}>Reward</span>
              <span style={{ textAlign: 'right' }}>Fans</span>
              <span style={{ textAlign: 'right' }}>Ends</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {pools.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem' }}>No pools yet — create your first one above</div>
            ) : (
              pools.map(pool => {
                const daysLeft = Math.ceil((new Date(pool.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="pool-row" key={pool.id}>
                    <div><div className="pool-name">{pool.title}</div><div className="pool-meta">Top {pool.topN} · {pool.criteriaType === 'first_N' ? 'First N' : 'Most played'}</div></div>
                    <div className="pool-val" style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{pool.trackName || '—'}</div>
                    <div className="pool-val">{pool.totalReward} {pool.currency}</div>
                    <div className="pool-val">{pool.participants}</div>
                    <div className="pool-val">{daysLeft > 0 ? `${daysLeft}d` : 'Ended'}</div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
                      {pool.status === 'active' ? (
                        <>
                          <span className="status-badge status-active">Live</span>
                          <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.25rem .75rem' }} onClick={() => handleClosePool(pool.id)}>Close</button>
                        </>
                      ) : (
                        <span className="status-badge" style={{ background: 'rgba(122,120,112,.15)', color: 'var(--muted)' }}>Closed</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>

    {/* CREATE POOL MODAL */}
    <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) { setIsModalOpen(false); resetForm(); } }}>
      <div className="modal">
        <h2>Create Reward Pool</h2>
        <div className="form-grid">
          <div className="form-field full">
            <label>Pool title</label>
            <input type="text" placeholder="e.g. Summer Drop Reward Campaign" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="form-field full">
            <label>Description</label>
            <textarea placeholder="Tell fans what this pool is about..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
          </div>

          {/* Track picker */}
          <div className="form-field full" style={{ position: 'relative' }}>
            <label>Track to reward</label>
            <input
              type="text"
              placeholder={API_URL ? 'Search your tracks on Spotify...' : 'Track search available in production'}
              value={trackQuery}
              onChange={e => { setTrackQuery(e.target.value); setFormData({ ...formData, trackId: '', trackName: '' }); }}
              disabled={!API_URL}
            />
            {trackSearching && <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.25rem' }}>Searching...</div>}
            {formData.trackId && (
              <div style={{ fontSize: '.8rem', color: 'var(--gold)', marginTop: '.25rem' }}>✓ {formData.trackName}</div>
            )}
            {trackResults.length > 0 && !formData.trackId && (
              <div className="track-dropdown">
                {trackResults.map(t => (
                  <div key={t.id} className="track-option" onClick={() => { setFormData({ ...formData, trackId: t.id, trackName: t.name }); setTrackQuery(t.name); setTrackResults([]); }}>
                    {t.albumArt && <img src={t.albumArt} width={32} height={32} alt="" style={{ borderRadius: 3, flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{t.name}</span>
                    <span className="track-album">{t.albumName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-field">
            <label>Ranking criteria</label>
            <select value={formData.criteriaType} onChange={e => setFormData({ ...formData, criteriaType: e.target.value })}>
              <option value="most_played">Most played (top listeners win)</option>
              <option value="first_N">First N (first fans to listen win)</option>
            </select>
          </div>

          <div className="form-field">
            <label>Reward type</label>
            <select value={formData.rewardType} onChange={e => setFormData({ ...formData, rewardType: e.target.value })}>
              <option value="token">Crypto token (SOL/USDC)</option>
              <option value="nft">NFT</option>
              <option value="merch">Merch</option>
              <option value="exclusive_content">Exclusive content</option>
            </select>
          </div>

          <div className="form-field">
            <label>Total reward (SOL)</label>
            <input type="number" placeholder="e.g. 1.5" step="0.01" min="0" value={formData.totalReward} onChange={e => setFormData({ ...formData, totalReward: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Duration (days)</label>
            <input type="number" placeholder="e.g. 30" min="1" max="365" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Number of winners</label>
            <input type="number" placeholder="e.g. 10" min="1" value={formData.topN} onChange={e => setFormData({ ...formData, topN: e.target.value })} />
          </div>
          <div className="form-field full">
            <label>Your Solana wallet address</label>
            <input type="text" placeholder="Your SOL wallet (funds come from here)" value={formData.walletAddress} onChange={e => setFormData({ ...formData, walletAddress: e.target.value })} />
          </div>
          <div className="form-field full">
            <label>Reward description</label>
            <input type="text" placeholder="e.g. Top 3 each get 0.5 SOL, places 4–10 get 0.1 SOL" value={formData.rewardDescription} onChange={e => setFormData({ ...formData, rewardDescription: e.target.value })} />
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn btn-outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</button>
          <button className="btn btn-gold" onClick={handleCreatePool}>Deploy Pool</button>
        </div>
      </div>
    </div>
    </>
  );
}
