import { useState, useRef, useEffect } from "react";

const SYSTEM_YARN = `당신은 코바늘 뜨개 전문가 AI 도우미 "실뭉치"예요.

규칙:
1. 실 정보 질문 (굵기/호수, 색상, 양) — 한번에 1~2개만
2. 작품 3가지 추천
3. 선택 시 반드시 아래 포맷으로만 응답

도안 응답 시 포맷 (이 형식 외 절대 사용 금지):
[PATTERN_START]
작품명: xxx
난이도: 초급
완성크기: 약 Ncm
바늘: 코바늘 N호
사용실: xxx
게이지: 짧은뜨기 10코x10단 = 약 4cm
[기초코]
사슬뜨기 N코
[단별도안]
1단: sc N (N코)
2단: sc N (N코)
[마무리]
실 정리 방법
[팁]
초보자 팁
[PATTERN_END]

⚠️ [PATTERN_START] 와 [PATTERN_END] 태그는 반드시 포함!
친근하고 따뜻한 말투로!`;

const SYSTEM_PATTERN = `당신은 코바늘 뜨개 전문가 AI 도우미 "실뭉치"예요.

규칙:
1. 세부사항 질문 (크기, 실 굵기/색상, 난이도) — 한번에 1~2개만
2. 파악되면 반드시 아래 포맷으로만 응답

도안 응답 시 포맷 (이 형식 외 절대 사용 금지):
[PATTERN_START]
작품명: xxx
난이도: 초급
완성크기: 약 Ncm
바늘: 코바늘 N호
사용실: xxx
게이지: 짧은뜨기 10코x10단 = 약 4cm
[기초코]
사슬뜨기 N코
[단별도안]
1단: sc N (N코)
2단: sc N (N코)
[마무리]
실 정리 방법
[팁]
초보자 팁
[PATTERN_END]

⚠️ [PATTERN_START] 와 [PATTERN_END] 태그는 반드시 포함!
친근하고 따뜻한 말투로!`;

function parsePattern(text) {
  const s = text.indexOf("[PATTERN_START]");
  const e = text.indexOf("[PATTERN_END]");
  if (s === -1 || e === -1) return null;
  return text.slice(s + 15, e).trim();
}

function PatternCard({ raw }) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const metaLines = [];
  const sections = [];
  let cur = null;
  lines.forEach(line => {
    if (line.startsWith("[") && line.endsWith("]")) {
      if (cur) sections.push(cur);
      cur = { title: line.slice(1,-1), items: [] };
    } else if (cur) {
      cur.items.push(line);
    } else {
      metaLines.push(line);
    }
  });
  if (cur) sections.push(cur);
  const get = k => { const l = metaLines.find(m => m.startsWith(k+":")); return l ? l.split(":").slice(1).join(":").trim() : ""; };
  const diffColor = get("난이도").includes("초급") ? "#4CAF50" : get("난이도").includes("중급") ? "#FF9800" : "#F44336";
  return (
    <div style={{background:"linear-gradient(135deg,#fff9f5,#fff4ee)",border:"1.5px solid #e8d5c4",borderRadius:16,padding:20,marginTop:12}}>
      <div style={{borderBottom:"1px dashed #e8d5c4",paddingBottom:14,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
          <span style={{fontSize:"1.05rem",fontWeight:700,color:"#5C3D2E"}}>🧶 {get("작품명")}</span>
          {get("난이도") && <span style={{background:diffColor,color:"white",fontSize:"0.68rem",padding:"2px 10px",borderRadius:20,fontWeight:600}}>{get("난이도")}</span>}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:14}}>
          {[["📏","완성크기"],["📍","바늘"],["🧵","사용실"],["📐","게이지"]].map(([icon,key]) =>
            get(key) ? <div key={key} style={{fontSize:"0.75rem",color:"#7a5c4a"}}>{icon} <span style={{color:"#aaa"}}>{key}:</span> <strong>{get(key)}</strong></div> : null
          )}
        </div>
      </div>
      {sections.map((sec,i) => (
        <div key={i} style={{marginBottom:14}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#c0704a",marginBottom:7,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:3,height:13,background:"#c0704a",borderRadius:2,display:"inline-block"}}/>
            {sec.title==="팁"?"💡 팁":sec.title}
          </div>
          <div style={{background:"white",borderRadius:10,padding:"10px 14px",border:"1px solid #f0e0d0"}}>
            {sec.items.map((item,j) => {
              const isRow = /^\d+[-~]?\d*단/.test(item);
              return (
                <div key={j} style={{fontSize:"0.81rem",color:"#5C3D2E",padding:"4px 0",borderBottom:isRow&&j<sec.items.length-1?"1px solid #f5ede6":"none",display:"flex",gap:8,alignItems:"flex-start",lineHeight:1.6}}>
                  {isRow && <span style={{minWidth:32,background:"#fde8d8",color:"#c0704a",fontSize:"0.67rem",fontWeight:700,borderRadius:4,padding:"1px 4px",textAlign:"center",flexShrink:0,marginTop:2}}>{item.match(/^\d+[-~]?\d*단/)?.[0]}</span>}
                  <span>{isRow?item.replace(/^\d+[-~]?\d*단:\s*/,""):item.replace(/^[-•]\s*/,"")}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Message({ m }) {
  const isUser = m.role==="user";
  const pattern = !isUser ? parsePattern(m.content) : null;
  const text = pattern ? m.content.slice(0,m.content.indexOf("[PATTERN_START]")).trim() : m.content;
  return (
    <div style={{display:"flex",flexDirection:isUser?"row-reverse":"row",gap:10,marginBottom:18,alignItems:"flex-start"}}>
      {!isUser && <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#e8a87c,#c0704a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>🧶</div>}
      <div style={{maxWidth:"78%"}}>
        {text && <div style={{background:isUser?"linear-gradient(135deg,#c0704a,#a85a35)":"white",color:isUser?"white":"#5C3D2E",borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",fontSize:"0.87rem",lineHeight:1.75,boxShadow:isUser?"0 2px 12px rgba(192,112,74,.3)":"0 2px 8px rgba(0,0,0,.07)",border:isUser?"none":"1px solid #f0e0d0",whiteSpace:"pre-wrap"}}>{text}</div>}
        {pattern && <PatternCard raw={pattern}/>}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"flex-start"}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#e8a87c,#c0704a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>🧶</div>
      <div style={{background:"white",border:"1px solid #f0e0d0",borderRadius:"18px 18px 18px 4px",padding:"13px 18px",display:"flex",gap:5,alignItems:"center"}}>
        {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#c0704a",opacity:0.6,animation:"bounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
      </div>
    </div>
  );
}

function UsageWarning({ count }) {
  const DAILY_LIMIT = 20;
  if (count < 15) return null;
  const isOver = count >= DAILY_LIMIT;
  return (
    <div style={{margin:"0 16px 12px",padding:"10px 14px",borderRadius:10,background:isOver?"#FFF3E0":"#FFF8E1",border:`1px solid ${isOver?"#FFB74D":"#FFD54F"}`,fontSize:"0.78rem",color:isOver?"#E65100":"#F57F17",display:"flex",alignItems:"center",gap:8}}>
      <span>{isOver?"⚠️":"💛"}</span>
      <span>{isOver?`오늘 사용량 한도(${DAILY_LIMIT}회)에 도달했어요. 내일 다시 이용해 주세요!`:`오늘 ${count}회 사용했어요. 하루 ${DAILY_LIMIT}회 이후엔 제한될 수 있어요.`}</span>
    </div>
  );
}

export default function App() {
  const DAILY_LIMIT = 20;

  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("silmungchi_mode") || null; }
    catch { return null; }
  });

  const [msgs, setMsgs] = useState(() => {
    try {
      const saved = localStorage.getItem("silmungchi_msgs");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(() => {
    const today = new Date().toDateString();
    try {
      const saved = localStorage.getItem("silmungchi_usage");
      if (saved) {
        const {date, count} = JSON.parse(saved);
        if (date === today) return count;
      }
    } catch {}
    return 0;
  });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  }, [msgs, loading]);

  useEffect(() => {
  try { localStorage.setItem("silmungchi_msgs", JSON.stringify(msgs)); }
  catch {}
}, [msgs]);

useEffect(() => {
  const handlePopState = () => {
    setMode(null);
    setMsgs([]);
    setInput("");
    localStorage.removeItem("silmungchi_msgs");
    localStorage.removeItem("silmungchi_mode");
  };
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);

  const updateUsage = (count) => {
    const today = new Date().toDateString();
    localStorage.setItem("silmungchi_usage", JSON.stringify({date: today, count}));
    setUsageCount(count);
  };

  const start = (m) => {
  setMode(m);
  localStorage.setItem("silmungchi_mode", m);
  window.history.pushState({mode: m}, "");
    setMsgs([{role:"assistant", content: m==="yarn"
      ?"안녕하세요! 🧶 저는 코바늘 도우미 실뭉치예요.\n\n어떤 실을 갖고 계신가요? 실의 굵기(호수)와 색상을 알려주시면 딱 맞는 작품을 찾아드릴게요! 😊"
      :"안녕하세요! 🧶 저는 코바늘 도우미 실뭉치예요.\n\n어떤 작품을 만들고 싶으신가요? 자유롭게 설명해 주세요!\n\n예) '딸기 모양 코스터', '귀여운 곰 인형', '따뜻한 컵받침' 😊"
    }]);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    if (usageCount >= DAILY_LIMIT) {
      setMsgs(prev => [...prev, {role:"assistant", content:`오늘 사용량 한도(${DAILY_LIMIT}회)에 도달했어요 😢\n내일 다시 이용해 주세요!`}]);
      return;
    }
    const newMsgs = [...msgs, {role:"user", content:input.trim()}];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    const newCount = usageCount + 1;
    updateUsage(newCount);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: mode==="yarn" ? SYSTEM_YARN : SYSTEM_PATTERN,
          messages: newMsgs.map(m => ({role:m.role, content:m.content}))
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text||"").join("") || "잠시 문제가 생겼어요. 다시 시도해주세요!";
      setMsgs(prev => [...prev, {role:"assistant", content:reply}]);
    } catch {
      setMsgs(prev => [...prev, {role:"assistant", content:"네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요."}]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const reset = () => {
    setMode(null);
    setMsgs([]);
    setInput("");
    localStorage.removeItem("silmungchi_msgs");
    localStorage.removeItem("silmungchi_mode");
  };

  if (!mode) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf6f0 0%,#faeee4 50%,#f5e6d8 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"sans-serif",overflow:"hidden",position:"relative"}}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}} @keyframes floatBg{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(4deg)}}`}</style>
      {["🧶","🪡","✂️","🧵"].map((e,i)=>(
        <div key={i} style={{position:"absolute",fontSize:`${1.4+i*0.3}rem`,opacity:0.1,top:`${12+i*18}%`,left:i%2===0?`${4+i*4}%`:"auto",right:i%2!==0?`${4+i*4}%`:"auto",animation:`floatBg ${3.5+i*0.6}s ease-in-out infinite`,animationDelay:`${i*0.5}s`,pointerEvents:"none"}}>{e}</div>
      ))}
      <div style={{textAlign:"center",maxWidth:460,animation:"fadeUp .75s ease forwards"}}>
        <div style={{fontSize:"3.2rem",marginBottom:10}}>🧶</div>
        <h1 style={{fontSize:"2.1rem",fontWeight:800,color:"#5C3D2E",marginBottom:6}}>실뭉치</h1>
        <p style={{fontSize:"0.95rem",color:"#a07060",marginBottom:6}}>AI 코바늘 도안 생성 서비스</p>
        <p style={{fontSize:"0.82rem",color:"#c4a090",marginBottom:40,lineHeight:1.75}}>가진 실을 알려주거나, 만들고 싶은 걸 설명하면<br/>AI가 맞춤 도안을 만들어드려요 ✨</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[
            {m:"yarn",icon:"🧵",title:"실이 있어요, 뭘 만들까요?",sub:"실 정보 → AI 질문 → 작품 추천 → 도안 생성",primary:true},
            {m:"pattern",icon:"✏️",title:"만들고 싶은 게 있어요",sub:"원하는 작품 설명 → AI 질문 → 도안 생성",primary:false}
          ].map(({m,icon,title,sub,primary})=>(
            <button key={m} onClick={()=>start(m)} style={{background:primary?"linear-gradient(135deg,#c0704a,#a85a35)":"white",color:primary?"white":"#5C3D2E",border:primary?"none":"2px solid #e8d5c4",borderRadius:14,padding:"17px 22px",cursor:"pointer",fontSize:"0.92rem",fontWeight:600,boxShadow:primary?"0 4px 16px rgba(192,112,74,.4)":"0 2px 10px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:14,transition:"transform .2s",textAlign:"left"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
            >
              <span style={{fontSize:"1.5rem",flexShrink:0}}>{icon}</span>
              <div><div>{title}</div><div style={{fontSize:"0.72rem",opacity:0.7,marginTop:3,fontWeight:400}}>{sub}</div></div>
            </button>
          ))}
        </div>
        <p style={{fontSize:"0.7rem",color:"#d4b8a8",marginTop:32}}>🌱 MVP 프로토타입 v0.1</p>
      </div>
    </div>
  );

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#fdf6f0",fontFamily:"sans-serif"}}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#e8d5c4;border-radius:4px} textarea{outline:none;}`}</style>
      <div style={{background:"linear-gradient(135deg,#c0704a,#a85a35)",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 14px rgba(192,112,74,.35)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1.3rem"}}>🧶</span>
          <div>
            <div style={{color:"white",fontWeight:700,fontSize:"1rem"}}>실뭉치</div>
            <div style={{color:"rgba(255,255,255,.75)",fontSize:"0.68rem"}}>{mode==="yarn"?"🧵 실 → 작품 추천 모드":"✏️ 작품 설명 → 도안 모드"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={reset} style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,color:"white",padding:"5px 13px",cursor:"pointer",fontSize:"0.75rem"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.28)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.18)"}
          >← 나가기</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
        {msgs.map((m,i)=><Message key={i} m={m}/>)}
        {loading&&<Typing/>}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"12px 14px 18px",background:"white",borderTop:"1px solid #f0e0d0",boxShadow:"0 -4px 20px rgba(0,0,0,.05)",flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"center",background:usageCount>=DAILY_LIMIT?"#FFF3E0":"#fdf6f0",borderRadius:14,border:`1.5px solid ${usageCount>=DAILY_LIMIT?"#FFB74D":"#e8d5c4"}`,padding:"9px 13px"}}>
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={mode==="yarn"?"가진 실에 대해 설명해주세요...":"만들고 싶은 작품을 설명해주세요..."}
            rows={1} style={{flex:1,border:"none",background:"transparent",resize:"none",fontSize:"0.87rem",color:"#5C3D2E",lineHeight:1.55,fontFamily:"inherit",maxHeight:100,overflowY:"auto"}}
          />
          <button onClick={send} disabled={!input.trim()||loading||usageCount>=DAILY_LIMIT} style={{background:input.trim()&&!loading&&usageCount<DAILY_LIMIT?"linear-gradient(135deg,#c0704a,#a85a35)":"#e8d5c4",border:"none",borderRadius:10,width:37,height:37,cursor:input.trim()&&!loading&&usageCount<DAILY_LIMIT?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.05rem",flexShrink:0,transition:"background .2s"}}
            onMouseEnter={e=>{if(input.trim()&&!loading)e.currentTarget.style.filter="brightness(1.1)"}}
            onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}
          >{loading?"⏳":"➤"}</button>
        </div>
        <p style={{textAlign:"center",fontSize:"0.66rem",color:"#c4a090",marginTop:7}}>Enter 전송 &nbsp;·&nbsp; Shift+Enter 줄바꿈</p>
      </div>
    </div>
  );
}
