'use client';

import { useState, useEffect } from 'react';

const EMOTION_COLORS: Record<string, string> = {
  Neutral:   '#7070a0',
  Happy:     '#f7c46a',
  Excited:   '#f76aaa',
  Angry:     '#f76a6a',
  Sorrow:    '#6aaaf7',
  Surprised: '#a06af7',
  Disgusted: '#6af7a0',
};

export default function TestPage() {
  const [data, setData] = useState<any>(null);

  // 0.5秒ごとにlocalStorageを監視して更新
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem('last_api_response');
      if (raw) setData(JSON.parse(raw));
    };
    load();
    const t = setInterval(load, 500);
    return () => clearInterval(t);
  }, []);

  const a = data?.animation || {};
  const color = EMOTION_COLORS[a.emotion] || '#7070a0';
  const intensityPct = Math.round((a.intensity || 0) * 100);

  return (
    <div style={{ minHeight:'100dvh', background:'#0f0f1a', color:'#e8e8f0', padding:24, fontFamily:'sans-serif' }}>
      <h1 style={{ fontSize:15, color:'#7c6af7', marginBottom:4 }}>🌸 最新APIレスポンス確認</h1>
      <p style={{ fontSize:12, color:'#7070a0', marginBottom:20 }}>アプリでメッセージを送ると自動で更新されます</p>

      {!data && (
        <div style={{ color:'#7070a0', fontSize:13 }}>まだデータがありません。アプリでメッセージを送ってください。</div>
      )}

      {data && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* 返答文 */}
          <div style={{ background:'#171728', border:'1px solid #2a2a45', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:11, color:'#7070a0', fontWeight:700, marginBottom:8 }}>💬 返答文</div>
            <div style={{ fontSize:14, lineHeight:1.7 }}>{data.response}</div>
          </div>

          {/* アニメーション */}
          <div style={{ background:'#171728', border:'1px solid #2a2a45', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:11, color:'#7070a0', fontWeight:700, marginBottom:12 }}>🎭 アニメーション</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

              <div style={{ background:'#1e1e32', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:11, color:'#7070a0', marginBottom:6 }}>Emotion</div>
                <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700, background:`${color}22`, color }}>
                  {a.emotion || '-'}
                </span>
              </div>

              <div style={{ background:'#1e1e32', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:11, color:'#7070a0', marginBottom:6 }}>Intensity</div>
                <div style={{ fontSize:18, fontWeight:700 }}>{a.intensity ?? '-'}</div>
                <div style={{ height:6, background:'#2a2a45', borderRadius:3, marginTop:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${intensityPct}%`, background:'linear-gradient(135deg,#7c6af7,#f76aaa)', borderRadius:3 }} />
                </div>
              </div>

              <div style={{ background:'#1e1e32', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:11, color:'#7070a0', marginBottom:6 }}>Body</div>
                <div style={{ fontSize:15, fontWeight:700 }}>{a.body || '-'}</div>
              </div>

              <div style={{ background:'#1e1e32', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:11, color:'#7070a0', marginBottom:6 }}>Gaze</div>
                <div style={{ fontSize:15, fontWeight:700 }}>{a.gaze || '-'}</div>
              </div>

            </div>
          </div>

          {/* 生JSON */}
          <div style={{ background:'#171728', border:'1px solid #2a2a45', borderRadius:14, padding:20 }}>
            <div style={{ fontSize:11, color:'#7070a0', fontWeight:700, marginBottom:8 }}>📄 生のJSON</div>
            <pre style={{ fontSize:12, color:'#6af7a0', overflowX:'auto', whiteSpace:'pre-wrap' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

        </div>
      )}
    </div>
  );
}
