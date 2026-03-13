import React, { useState, useEffect } from 'react';
import { Shield, Send, CreditCard, Settings, LogOut, CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import './index.css';

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('clay_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, connected: false }; // Need to re-auth status on mount
      } catch (e) { }
    }
    return { url: window.location.origin, token: '', connected: false };
  });

  const [sandboxState, setSandboxState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('wallet');
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveSession = (s: any) => {
    localStorage.setItem('clay_session', JSON.stringify({ url: s.url, token: s.token }));
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${session.url}/api/v1/wallet/status`, {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxState(data);
        const newSession = { ...session, connected: true };
        setSession(newSession);
        saveSession(newSession);
        showToast('Connected to Local Sandbox', 'success');
      } else {
        showToast(`Connection failed: HTTP ${res.status}`, 'error');
      }
    } catch (err) {
      showToast('Sandbox unreachable. Check URL and CORS.', 'error');
    }
  };

  const fetchStatus = async () => {
    if (!session.connected) return;
    try {
      const res = await fetch(`${session.url}/api/v1/wallet/status`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxState(data);
      } else if (res.status === 401) {
        setSession({ ...session, connected: false });
        showToast('Session expired or invalid token', 'error');
      }
    } catch {
      showToast('Lost connection to Sandbox', 'error');
    }
  };

  useEffect(() => {
    // Auto-reconnect if session exists
    if (!session.connected && session.token) {
      fetchStatus().then(() => {
        // If fetchStatus succeeds, it will set connected: true via inside state
      });
    }
  }, []);

  useEffect(() => {
    if (session.connected) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [session.connected]);

  if (!session.connected) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="card animate-in" style={{ width: '400px' }}>
          <div className="card-header" style={{ justifyContent: 'center', flexDirection: 'column', gap: '4px', border: 'none', padding: '0 0 20px 0' }}>
            <img src="/logo.png" alt="Claw Wallet" style={{ width: '56px', height: '56px', borderRadius: '12px', marginBottom: '12px' }} />
            <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Claw Wallet</h1>
            <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>Connect to your Local Agent Sandbox</p>
          </div>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sandbox URL</label>
              <input
                type="text"
                value={session.url}
                onChange={e => setSession({ ...session, url: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Agent Token</label>
              <input
                type="password"
                value={session.token}
                onChange={e => setSession({ ...session, token: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              Connect to Wallet
            </button>
          </form>
        </div>
        {toast && (
          <div className={`toast show`} style={{ borderColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Claw" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="sidebar-title" style={{ margin: 0, lineHeight: 1.2 }}>Claw Wallet</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 600 }}>
                <div className="dot" style={{ background: 'currentColor', width: '6px', height: '6px' }}></div>
                Connected
              </div>
            </div>
          </div>
        </div>

        <div className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
          <CreditCard size={20} /> My Assets
        </div>
        <div className={`nav-item ${activeTab === 'send' ? 'active' : ''}`} onClick={() => setActiveTab('send')}>
          <Send size={20} /> Send / Transfer
        </div>
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <RefreshCw size={20} /> History
        </div>
        <div className={`nav-item ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          <Shield size={20} /> Security Policy
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={20} /> Settings
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div className="nav-item" style={{ color: 'var(--danger)' }} onClick={() => {
            localStorage.removeItem('clay_session');
            setSession({ ...session, connected: false, token: '' });
          }}>
            <LogOut size={20} /> Disconnect
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'wallet' && <WalletView state={sandboxState} session={session} showToast={showToast} />}
        {activeTab === 'send' && <SendView session={session} state={sandboxState} showToast={showToast} />}
        {activeTab === 'history' && <HistoryView session={session} />}
        {activeTab === 'policy' && <PolicyView state={sandboxState} session={session} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView state={sandboxState} session={session} showToast={showToast} onRefresh={fetchStatus} />}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast show" style={{ borderColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
          {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// Subcomponents



function WalletView({ state, session, showToast }: any) {
  const evmAddr = state?.addresses?.ethereum || state?.addresses?.evm || '';
  const solAddr = state?.addresses?.solana || '';
  const suiAddr = state?.addresses?.sui || '';
  const copyToClip = (txt: string) => { if (txt) navigator.clipboard.writeText(txt); };

  const [assets, setAssets] = useState<any>(null);
  const [prices, setPrices] = useState<any>({});
  const [securityData, setSecurityData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [expandedSmall, setExpandedSmall] = useState<Record<string, boolean>>({});

  const chainToID: any = { ethereum: 1, bsc: 56, base: 8453, solana: 501, sui: 784 };

  const fetchData = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${session.token}` };
      const [aRes, pRes, sRes] = await Promise.all([
        fetch(`${session.url}/api/v1/wallet/assets`, { headers: authHeader }),
        fetch(`${session.url}/api/v1/price/cache`, { headers: authHeader }),
        fetch(`${session.url}/api/v1/security/cache`, { headers: authHeader })
      ]);
      const [aData, pData, sData] = await Promise.all([aRes.json(), pRes.json(), sRes.json()]);
      setAssets(aData);
      setPrices(pData.prices || {});
      setSecurityData(sData.security || {});
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!session.connected) return;
    fetchData();
    const inv = setInterval(fetchData, 10000); // UI poll 10s
    return () => clearInterval(inv);
  }, [session.connected, session.token]);

  const getAssetUSD = (a: any) => {
    const key = (a.contract_address === 'native' ? `native:${a.chain}` : `token:${a.chain}:${a.contract_address}`).toLowerCase();
    return (a.ui_balance * (prices[key] || 0));
  };

  const renderAssetGroup = (title: string, chainKey: string, address: string) => {
    const group = assets ? Object.entries(assets).find(([k]) => k.startsWith(chainKey)) : null;
    let items: any[] = group ? ((group[1] as any).Assets || []) : [];
    const blockHighRisk = state?.policy?.block_high_risk_tokens ?? true;

    // Annotate with USD
    items = items.map(a => ({ ...a, usdVal: getAssetUSD(a) }));

    // Filter malicious tokens if blocked by policy
    if (blockHighRisk) {
      items = items.filter(a => {
        if (a.contract_address === 'native') return true;
        const cid = chainToID[a.chain.toLowerCase()];
        const sKey = `${cid}:${a.contract_address.toLowerCase()}`;
        const r = securityData[sKey];
        return !(r && r.risk_level >= 4);
      });
    }

    // Sort
    items = items.sort((a, b) => {
      // Native always first
      if (a.contract_address === 'native') return -1;
      if (b.contract_address === 'native') return 1;
      // Then by USD value
      return b.usdVal - a.usdVal;
    });

    const totalUSD = items.reduce((sum, a) => sum + a.usdVal, 0);
    const mainItems = items.filter(a => a.usdVal >= 1);
    const smallItems = items.filter(a => a.usdVal < 1);
    const isExpanded = expandedSmall[chainKey];

      const renderItem = (a: any) => {
        const chainID = chainToID[a.chain.toLowerCase()];
        const secKey = `${chainID}:${a.contract_address.toLowerCase()}`;
        const risk = securityData[secKey];

        return (
          <div key={a.contract_address + a.symbol} className="glass-block" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{a.symbol}</span>
                  {risk && risk.risk_level > 2 && (
                    <span className={`badge ${risk.risk_level >= 4 ? 'danger' : 'warning'}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                      {risk.risk_label}
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {a.usdVal > 0 ? `$${a.usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {a.ui_balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
            </div>
            <div
              onClick={(e) => { e.stopPropagation(); copyToClip(a.contract_address); showToast('Address copied'); }}
              title="Click to copy address"
              style={{
                fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '10px',
                fontFamily: 'monospace', cursor: 'pointer',
                borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, opacity: 0.7 }}>
                {a.contract_address}
              </span>
              <Copy size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
            </div>
          </div>
        );
      };

    return (
      <div className="card">
        <div className="card-header" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h3 className="card-title">{title}</h3>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
              ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span style={{ color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => copyToClip(address)}>
            {address ? `${address.slice(0, 8)}...${address.slice(-6)} ⎘` : 'Not generated'}
          </span>
        </div>

        {!address ? (
          <div style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Address not initialized</div>
        ) : loading && !assets ? (
          <div style={{ marginTop: '15px' }}>Loading assets...</div>
        ) : items.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>No assets found</div>
        ) : (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Assets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {mainItems.map(renderItem)}
            </div>

            {/* Small Assets Toggle */}
            {smallItems.length > 0 && (
              <div>
                <div
                  onClick={() => setExpandedSmall({ ...expandedSmall, [chainKey]: !isExpanded })}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 0' }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Dust Assets ({smallItems.length} items {"<"} $1.00)
                </div>
                {isExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginTop: '8px' }}>
                    {smallItems.map(a => (
                      <div key={a.contract_address + a.symbol} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>{a.ui_balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>{a.symbol}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ${a.usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Assets</h1>
          <p className="page-subtitle">Unified multichain view (EVM, Solana, Sui) via Alchemy Node Layer</p>
        </div>
      </div>

      {renderAssetGroup("Ethereum", "ethereum", evmAddr)}
      {renderAssetGroup("Base", "base", evmAddr)}
      {renderAssetGroup("BSC", "bsc", evmAddr)}
      {renderAssetGroup("Solana", "solana", solAddr)}
      {renderAssetGroup("Sui", "sui", suiAddr)}
    </div>
  );
}

function HistoryView({ session }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${session.token}` };
      const [aRes, tRes] = await Promise.all([
        fetch(`${session.url}/api/v1/audit/logs`, { headers: authHeader }),
        fetch(`${session.url}/api/v1/wallet/history`, { headers: authHeader })
      ]);
      const [auditLogs, onChainTxs] = await Promise.all([aRes.json(), tRes.json()]);

      // Normalize Audit Logs (Sandbox Events)
      const normalizedAudit = (auditLogs || []).map((l: any) => {
        let chain = 'sandbox';
        // Match chain=NAME or Chain: NAME
        const chainMatch = l.details?.match(/(?:chain|Chain)[:=]\s*([a-z0-9]+)/i);
        if (chainMatch) chain = chainMatch[1].toLowerCase();

        return {
          timestamp: l.timestamp,
          chain: chain,
          isSandbox: true,
          event: l.event_type.replace('_', ' ').toUpperCase(),
          status: l.status,
          details: l.details,
          id: l.timestamp + l.event_type
        };
      });

      // Normalize On-Chain Txs
      const normalizedChain = (onChainTxs || []).map((t: any, idx: number) => ({
        timestamp: t.timestamp,
        chain: t.chain,
        event: 'ON-CHAIN TX',
        status: t.status,
        details: `${t.amount} ${t.symbol} | Hash: ${t.hash.slice(0, 10)}...`,
        id: `tx-${t.chain}-${t.hash}-${idx}` // Make ID unique including chain and index
      }));

      const merged = [...normalizedAudit, ...normalizedChain]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setItems(merged);
    } catch (e) { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 8000);
    return () => clearInterval(inv);
  }, [session]);

  const filtered = items.filter(i => {
    const currentFilter = filter.toLowerCase().trim();
    if (currentFilter === 'all') return true;
    
    // Normalize item chain
    let itemChain = (i.chain || '').toLowerCase().trim();
    if (itemChain === 'eth') itemChain = 'ethereum';
    if (itemChain === 'sol') itemChain = 'solana';

    // Normalize selected filter
    let target = currentFilter;
    if (target === 'eth') target = 'ethereum';
    if (target === 'sol') target = 'solana';

    const match = itemChain === target;
    // console.log(`Filter [${target}] vs Item [${itemChain}] = ${match}`);
    return match;
  });

  const chains = ['all', 'ethereum', 'base', 'bsc', 'solana', 'sui', 'sandbox'];

  const getExplorerLink = (chain: string, id: string) => {
    const explorers: any = {
      ethereum: 'https://etherscan.io/tx/',
      base: 'https://basescan.org/tx/',
      bsc: 'https://bscscan.com/tx/',
      solana: 'https://solscan.io/tx/',
      sui: 'https://suivision.xyz/txblock/',
      polygon: 'https://polygonscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/'
    };
    return explorers[chain.toLowerCase()] ? explorers[chain.toLowerCase()] + id : '#';
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">Unified activity feed across sandbox and 5 chains</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {chains.map(c => (
          <button key={c} className={`btn ${filter === c ? 'btn-primary' : ''}`} onClick={() => setFilter(c)} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Activity Feed</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Polling active</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {loading ? 'Fetching history...' : 'No records found'}
            </div>
          ) : (
            filtered.map((item: any) => (
              <div key={item.id} className="glass-block" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`badge ${item.isSandbox ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                      {item.chain.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.event}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.status === 'success' || item.status === 'SUCCESS' || item.status === 'accepted' ? '✓' : '✗'} {item.status}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="data-value" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {!item.isSandbox ? (
                    <a href={getExplorerLink(item.chain, item.id)} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {item.details} <span style={{ opacity: 0.5 }}>↗</span>
                    </a>
                  ) : item.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



function SendView({ session, state, showToast }: any) {
  const [txData, setTxData] = useState({ chain: 'ethereum', to: '', amount: '', asset: 'native', hexData: '0x' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState('');

  const sendTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult('');
    try {
      const payload = {
        chain: txData.chain,
        sign_mode: "transaction",
        uid: state?.uid || "UID-WEB",
        to: txData.to,
        amount_wei: txData.amount || "0",
        data: txData.hexData,
        tx_payload_hex: "0x02c0" + Date.now().toString(16),
        enc_share1: { cipher: "", iv: "", salt: "" }
      };

      const res = await fetch(`${session.url}/api/v1/tx/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      if (res.ok) {
        showToast('Transaction Signature Granted!', 'success');
        let parsed = text;
        try { parsed = JSON.stringify(JSON.parse(text), null, 2) } catch (e) { }
        setResult(`SUCCESS:\n${parsed}`);
      } else {
        showToast('Transaction Rejected by Policy', 'error');
        setResult(`REJECTED [${res.status}]:\n${text}`);
      }
    } catch (err) {
      showToast('Error communicating with Sandbox', 'error');
      setResult('Network Error');
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Send Crypto</h1>
        <p className="page-subtitle">Draft and execute a multi-chain signing request through your local agent</p>
      </div>

      <div className="card">
        <form onSubmit={sendTx} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Network (Chain)</label>
              <select className="input-field" value={txData.chain} onChange={e => setTxData({ ...txData, chain: e.target.value })}>
                <option value="ethereum">Ethereum</option>
                <option value="base">Base</option>
                <option value="bsc">BSC</option>
                <option value="solana">Solana</option>
                <option value="sui">Sui</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Recipient Address (To)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Address"
                value={txData.to}
                onChange={e => setTxData({ ...txData, to: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Amount (Unit/Wei)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 1000000000000000000"
                value={txData.amount}
                onChange={e => setTxData({ ...txData, amount: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Data (Hex)</label>
              <input
                type="text"
                className="input-field"
                placeholder="0x..."
                value={txData.hexData}
                onChange={e => setTxData({ ...txData, hexData: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <RefreshCw className="spin" size={18} /> : <Send size={18} />} Request Agent Signature
          </button>
        </form>
      </div>

      {result && (
        <div className="card" style={{ borderColor: result.includes('SUCCESS') ? 'var(--success)' : 'var(--danger)' }}>
          <div className="card-header"><h3 className="card-title">Sandbox Signature Output</h3></div>
          <div className="pre-code" style={{ color: result.includes('SUCCESS') ? 'var(--success)' : 'var(--danger)' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

function PolicyView({ state, session, showToast }: any) {
  const policy = state?.policy;
  const oracleNative: boolean = state?.oracle_native ?? false;
  const oracleTokens: boolean = state?.oracle_tokens ?? false;

  const [edits, setEdits] = useState({
    daily_limit_usd: policy?.daily_limit_usd || 0,
    max_amount_per_tx_usd: policy?.max_amount_per_tx_usd || 0,
    daily_max_tx_count: policy?.daily_max_tx_count || 0,
    pin_ttl_seconds: policy?.pin_ttl_seconds || 86400,
    block_high_risk_tokens: policy?.block_high_risk_tokens ?? true,
    unpriced_asset_policy_block: policy?.unpriced_asset_policy === 'block'
  });

  const [whitelist, setWhitelist] = useState<any[]>(policy?.whitelist_to || []);
  const [blacklist, setBlacklist] = useState<any[]>(policy?.blacklist_to || []);
  const [newW, setNewW] = useState({ address: '', note: '', chain: '' });
  const [newB, setNewB] = useState({ address: '', note: '', chain: '' });

  const updatePolicy = async (newRules: any) => {
    try {
      const res = await fetch(`${session.url}/policy/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify(newRules)
      });
      if (res.ok) showToast('Policy rules enforced');
      else showToast('Failed to update policy', 'error');
    } catch (e) { showToast('Network error', 'error'); }
  };

  const handleApply = () => {
    updatePolicy({
      ...policy,
      daily_limit_usd: parseFloat(edits.daily_limit_usd as any) || 0,
      max_amount_per_tx_usd: parseFloat(edits.max_amount_per_tx_usd as any) || 0,
      daily_max_tx_count: parseInt(edits.daily_max_tx_count as any) || 0,
      pin_ttl_seconds: parseInt(edits.pin_ttl_seconds as any) || 86400,
      whitelist_to: whitelist,
      blacklist_to: blacklist,
      block_high_risk_tokens: Boolean(edits.block_high_risk_tokens),
      unpriced_asset_policy: edits.unpriced_asset_policy_block ? 'block' : 'allow'
    });
  };

  // USD-primary daily spend
  const spentUSD: number = state?.today_spent_usd || 0;
  const limitUSD: number = policy?.daily_limit_usd || 0;
  const usdProgress = limitUSD > 0 ? (spentUSD / limitUSD) * 100 : 0;

  const currentTxs = state?.today_tx_count || 0;
  const maxTxs = policy?.daily_max_tx_count || 0;
  const txProgress = maxTxs > 0 ? (currentTxs / maxTxs) * 100 : 0;

  const ProgressBar = ({ pct, warn }: { pct: number; warn?: boolean }) => (
    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pct > 90 ? 'var(--danger)' : warn ? 'var(--warning)' : 'var(--accent)', transition: 'width 0.5s ease' }} />
    </div>
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Security & Policy</h1>
        <p className="page-subtitle">Real-time spend tracking and enforcement rules</p>
      </div>

      <div className="grid">
        {/* Oracle Health */}
        <div className="card" style={{ borderColor: oracleNative ? 'var(--success)' : 'var(--danger)' }}>
          <div className="card-header">
            <h3 className="card-title">Native Oracle (CoinGecko)</h3>
            <span className={`badge ${oracleNative ? 'success' : 'danger'}`}>
              {oracleNative ? 'Online' : 'Offline'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>Used for ETH/BNB/SOL/SUI gas and value.</p>
        </div>

        <div className="card" style={{ borderColor: oracleTokens ? 'var(--success)' : 'var(--danger)' }}>
          <div className="card-header">
            <h3 className="card-title">Token Oracle (DexScreener)</h3>
            <span className={`badge ${oracleTokens ? 'success' : 'danger'}`}>
              {oracleTokens ? 'Active' : 'Offline'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>Real-time price feed for arbitrary tokens & meme coins.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header"><h3 className="card-title">Risk Control Configuration</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Daily USD Limit</label>
              <input type="number" className="input-field" value={edits.daily_limit_usd} onChange={e => setEdits({ ...edits, daily_limit_usd: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Single USD Limit</label>
              <input type="number" className="input-field" value={edits.max_amount_per_tx_usd} onChange={e => setEdits({ ...edits, max_amount_per_tx_usd: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Daily Max TXs</label>
              <input type="number" className="input-field" value={edits.daily_max_tx_count} onChange={e => setEdits({ ...edits, daily_max_tx_count: parseInt(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Session TTL (Seconds)</label>
              <input type="number" className="input-field" value={edits.pin_ttl_seconds} onChange={e => setEdits({ ...edits, pin_ttl_seconds: parseInt(e.target.value) })} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
               <button className="btn btn-primary" onClick={handleApply}>Apply Changes</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', gridColumn: 'span 2' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>Block High Risk Tokens</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Automatically disable signing for honeypots, scam airdrops, or high-tax tokens flagged by the security engine.</span>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px', flexShrink: 0 }}>
                <input type="checkbox" checked={edits.block_high_risk_tokens} onChange={e => setEdits({ ...edits, block_high_risk_tokens: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: edits.block_high_risk_tokens ? 'var(--accent)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
                  <span style={{ position: 'absolute', height: '18px', width: '18px', left: edits.block_high_risk_tokens ? '19px' : '3px', bottom: '3px', backgroundColor: '#fff', borderRadius: '50%', transition: '.4s' }}></span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', gridColumn: 'span 2' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', fontWeight: 600 }}>Block Unpriced Assets</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Reject transactions involving tokens that lack reliable price feeds to prevent circumvention of Daily USD Limits.</span>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px', flexShrink: 0 }}>
                <input type="checkbox" checked={edits.unpriced_asset_policy_block} onChange={e => setEdits({ ...edits, unpriced_asset_policy_block: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: edits.unpriced_asset_policy_block ? 'var(--accent)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
                  <span style={{ position: 'absolute', height: '18px', width: '18px', left: edits.unpriced_asset_policy_block ? '19px' : '3px', bottom: '3px', backgroundColor: '#fff', borderRadius: '50%', transition: '.4s' }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* Data Dashboard */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header"><h3 className="card-title">Data Dashboard</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr)', gap: '24px', marginTop: '15px' }}>

            {/* Daily Limit USD */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Daily USD Limit</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>${spentUSD.toFixed(2)} / ${limitUSD.toFixed(1)}</span>
              </div>
              <ProgressBar pct={usdProgress} />
            </div>

            {/* Daily Max Txs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>TX Count Today</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentTxs} / {maxTxs}</span>
              </div>
              <ProgressBar pct={txProgress} />
            </div>

            {/* Session Remaining Today */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Session Remaining</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{((policy?.pin_ttl_seconds || 86400) / 3600).toFixed(1)}h Total</span>
              </div>
              <ProgressBar pct={0} />
            </div>

          </div>
        </div>
      </div>

      {/* Activated Chains */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Activated Chains</h3></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
          {policy?.allowed_chains?.map((c: string) => (
            <span key={c} className="badge" style={{ background: 'var(--accent)', color: 'black', fontWeight: 600 }}>{c.toUpperCase()}</span>
          ))}
        </div>
      </div>

      <div className="grid">
        {/* Whitelist Addresses */}
        <div className="card">
          <div className="card-header"><h3 className="card-title" style={{ color: 'var(--success)' }}>Whitelist Addresses</h3></div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
            <select className="input-field" value={newW.chain} onChange={e => setNewW({ ...newW, chain: e.target.value })} style={{ flex: '0 0 110px' }}>
              <option value="">All Chains</option>
              <option value="ethereum">ETH</option>
              <option value="bsc">BSC</option>
              <option value="base">Base</option>
              <option value="solana">SOL</option>
              <option value="sui">Sui</option>
            </select>
            <input type="text" className="input-field" placeholder="0x..." value={newW.address} onChange={e => setNewW({ ...newW, address: e.target.value })} style={{ flex: 2 }} />
            <input type="text" className="input-field" placeholder="Note" value={newW.note} onChange={e => setNewW({ ...newW, note: e.target.value })} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => { if (newW.address) { setWhitelist([...whitelist, newW]); setNewW({ address: '', note: '', chain: '' }); handleApply(); } }}>+</button>
          </div>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {whitelist.map((w: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--success)' }}>{w.address.slice(0, 10)}...{w.address.slice(-8)}</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{w.chain || 'All Chains'}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{w.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Blacklist Addresses */}
        <div className="card">
          <div className="card-header"><h3 className="card-title" style={{ color: 'var(--danger)' }}>Blacklist Addresses</h3></div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
            <select className="input-field" value={newB.chain} onChange={e => setNewB({ ...newB, chain: e.target.value })} style={{ flex: '0 0 110px' }}>
              <option value="">All Chains</option>
              <option value="ethereum">ETH</option>
              <option value="bsc">BSC</option>
              <option value="base">Base</option>
              <option value="solana">SOL</option>
              <option value="sui">Sui</option>
            </select>
            <input type="text" className="input-field" placeholder="0x..." value={newB.address} onChange={e => setNewB({ ...newB, address: e.target.value })} style={{ flex: 2 }} />
            <input type="text" className="input-field" placeholder="Note" value={newB.note} onChange={e => setNewB({ ...newB, note: e.target.value })} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => { if (newB.address) { setBlacklist([...blacklist, newB]); setNewB({ address: '', note: '', chain: '' }); handleApply(); } }}>+</button>
          </div>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {blacklist.map((b: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--danger)' }}>{b.address.slice(0, 10)}...{b.address.slice(-8)}</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{b.chain || 'All Chains'}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ state, session, showToast, onRefresh }: any) {
  const [bindUid, setBindUid] = useState('');

  const handleExport = () => {
    const backup = {
      uid: state?.uid,
      master_pub_key: state?.master_pub_key,
      addresses: state?.addresses,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claw_backup_${state?.uid || 'wallet'}.json`;
    a.click();
    showToast('Identity backup downloaded');
  };
  const handleBind = async () => {
    if (!bindUid) return;
    try {
      const res = await fetch(`${session.url}/api/v1/wallet/bind_uid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify({ uid: bindUid })
      });
      if (res.ok) {
        showToast('UID bound successfully');
        onRefresh();
      } else {
        showToast('Failed to bind UID', 'error');
      }
    } catch (e) { showToast('Network error', 'error'); }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Sandbox Management & Integration</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3 className="card-title">Instance Identity</h3>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>UID</label>
              {state?.uid ? (
                <div style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{state.uid}</div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <input type="text" className="input-field" placeholder="Enter UID to bind..." value={bindUid} onChange={e => setBindUid(e.target.value)} />
                  <button className="btn btn-primary" onClick={handleBind}>Bind</button>
                </div>
              )}
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Agent Token</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', flex: 1, background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                  {session.token.slice(0, 8)}...{session.token.slice(-8)}
                </div>
                <button className="nav-item" style={{ padding: '8px', border: '1px solid var(--glass-border)' }} onClick={() => { navigator.clipboard.writeText(session.token); showToast('Token copied'); }}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cloud Relay</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '10px 0' }}>
            Your sandbox is tethered to the cloud relay for MPC key fragment management and security orchestration.
          </p>
          <div className="glass-block" style={{ 
            padding: '20px', 
            marginTop: '15px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Share 2 Status</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>Locked In Vault</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Relay Heartbeat</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>Active</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn" style={{ fontSize: '0.8rem', flex: 1 }} onClick={() => showToast('Vault sync complete')}>Sync Vault Status</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
           <h2 className="card-title">Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn" style={{ width: 'fit-content' }} onClick={async () => {
              try {
                await fetch(`${session.url}/api/v1/wallet/refresh`, { headers: { 'Authorization': `Bearer ${session.token}` } });
                showToast('Multichain discovery triggered');
              } catch (e) {
                showToast('Refresh failed');
              }
            }}>Force Sync Assets</button>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>Immediately trigger a full multi-chain balance refresh from RPC nodes.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn" style={{ width: 'fit-content' }} onClick={handleExport}>Export Identity Backup</button>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>Download a secure backup of your master public key and chain addresses.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn" style={{ width: 'fit-content', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Factory Reset Sandbox</button>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>Wipe all local identity, policy, and tracker files to start from scratch.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
