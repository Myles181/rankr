"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArtistDashboard;
const react_1 = require("react");
const API = 'http://localhost:4000';
function ArtistDashboard() {
    const [session, setSession] = (0, react_1.useState)(null);
    const [pools, setPools] = (0, react_1.useState)([]);
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [stats, setStats] = (0, react_1.useState)({ active: 0, totalFans: 0, totalRewards: 0, totalStreams: 0 });
    const [formData, setFormData] = (0, react_1.useState)({
        title: '', description: '', rewardType: 'token', totalReward: '',
        durationDays: '', topN: '', walletAddress: '', rewardDescription: ''
    });
    (0, react_1.useEffect)(() => {
        setSession({ displayName: 'Mock Artist', artistVerified: true });
        const mockPools = [
            { id: 1, title: 'Summer Drop Reward Campaign', topN: 10, totalReward: 1.5, currency: 'SOL', participants: 450, endsAt: new Date(Date.now() + 86400000 * 12).toISOString() },
            { id: 2, title: 'Early Access NFT Giveaway', topN: 50, totalReward: 50, currency: 'NFTs', participants: 1200, endsAt: new Date(Date.now() + 86400000 * 5).toISOString() }
        ];
        setPools(mockPools);
        setStats({ active: mockPools.length, totalFans: 1650, totalRewards: 0, totalStreams: 25400 });
    }, []);
    const handleCreatePool = () => {
        const newPool = {
            id: Math.random(),
            title: formData.title || 'New Pool',
            topN: formData.topN || 10,
            totalReward: formData.totalReward || 0,
            currency: 'SOL',
            participants: 0,
            endsAt: new Date(Date.now() + 86400000 * (Number(formData.durationDays) || 30)).toISOString()
        };
        setPools([...pools, newPool]);
        setIsModalOpen(false);
        setStats(s => ({ ...s, active: s.active + 1 }));
    };
    return (<>
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sb-logo">Rankr</div>
        <nav className="sb-nav">
          <a className="sb-link active" href="#">
            <span className="sb-dot"></span> Dashboard
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> My Pools
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Leaderboard
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Analytics
          </a>
          <a className="sb-link" href="#">
            <span className="sb-dot"></span> Settings
          </a>
        </nav>
        <div className="sb-footer">
          <div className="sb-profile">
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${session?.displayName || 'Artist'}`} className="sb-avatar" alt="Avatar"/>
            <div>
              <div className="sb-name" id="artistName">{session?.displayName || 'Loading...'}</div>
              <div className="sb-role">Artist {session?.artistVerified && <span className="verified-badge" id="verifiedBadge">✓ Verified</span>}</div>
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
          {!session?.artistVerified && (<div className="verify-banner" id="verifyBanner">
              <div className="verify-icon">⚠️</div>
              <div>
                <strong>Verify your Spotify artist profile</strong>
                <p>Connect your official Spotify artist account so fans can trust your pools are legitimate.</p>
              </div>
              <button className="btn btn-outline">Connect Spotify</button>
            </div>)}

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Active pools</div>
              <div className="stat-val" id="statActive">{stats.active}</div>
              <div className="stat-sub">Running now</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total fans</div>
              <div className="stat-val" id="statFans">{stats.totalFans}</div>
              <div className="stat-sub">Across all pools</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rewards given</div>
              <div className="stat-val" id="statRewards">{stats.totalRewards}</div>
              <div className="stat-sub">SOL distributed</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total streams</div>
              <div className="stat-val" id="statStreams">{stats.totalStreams}</div>
              <div className="stat-sub">Verified plays</div>
            </div>
          </div>

          <div className="section-title">Active pools</div>
          <div className="pool-table">
            <div className="pool-row header">
              <span>Pool name</span>
              <span style={{ textAlign: 'right' }}>Reward</span>
              <span style={{ textAlign: 'right' }}>Fans</span>
              <span style={{ textAlign: 'right' }}>Ends</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            <div id="poolList">
              {pools.length === 0 ? (<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.875rem' }}>
                  No pools yet — create your first one above
                </div>) : (pools.map(pool => {
            const ends = new Date(pool.endsAt);
            const daysLeft = Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (<div className="pool-row" key={pool.id}>
                      <div>
                        <div className="pool-name">{pool.title}</div>
                        <div className="pool-meta">Top {pool.topN} winners</div>
                      </div>
                      <div className="pool-val">{pool.totalReward} {pool.currency}</div>
                      <div className="pool-val">{pool.participants}</div>
                      <div className="pool-val">{daysLeft > 0 ? `${daysLeft}d` : 'Ended'}</div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="status-badge status-active">Live</span>
                      </div>
                    </div>);
        }))}
            </div>
          </div>
        </div>
      </main>
    </div>
      
      <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} id="modalOverlay" onClick={(e) => { if (e.target === e.currentTarget)
        setIsModalOpen(false); }}>
        <div className="modal">
          <h2>Create Reward Pool</h2>
          <div className="form-grid">
            <div className="form-field full">
              <label>Pool title</label>
              <input type="text" id="poolTitle" placeholder="e.g. Summer Drop Reward Campaign" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}/>
            </div>
            <div className="form-field full">
              <label>Description</label>
              <textarea id="poolDesc" placeholder="Tell fans what this pool is about..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
            <div className="form-field">
              <label>Reward type</label>
              <select id="rewardType" value={formData.rewardType} onChange={e => setFormData({ ...formData, rewardType: e.target.value })}>
                <option value="token">Crypto token (SOL/USDC)</option>
                <option value="nft">NFT</option>
                <option value="merch">Merch</option>
                <option value="exclusive_content">Exclusive content</option>
              </select>
            </div>
            <div className="form-field">
              <label>Total reward (SOL)</label>
              <input type="number" id="totalReward" placeholder="e.g. 1.5" step="0.01" min="0" value={formData.totalReward} onChange={e => setFormData({ ...formData, totalReward: e.target.value })}/>
            </div>
            <div className="form-field">
              <label>Duration (days)</label>
              <input type="number" id="duration" placeholder="e.g. 30" min="1" max="365" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: e.target.value })}/>
            </div>
            <div className="form-field">
              <label>Number of winners</label>
              <input type="number" id="topN" placeholder="e.g. 10" min="1" value={formData.topN} onChange={e => setFormData({ ...formData, topN: e.target.value })}/>
            </div>
            <div className="form-field full">
              <label>Your Solana wallet address</label>
              <input type="text" id="walletAddr" placeholder="Your SOL wallet (funds come from here)" value={formData.walletAddress} onChange={e => setFormData({ ...formData, walletAddress: e.target.value })}/>
            </div>
            <div className="form-field full">
              <label>Reward description</label>
              <input type="text" id="rewardDesc" placeholder="e.g. Top 3 each get 0.5 SOL, places 4-10 get 0.1 SOL" value={formData.rewardDescription} onChange={e => setFormData({ ...formData, rewardDescription: e.target.value })}/>
            </div>
          </div>
          <div className="modal-btns">
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleCreatePool}>Deploy Pool</button>
          </div>
        </div>
      </div>
    </>);
}
//# sourceMappingURL=ArtistDashboard.js.map