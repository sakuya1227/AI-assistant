'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Session { id: number; title: string; messages: Message[]; summary: string | null; createdAt: string; }
interface Config { pcUrl?: string; modalUrl?: string; name?: string | null; age?: number | null; gender?: string | null; memo?: string | null; password?: string; }

const MAX_RECENT_TURNS  = 10;
const MAX_SUMMARY_COUNT = 5;
const DEFAULT_PASSWORD  = 'ai-assistant';

function esc(t: string) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function PasswordScreen({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const submit = () => {
    const correct = (JSON.parse(localStorage.getItem('config') || '{}') as Config).password || DEFAULT_PASSWORD;
    if (pw === correct) { onAuth(); }
    else { setError(true); setPw(''); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#0f0f1a' }}>
      <div style={{ background:'#171728', border:'1px solid #2a2a45', borderRadius:18, padding:'40px 36px', width:340, maxWidth:'90vw', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🌸</div>
        <h1 style={{ fontSize:18, fontWeight:700, marginBottom:8, background:'linear-gradient(135deg,#7c6af7,#f76aaa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>AI アシスタント</h1>
        <p style={{ fontSize:12, color:'#7070a0', marginBottom:28 }}>パスワードを入力してください</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="パスワード" autoFocus
          style={{ width:'100%', background:'#1e1e32', border:`1px solid ${error?'#f76aaa':'#2a2a45'}`, borderRadius:10, padding:'10px 14px', color:'#e8e8f0', fontFamily:'inherit', fontSize:14, outline:'none', marginBottom:12, textAlign:'center', letterSpacing:'0.2em' }} />
        {error && <p style={{ fontSize:12, color:'#f76aaa', marginBottom:12 }}>パスワードが違うよ…</p>}
        <button onClick={submit} style={{ width:'100%', padding:'10px', border:'none', borderRadius:10, background:'linear-gradient(135deg,#7c6af7,#f76aaa)', color:'white', fontFamily:'inherit', fontSize:14, fontWeight:700, cursor:'pointer' }}>ログイン</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [authed,       setAuthed]       = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [currentIdx,   setCurrentIdx]   = useState<number>(-1);
  const [cfg,          setCfg]          = useState<Config>({});
  const [isVoiceMode,  setIsVoiceMode]  = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [pcConnected,  setPcConnected]  = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [commandMsg,   setCommandMsg]   = useState<string | null>(null);
  const [inputText,    setInputText]    = useState('');
  const [sPcUrl,    setSPcUrl]    = useState('http://localhost:7860');
  const [sModalUrl, setSModalUrl] = useState('');
  const [sName,     setSName]     = useState('');
  const [sAge,      setSAge]      = useState('');
  const [sGender,   setSGender]   = useState('');
  const [sMemo,     setSMemo]     = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sPasswordConfirm, setSPasswordConfirm] = useState('');
  const [pwChangeError, setPwChangeError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRef       = useRef(false);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const sessionsRef    = useRef<Session[]>([]);
  const currentIdxRef  = useRef<number>(-1);
  const cfgRef         = useRef<Config>({});

  useEffect(() => { sessionsRef.current   = sessions;   }, [sessions]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { cfgRef.current        = cfg;        }, [cfg]);

  const makeNewSession = (): Session => ({ id:Date.now(), title:'新しいセッション', messages:[], summary:null, createdAt:new Date().toISOString() });

  const initApp = useCallback(() => {
    const ss = JSON.parse(localStorage.getItem('sessions') || '[]') as Session[];
    const c  = JSON.parse(localStorage.getItem('config')   || '{}') as Config;
    setCfg(c); cfgRef.current = c;
    if (ss.length === 0) {
      const s = makeNewSession();
      setSessions([s]); sessionsRef.current=[s]; setCurrentIdx(0); currentIdxRef.current=0;
      localStorage.setItem('sessions', JSON.stringify([s]));
    } else {
      setSessions(ss); sessionsRef.current=ss; setCurrentIdx(0); currentIdxRef.current=0;
    }
  }, []);

  const handleAuth = useCallback(() => { setAuthed(true); initApp(); }, [initApp]);

  const checkPcStatus = useCallback(async () => {
    try {
      const res = await fetch((cfgRef.current.pcUrl||'http://localhost:7860')+'/api/status', { signal:AbortSignal.timeout(2000) });
      setPcConnected(!!(await res.json()).ok);
    } catch { setPcConnected(false); }
  }, []);

  useEffect(() => { if (!authed) return; checkPcStatus(); const t=setInterval(checkPcStatus,30000); return ()=>clearInterval(t); }, [checkPcStatus, authed]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [sessions, currentIdx, isLoading]);

  const saveSessions = (next: Session[]) => { setSessions([...next]); sessionsRef.current=[...next]; localStorage.setItem('sessions',JSON.stringify(next)); };

  const newSession = () => {
    const s = makeNewSession();
    saveSessions([s,...sessionsRef.current]); setCurrentIdx(0); currentIdxRef.current=0;
    setSidebarOpen(false);
  };

  const switchSession = (i: number) => { setCurrentIdx(i); currentIdxRef.current=i; setSidebarOpen(false); };

  const autoSummarize = (s: Session, all: Session[]) => {
    if (s.messages.length >= 20 && !s.summary) {
      s.summary = s.messages.slice(0,10).map(m=>`${m.role==='user'?'ユーザー':'AI'}: ${m.content}`).join('\n').slice(0,200)+'...';
      saveSessions([...all]);
    }
  };

  const pcPost = async (path: string, body: object) => {
    const res = await fetch((cfgRef.current.pcUrl||'http://localhost:7860')+path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return res.json();
  };

  const showCommandBanner = (msg: string) => { setCommandMsg(msg); setTimeout(()=>setCommandMsg(null),3000); };

  const sendToElyza = async (userInput: string, currentSessions: Session[], idx: number) => {
    const s=currentSessions[idx], url=cfgRef.current.modalUrl||'';
    if (!url) { const u=[...currentSessions]; u[idx].messages.push({role:'assistant',content:'Modal URLが設定されていないよ！設定から入力してね。'}); saveSessions(u); return; }
    const recentMsgs = s.messages.slice(0,-1).slice(-MAX_RECENT_TURNS).map(m=>({role:m.role,content:m.content}));
    const summaries  = currentSessions.filter((ss,i)=>i!==idx&&ss.summary).slice(0,MAX_SUMMARY_COUNT).map(ss=>ss.summary as string);
    setIsLoading(true);
    try {
      const res  = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ chat_history:recentMsgs, session_summaries:summaries, user_input:userInput, user_profile:{name:cfgRef.current.name||null,age:cfgRef.current.age||null,gender:cfgRef.current.gender||null,memo:cfgRef.current.memo||null} }) });
      const data = await res.json();
      const u=[...currentSessions]; u[idx].messages.push({role:'assistant',content:data.response||'（返答なし）'});
      autoSummarize(u[idx],u); saveSessions(u);
    } catch { const u=[...currentSessions]; u[idx].messages.push({role:'assistant',content:'接続エラーが発生しちゃった…Modal URLを確認してね。'}); saveSessions(u); }
    finally { setIsLoading(false); }
  };

  const handleUserInput = useCallback(async (text: string) => {
    let idx=currentIdxRef.current, cs=[...sessionsRef.current];
    if (idx<0) { const s=makeNewSession(); cs=[s,...cs]; idx=0; setCurrentIdx(0); currentIdxRef.current=0; }
    const u=[...cs]; u[idx]={...u[idx],messages:[...u[idx].messages,{role:'user',content:text}]};
    if (u[idx].title==='新しいセッション'&&u[idx].messages.length===1) u[idx].title=text.slice(0,20)+(text.length>20?'…':'');
    saveSessions(u);
    try {
      const cls=await pcPost('/api/classify',{text});
      if (cls&&cls.label!=='chat'&&cls.label!=='hearsay'&&cls.parsed) {
        const exec=await pcPost('/api/execute',{objects:cls.parsed.objects,main_verbs:cls.parsed.main_verbs});
        showCommandBanner(exec?.message||'実行しました');
        const u2=[...sessionsRef.current]; u2[idx]={...u2[idx],messages:[...u2[idx].messages,{role:'assistant',content:`「${text}」を実行したよ！`}]};
        saveSessions(u2); return;
      }
    } catch {}
    await sendToElyza(text, sessionsRef.current, idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async () => {
    const text=inputText.trim(); if (!text||isLoading) return;
    setInputText(''); if (textareaRef.current) textareaRef.current.style.height='auto';
    await handleUserInput(text);
  };

  const pollVoice = useCallback(async () => {
    if (!voiceRef.current) return;
    try { const d=await pcPost('/api/voice-pipeline',{}); if (d.text) { if (d.action==='command') showCommandBanner(d.message); else await handleUserInput(d.text); } } catch {}
    if (voiceRef.current) setTimeout(pollVoice,500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUserInput]);

  const toggleVoice = () => { if (!isVoiceMode) { voiceRef.current=true; setIsVoiceMode(true); pollVoice(); } else { voiceRef.current=false; setIsVoiceMode(false); } };

  const openSettings = () => {
    setSPcUrl(cfg.pcUrl||'http://localhost:7860'); setSModalUrl(cfg.modalUrl||'');
    setSName(cfg.name||''); setSAge(cfg.age?String(cfg.age):''); setSGender(cfg.gender||''); setSMemo(cfg.memo||'');
    setSPassword(''); setSPasswordConfirm(''); setPwChangeError(''); setShowSettings(true);
  };

  const saveSettings = () => {
    if (sPassword||sPasswordConfirm) {
      if (sPassword.length<4) { setPwChangeError('パスワードは4文字以上にしてね'); return; }
      if (sPassword!==sPasswordConfirm) { setPwChangeError('パスワードが一致しないよ'); return; }
    }
    const newCfg: Config = { pcUrl:sPcUrl||'http://localhost:7860', modalUrl:sModalUrl||'', name:sName||null, age:sAge?parseInt(sAge):null, gender:sGender||null, memo:sMemo||null, password:sPassword||(cfg.password||DEFAULT_PASSWORD) };
    setCfg(newCfg); cfgRef.current=newCfg; localStorage.setItem('config',JSON.stringify(newCfg)); setShowSettings(false); checkPcStatus();
  };

  if (!authed) return <PasswordScreen onAuth={handleAuth} />;
  const currentSession = sessions[currentIdx]||null;

  return (
    <div className="app-layout">

      {/* スマホ用オーバーレイ */}
      <div className={`sidebar-overlay ${sidebarOpen?'open':''}`} onClick={()=>setSidebarOpen(false)} />

      {/* サイドバー */}
      <nav className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-header">
          <h1>✦ AI アシスタント</h1>
          <button className="new-session-btn" onClick={newSession}>＋ 新しいセッション</button>
        </div>
        <div className="session-list">
          {sessions.map((s,i) => (
            <div key={s.id} className={`session-item ${i===currentIdx?'active':''}`} onClick={()=>switchSession(i)}>
              <div className="session-title">{s.title}</div>
              <div className="session-date">{new Date(s.createdAt).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="settings-btn" onClick={openSettings}>⚙ 設定</button>
        </div>
      </nav>

      {/* メインエリア */}
      <div className="main">
        {commandMsg && <div className="command-banner">⚡ {commandMsg}</div>}

        <div className="chat-header">
          {/* ハンバーガーボタン（スマホのみ表示） */}
          <button className="menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="ai-avatar">🌸</div>
          <div className="chat-header-info">
            <h2>ELYZA</h2>
            <div className={`pc-status ${pcConnected?'connected':''}`}>{pcConnected?'PC接続済み ✓':'PC未接続'}</div>
          </div>
        </div>

        <div className="messages">
          {!currentSession && <div style={{color:'var(--muted)',textAlign:'center',marginTop:40}}>セッションを選択または作成してください</div>}
          {currentSession?.messages.map((m,i) => {
            const isUser=m.role==='user';
            return (
              <div key={i} className={`msg-row ${isUser?'user':'ai'}`}>
                {!isUser && <div className="msg-avatar">🌸</div>}
                <div className="bubble" dangerouslySetInnerHTML={{__html:esc(m.content)}} />
                {isUser && <div className="msg-avatar">👤</div>}
              </div>
            );
          })}
          {isLoading && <div className="msg-row ai"><div className="msg-avatar">🌸</div><div className="bubble"><div className="typing-dots"><span/><span/><span/></div></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <button className={`input-btn voice-btn ${isVoiceMode?'listening':''}`} onClick={toggleVoice} title="音声入力">{isVoiceMode?'⏹':'🎤'}</button>
          <textarea ref={textareaRef} className="text-input" value={inputText} placeholder="メッセージを入力…" rows={1}
            onChange={e=>{setInputText(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px';}}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} />
          <button className="input-btn send-btn" onClick={sendMessage} disabled={isLoading||!inputText.trim()}>➤</button>
        </div>
      </div>

      {/* 設定モーダル */}
      {showSettings && (
        <div className="modal-overlay" onClick={()=>setShowSettings(false)}>
          <div className="modal-panel" onClick={e=>e.stopPropagation()}>
            <h3>⚙ 設定</h3>
            <div className="field"><label>PC サーバーURL</label><input type="text" value={sPcUrl} onChange={e=>setSPcUrl(e.target.value)} placeholder="http://localhost:7860" /><div className="hint">pc_server.py の起動URLを入力</div></div>
            <div className="field"><label>Modal API URL</label><input type="text" value={sModalUrl} onChange={e=>setSModalUrl(e.target.value)} placeholder="https://xxx.modal.run/chat" /></div>
            <hr style={{borderColor:'var(--border)',margin:'16px 0'}}/>
            <div className="field"><label>あなたの名前</label><input type="text" value={sName} onChange={e=>setSName(e.target.value)} placeholder="例: 翔" /></div>
            <div className="field"><label>年齢</label><input type="number" value={sAge} onChange={e=>setSAge(e.target.value)} placeholder="例: 22" /></div>
            <div className="field"><label>性別</label>
              <select value={sGender} onChange={e=>setSGender(e.target.value)}>
                <option value="">未設定</option><option value="男性">男性</option><option value="女性">女性</option><option value="その他">その他</option>
              </select>
            </div>
            <div className="field"><label>メモ（趣味・特記など）</label><textarea value={sMemo} onChange={e=>setSMemo(e.target.value)} placeholder="例: ゲームが好き、夜型人間" /></div>
            <hr style={{borderColor:'var(--border)',margin:'16px 0'}}/>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:10,fontWeight:700,letterSpacing:'.05em'}}>🔑 パスワード変更（変更しない場合は空欄のまま）</div>
            <div className="field"><label>新しいパスワード</label><input type="password" value={sPassword} onChange={e=>{setSPassword(e.target.value);setPwChangeError('');}} placeholder="4文字以上" /></div>
            <div className="field"><label>パスワード確認</label><input type="password" value={sPasswordConfirm} onChange={e=>{setSPasswordConfirm(e.target.value);setPwChangeError('');}} placeholder="もう一度入力" /></div>
            {pwChangeError && <div style={{fontSize:12,color:'#f76aaa',marginBottom:8}}>{pwChangeError}</div>}
            <div className="modal-btns">
              <button className="btn-cancel" onClick={()=>setShowSettings(false)}>キャンセル</button>
              <button className="btn-save" onClick={saveSettings}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
