import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, TrendingUp, Mail, User, Briefcase, Loader2 } from 'lucide-react';

// ===== QUANTIX AI BOT v1.5 - INVESTOR-FOCUSED FAQ DATABASE =====
const FAQ_DATABASE = {
    'technical_inquiry': {
        question: "⚙️ Technical Inquiry",
        answer: "Quantix Core v1.5 uses **Semantic Caching** to reduce LLM overhead by 70%. We process real-time market data through a hybrid routing system, ensuring high-speed delivery with minimal API costs.\n\nWould you like to see our Architecture Diagram?",
        followUp: "May I have your email to send the technical documentation?"
    },
    'be_a_partner': {
        question: "🤝 I want to be a Partner",
        answer: "We're looking for **Strategic Partners** to scale the Quantix ecosystem. We offer:\n\n• Revenue Sharing for KOLs\n• API Licensing for institutions\n• White-label solutions\n\nShould I send our Partnership Deck to your email?",
        followUp: "Please provide your email to receive the Partnership Package.",
        isVIP: true
    },
    'investment_case': {
        question: "📊 Investment Case",
        answer: "Our **Unit Economics** are built for scale:\n\n• 90% gross margin per premium user\n• $2.50 CAC with 12-month payback\n• Projected ARR: $5M by Q4 2026\n\nQuantix is designed for rapid ROI. May I provide our 24-month financial roadmap?",
        followUp: "To send the full Investment Memo, I'll need your email address."
    },
    'market_performance': {
        question: "📈 Market Performance",
        answer: "Version 1.5 has expanded from VN30 to the **full market**, maintaining an 85%+ Confidence Score on trend signals.\n\nWe focus on 'Micro-Personalization'—analyzing exactly what's in YOUR portfolio, not generic market noise.",
        followUp: "Want to see live performance metrics? Leave your email below."
    },
    'pricing': {
        question: "💰 Pricing Model",
        answer: "We offer tiered pricing:\n\n• **Free**: Basic signals for individuals\n• **Pro ($49/mo)**: Advanced analytics + alerts\n• **Enterprise**: Custom API licensing\n\nOur cost-per-user is 70% lower than traditional platforms.",
        followUp: "Interested in a custom quote? Share your email."
    },
    'technology': {
        question: "🔬 Technology Stack",
        answer: "We leverage:\n\n• Advanced LLM with proprietary semantic caching\n• Real-time market data via Yahoo Finance & OANDA\n• Scalable Supabase backend\n• Edge computing for sub-100ms latency\n\nOur tech stack is built for institutional-grade reliability.",
        followUp: "Want the full tech spec sheet? Drop your email."
    },
    'roadmap': {
        question: "🗺️ 2026 Roadmap",
        answer: "Our expansion plan:\n\n**Q1**: Full market coverage (VN30 → All stocks)\n**Q2**: Automated payment gateway integration\n**Q3**: B2B API licensing launch\n**Q4**: International expansion (Thailand, Indonesia)\n\nWe're scaling fast.",
        followUp: "Want quarterly updates? Leave your email."
    }
};

// ===== QUICK REPLY BUTTONS (Investor-Focused) =====
const QUICK_REPLIES = [
    { id: 'technical_inquiry', text: "⚙️ Technical Inquiry" },
    { id: 'be_a_partner', text: "🤝 I want to be a Partner" },
    { id: 'investment_case', text: "📊 Investment Case" },
    { id: 'market_performance', text: "📈 Market Performance" }
];

export default function InvestorConcierge() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [userProfile, setUserProfile] = useState({ name: '', email: '', role: '' });
    const [stage, setStage] = useState('greeting'); // greeting, profiling, consulting, capture
    const [hasGreeted, setHasGreeted] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // NEW: Typing indicator
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-greeting after 5 seconds
    useEffect(() => {
        if (!hasGreeted) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                addBotMessage(
                    "👋 Welcome to Quantix AI Core v1.5! I'm your Institutional Concierge.\n\nHow can I assist your interest today?",
                    ['💎 I want to Invest', '🤝 I want to be a Partner', '⚙️ Technical Inquiry']
                );
                setHasGreeted(true);
                setStage('profiling');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [hasGreeted]);

    const addBotMessage = (text, quickReplies = null) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            text,
            quickReplies,
            timestamp: new Date()
        }]);
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            text,
            timestamp: new Date()
        }]);
    };

    const handleQuickReply = (replyText) => {
        // CRITICAL: Reset state immediately to prevent "frozen" buttons
        setIsTyping(true);

        // Map text to FAQ ID
        let replyId = replyText;
        const faqEntry = QUICK_REPLIES.find(q => q.text === replyText);
        if (faqEntry) {
            replyId = faqEntry.id;
        }

        // Display user's choice
        const faqItem = FAQ_DATABASE[replyId];
        if (faqItem) {
            addUserMessage(faqItem.question);
        } else {
            addUserMessage(replyText);
        }

        // Show typing indicator for 1.2 seconds
        setTimeout(() => {
            setIsTyping(false);

            if (stage === 'profiling') {
                // Initial profiling stage
                setUserProfile(prev => ({ ...prev, role: replyId }));

                let followUp = "";
                if (replyId === 'investment_case') {
                    followUp = "Fantastic. We are currently opening our Strategic Seed Round. Would you like to see our Financial Projections?";
                } else if (replyId === 'be_a_partner') {
                    followUp = "We love scaling through collaboration. Are you interested in our API Licensing or Local Distribution?";
                } else {
                    followUp = "Our v1.5 Core utilizes Semantic Caching and Hybrid Model routing. What technical aspects can I clarify?";
                }

                addBotMessage(followUp, QUICK_REPLIES.map(q => q.text));
                setStage('consulting');
            } else {
                // Consulting stage - handle FAQ
                handleFAQ(replyId);
            }
        }, 1200);
    };

    const handleFAQ = (queryOrId) => {
        setIsTyping(true);

        let faqItem = null;

        // Try direct ID match first
        if (FAQ_DATABASE[queryOrId]) {
            faqItem = FAQ_DATABASE[queryOrId];
        } else {
            // Fuzzy search through FAQ
            const lowerQuery = queryOrId.toLowerCase();
            for (const [key, faq] of Object.entries(FAQ_DATABASE)) {
                if (lowerQuery.includes(key) ||
                    lowerQuery.includes(faq.question.toLowerCase()) ||
                    faq.question.toLowerCase().includes(lowerQuery)) {
                    faqItem = faq;
                    break;
                }
            }
        }

        setTimeout(() => {
            setIsTyping(false);

            if (faqItem) {
                addBotMessage(faqItem.answer);

                // Smart follow-up
                setTimeout(() => {
                    if (faqItem.followUp) {
                        addBotMessage(faqItem.followUp, null);
                        setStage('capture');
                    } else {
                        addBotMessage(
                            "Would you like to know more about something else?",
                            QUICK_REPLIES.map(q => q.text)
                        );
                    }
                }, 1500);
            } else {
                // Fallback for unrecognized queries
                addBotMessage(
                    "That's a great question! Let me connect you with our founder for a detailed answer.\n\nMay I have your email to arrange a follow-up?",
                    null
                );
                setStage('capture');
            }
        }, 1200);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const message = inputValue.trim();
        addUserMessage(message);
        setInputValue('');

        if (stage === 'capture') {
            // Capture user details
            if (!userProfile.name) {
                setUserProfile(prev => ({ ...prev, name: message }));
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    addBotMessage("Great! And what's your email address?");
                }, 800);
            } else if (!userProfile.email) {
                // ===== EMAIL VALIDATION =====
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(message)) {
                    setIsTyping(true);
                    setTimeout(() => {
                        setIsTyping(false);
                        addBotMessage("⚠️ That doesn't look like a valid email. Please enter a valid email address (e.g., investor@company.com)");
                    }, 600);
                    return;
                }

                setUserProfile(prev => ({ ...prev, email: message }));

                // Determine if this is a VIP Partner lead
                const isVIPLead = userProfile.role === 'be_a_partner';

                // Send notification email
                await sendLeadNotification({
                    ...userProfile,
                    email: message,
                    conversationSummary: messages.map(m => `${m.type}: ${m.text}`).join('\n'),
                    isVIP: isVIPLead
                });

                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    addBotMessage(
                        `Perfect! I've sent the ${isVIPLead ? 'Partnership Package' : 'Executive Summary'} to **${message}**.\n\nOur founder will personally reach out within 4 hours.\n\nIn the meantime, feel free to explore our [Investment Thesis](#/investment) page! 🚀`,
                        null
                    );
                    setStage('completed');
                }, 1200);
            }
        } else {
            handleFAQ(message);
        }
    };

    const sendLeadNotification = async (leadData) => {
        try {
            // ===== VIP PARTNER ALERT SYSTEM =====
            const emailSubject = leadData.isVIP
                ? "🔥 [VIP PARTNER] - Quantix Strategic Partnership Inquiry"
                : "🚀 [HOT LEAD] - Quantix Investor Inquiry";

            await fetch("https://formsubmit.co/ajax/vuquangcuong@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: emailSubject,
                    name: leadData.name,
                    email: leadData.email,
                    role: leadData.role,
                    priority: leadData.isVIP ? 'HIGH - PARTNER LEAD' : 'NORMAL',
                    conversation: leadData.conversationSummary,
                    timestamp: new Date().toISOString()
                })
            });
            console.log(`✅ Lead notification sent: ${emailSubject}`);
        } catch (error) {
            console.error("Failed to send lead notification:", error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9998,
                        transition: 'transform 0.3s ease',
                        animation: 'pulse 2s infinite'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <MessageCircle size={28} color="#000" />
                    <style>{`
            @keyframes pulse {
              0%, 100% { box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4); }
              50% { box-shadow: 0 4px 30px rgba(255, 215, 0, 0.8); }
            }
          `}</style>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '400px',
                    maxWidth: 'calc(100vw - 2rem)',
                    height: '600px',
                    maxHeight: 'calc(100vh - 4rem)',
                    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9999,
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sparkles size={24} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Quantix AI Concierge</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Investment Advisory Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} color="#000" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '0.5rem'
                                }}>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        background: msg.type === 'user'
                                            ? 'linear-gradient(135deg, #00F0FF 0%, #00BA88 100%)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>

                                {/* Quick Replies */}
                                {msg.quickReplies && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        {msg.quickReplies.map((reply, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuickReply(reply)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    border: '1px solid #FFD700',
                                                    background: 'rgba(255, 215, 0, 0.1)',
                                                    color: '#FFD700',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontWeight: '500'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#FFD700';
                                                    e.currentTarget.style.color = '#000';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                                                    e.currentTarget.style.color = '#FFD700';
                                                }}
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* ===== TYPING INDICATOR ===== */}
                        {isTyping && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <Loader2 size={16} color="#FFD700" className="animate-spin" />
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Quantix is typing...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    {stage !== 'completed' && (
                        <div style={{
                            padding: '1rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={
                                    stage === 'capture' && !userProfile.name ? "Your name..." :
                                        stage === 'capture' && !userProfile.email ? "Your email..." :
                                            "Type your message..."
                                }
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                    color: '#000',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
