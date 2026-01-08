import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Radio, Shield, Zap, TrendingUp, TrendingDown, Clipboard, Check, Lock, AlertTriangle } from 'lucide-react';

// --- MOCK DATA FOR MVP ---
const MVP_SIGNALS = [
    { id: 1, pair: 'EUR/USD', type: 'LONG', entry: 1.0520, tp: 1.0580, sl: 1.0490, rr: '1:2', conf: 92, status: 'ACTIVE', time: '5m ago' },
    { id: 2, pair: 'GBP/USD', type: 'SHORT', entry: 1.2750, tp: 1.2650, sl: 1.2800, rr: '1:2', conf: 85, status: 'PROFIT', time: '2h ago' },
    { id: 3, pair: 'XAU/USD', type: 'LONG', entry: 2035.5, tp: 2050.0, sl: 2028.0, rr: '1:2.5', conf: 88, status: 'ACTIVE', time: '15m ago' },
    { id: 4, pair: 'USD/JPY', type: 'SHORT', entry: 144.20, tp: 143.50, sl: 144.60, rr: '1:2', conf: 75, status: 'LOSS', time: 'Yesterday' },
];

const MVP_STATS = {
    trades: 124,
    winRate: '78%',
    avgProfit: '+15.4%',
    streak: '4 WINS'
};

function SignalRow({ s }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `SIGNAL: ${s.type} ${s.pair} @ ${s.entry}\nTP: ${s.tp}\nSL: ${s.sl}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>{s.pair}</span>
                    <span style={{
                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        background: s.status === 'ACTIVE' ? 'rgba(0,186,136,0.2)' : s.status === 'LOSS' ? 'rgba(255,0,85,0.2)' : 'rgba(255,255,255,0.1)',
                        color: s.status === 'ACTIVE' || s.status === 'PROFIT' ? '#00BA88' : s.status === 'LOSS' ? '#FF0055' : 'white'
                    }}>
                        {s.status}
                    </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.time}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action</p>
                    <p style={{ fontWeight: 'bold', color: s.type === 'LONG' ? '#00BA88' : '#FF0055', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {s.type === 'LONG' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {s.type}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Entry</p>
                    <p style={{ fontWeight: 'bold' }}>{s.entry}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence</p>
                    <p style={{ fontWeight: 'bold', color: 'gold' }}>{s.conf}%</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stop Loss</p>
                    <p style={{ color: '#FF0055', fontWeight: 'bold' }}>{s.sl}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Take Profit</p>
                    <p style={{ color: '#00BA88', fontWeight: 'bold' }}>{s.tp}</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk:Reward</p>
                    <p style={{ fontWeight: 'bold' }}>{s.rr}</p>
                </div>
            </div>

            <button onClick={handleCopy} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.6rem' }}>
                {copied ? <Check size={18} /> : <Clipboard size={18} />}
                {copied ? 'COPIED!' : 'COPY SIGNAL'}
            </button>
        </div>
    );
}

function StatsCard({ label, value, sub }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{value}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</p>
            {sub && <p style={{ color: '#00BA88', fontSize: '0.8rem', marginTop: '0.5rem' }}>{sub}</p>}
        </div>
    )
}

export default function AppMVP() {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Mock chart data generation
        const data = [];
        let price = 1.0500;
        for (let i = 0; i < 20; i++) {
            price = price + (Math.random() - 0.5) * 0.0050;
            data.push({ time: i, price });
        }
        setChartData(data);
    }, []);

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* HEADER */}
            <nav className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity color="var(--primary)" size={24} />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>AI Forecast <span className="text-secondary" style={{ fontSize: '0.8rem', border: '1px solid var(--secondary)', padding: '2px 6px', borderRadius: '4px' }}>MVP</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#00BA88' }}>
                    <Radio size={16} className="animate-pulse" /> LIVE MONITORING
                </div>
            </nav>

            <main className="container" style={{ padding: '2rem 1rem' }}>

                {/* HERO SECTION */}
                <section style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', lineHeight: '1.2', marginBottom: '1rem' }}>
                        EUR/USD Live AI Signals <br /> <span className="text-gradient">MVP Edition</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Real-time AI monitoring with automated SL/TP tracking for Forex Traders.
                        <br />
                        <span style={{ fontSize: '0.9rem', color: 'orange', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '1rem' }}>
                            <Lock size={12} /> Private Access for Beta Testing
                        </span>
                    </p>
                </section>

                {/* PERFORMANCE STATS */}
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '3rem' }}>
                    <StatsCard label="Total Trades (7D)" value={MVP_STATS.trades} />
                    <StatsCard label="Win Rate" value={MVP_STATS.winRate} sub={MVP_STATS.streak} />
                    <StatsCard label="Avg. Profit" value={MVP_STATS.avgProfit} />
                </section>

                {/* LIVE CHART SIMULATION */}
                <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem', height: '300px' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Live Market Trend (1H)</span>
                        <span style={{ color: 'var(--primary)' }}>EUR/USD: 1.0542</span>
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ backgroundColor: '#030014', border: 'none' }} />
                            <Area type="monotone" dataKey="price" stroke="#00F0FF" fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </section>

                {/* SIGNALS LIST */}
                <section>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Active AI Signals</h2>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        {MVP_SIGNALS.map(s => (
                            <SignalRow key={s.id} s={s} />
                        ))}
                    </div>
                </section>

                {/* DISCLAIMER */}
                <footer style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <AlertTriangle size={16} color="orange" />
                        Educational purposes only - Not financial advice.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                        &copy; 2024 AI Smart Forecast. UK/Global Edition.
                    </p>
                </footer>

            </main>
        </div>
    );
}
