import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bot, X, Send, Sparkles, AlertCircle, Loader2,
  Copy, Check, ChevronRight, Zap, TrendingUp,
  ClipboardList, Package, Receipt
} from 'lucide-react';

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: TrendingUp,    label: 'Sales this month',   text: 'What are my total sales this month?' },
  { icon: Package,       label: 'Low stock items',     text: 'Which inventory items are running low on stock?' },
  { icon: ClipboardList, label: 'Pending tasks',       text: 'Show me all my pending and overdue tasks.' },
  { icon: Receipt,       label: 'Unpaid invoices',     text: 'How many unpaid invoices do I have and what is the total amount?' },
  { icon: Zap,           label: 'Business summary',    text: 'Give me a quick summary of my business performance today.' },
];

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

// ─── Copy Button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <button onClick={handle} style={{
      display:'flex', alignItems:'center', gap:'3px', fontSize:'10px',
      color: copied ? '#10B981' : '#9CA3AF', background:'none', border:'none',
      cursor:'pointer', padding:'2px 4px', borderRadius:'4px', fontFamily:'inherit',
      transition:'color 0.2s', marginLeft:'auto'
    }}>
      {copied ? <Check size={10}/> : <Copy size={10}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

// ─── Typing dots ──────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display:'flex', gap:'4px', alignItems:'center', padding:'4px 0' }}>
    {[0,150,300].map((d,i) => (
      <span key={i} style={{
        width:'6px', height:'6px', borderRadius:'50%',
        background:'#3B82F6', display:'inline-block',
        animation:`bizDot 1.2s ease-in-out ${d}ms infinite`
      }}/>
    ))}
  </div>
);

// ─── Message ─────────────────────────────────────────────────────────────────
const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom:'12px' }}>
      {!isUser && (
        <div style={{
          width:'26px', height:'26px', borderRadius:'8px', flexShrink:0,
          background:'linear-gradient(135deg,#3B82F6,#6366F1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', marginRight:'8px', marginTop:'2px'
        }}>
          {msg.isError ? <AlertCircle size={12}/> : <Sparkles size={12}/>}
        </div>
      )}
      <div style={{ maxWidth:'82%' }}>
        <div style={{
          padding:'9px 13px',
          borderRadius: isUser ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
          background: isUser
            ? 'linear-gradient(135deg,#3B82F6,#6366F1)'
            : msg.isError ? '#FEF2F2' : 'white',
          color: isUser ? 'white' : msg.isError ? '#DC2626' : '#111827',
          fontSize:'13px', lineHeight:'1.55',
          border: isUser ? 'none' : msg.isError ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
          boxShadow: isUser ? '0 2px 12px rgba(59,130,246,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {msg.text.split('\n').map((line, i) =>
            line.trim() ? <p key={i} style={{margin:'2px 0'}}>{line}</p> : <br key={i}/>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', marginTop:'3px', paddingLeft: isUser ? 0 : '2px' }}>
          <span style={{ fontSize:'10px', color:'#9CA3AF' }}>{formatTime(msg.ts)}</span>
          {!isUser && !msg.isError && <CopyButton text={msg.text}/>}
        </div>
      </div>
    </div>
  );
};

// ─── Main Widget ──────────────────────────────────────────────────────────────
const QueryBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Drag state
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);

  // Drag handlers
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragRef.current) return;
    
    // If movement is tiny, don't consider it a drag (allows normal clicks)
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.hasMoved = true;
    }

    let newX = dragRef.current.startRight - dx;
    let newY = dragRef.current.startBottom - dy;
    
    // Keep within bounds
    newX = Math.max(10, Math.min(newX, window.innerWidth - 62));
    newY = Math.max(10, Math.min(newY, window.innerHeight - 62));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { 
      startX: e.clientX, 
      startY: e.clientY, 
      startRight: position.x, 
      startBottom: position.y, 
      hasMoved: false 
    };
  };

  const handleFabClick = () => {
    if (dragRef.current?.hasMoved) {
      // Don't open/close if just dragged
      dragRef.current.hasMoved = false;
      return;
    }
    setIsOpen(o => !o);
  };

  const buildHistory = (msgs) =>
    msgs.slice(0, -1).map((m) => ({ role: m.role, text: m.text }));

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: 'user', text: text.trim(), ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setQuery('');
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/chat`,
        { query: text.trim(), history: buildHistory(next) },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      const answer = res.data?.data?.answer || 'Got a response but could not read it.';
      setMessages(p => [...p, { role:'assistant', text:answer, ts:Date.now() }]);
    } catch {
      setMessages(p => [...p, { role:'assistant', text:'Something went wrong. Please try again.', isError:true, ts:Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(query); };
  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(query); } };

  const showWelcome = messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes bizDot { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes bizPop { 0%{transform:scale(0.85) translateY(12px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        .biz-panel { animation: bizPop 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .biz-panel::-webkit-scrollbar { display:none; }
        .biz-msg-area::-webkit-scrollbar { width:3px; }
        .biz-msg-area::-webkit-scrollbar-track { background:transparent; }
        .biz-msg-area::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px; }
        .biz-qp:hover { background:#EFF6FF !important; border-color:#BFDBFE !important; color:#1D4ED8 !important; transform:translateX(2px); }
        .biz-fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 8px 28px rgba(59,130,246,0.4) !important; }
        .biz-fab::before {
          content: 'Drag me';
          position: absolute;
          top: -30px;
          right: 50%;
          transform: translateX(50%) translateY(5px);
          background: #1F2937;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .biz-fab:hover::before { opacity: 1; transform: translateX(50%) translateY(0); }
        .biz-send:hover:not(:disabled) { background:linear-gradient(135deg,#2563EB,#4F46E5) !important; transform:scale(1.05); }
        .biz-input:focus { outline:none; }
        .biz-input-wrap:focus-within { border-color:#93C5FD !important; background:#F0F9FF !important; box-shadow:0 0 0 3px rgba(59,130,246,0.1) !important; }
      `}</style>

      {/* ── FAB ── */}
      <button
        id="bizzops-ai-fab"
        className="biz-fab"
        onMouseDown={handleMouseDown}
        onClick={handleFabClick}
        style={{
          position:'fixed', bottom: `${position.y}px`, right: `${position.x}px`, zIndex:998,
          width:'52px', height:'52px', borderRadius:'16px',
          background:'linear-gradient(135deg,#3B82F6,#6366F1)',
          border:'none', color:'white', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(59,130,246,0.35), 0 1px 4px rgba(0,0,0,0.15)',
          transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {isOpen ? <X size={20}/> : <Bot size={22}/>}
      </button>

      {/* ── Chat Popup ── */}
      {isOpen && (
        <div
          className="biz-panel"
          style={{
            position:'fixed', 
            bottom: `${position.y + 64}px`, 
            right: position.x > window.innerWidth / 2 ? `${position.x}px` : 'auto',
            left: position.x <= window.innerWidth / 2 ? `${window.innerWidth - position.x - 360}px` : 'auto', 
            zIndex:999,
            width:'360px', maxWidth:'calc(100vw - 48px)',
            borderRadius:'20px',
            background:'rgba(255,255,255,0.92)',
            backdropFilter:'blur(20px)',
            WebkitBackdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.6)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            display:'flex', flexDirection:'column',
            fontFamily:"'Inter',-apple-system,sans-serif",
            overflow:'hidden',
            maxHeight:'520px',
          }}
        >
          {/* Header */}
          <div style={{
            padding:'14px 16px',
            background:'linear-gradient(135deg,rgba(59,130,246,0.06),rgba(99,102,241,0.04))',
            borderBottom:'1px solid rgba(229,231,235,0.8)',
            display:'flex', alignItems:'center', gap:'10px', flexShrink:0,
          }}>
            <div style={{
              width:'34px', height:'34px', borderRadius:'10px', flexShrink:0,
              background:'linear-gradient(135deg,#3B82F6,#6366F1)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'white',
              boxShadow:'0 2px 8px rgba(59,130,246,0.3)'
            }}>
              <Sparkles size={16}/>
            </div>
            <div style={{flex:1}}>
              <p style={{margin:0, fontSize:'14px', fontWeight:700, color:'#111827', lineHeight:1.2}}>Biz AI Assistant</p>
              <p style={{margin:0, fontSize:'11px', color:'#6B7280', display:'flex', alignItems:'center', gap:'4px', marginTop:'1px'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10B981',display:'inline-block'}}/>
                Powered by Gemini
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{fontSize:'10px',color:'#9CA3AF',background:'#F3F4F6',border:'none',borderRadius:'6px',padding:'3px 7px',cursor:'pointer',fontFamily:'inherit'}}
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              style={{width:'28px',height:'28px',borderRadius:'8px',background:'#F3F4F6',border:'none',color:'#6B7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.15s'}}
              onMouseEnter={e => e.currentTarget.style.background='#E5E7EB'}
              onMouseLeave={e => e.currentTarget.style.background='#F3F4F6'}
            >
              <X size={14}/>
            </button>
          </div>

          {/* Messages */}
          <div
            className="biz-msg-area"
            style={{ flex:1, overflowY:'auto', padding:'16px', minHeight:0 }}
          >
            {showWelcome ? (
              <div style={{ textAlign:'center', padding:'8px 0 12px' }}>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'14px', margin:'0 auto 12px',
                  background:'linear-gradient(135deg,#3B82F6,#6366F1)',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                  boxShadow:'0 4px 16px rgba(59,130,246,0.3)'
                }}>
                  <Bot size={24}/>
                </div>
                <p style={{margin:'0 0 2px',fontSize:'14px',fontWeight:700,color:'#111827'}}>Hi, I'm Biz!</p>
                <p style={{margin:'0 0 16px',fontSize:'12px',color:'#6B7280',lineHeight:1.5}}>
                  Ask me anything about your business — sales, tasks, inventory and more.
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:'6px',textAlign:'left'}}>
                  {QUICK_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={i}
                        className="biz-qp"
                        onClick={() => sendMessage(p.text)}
                        disabled={isLoading}
                        style={{
                          display:'flex', alignItems:'center', gap:'8px',
                          padding:'8px 12px',
                          background:'#F9FAFB', border:'1px solid #E5E7EB',
                          borderRadius:'10px', color:'#374151',
                          fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit',
                          transition:'all 0.15s', textAlign:'left',
                        }}
                      >
                        <Icon size={13} style={{color:'#6B7280',flexShrink:0}}/>
                        <span style={{flex:1}}>{p.label}</span>
                        <ChevronRight size={12} style={{color:'#D1D5DB',flexShrink:0}}/>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => <Message key={idx} msg={msg}/>)
            )}

            {isLoading && (
              <div style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'12px'}}>
                <div style={{
                  width:'26px',height:'26px',borderRadius:'8px',flexShrink:0,
                  background:'linear-gradient(135deg,#3B82F6,#6366F1)',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'white',marginTop:'2px'
                }}>
                  <Sparkles size={12}/>
                </div>
                <div style={{
                  padding:'10px 14px', borderRadius:'3px 14px 14px 14px',
                  background:'white', border:'1px solid #E5E7EB',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{
            padding:'12px 14px 14px',
            borderTop:'1px solid rgba(229,231,235,0.8)',
            background:'rgba(249,250,251,0.8)', flexShrink:0
          }}>
            <form onSubmit={handleSubmit}>
              <div className="biz-input-wrap" style={{
                display:'flex', alignItems:'center', gap:'8px',
                background:'white', border:'1.5px solid #E5E7EB',
                borderRadius:'12px', padding:'4px 4px 4px 12px',
                transition:'all 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <input
                  ref={inputRef}
                  className="biz-input"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={isLoading}
                  placeholder="Ask anything about your business..."
                  maxLength={500}
                  autoComplete="off"
                  style={{
                    flex:1, border:'none', background:'transparent',
                    fontSize:'13px', color:'#111827', fontFamily:'inherit',
                    outline:'none', padding:'6px 0'
                  }}
                />
                <button
                  type="submit"
                  className="biz-send"
                  disabled={!query.trim() || isLoading}
                  style={{
                    width:'34px', height:'34px', borderRadius:'9px', flexShrink:0,
                    background:'linear-gradient(135deg,#3B82F6,#6366F1)',
                    border:'none', color:'white', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.15s',
                    opacity: (!query.trim() || isLoading) ? 0.45 : 1,
                    boxShadow: (!query.trim() || isLoading) ? 'none' : '0 2px 8px rgba(59,130,246,0.3)'
                  }}
                >
                  {isLoading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Send size={13}/>}
                </button>
              </div>
            </form>
            <p style={{margin:'7px 0 0',fontSize:'10px',color:'#9CA3AF',textAlign:'center'}}>
              Enter to send · Reads your live business data
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default QueryBotWidget;
