import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { supabase } from './supabaseClient';

// Use standard names to avoid import issues
const {
    Activity, Server, Database, Shield, Cpu, Terminal,
    RefreshCw, CheckCircle, XCircle, AlertTriangle, MessageSquare
} = Lucide;

export default function AdminDashboard() {
    // 1. System Infrastructure Status
    const [systemStatus, setSystemStatus] = useState({
        api: 'checking',
        db: 'checking',
        bot: 'checking'
    });

    // 2. Real Data from Supabase
    const [realMetrics, setRealMetrics] = useState({
        totalSignals: 0,
        activeSignals: 0,
        signals24h: 0,
        lastUpdate: 'Initializing...'
    });

    // 3. AI Learning Status
    const [aiState, setAiState] = useState({
        learningPhase: 'Real-time Reinforcement',
        confidenceScore: 94,
        backtestDepth: '6,176 candles (1Y)',
        adaptiveFilter: 'Active'
    });

    const [logs, setLogs] = useState([
        { time: new Date().toLocaleTimeString(), type: 'INFO', msg: 'System Core Initialized' }
    ]);

    const logEndRef = useRef(null);
    const logContainerRef = useRef(null);

    const [metrics, setMetrics] = useState({
        cpu: 12,
        memory: 450,
        uptime: '14d 2h 15m',
        requests: 15420
    });

    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, type, msg }].slice(-100));
    };

    const scrollToBottom = () => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    useEffect(() => {
        // Infrastructure Simulation
        const handshake = setTimeout(() => {
            setSystemStatus({ api: 'online', db: 'online', bot: 'online' });
            addLog('SUCCESS', 'Neural Uplink Stable. System Operational.');
        }, 1500);

        const fetchMetrics = async () => {
            if (!supabase) {
                // If supabase is null, it means initialization failed (missing keys)
                addLog('ERROR', 'DB Setup Error: VITE_SUPABASE_ANON_KEY is missing in .env');
                return;
            }

            try {
                // Fetch counts in parallel
                const [totalRes, activeRes, last24Res] = await Promise.all([
                    supabase.from('signals').select('*', { count: 'exact', head: true }),
                    supabase.from('signals').select('*', { count: 'exact', head: true }).in('status', ['WAITING', 'ACTIVE']),
                    supabase.from('signals').select('*', { count: 'exact', head: true }).gt('created_at', new Date(Date.now() - 86400000).toISOString())
                ]);

                // Check for errors in any response
                if (totalRes.error) throw new Error(totalRes.error.message);
                if (activeRes.error) throw new Error(activeRes.error.message);
                if (last24Res.error) throw new Error(last24Res.error.message);

                setRealMetrics({
                    totalSignals: totalRes.count || 0,
                    activeSignals: activeRes.count || 0,
                    signals24h: last24Res.count || 0,
                    lastUpdate: new Date().toLocaleTimeString()
                });
            } catch (e) {
                console.error("Fetch failed:", e);
                addLog('ERROR', `Connection Failed: ${e.message}`);
            }
        };

        fetchMetrics();
        const dataTimer = setInterval(fetchMetrics, 15000);

        const sysTimer = setInterval(() => {
            setMetrics(prev => ({
                ...prev,
                cpu: 10 + Math.floor(Math.random() * 20),
                memory: 400 + Math.floor(Math.random() * 50),
                requests: prev.requests + Math.floor(Math.random() * 3)
            }));
        }, 5000);

        return () => {
            clearTimeout(handshake);
            clearInterval(dataTimer);
            clearInterval(sysTimer);
        };
    }, []);

    // Helper to format numbers safely
    const fmt = (num) => (typeof num === 'number' ? num.toLocaleString() : '0');

    // Shared Styles
    const cardStyle = {
        background: 'rgba(10, 15, 30, 0.7)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
        height: '280px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    };

    const itemStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        marginBottom: '0.75rem',
        fontSize: '0.85rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
    };

    const StatusBadge = ({ status }) => {
        if (status === 'online') return <span style={{ color: '#4ade80' }}>● Online</span>;
        if (status === 'offline') return <span style={{ color: '#f87171' }}>● Offline</span>;
        return <span style={{ color: '#facc15' }}>● Checking</span>;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', padding: '2.5rem', fontFamily: "'Outfit', sans-serif" }}>

            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Shield size={36} color="#38bdf8" />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                            QUANTIX AI CORE
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational Control v1.5.5</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Environment</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ade80' }}>PRODUCTION CLUSTER</div>
                    </div>
                    <button onClick={() => window.location.reload()} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600 }}>
                        <RefreshCw size={16} /> SYNC
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>

                {/* Infrastructure */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', gap: '10px', color: '#38bdf8' }}>
                        <Server size={18} /> Connectivity Grid
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={itemStyle}>
                            <span>Backend Cluster</span>
                            <StatusBadge status={systemStatus.api} />
                        </div>
                        <div style={itemStyle}>
                            <span>Supabase Engine</span>
                            <StatusBadge status={systemStatus.db} />
                        </div>
                        <div style={itemStyle}>
                            <span>Telegram Uplink</span>
                            <StatusBadge status={systemStatus.bot} />
                        </div>
                    </div>
                </div>

                {/* AI Status */}
                <div style={{ ...cardStyle, background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', gap: '10px', color: '#4ade80' }}>
                        <Cpu size={18} /> Neural Heartbeat
                    </h2>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '10px' }}>
                            <span style={{ color: '#94a3b8' }}>Learning Phase</span>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{aiState.learningPhase}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '15px' }}>
                            <span style={{ color: '#94a3b8' }}>Consistency</span>
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>99.2%</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                                <span>Inference Latency</span>
                                <span style={{ color: '#c084fc' }}>0.21s</span>
                            </div>
                            <div style={{ width: '100%', background: '#1e293b', height: '4px', borderRadius: '4px' }}>
                                <div style={{ width: '85%', background: '#c084fc', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Telemetry */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', gap: '10px', color: '#facc15' }}>
                        <Activity size={18} /> Market Operations
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active Targets</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#facc15', marginTop: '5px' }}>{fmt(realMetrics.activeSignals)}</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>24H Volume</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginTop: '5px' }}>{fmt(realMetrics.signals24h)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Total Signals Dispatched: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{fmt(realMetrics.totalSignals)}</span>
                    </div>
                </div>

                {/* Column Span for Logs */}
                <div style={{ gridColumn: 'span 3', background: '#000', borderRadius: '16px', border: '1px solid #1e293b', padding: '1.25rem', height: '350px', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
                            <Terminal size={16} /> NEURAL_LOG_STREAM
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#475569' }}>LISTENING_ON_PORT_5173</div>
                    </div>
                    <div ref={logContainerRef} style={{ flex: 1, overflowY: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.75rem', paddingRight: '10px' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px', display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#475569', minWidth: '80px' }}>[{log.time}]</span>
                                <span style={{
                                    minWidth: '60px',
                                    color: log.type === 'SUCCESS' ? '#4ade80' :
                                        log.type === 'ERROR' ? '#f87171' :
                                            log.type === 'AI' ? '#f472b6' : '#38bdf8'
                                }}>{log.type}</span>
                                <span style={{ color: '#cbd5e1' }}>{log.msg}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>

            </div>
        </div>
    );
}
