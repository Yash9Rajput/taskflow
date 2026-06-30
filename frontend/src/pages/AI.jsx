import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../api';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '📋', text: 'How do I manage task priorities effectively?' },
  { icon: '📱', text: 'Write a project proposal for a mobile app' },
  { icon: '📅', text: 'Create a team meeting agenda template' },
  { icon: '⚡', text: 'Explain agile vs waterfall methodology' },
  { icon: '🌐', text: 'Best practices for remote team collaboration' },
  { icon: '🎯', text: 'How to set effective OKRs for my team?' },
];

// ── Per-user storage key ─────────────────────────────────────────────────────
// CRITICAL FIX: chats must be scoped to the logged-in user's ID, never shared
// globally — otherwise Account A sees Account B's chat history.
function storageKeyFor(userId) {
  return userId ? `tf_ai_chats_${userId}` : null;
}

function loadChats(userId) {
  const key = storageKeyFor(userId);
  if (!key) return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveChats(userId, chats) {
  const key = storageKeyFor(userId);
  if (!key) return;
  try { localStorage.setItem(key, JSON.stringify(chats.slice(0, 30))); } catch {}
}
function genChatId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function chatTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New Chat';
  return first.content?.slice(0, 48) + (first.content?.length > 48 ? '…' : '');
}

// One-time migration: if the OLD global key `tf_ai_chats` exists from before
// this fix, and it has no owner info, just remove it so it can't leak into
// any account anymore. Each user starts fresh under their own scoped key.
function cleanupLegacyGlobalChats() {
  try {
    if (localStorage.getItem('tf_ai_chats')) {
      localStorage.removeItem('tf_ai_chats');
    }
  } catch {}
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = useCallback((text, key = 'default') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }, []);
  return { copy, copied };
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text, onCopyCode) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeStr = codeLines.join('\n');
      const key = `code-${keyCounter++}`;
      elements.push(
        <div key={key} style={{
          margin: '16px 0',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(99,102,241,0.25)',
          background: 'rgba(0,0,0,0.35)',
        }}>
          {/* Code header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px',
            background: 'rgba(99,102,241,0.12)',
            borderBottom: '1px solid rgba(99,102,241,0.2)',
            flexWrap: 'wrap', gap: 6,
          }}>
            <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang}
            </span>
            <button
              onClick={() => onCopyCode(codeStr, key)}
              style={{
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#a5b4fc',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500,
              }}>
              📋 Copy code
            </button>
          </div>
          {/* Scrollable code */}
          <div style={{ overflowX: 'auto', padding: '14px 16px', maxHeight: 400, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <pre style={{
              margin: 0, fontSize: 13, lineHeight: 1.65,
              color: '#e2e8f0', fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
              whiteSpace: 'pre',
            }}>
              {codeStr}
            </pre>
          </div>
        </div>
      );
      i++;
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={keyCounter++} style={{
          fontSize: 20, fontWeight: 800, color: 'var(--text)',
          margin: '20px 0 10px', letterSpacing: '-0.3px',
          borderBottom: '2px solid rgba(99,102,241,0.3)', paddingBottom: 8,
          background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{line.slice(2)}</h1>
      );
      i++; continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={keyCounter++} style={{
          fontSize: 17, fontWeight: 700, color: '#c4b5fd',
          margin: '18px 0 8px', letterSpacing: '-0.2px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 3, height: 18, background: 'linear-gradient(#6366f1,#8b5cf6)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }}/>
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={keyCounter++} style={{
          fontSize: 15, fontWeight: 700, color: '#a5b4fc',
          margin: '14px 0 6px',
        }}>{line.slice(4)}</h3>
      );
      i++; continue;
    }

    // H4
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={keyCounter++} style={{
          fontSize: 13, fontWeight: 700, color: '#94a3b8',
          margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{line.slice(5)}</h4>
      );
      i++; continue;
    }

    // Horizontal rule
    if (line.startsWith('---') || line.startsWith('***')) {
      elements.push(
        <hr key={keyCounter++} style={{
          border: 'none', borderTop: '1px solid rgba(99,102,241,0.2)',
          margin: '16px 0',
        }}/>
      );
      i++; continue;
    }

    // Unordered list
    if (line.match(/^[-*•] /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={keyCounter++} style={{ margin: '8px 0', paddingLeft: 0, listStyle: 'none' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '4px 0', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                flexShrink: 0, marginTop: 8,
              }}/>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}/>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={keyCounter++} style={{ margin: '8px 0', paddingLeft: 0, listStyle: 'none' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '4px 0', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7,
            }}>
              <span style={{
                minWidth: 22, height: 22, borderRadius: 6,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
              }}>{idx + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}/>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={keyCounter++} style={{
          borderLeft: '3px solid #6366f1',
          background: 'rgba(99,102,241,0.06)',
          borderRadius: '0 8px 8px 0',
          padding: '10px 16px',
          margin: '10px 0',
          fontSize: 14, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.7,
        }}>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}/>
        </blockquote>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={keyCounter++} style={{ height: 6 }}/>);
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <p key={keyCounter++} style={{
        margin: '4px 0', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8,
      }}>
        <span dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}/>
      </p>
    );
    i++;
  }

  return elements;
}

// Inline formatting: bold, italic, inline code
function inlineFormat(text) {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text);font-weight:700">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#c4b5fd">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.25);padding:1px 7px;border-radius:5px;font-size:0.88em;font-family:monospace;color:#a5b4fc">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#818cf8;text-decoration:underline">$1</a>');
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, active }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 8,
        border: `1px solid ${active || hover ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
        background: active || hover ? 'rgba(99,102,241,0.12)' : 'transparent',
        color: active ? '#a5b4fc' : hover ? '#a5b4fc' : 'var(--text-3)',
        fontSize: 11, fontWeight: 500, cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'var(--font-b)',
        whiteSpace: 'nowrap',
      }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ content, onClose }) {
  const { copy, copied } = useCopy();
  const shareText = `💬 Shared from TaskFlow AI\n\n${content}`;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
        borderRadius: 20, padding: '1.5rem', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'scaleIn 0.2s ease',
        maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700 }}>Share Response</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18 }}>✕</button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'var(--text-2)',
          lineHeight: 1.6, maxHeight: 120, overflow: 'hidden',
          textOverflow: 'ellipsis', marginBottom: '1rem',
        }}>
          {content.slice(0, 200)}{content.length > 200 ? '…' : ''}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '📋', label: 'Copy to clipboard', action: () => copy(shareText, 'share') },
            { icon: '✉️', label: 'Share via email', action: () => window.open(`mailto:?subject=TaskFlow AI Response&body=${encodeURIComponent(shareText)}`) },
            { icon: '💬', label: 'Share via WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`) },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-b)',
              transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{label}</span>
              {copied === 'share' && label.includes('Copy') && <span style={{ marginLeft: 'auto', color: '#34d399', fontSize: 11 }}>✓ Copied!</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ content, onClose, onResend }) {
  const [val, setVal] = useState(content);
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
        borderRadius: 20, padding: '1.5rem', width: '100%', maxWidth: 520,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'scaleIn 0.2s ease',
        maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700 }}>Edit & Resend</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18 }}>✕</button>
        </div>
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          style={{
            width: '100%', minHeight: 100, maxHeight: 240, resize: 'vertical',
            borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.6,
            marginBottom: '1rem', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onResend(val); onClose(); }} disabled={!val.trim()}>
            Resend ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recent chats sidebar ──────────────────────────────────────────────────────
function ChatSidebar({ chats, activeChatId, onSelect, onNew, onDelete, searchQuery, onSearch, onClose }) {
  const filtered = chats.filter(c =>
    !searchQuery || chatTitle(c.messages).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Sidebar header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>💬 Recent Chats</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }} title="Close sidebar">✕</button>
        </div>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-3)' }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search chats…"
            style={{ width: '100%', paddingLeft: 30, fontSize: 12, padding: '7px 10px 7px 28px', borderRadius: 8, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* New chat button */}
      <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onNew}
          style={{
            width: '100%', padding: '9px', borderRadius: 10,
            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'var(--font-b)',
          }}>
          ✦ New Chat
        </button>
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-3)', fontSize: 12 }}>
            {searchQuery ? 'No chats found' : 'No previous chats yet'}
          </div>
        ) : filtered.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            style={{
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
              background: activeChatId === chat.id ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: `1px solid ${activeChatId === chat.id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}
            onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ fontSize: 14, marginTop: 1 }}>💬</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: activeChatId === chat.id ? 600 : 400,
                color: activeChatId === chat.id ? '#a5b4fc' : 'var(--text-2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{chatTitle(chat.messages)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                {new Date(chat.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(chat.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
              title="Delete chat">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AI() {
  const { user } = useAuth();
  const { copy, copied } = useCopy();

  const makeWelcome = () => ({
    role: 'assistant',
    content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your **TaskFlow AI assistant**. I can help you with:\n\n- 📋 Project planning & task management\n- ✍️ Writing proposals, agendas & templates\n- 🧠 Brainstorming & strategy\n- 💻 Code help & technical questions\n- 🌐 Any question you have\n\nWhat can I help you with today?`,
    id: 'welcome',
  });

  // ── CRITICAL FIX: chats are now scoped to user.id ─────────────────────────
  // Previously all accounts shared a single `tf_ai_chats` localStorage key,
  // so Account B could see Account A's saved chats. Now every read/write
  // goes through storageKeyFor(user.id) which is unique per account.
  const [chats, setChats]           = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages]     = useState([makeWelcome()]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [file, setFile]             = useState(null);
  const [fileData, setFileData]     = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [shareMsg, setShareMsg]     = useState(null);
  const [editMsg, setEditMsg]       = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768);

  const messagesEndRef = useRef(null);
  const fileRef        = useRef(null);
  const textareaRef    = useRef(null);

  // Track viewport for mobile layout
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load this user's own chats once we know who they are
  useEffect(() => {
    if (!user?.id) return;
    cleanupLegacyGlobalChats();
    setChats(loadChats(user.id));
    setMessages([makeWelcome()]);
    setActiveChatId(null);
  }, [user?.id]);

  // Scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // Save current chat to THIS user's scoped storage whenever messages change
  useEffect(() => {
    if (!user?.id) return;
    if (messages.length <= 1) return; // don't save empty/welcome-only chats
    const chatData = {
      id: activeChatId || genChatId(),
      messages,
      updatedAt: Date.now(),
    };
    if (!activeChatId) setActiveChatId(chatData.id);
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== chatData.id);
      const updated  = [chatData, ...filtered];
      saveChats(user.id, updated);
      return updated;
    });
  }, [messages]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setFileData({ name: f.name, type: f.type, data: ev.target.result });
    if (f.type.startsWith('image/')) reader.readAsDataURL(f);
    else reader.readAsText(f);
  };

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q && !fileData) return;

    const userMsg = { role: 'user', content: q, file: fileData, id: genChatId() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setFile(null);
    setFileData(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const apiMessages = [];
      const history = [...messages, userMsg].slice(-10);
      for (const msg of history) {
        if (msg.role === 'user') {
          const parts = [];
          if (msg.file?.type?.startsWith('image/')) {
            parts.push({ type: 'image', source: { type: 'base64', media_type: msg.file.type, data: msg.file.data.split(',')[1] } });
          }
          if (msg.content) parts.push({ type: 'text', text: msg.file && !msg.file.type.startsWith('image/') ? `[File: ${msg.file.name}]\n${msg.file.data}\n\n${msg.content}` : msg.content });
          if (parts.length) apiMessages.push({ role: 'user', content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts });
        } else {
          apiMessages.push({ role: 'assistant', content: msg.content });
        }
      }

      const systemPrompt = `You are an expert AI assistant integrated into TaskFlow, a team task management platform. You help users with project planning, task management, productivity, writing, brainstorming, and answering any questions. The current user is ${user?.name} with role ${user?.role}. Be helpful, concise, and professional. Use markdown formatting when appropriate.`;
      const response = await aiAPI.chat(apiMessages, systemPrompt);
      const reply = response.data?.content || 'Sorry, I could not generate a response.';
      setMessages(m => [...m, { role: 'assistant', content: reply, id: genChatId() }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: genChatId() }]);
    } finally {
      setLoading(false);
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages(m => m.filter((_, i) => i < m.length - 1 || m[m.length - 1].role !== 'assistant'));
    sendMessage(lastUser.content);
  };

  const startNewChat = () => {
    setMessages([makeWelcome()]);
    setActiveChatId(null);
    setInput('');
    if (isMobile) setShowSidebar(false);
  };

  const loadChat = (id) => {
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setMessages(chat.messages);
      setActiveChatId(id);
      setShowSidebar(false);
    }
  };

  const deleteChat = (id) => {
    if (!user?.id) return;
    setChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChats(user.id, updated);
      return updated;
    });
    if (activeChatId === id) startNewChat();
  };

  const handleCopyCode = (code, key) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(key);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', minHeight: 500 }}>

      {/* Modals */}
      {shareMsg && <ShareModal content={shareMsg} onClose={() => setShareMsg(null)} />}
      {editMsg  && <EditModal  content={editMsg.content} onClose={() => setEditMsg(null)} onResend={(txt) => { sendMessage(txt); }} />}

      {/* Header */}
      <div className="au" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 24px rgba(99,102,241,0.4)', flexShrink: 0 }}>✦</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI Assistant</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ask anything · {chats.length} saved chats</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setShowSidebar(v => !v)}
            className="btn"
            style={{ fontSize: 12, gap: 6, display: 'flex', alignItems: 'center', background: showSidebar ? 'rgba(99,102,241,0.12)' : undefined, borderColor: showSidebar ? 'rgba(99,102,241,0.4)' : undefined }}>
            💬 <span className="ai-btn-label">Chats</span> {chats.length > 0 && <span style={{ background: 'rgba(99,102,241,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 10, color: '#a5b4fc' }}>{chats.length}</span>}
          </button>
          <button onClick={startNewChat} className="btn btn-primary" style={{ fontSize: 12 }}>
            ✦ <span className="ai-btn-label">New Chat</span>
          </button>
        </div>
      </div>

      {/* Body: sidebar + chat */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* Sidebar — overlay on mobile, inline on desktop */}
        {showSidebar && (
          <>
            {isMobile && (
              <div
                onClick={() => setShowSidebar(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 90 }}
              />
            )}
            <div style={isMobile ? {
              position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 91,
              width: 'min(280px, 85vw)', animation: 'slideInLeft 0.25s ease',
            } : {}}>
              <ChatSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelect={loadChat}
                onNew={startNewChat}
                onDelete={deleteChat}
                searchQuery={sidebarSearch}
                onSearch={setSidebarSearch}
                onClose={() => setShowSidebar(false)}
              />
            </div>
          </>
        )}

        {/* Chat window */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={msg.id || i}>
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    background: msg.role === 'assistant' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-hi)', color: 'white', fontWeight: 600,
                    boxShadow: msg.role === 'assistant' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}>
                    {msg.role === 'assistant' ? '✦' : (user?.name?.[0] || 'U')}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: msg.role === 'user' ? '85%' : '92%',
                    minWidth: 80,
                  }}>
                    <div style={{
                      padding: msg.role === 'user' ? '10px 16px' : '16px 20px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.04)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                      fontSize: 14, lineHeight: 1.8,
                      color: msg.role === 'user' ? 'white' : 'var(--text-2)',
                      animation: 'fadeUp 0.3s ease',
                      wordBreak: 'break-word',
                    }}>
                      {msg.file && msg.file.type?.startsWith('image/') && (
                        <img src={msg.file.data} alt={msg.file.name} style={{ width: '100%', borderRadius: 'var(--r-sm)', marginBottom: 8, maxHeight: 200, objectFit: 'cover' }}/>
                      )}
                      {msg.file && !msg.file.type?.startsWith('image/') && (
                        <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, marginBottom: 8 }}>📎 {msg.file.name}</div>
                      )}
                      {msg.role === 'user'
                        ? <span>{msg.content}</span>
                        : <div>{renderMarkdown(msg.content, handleCopyCode)}</div>
                      }
                    </div>

                    {/* Action bar */}
                    <div style={{
                      display: 'flex', gap: 4, marginTop: 6,
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      flexWrap: 'wrap',
                    }}>
                      {msg.role === 'user' ? (
                        <>
                          <ActionBtn icon="✏️" label="Edit" onClick={() => setEditMsg(msg)} />
                          <ActionBtn icon={copied === msg.id ? '✓' : '📋'} label={copied === msg.id ? 'Copied!' : 'Copy'} onClick={() => copy(msg.content, msg.id)} active={copied === msg.id} />
                        </>
                      ) : (
                        i > 0 && <>
                          <ActionBtn icon={copied === msg.id ? '✓' : '📋'} label={copied === msg.id ? 'Copied!' : 'Copy'} onClick={() => copy(msg.content, msg.id)} active={copied === msg.id} />
                          <ActionBtn icon="↗️" label="Share" onClick={() => setShareMsg(msg.content)} />
                          {i === messages.length - 1 && (
                            <ActionBtn icon="🔄" label="Retry" onClick={retryLast} />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>✦</div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `pulse-dot 1.2s ${j * 0.2}s ease-in-out infinite` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 1.25rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>✨ Quick Start</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)}
                    style={{
                      padding: '8px 12px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)',
                      fontSize: 12, color: 'var(--text-2)', cursor: 'pointer',
                      transition: 'all 0.2s', fontFamily: 'var(--font-b)',
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#a5b4fc'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
            {file && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--r-sm)', fontSize: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
                <span>📎</span>
                <span style={{ flex: 1, color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <button onClick={() => { setFile(null); setFileData(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14 }}>✕</button>
              </div>
            )}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-hi)',
              borderRadius: 16, padding: '8px 10px',
              transition: 'border-color 0.2s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.md" onChange={handleFile} style={{ display: 'none' }}/>
              <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, padding: '4px 6px', borderRadius: 8, flexShrink: 0 }} title="Attach file">📎</button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); sendMessage(); } }}
                placeholder={isMobile ? 'Ask anything…' : 'Ask anything… (Enter to send, Shift+Enter for new line)'}
                rows={1}
                style={{
                  flex: 1, minHeight: 24, maxHeight: 140, resize: 'none',
                  background: 'transparent', border: 'none', outline: 'none',
                  padding: '4px 4px', fontSize: 14, lineHeight: 1.6,
                  color: 'var(--text)', fontFamily: 'var(--font-b)',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !fileData)}
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                  background: loading || (!input.trim() && !fileData) ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border: 'none', color: 'white', fontSize: 16, cursor: loading || (!input.trim() && !fileData) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: loading || (!input.trim() && !fileData) ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s',
                }}>
                {loading ? '…' : '↑'}
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>
              Developed by Yash Rajput · Integrated with ❤️
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
