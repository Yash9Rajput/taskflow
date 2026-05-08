import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../api';

const SUGGESTIONS = [
  'How do I manage task priorities effectively?',
  'Write a project proposal for a mobile app',
  'Create a team meeting agenda template',
  'Explain agile vs waterfall methodology',
  'Best practices for remote team collaboration',
];

export default function AI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role:'assistant', content:`Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your TaskFlow AI assistant. I can help you with project planning, task management, writing, brainstorming, and much more. What can I help you with today?` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [file,    setFile]    = useState(null);
  const [fileData,setFileData]= useState(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFileData({ name:f.name, type:f.type, data:ev.target.result });
    if (f.type.startsWith('image/')) reader.readAsDataURL(f);
    else reader.readAsText(f);
  };

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q && !fileData) return;

    const userMsg = { role:'user', content: q, file: fileData };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setFile(null);
    setFileData(null);
    setLoading(true);

    try {
      // Build messages for API
      const apiMessages = [];
      const history = [...messages, userMsg].slice(-10);
      for (const msg of history) {
        if (msg.role === 'user') {
          const parts = [];
          if (msg.file?.type?.startsWith('image/')) {
            parts.push({ type:'image', source:{ type:'base64', media_type:msg.file.type, data:msg.file.data.split(',')[1] } });
          }
          if (msg.content) parts.push({ type:'text', text: msg.file && !msg.file.type.startsWith('image/') ? `[File: ${msg.file.name}]\n${msg.file.data}\n\n${msg.content}` : msg.content });
          if (parts.length) apiMessages.push({ role:'user', content: parts.length===1&&parts[0].type==='text'? parts[0].text : parts });
        } else {
          apiMessages.push({ role:'assistant', content: msg.content });
        }
      }

      const systemPrompt = `You are an expert AI assistant integrated into TaskFlow, a team task management platform. You help users with project planning, task management, productivity, writing, brainstorming, and answering any questions. The current user is ${user?.name} with role ${user?.role}. Be helpful, concise, and professional. Use markdown formatting when appropriate.`;

      const response = await aiAPI.chat(apiMessages, systemPrompt);
      const reply = response.data?.content || 'Sorry, I could not generate a response.';
      setMessages(m => [...m, { role:'assistant', content:reply }]);
    } catch (err) {
      setMessages(m => [...m, { role:'assistant', content:'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text) => {
    // Simple markdown-like rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.2);padding:1px 6px;border-radius:4px;font-size:0.9em">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 120px)',minHeight:500}}>
      {/* Header */}
      <div className="au" style={{marginBottom:'1rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,borderRadius:'var(--r-md)',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:'0 8px 24px rgba(99,102,241,0.4)'}}>✦</div>
          <div>
            <h1 style={{fontFamily:'var(--font-d)',fontSize:22,fontWeight:700,background:'linear-gradient(135deg,#a5b4fc,#c4b5fd)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>AI Assistant</h1>
            <p style={{fontSize:12,color:'var(--text-3)'}}>Ask anything about your projects</p>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'1.25rem',display:'flex',flexDirection:'column',gap:12}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flexDirection:msg.role==='user'?'row-reverse':'row'}}>
              {/* Avatar */}
              <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
                background:msg.role==='assistant'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.08)',
                border:'1px solid var(--border-hi)',color:'white',fontWeight:600}}>
                {msg.role==='assistant'?'✦':(user?.name?.[0]||'U')}
              </div>
              {/* Bubble */}
              <div style={{
                maxWidth:'75%',padding:'10px 14px',borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:msg.role==='user'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.05)',
                border:msg.role==='user'?'none':'1px solid var(--border)',
                fontSize:14,lineHeight:1.7,color:msg.role==='user'?'white':'var(--text-2)',
                animation:'fadeUp 0.3s ease',
              }}>
                {msg.file && msg.file.type?.startsWith('image/') && <img src={msg.file.data} alt={msg.file.name} style={{width:'100%',borderRadius:'var(--r-sm)',marginBottom:8,maxHeight:200,objectFit:'cover'}}/>}
                {msg.file && !msg.file.type?.startsWith('image/') && <div style={{padding:'6px 10px',background:'rgba(255,255,255,0.1)',borderRadius:6,fontSize:12,marginBottom:8}}>📎 {msg.file.name}</div>}
                <div dangerouslySetInnerHTML={{__html:renderContent(msg.content)}}/>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'white'}}>✦</div>
              <div style={{padding:'12px 16px',borderRadius:'18px 18px 18px 4px',background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',animation:`pulse-dot 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Suggestions */}
        {messages.length<=1 && (
          <div style={{padding:'0 1.25rem',marginBottom:'0.75rem'}}>
            <div style={{fontSize:11,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,fontWeight:600}}>Suggestions</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {SUGGESTIONS.map(s=>(
                <button key={s} onClick={()=>sendMessage(s)}
                  style={{padding:'5px 12px',borderRadius:999,border:'1px solid var(--border)',background:'rgba(255,255,255,0.04)',fontSize:12,color:'var(--text-2)',cursor:'pointer',transition:'all 0.2s',fontFamily:'var(--font-b)'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='#a5b4fc';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-2)';}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{padding:'1rem 1.25rem',borderTop:'1px solid var(--border)'}}>
          {file && (
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:'rgba(99,102,241,0.1)',borderRadius:'var(--r-sm)',fontSize:12,border:'1px solid rgba(99,102,241,0.2)'}}>
              <span>📎</span><span style={{flex:1,color:'#a5b4fc'}}>{file.name}</span>
              <button onClick={()=>{setFile(null);setFileData(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:14}}>✕</button>
            </div>
          )}
          <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.md" onChange={handleFile} style={{display:'none'}}/>
            <button onClick={()=>fileRef.current?.click()} className="btn" style={{flexShrink:0,padding:'10px 12px'}} title="Attach file">📎</button>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
              placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
              style={{flex:1,minHeight:44,maxHeight:140,resize:'none',borderRadius:'var(--r-md)',padding:'10px 14px',fontSize:14,lineHeight:1.5}}/>
            <button onClick={()=>sendMessage()} className="btn btn-primary" style={{flexShrink:0,padding:'10px 16px'}} disabled={loading||(!input.trim()&&!fileData)}>
              {loading?'…':'Send ↑'}
            </button>
          </div>
          <div style={{fontSize:10,color:'var(--text-3)',textAlign:'center',marginTop:6}}>Developed by Yash Rajput · Integrated with ❤️</div>
        </div>
      </div>
    </div>
  );
}
