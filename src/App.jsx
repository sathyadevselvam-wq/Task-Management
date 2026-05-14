import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Constants ─────────────────────────────────────────── */
const PRIORITIES = ["low", "medium", "high", "critical"];
const PM = {
  low:      { label:"Low",      color:"#3B6D11", bg:"#EAF3DE", bgD:"#1a2e0a", dot:"#639922" },
  medium:   { label:"Medium",   color:"#854F0B", bg:"#FAEEDA", bgD:"#2e1f05", dot:"#EF9F27" },
  high:     { label:"High",     color:"#A32D2D", bg:"#FCEBEB", bgD:"#2e0a0a", dot:"#E24B4A" },
  critical: { label:"Critical", color:"#3C3489", bg:"#EEEDFE", bgD:"#1a1840", dot:"#7F77DD" },
};
const CATS = ["work","personal","design","dev","other"];
const CC = { work:"#178DDC", personal:"#1D9E75", design:"#D4537E", dev:"#7F77DD", other:"#888780" };
const COLS = [
  { id:"todo",        label:"To Do",       accent:"#185FA5", lightBg:"#E6F1FB" },
  { id:"in-progress", label:"In Progress", accent:"#854F0B", lightBg:"#FAEEDA" },
  { id:"done",        label:"Done",        accent:"#3B6D11", lightBg:"#EAF3DE" },
];
const gId = () => Math.random().toString(36).slice(2,10);

function seedTasks(uid) {
  return [
    { id:gId(), userId:uid, title:"Design new landing page", description:"Revamp the hero section and CTA buttons", status:"in-progress", priority:"high", category:"design", due:"2026-05-20", created:Date.now()-86400000, tags:["ui","client"] },
    { id:gId(), userId:uid, title:"Fix auth bug in prod", description:"Token refresh fails on mobile Safari", status:"todo", priority:"critical", category:"dev", due:"2026-05-15", created:Date.now()-18000000, tags:["bug","urgent"] },
    { id:gId(), userId:uid, title:"Weekly team sync", description:"Prepare agenda and share with team", status:"todo", priority:"medium", category:"work", due:"2026-05-16", created:Date.now()-7200000, tags:["meeting"] },
    { id:gId(), userId:uid, title:"Gym session", description:"Leg day — don't skip", status:"done", priority:"low", category:"personal", due:"2026-05-14", created:Date.now()-172800000, tags:[] },
    { id:gId(), userId:uid, title:"API rate limiting docs", description:"Document the new rate limit headers for public API", status:"in-progress", priority:"medium", category:"dev", due:"2026-05-22", created:Date.now()-36000000, tags:["docs","api"] },
    { id:gId(), userId:uid, title:"Client proposal review", description:"Review and annotate Q3 proposal before Friday", status:"todo", priority:"high", category:"work", due:"2026-05-17", created:Date.now()-3600000, tags:["client"] },
  ];
}

const API = 'https://task-management-hp2x.onrender.com/api';


/* ─── Root ───────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [allTasks, setAllTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setCurrentUser(session.user);
      fetch(`${API}/tasks?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAllTasks(data);
          else { console.error("Tasks fetch error:", data); setAllTasks([]); }
        })
        .catch(console.error);
    }
  }, [session]);

  const myTasks = allTasks;

  async function setMyTasksAsync(fn) {
    let nextTasks;
    if (typeof fn === 'function') {
      nextTasks = fn(allTasks);
    } else {
      nextTasks = fn;
    }
    
    // Find additions, modifications, deletions
    const added = nextTasks.filter(t => !allTasks.some(ot => ot.id === t.id));
    const modified = nextTasks.filter(t => {
      const ot = allTasks.find(x => x.id === t.id);
      return ot && JSON.stringify(ot) !== JSON.stringify(t);
    });
    const deleted = allTasks.filter(t => !nextTasks.some(nt => nt.id === t.id));

    setAllTasks(nextTasks);

    for (const t of added) await fetch(`${API}/tasks`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(t) }).catch(console.error);
    for (const t of modified) await fetch(`${API}/tasks/${t.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(t) }).catch(console.error);
    for (const t of deleted) await fetch(`${API}/tasks/${t.id}`, { method: 'DELETE' }).catch(console.error);
  }

  async function updateUser(id, patch) {
    setCurrentUser(u => ({ ...u, ...patch }));
    try {
      await fetch(`${API}/users/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(patch) });
    } catch(e) { console.error(e); }
  }

  function login(user) { setSession({ user }); }
  function logout() { setSession(null); setAuthView("login"); }

  if (!session) return (
    <AuthScreen view={authView} setView={setAuthView} onLogin={login} dark={darkMode} setDark={setDarkMode} />
  );
  return (
    <Dashboard
      user={currentUser || session.user}
      tasks={myTasks}
      setTasks={setMyTasksAsync}
      onLogout={logout}
      dark={darkMode}
      setDark={setDarkMode}
      updateUser={updateUser}
    />
  );
}

/* ══ SHARED STYLES ════════════════════════════════════════ */
const BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  input,button,select,textarea{font-family:inherit}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{border-radius:3px}
  .tf-input{width:100%;padding:9px 13px;border-radius:9px;font-size:14px;outline:none;transition:border-color .15s,box-shadow .15s}
  .tf-btn{cursor:pointer;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;transition:all .15s;border:none}
  .tf-btn:active{transform:scale(.98)}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:500;white-space:nowrap}
  .chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap}
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:300;padding:1rem}
  .modal-box{border-radius:16px;padding:1.75rem;width:100%;max-width:540px;max-height:90vh;overflow-y:auto}
  .task-card{cursor:pointer;transition:transform .12s,box-shadow .12s}
  .task-card:hover{transform:translateY(-2px)}
  .col-drop{transition:background .12s,border-color .12s}
  .col-drop.dragover{opacity:.85}
  .nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:9px;cursor:pointer;font-size:13.5px;font-weight:500;transition:background .12s,color .12s;border:none;width:100%;text-align:left}
  .nav-item svg{flex-shrink:0}
  select option{background:inherit;color:inherit}
  .toggle{position:relative;display:inline-block;width:42px;height:24px;cursor:pointer}
  .toggle input{opacity:0;width:0;height:0}
  .toggle-track{position:absolute;inset:0;border-radius:24px;transition:background .2s}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}
  input:checked+.toggle-track{background:#185FA5}
  input:checked~.toggle-thumb{transform:translateX(18px)}
  .settings-tab{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:background .1s}
  .progress-bar{height:6px;border-radius:3px;overflow:hidden}
`;

/* ══ AUTH SCREEN ══════════════════════════════════════════ */
function AuthScreen({ view, setView, onLogin, dark, setDark }) {
  const bg   = dark ? "#0f1117" : "#f4f5f7";
  const card = dark ? "#1c1e26" : "#ffffff";
  const border= dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const text = dark ? "#f0f0f0" : "#111";
  const sub  = dark ? "#888" : "#666";
  const inp  = dark ? "#252831" : "#fff";

  return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet" />
      <style>{BASE_CSS+`
        body{background:${bg}}
        .ai{background:${inp}!important;color:${text}!important;border:1px solid ${border}!important}
        .ai:focus{border-color:#185FA5!important;box-shadow:0 0 0 3px rgba(24,95,165,.15)!important}
        .ai::placeholder{color:${sub}}
        .ab{background:#185FA5;color:#fff;width:100%;padding:11px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:background .15s}
        .ab:hover{background:#0C447C}
        .ab:disabled{background:#93b8d8;cursor:not-allowed}
        .lb{background:none;border:none;color:#185FA5;cursor:pointer;font-size:13px;font-weight:500;padding:0;text-decoration:underline}
        .err-box{padding:9px 13px;border-radius:8px;font-size:12.5px;background:#FCEBEB;color:#A32D2D;border:1px solid #F09595}
        ::-webkit-scrollbar-thumb{background:${border}}
      `}</style>

      {/* Dark mode toggle top-right */}
      <button onClick={() => setDark(d=>!d)} style={{ position:"fixed", top:16, right:16, background:card, border:`1px solid ${border}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13, color:text }}>
        {dark ? "☀ Light" : "🌙 Dark"}
      </button>

      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, background:"linear-gradient(135deg,#185FA5,#7F77DD)", borderRadius:15, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:28, color:text, letterSpacing:"-0.5px" }}>taskflow</div>
          <p style={{ fontSize:13, color:sub, marginTop:4 }}>Work smarter, not harder</p>
        </div>
        <div style={{ background:card, borderRadius:18, border:`1px solid ${border}`, padding:"2rem" }}>
          {view==="login"
            ? <LoginForm onLogin={onLogin} onSwitch={()=>setView("register")} dark={dark} text={text} sub={sub} border={border} />
            : <RegisterForm onLogin={onLogin} onSwitch={()=>setView("login")} dark={dark} text={text} sub={sub} border={border} />}
        </div>
        <p style={{ textAlign:"center", fontSize:12, color:sub, marginTop:18 }}>Demo: alex@example.com · password123</p>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, onSwitch, text, sub }) {
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [err, setErr]     = useState("");
  const [loading, setL]   = useState(false);

  async function submit() {
    setErr("");
    if (!email||!pw) { setErr("Please fill in all fields."); return; }
    setL(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw })
      });
      const data = await res.json();
      setL(false);
      if (res.ok) onLogin(data);
      else setErr(data.error || "Incorrect email or password.");
    } catch (e) {
      setL(false);
      setErr("Failed to connect to server.");
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:text, marginBottom:5 }}>Welcome back</h2>
      <p style={{ fontSize:13, color:sub, marginBottom:22 }}>Sign in to your account</p>
      <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
        {err && <div className="err-box">{err}</div>}
        <Field label="Email address" text={text} sub={sub}>
          <input className="ai tf-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
        </Field>
        <Field label="Password" text={text} sub={sub}>
          <div style={{ position:"relative" }}>
            <input className="ai tf-input" type={show?"text":"password"} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ paddingRight:44 }} />
            <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:sub, fontSize:12, padding:0 }}>{show?"Hide":"Show"}</button>
          </div>
        </Field>
        <button className="ab" onClick={submit} disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
        <p style={{ textAlign:"center", fontSize:13, color:sub }}>No account? <button className="lb" onClick={onSwitch}>Create one</button></p>
      </div>
    </div>
  );
}

function RegisterForm({ onLogin, onSwitch, text, sub }) {
  const [f, setF] = useState({ name:"", email:"", pw:"", confirm:"" });
  const [show, setShow] = useState(false);
  const [err, setErr]   = useState("");
  const [loading, setL] = useState(false);
  const upd = (k,v) => setF(x=>({...x,[k]:v}));

  async function submit() {
    setErr("");
    if (!f.name.trim()||!f.email||!f.pw||!f.confirm) { setErr("Please fill in all fields."); return; }
    if (f.pw.length<6) { setErr("Password must be at least 6 characters."); return; }
    if (f.pw!==f.confirm) { setErr("Passwords do not match."); return; }
    setL(true);
    try {
      const inits = f.name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
      const user = { id:gId(), name:f.name.trim(), email:f.email, password:f.pw, initials:inits, photo:null, bio:"", role:"Member" };
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const data = await res.json();
      setL(false);
      if (res.ok) onLogin(data);
      else setErr(data.error || "Registration failed.");
    } catch (e) {
      setL(false);
      setErr("Failed to connect to server.");
    }
  }

  const str = f.pw.length===0?0:f.pw.length<6?1:f.pw.length<10?2:3;
  const sc  = ["transparent","#E24B4A","#EF9F27","#1D9E75"][str];
  const sl  = ["","Weak","Fair","Strong"][str];

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:text, marginBottom:5 }}>Create account</h2>
      <p style={{ fontSize:13, color:sub, marginBottom:22 }}>Get started with Taskflow</p>
      <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
        {err && <div className="err-box">{err}</div>}
        <Field label="Full name" text={text} sub={sub}><input className="ai tf-input" placeholder="Alex Morgan" value={f.name} onChange={e=>upd("name",e.target.value)} /></Field>
        <Field label="Email address" text={text} sub={sub}><input className="ai tf-input" type="email" placeholder="you@example.com" value={f.email} onChange={e=>upd("email",e.target.value)} /></Field>
        <Field label="Password" text={text} sub={sub}>
          <div style={{ position:"relative" }}>
            <input className="ai tf-input" type={show?"text":"password"} placeholder="Min. 6 characters" value={f.pw} onChange={e=>upd("pw",e.target.value)} style={{ paddingRight:44 }} />
            <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:sub, fontSize:12, padding:0 }}>{show?"Hide":"Show"}</button>
          </div>
          {f.pw.length>0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:7 }}>
              <div style={{ display:"flex", gap:3, flex:1 }}>
                {[1,2,3].map(i=><div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<=str?sc:"#ddd", transition:"background .2s" }} />)}
              </div>
              <span style={{ fontSize:11, color:sc, fontWeight:500 }}>{sl}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" text={text} sub={sub}>
          <input className="ai tf-input" type="password" placeholder="Re-enter password" value={f.confirm} onChange={e=>upd("confirm",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {f.confirm.length>0 && f.pw!==f.confirm && <p style={{ fontSize:11, color:"#A32D2D", marginTop:3 }}>Passwords don't match</p>}
        </Field>
        <button className="ab" onClick={submit} disabled={loading}>{loading?"Creating account…":"Create account"}</button>
        <p style={{ textAlign:"center", fontSize:13, color:sub }}>Already have an account? <button className="lb" onClick={onSwitch}>Sign in</button></p>
      </div>
    </div>
  );
}

function Field({ label, children, text, sub }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:500, color:sub, display:"block", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

/* ══ DASHBOARD ════════════════════════════════════════════ */
function Dashboard({ user, tasks, setTasks, onLogout, dark, setDark, updateUser }) {
  const [page, setPage]     = useState("board"); // board | list | calendar | analytics | settings
  const [modal, setModal]   = useState(null);
  const [editing, setEditing]= useState(null);
  const [search, setSearch] = useState("");
  const [fpri, setFpri]     = useState("all");
  const [fcat, setFcat]     = useState("all");
  const [fstat, setFstat]   = useState("all");
  const [sort, setSort]     = useState("created");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const dragTask = useRef(null);

  /* Theme tokens */
  const D = dark;
  const bg    = D?"#0f1117":"#f4f5f7";
  const side  = D?"#14161e":"#ffffff";
  const card  = D?"#1c1e26":"#ffffff";
  const hdr   = D?"#14161e":"#ffffff";
  const bdr   = D?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)";
  const bdr2  = D?"rgba(255,255,255,.12)":"rgba(0,0,0,.12)";
  const txt   = D?"#f0f0f0":"#111827";
  const sub   = D?"#8b8fa8":"#6b7280";
  const hover = D?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)";
  const active= D?"rgba(24,95,165,.25)":"#EBF3FB";
  const inp   = D?"#252831":"#f9fafb";
  const T = { bg,side,card,hdr,bdr,bdr2,txt,sub,hover,active,inp };

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.description||"").toLowerCase().includes(search.toLowerCase())) return false;
    if (fpri!=="all" && t.priority!==fpri) return false;
    if (fcat!=="all" && t.category!==fcat) return false;
    if (fstat!=="all" && t.status!==fstat) return false;
    return true;
  }).sort((a,b) => {
    if (sort==="due") return (a.due||"9999")<(b.due||"9999")?-1:1;
    if (sort==="priority") return PRIORITIES.indexOf(b.priority)-PRIORITIES.indexOf(a.priority);
    if (sort==="title") return a.title.localeCompare(b.title);
    return b.created-a.created;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t=>t.status==="todo").length,
    inProgress: tasks.filter(t=>t.status==="in-progress").length,
    done: tasks.filter(t=>t.status==="done").length,
    critical: tasks.filter(t=>t.priority==="critical"&&t.status!=="done").length,
    overdue: tasks.filter(t=>t.due&&t.status!=="done"&&new Date(t.due+"T00:00:00")<new Date()).length,
  };
  const doneRatio = tasks.length ? Math.round((stats.done/tasks.length)*100) : 0;

  function saveTask(form) {
    if (editing) setTasks(ts=>ts.map(t=>t.id===editing.id?{...t,...form}:t));
    else setTasks(ts=>[...ts,{id:gId(),userId:user.id,created:Date.now(),status:"todo",tags:[],...form}]);
    setModal(null); setEditing(null);
  }
  function delTask(id) { setTasks(ts=>ts.filter(t=>t.id!==id)); setModal(null); setEditing(null); }
  function moveStatus(id,status) { setTasks(ts=>ts.map(t=>t.id===id?{...t,status}:t)); }
  function onDragStart(task) { dragTask.current=task; }
  function onDrop(status) { if(dragTask.current) moveStatus(dragTask.current.id,status); dragTask.current=null; setDragOver(null); }

  const greeting = (()=>{const h=new Date().getHours();return h<12?"morning":h<17?"afternoon":"evening";})();
  const SW = sideCollapsed ? 64 : 230;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:txt }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet" />
      <style>{BASE_CSS+`
        body{background:${bg}}
        .tf-input{background:${inp};color:${txt};border:1px solid ${bdr2}}
        .tf-input:focus{border-color:#185FA5;box-shadow:0 0 0 3px rgba(24,95,165,.12)}
        .tf-input::placeholder{color:${sub}}
        .tf-btn-primary{background:#185FA5;color:#fff}
        .tf-btn-primary:hover{background:#0C447C}
        .tf-btn-ghost{background:transparent;color:${txt};border:1px solid ${bdr2}}
        .tf-btn-ghost:hover{background:${hover}}
        .tf-btn-danger{background:#A32D2D;color:#fff}
        .tf-btn-danger:hover{background:#791F1F}
        .modal-box{background:${card};border:1px solid ${bdr};color:${txt}}
        .task-card:hover{box-shadow:0 4px 16px rgba(0,0,0,${D?".4":".08"})}
        select.tf-input option{background:${card};color:${txt}}
        .nav-item:hover{background:${hover}}
        .nav-active{background:${active}!important;color:#185FA5!important}
        .nav-active svg{stroke:#185FA5!important}
        .settings-tab:hover{background:${hover}}
        .settings-tab-active{background:${active};color:#185FA5}
        ::-webkit-scrollbar-thumb{background:${bdr2}}
        .col-drop.dragover{background:${D?"rgba(24,95,165,.12)":"rgba(24,95,165,.06)"}!important;border-color:#185FA5!important}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width:SW, minHeight:"100vh", background:side, borderRight:`1px solid ${bdr}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", transition:"width .2s", overflow:"hidden", flexShrink:0, zIndex:10 }}>
        {/* Logo */}
        <div style={{ padding:"18px 14px 12px", display:"flex", alignItems:"center", justifyContent:sideCollapsed?"center":"space-between", gap:8, borderBottom:`1px solid ${bdr}` }}>
          {!sideCollapsed && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:30, height:30, background:"linear-gradient(135deg,#185FA5,#7F77DD)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:txt, letterSpacing:"-0.3px" }}>taskflow</span>
            </div>
          )}
          {sideCollapsed && <div style={{ width:30, height:30, background:"linear-gradient(135deg,#185FA5,#7F77DD)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>}
          {!sideCollapsed && <button onClick={()=>setSideCollapsed(true)} style={{ background:"none", border:"none", cursor:"pointer", color:sub, padding:4, borderRadius:6, display:"flex" }} title="Collapse"><CollapseIcon /></button>}
        </div>

        {/* Expand button when collapsed */}
        {sideCollapsed && <button onClick={()=>setSideCollapsed(false)} style={{ background:"none", border:"none", cursor:"pointer", color:sub, padding:"10px", display:"flex", justifyContent:"center" }} title="Expand"><CollapseIcon flipped /></button>}

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
          {!sideCollapsed && <p style={{ fontSize:10, fontWeight:600, color:sub, letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 8px 4px", marginTop:4 }}>Workspace</p>}
          <NavItem icon={<BoardIcon />} label="Board" active={page==="board"} collapsed={sideCollapsed} onClick={()=>setPage("board")} />
          <NavItem icon={<ListIcon />}  label="List"  active={page==="list"}  collapsed={sideCollapsed} onClick={()=>setPage("list")}  />
          <NavItem icon={<CalIcon />}   label="Calendar" active={page==="calendar"} collapsed={sideCollapsed} onClick={()=>setPage("calendar")} />
          <NavItem icon={<ChartIcon />} label="Analytics" active={page==="analytics"} collapsed={sideCollapsed} onClick={()=>setPage("analytics")} />

          {!sideCollapsed && <p style={{ fontSize:10, fontWeight:600, color:sub, letterSpacing:"0.08em", textTransform:"uppercase", padding:"14px 8px 4px" }}>Filters</p>}
          {!sideCollapsed && CATS.map(c => (
            <button key={c} onClick={()=>setFcat(fcat===c?"all":c)} className="nav-item" style={{ color: fcat===c?"#185FA5":sub, background: fcat===c?active:"transparent", fontSize:12.5 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:CC[c], flexShrink:0 }}></span>
              {c.charAt(0).toUpperCase()+c.slice(1)}
              <span style={{ marginLeft:"auto", fontSize:11, opacity:.7 }}>{tasks.filter(t=>t.category===c).length}</span>
            </button>
          ))}

          <div style={{ flex:1 }} />

          {!sideCollapsed && <p style={{ fontSize:10, fontWeight:600, color:sub, letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 8px 4px" }}>Account</p>}
          <NavItem icon={<SettingsIcon />} label="Settings" active={page==="settings"} collapsed={sideCollapsed} onClick={()=>setPage("settings")} />
        </nav>

        {/* User */}
        <div style={{ padding:"10px 8px", borderTop:`1px solid ${bdr}` }}>
          {!sideCollapsed ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 8px", borderRadius:9, background:hover, cursor:"pointer" }} onClick={()=>setPage("settings")}>
              <Avatar user={user} size={32} />
              <div style={{ flex:1, overflow:"hidden" }}>
                <p style={{ fontSize:12.5, fontWeight:600, color:txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</p>
                <p style={{ fontSize:11, color:sub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.role||"Member"}</p>
              </div>
              <button onClick={e=>{e.stopPropagation();onLogout();}} style={{ background:"none", border:"none", cursor:"pointer", color:sub, padding:3, borderRadius:5, display:"flex" }} title="Sign out"><LogoutIcon /></button>
            </div>
          ) : (
            <div style={{ display:"flex", justifyContent:"center" }}>
              <Avatar user={user} size={32} onClick={()=>setPage("settings")} />
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Top bar */}
        <header style={{ background:hdr, borderBottom:`1px solid ${bdr}`, padding:"0 24px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, position:"sticky", top:0, zIndex:9 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
            <div style={{ position:"relative", flex:"0 0 280px" }}>
              <SearchIcon style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:sub }} />
              <input className="tf-input" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34, paddingRight:12, height:36, fontSize:13, borderRadius:9 }} />
            </div>
            <select className="tf-input" value={fpri} onChange={e=>setFpri(e.target.value)} style={{ height:36, fontSize:12.5, borderRadius:9, width:130 }}>
              <option value="all">All priorities</option>
              {PRIORITIES.map(p=><option key={p} value={p}>{PM[p].label}</option>)}
            </select>
            <select className="tf-input" value={fstat} onChange={e=>setFstat(e.target.value)} style={{ height:36, fontSize:12.5, borderRadius:9, width:130 }}>
              <option value="all">All statuses</option>
              {COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select className="tf-input" value={sort} onChange={e=>setSort(e.target.value)} style={{ height:36, fontSize:12.5, borderRadius:9, width:130 }}>
              <option value="created">Newest first</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="title">Alphabetical</option>
            </select>
            {(search||fpri!=="all"||fcat!=="all"||fstat!=="all") && (
              <button onClick={()=>{setSearch("");setFpri("all");setFcat("all");setFstat("all");}} className="tf-btn tf-btn-ghost" style={{ height:36, padding:"0 12px", fontSize:12.5, borderRadius:9, whiteSpace:"nowrap" }}>✕ Clear</button>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setDark(d=>!d)} style={{ background:"none", border:`1px solid ${bdr2}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:sub, fontSize:13 }} title="Toggle theme">{dark?"☀":"🌙"}</button>
            <button className="tf-btn tf-btn-primary" onClick={()=>{setEditing(null);setModal("task");}} style={{ height:36, padding:"0 16px", borderRadius:9, fontSize:13, fontWeight:600 }}>+ New Task</button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:"22px 24px", overflowY:"auto" }}>
          {/* Greeting + stats — always visible */}
          {(page==="board"||page==="list") && (
            <>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:18 }}>
                <div>
                  <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:21, color:txt }}>Good {greeting}, {user.name.split(" ")[0]} 👋</h1>
                  <p style={{ fontSize:13, color:sub, marginTop:3 }}>{stats.overdue>0 ? `⚠ ${stats.overdue} overdue task${stats.overdue>1?"s":""} need attention` : "Everything looks on track today."}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:12, color:sub, marginBottom:4 }}>Overall progress</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div className="progress-bar" style={{ width:120, background:bdr2 }}>
                      <div style={{ width:`${doneRatio}%`, height:6, background:"#1D9E75", borderRadius:3, transition:"width .4s" }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:txt }}>{doneRatio}%</span>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:22 }}>
                {[
                  { label:"Total", value:stats.total, color:"#185FA5", bg:D?"rgba(24,95,165,.15)":"#E6F1FB" },
                  { label:"To Do", value:stats.todo, color:"#854F0B", bg:D?"rgba(133,79,11,.15)":"#FEF9EE" },
                  { label:"In Progress", value:stats.inProgress, color:"#185FA5", bg:D?"rgba(24,95,165,.12)":"#EFF6FF" },
                  { label:"Done", value:stats.done, color:"#3B6D11", bg:D?"rgba(59,109,17,.15)":"#EAF3DE" },
                  { label:"Critical", value:stats.critical, color:"#A32D2D", bg:D?"rgba(163,45,45,.15)":"#FCEBEB" },
                  { label:"Overdue", value:stats.overdue, color:"#7F77DD", bg:D?"rgba(127,119,221,.15)":"#EEEDFE" },
                ].map(s=>(
                  <div key={s.label} style={{ background:s.bg, borderRadius:11, padding:"12px 14px", border:`1px solid ${bdr}` }}>
                    <p style={{ fontSize:11, color:s.color, fontWeight:500, marginBottom:5 }}>{s.label}</p>
                    <p style={{ fontSize:24, fontWeight:700, fontFamily:"'Syne',sans-serif", color:s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {page==="board"     && <BoardView filtered={filtered} tasks={tasks} dragOver={dragOver} setDragOver={setDragOver} onDragStart={onDragStart} onDrop={onDrop} onOpen={(t)=>{setEditing(t);setModal("task");}} T={T} dark={dark} />}
          {page==="list"      && <ListView filtered={filtered} onOpen={(t)=>{setEditing(t);setModal("task");}} moveStatus={moveStatus} T={T} />}
          {page==="calendar"  && <CalendarView tasks={tasks} onOpen={(t)=>{setEditing(t);setModal("task");}} T={T} dark={dark} />}
          {page==="analytics" && <AnalyticsView tasks={tasks} T={T} dark={dark} />}
          {page==="settings"  && <SettingsView user={user} dark={dark} setDark={setDark} onLogout={onLogout} updateUser={updateUser} T={T} />}
        </main>
      </div>

      {/* Task Modal */}
      {modal==="task" && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget){setModal(null);setEditing(null);}}}>
          <TaskModal task={editing} onSave={saveTask} onDelete={editing?()=>delTask(editing.id):null} onClose={()=>{setModal(null);setEditing(null);}} T={T} />
        </div>
      )}
    </div>
  );
}

/* ══ VIEWS ════════════════════════════════════════════════ */
function BoardView({ filtered, dragOver, setDragOver, onDragStart, onDrop, onOpen, T, dark }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
      {COLS.map(col => {
        const colTasks = filtered.filter(t=>t.status===col.id);
        return (
          <div key={col.id} className={`col-drop${dragOver===col.id?" dragover":""}`}
            style={{ background:T.bg, borderRadius:14, padding:"14px", minHeight:400, border:`1px solid ${dragOver===col.id?"#185FA5":T.bdr}` }}
            onDragOver={e=>{e.preventDefault();setDragOver(col.id);}}
            onDragLeave={()=>setDragOver(null)}
            onDrop={()=>onDrop(col.id)}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:col.accent, flexShrink:0 }}></div>
              <span style={{ fontWeight:600, fontSize:13.5, color:T.txt }}>{col.label}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:T.sub, background:T.card, borderRadius:999, padding:"1px 8px", border:`1px solid ${T.bdr}` }}>{colTasks.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {colTasks.map(task => <TaskCard key={task.id} task={task} onOpen={()=>onOpen(task)} onDragStart={()=>onDragStart(task)} T={T} dark={dark} />)}
              {colTasks.length===0 && <div style={{ textAlign:"center", color:T.sub, fontSize:13, padding:"2.5rem 0", border:`1.5px dashed ${T.bdr2}`, borderRadius:10 }}>Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ filtered, onOpen, moveStatus, T }) {
  return (
    <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 110px 110px 110px 90px", padding:"10px 18px", borderBottom:`1px solid ${T.bdr}`, fontSize:11, fontWeight:600, color:T.sub, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        <span>Task</span><span>Category</span><span>Priority</span><span>Status</span><span>Due</span><span style={{ textAlign:"right" }}>Move</span>
      </div>
      {filtered.length===0 && <div style={{ textAlign:"center", color:T.sub, padding:"3rem", fontSize:14 }}>No tasks match your filters</div>}
      {filtered.map((task,i) => (
        <div key={task.id} style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 110px 110px 110px 90px", padding:"13px 18px", borderBottom:i<filtered.length-1?`1px solid ${T.bdr}`:"none", alignItems:"center", cursor:"pointer", transition:"background .1s" }}
          onClick={()=>onOpen(task)}
          onMouseEnter={e=>e.currentTarget.style.background=T.hover}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div>
            <p style={{ fontWeight:500, fontSize:13.5, color:task.status==="done"?T.sub:T.txt, textDecoration:task.status==="done"?"line-through":"none", marginBottom:2 }}>{task.title}</p>
            {task.description && <p style={{ fontSize:12, color:T.sub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:340 }}>{task.description}</p>}
            {task.tags?.length>0 && <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>{task.tags.map(tg=><span key={tg} style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:T.hover, color:T.sub, border:`1px solid ${T.bdr}` }}>{tg}</span>)}</div>}
          </div>
          <CategoryChip c={task.category} />
          <PriorityBadge p={task.priority} dark={false} />
          <StatusBadge s={task.status} />
          <span style={{ fontSize:12, color:isOverdue(task.due,task.status)?"#E24B4A":T.sub }}>{task.due?fmtDate(task.due):"—"}</span>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:4 }} onClick={e=>e.stopPropagation()}>
            {COLS.filter(c=>c.id!==task.status).map(c=>(
              <button key={c.id} onClick={()=>moveStatus(task.id,c.id)} style={{ padding:"3px 7px", borderRadius:6, fontSize:10.5, background:T.hover, color:T.sub, border:`1px solid ${T.bdr}`, cursor:"pointer" }}>{c.label.split(" ")[0]}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ tasks, onOpen, T, dark }) {
  const [month, setMonth] = useState(new Date(2026, 4, 1)); // May 2026
  const year = month.getFullYear(), mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon+1, 0).getDate();
  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  const tasksByDay = {};
  tasks.forEach(t => {
    if (!t.due) return;
    const d = new Date(t.due+"T00:00:00");
    if (d.getFullYear()===year && d.getMonth()===mon) {
      const key = d.getDate();
      if (!tasksByDay[key]) tasksByDay[key]=[];
      tasksByDay[key].push(t);
    }
  });

  const today = new Date();
  const isToday = (d) => d===today.getDate()&&mon===today.getMonth()&&year===today.getFullYear();

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.txt }}>Calendar</h2>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setMonth(new Date(year,mon-1,1))} style={{ background:T.card, border:`1px solid ${T.bdr}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", color:T.txt, fontSize:14 }}>‹</button>
          <span style={{ fontWeight:600, fontSize:15, color:T.txt, minWidth:140, textAlign:"center" }}>{month.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
          <button onClick={()=>setMonth(new Date(year,mon+1,1))} style={{ background:T.card, border:`1px solid ${T.bdr}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", color:T.txt, fontSize:14 }}>›</button>
        </div>
      </div>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${T.bdr}` }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:600, color:T.sub, textTransform:"uppercase", letterSpacing:"0.06em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((d,i) => (
            <div key={i} style={{ minHeight:96, padding:8, borderRight:i%7!==6?`1px solid ${T.bdr}`:"none", borderBottom:i<cells.length-7?`1px solid ${T.bdr}`:"none", background:isToday(d)?`rgba(24,95,165,${dark?.08:.04})`:"transparent" }}>
              {d && <>
                <div style={{ fontSize:12, fontWeight:isToday(d)?700:400, color:isToday(d)?"#185FA5":T.sub, marginBottom:4, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", background:isToday(d)?"#185FA5":"transparent", color:isToday(d)?"#fff":T.sub }}>{d}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {(tasksByDay[d]||[]).slice(0,3).map(t=>(
                    <div key={t.id} onClick={()=>onOpen(t)} style={{ fontSize:10.5, padding:"2px 6px", borderRadius:5, background:COLS.find(c=>c.id===t.status)?.lightBg, color:COLS.find(c=>c.id===t.status)?.accent, cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", border:`1px solid ${COLS.find(c=>c.id===t.status)?.accent}33` }}>{t.title}</div>
                  ))}
                  {(tasksByDay[d]||[]).length>3 && <div style={{ fontSize:10, color:T.sub }}>+{tasksByDay[d].length-3} more</div>}
                </div>
              </>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ tasks, T, dark }) {
  const total = tasks.length||1;
  const byStatus = COLS.map(c=>({ ...c, count:tasks.filter(t=>t.status===c.id).length }));
  const byPri = PRIORITIES.map(p=>({ p, count:tasks.filter(t=>t.priority===p).length, ...PM[p] }));
  const byCat = CATS.map(c=>({ c, count:tasks.filter(t=>t.category===c).length, color:CC[c] })).sort((a,b)=>b.count-a.count);
  const done = tasks.filter(t=>t.status==="done").length;
  const overdue = tasks.filter(t=>t.due&&t.status!=="done"&&new Date(t.due+"T00:00:00")<new Date()).length;

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.txt, marginBottom:20 }}>Analytics</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Status breakdown */}
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.25rem" }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Status breakdown</p>
          {byStatus.map(s=>(
            <div key={s.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12.5, color:T.txt }}>{s.label}</span>
                <span style={{ fontSize:12, color:T.sub }}>{s.count} / {tasks.length}</span>
              </div>
              <div className="progress-bar" style={{ background:T.bdr2 }}>
                <div style={{ width:`${Math.round((s.count/total)*100)}%`, height:6, background:s.accent, borderRadius:3, transition:"width .6s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Priority breakdown */}
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.25rem" }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Priority breakdown</p>
          {byPri.map(p=>(
            <div key={p.p} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12.5, color:T.txt }}>{p.label}</span>
                <span style={{ fontSize:12, color:T.sub }}>{p.count}</span>
              </div>
              <div className="progress-bar" style={{ background:T.bdr2 }}>
                <div style={{ width:`${Math.round((p.count/total)*100)}%`, height:6, background:p.dot, borderRadius:3, transition:"width .6s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Category distribution */}
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.25rem" }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Category distribution</p>
          {byCat.map(c=>(
            <div key={c.c} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:c.color, flexShrink:0 }}></span>
              <span style={{ fontSize:12.5, color:T.txt, flex:1 }}>{c.c.charAt(0).toUpperCase()+c.c.slice(1)}</span>
              <div className="progress-bar" style={{ width:80, background:T.bdr2 }}>
                <div style={{ width:`${Math.round((c.count/total)*100)}%`, height:6, background:c.color, borderRadius:3 }} />
              </div>
              <span style={{ fontSize:12, color:T.sub, minWidth:16, textAlign:"right" }}>{c.count}</span>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.25rem" }}>
          <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Quick stats</p>
          {[
            { label:"Completion rate", value:`${tasks.length?Math.round((done/tasks.length)*100):0}%`, color:"#1D9E75" },
            { label:"Tasks completed", value:done, color:"#1D9E75" },
            { label:"Overdue tasks", value:overdue, color:"#E24B4A" },
            { label:"Critical pending", value:tasks.filter(t=>t.priority==="critical"&&t.status!=="done").length, color:"#7F77DD" },
            { label:"No due date", value:tasks.filter(t=>!t.due).length, color:T.sub },
          ].map(r=>(
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.bdr}` }}>
              <span style={{ fontSize:12.5, color:T.sub }}>{r.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ SETTINGS ════════════════════════════════════════════ */
function SettingsView({ user, dark, setDark, onLogout, updateUser, T }) {
  const [tab, setTab] = useState("account");
  const tabs = [
    { id:"account", label:"Account" },
    { id:"security", label:"Security" },
    { id:"appearance", label:"Appearance" },
    { id:"notifications", label:"Notifications" },
  ];

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.txt, marginBottom:20 }}>Settings</h2>
      <div style={{ display:"flex", gap:4, marginBottom:22, background:T.card, padding:4, borderRadius:11, border:`1px solid ${T.bdr}`, width:"fit-content" }}>
        {tabs.map(t=>(
          <button key={t.id} className={`settings-tab${tab===t.id?" settings-tab-active":""}`} onClick={()=>setTab(t.id)} style={{ color:tab===t.id?"#185FA5":T.sub, background:tab===t.id?T.active:"transparent" }}>{t.label}</button>
        ))}
      </div>
      {tab==="account"      && <AccountTab user={user} updateUser={updateUser} onLogout={onLogout} T={T} />}
      {tab==="security"     && <SecurityTab user={user} updateUser={updateUser} T={T} />}
      {tab==="appearance"   && <AppearanceTab dark={dark} setDark={setDark} T={T} />}
      {tab==="notifications"&& <NotificationsTab T={T} />}
    </div>
  );
}

function AccountTab({ user, updateUser, onLogout, T }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio]   = useState(user.bio||"");
  const [role, setRole] = useState(user.role||"Member");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  function save() {
    updateUser(user.id, { name:name.trim()||user.name, bio, role, initials:name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() });
    setSaved(true); setTimeout(()=>setSaved(false), 2500);
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser(user.id, { photo: ev.target.result });
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      {/* Avatar */}
      <div style={{ gridColumn:"1/-1", background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem", display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ position:"relative" }}>
          <Avatar user={user} size={72} />
          <button onClick={()=>fileRef.current.click()} style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:"#185FA5", border:"2px solid "+T.card, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:13 }}>✎</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
        </div>
        <div>
          <p style={{ fontWeight:600, fontSize:15, color:T.txt }}>{user.name}</p>
          <p style={{ fontSize:12.5, color:T.sub, marginTop:2 }}>{user.email}</p>
          <p style={{ fontSize:11.5, color:T.sub, marginTop:4 }}>Click the pencil icon to upload a photo</p>
        </div>
      </div>

      {/* Fields */}
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem" }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Profile info</p>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          <SettField label="Full name" sub={T.sub}>
            <input className="tf-input" value={name} onChange={e=>setName(e.target.value)} style={{ height:38 }} />
          </SettField>
          <SettField label="Email" sub={T.sub}>
            <input className="tf-input" value={user.email} disabled style={{ height:38, opacity:.6 }} />
          </SettField>
          <SettField label="Role" sub={T.sub}>
            <select className="tf-input" value={role} onChange={e=>setRole(e.target.value)} style={{ height:38 }}>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
          </SettField>
          <SettField label="Bio" sub={T.sub}>
            <textarea className="tf-input" value={bio} onChange={e=>setBio(e.target.value)} style={{ resize:"vertical", minHeight:72, paddingTop:8 }} placeholder="A short description about you…" />
          </SettField>
          <button className="tf-btn tf-btn-primary" onClick={save} style={{ height:38, borderRadius:9, fontSize:13, fontWeight:600 }}>
            {saved ? "✓ Saved!" : "Save changes"}
          </button>
        </div>
      </div>

      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem" }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:14 }}>Account details</p>
        {[
          { label:"User ID", value:user.id },
          { label:"Member since", value:"May 2026" },
          { label:"Account type", value:"Free plan" },
        ].map(r=>(
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${T.bdr}` }}>
            <span style={{ fontSize:12.5, color:T.sub }}>{r.label}</span>
            <span style={{ fontSize:12.5, color:T.txt, fontWeight:500 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ marginTop:20, padding:"13px", background:"#FCEBEB", borderRadius:10, border:"1px solid #F09595" }}>
          <p style={{ fontSize:12.5, color:"#A32D2D", fontWeight:600, marginBottom:4 }}>Danger zone</p>
          <p style={{ fontSize:12, color:"#A32D2D", marginBottom:10 }}>Signing out will end your current session.</p>
          <button className="tf-btn tf-btn-danger" onClick={onLogout} style={{ height:34, borderRadius:8, fontSize:12.5 }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ user, updateUser, T }) {
  const [cur, setCur]   = useState("");
  const [nw, setNw]     = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg]   = useState(null);
  const [show, setShow] = useState(false);

  const str = nw.length===0?0:nw.length<6?1:nw.length<10?2:3;
  const sc  = ["transparent","#E24B4A","#EF9F27","#1D9E75"][str];
  const sl  = ["","Weak","Fair","Strong"][str];

  function changePassword() {
    setMsg(null);
    if (!cur||!nw||!conf) { setMsg({type:"err",text:"Please fill in all fields."}); return; }
    if (cur!==user.password) { setMsg({type:"err",text:"Current password is incorrect."}); return; }
    if (nw.length<6) { setMsg({type:"err",text:"New password must be at least 6 characters."}); return; }
    if (nw!==conf) { setMsg({type:"err",text:"New passwords do not match."}); return; }
    updateUser(user.id, { password:nw });
    setCur(""); setNw(""); setConf("");
    setMsg({type:"ok",text:"Password updated successfully!"});
  }

  return (
    <div style={{ maxWidth:520 }}>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem" }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:16 }}>Change password</p>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          {msg && <div style={{ padding:"9px 13px", borderRadius:8, fontSize:12.5, background:msg.type==="ok"?"#EAF3DE":"#FCEBEB", color:msg.type==="ok"?"#3B6D11":"#A32D2D", border:`1px solid ${msg.type==="ok"?"#9FE1CB":"#F09595"}` }}>{msg.text}</div>}
          <SettField label="Current password" sub={T.sub}>
            <div style={{ position:"relative" }}>
              <input className="tf-input" type={show?"text":"password"} placeholder="••••••••" value={cur} onChange={e=>setCur(e.target.value)} style={{ height:38, paddingRight:44 }} />
              <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.sub, fontSize:12 }}>{show?"Hide":"Show"}</button>
            </div>
          </SettField>
          <SettField label="New password" sub={T.sub}>
            <input className="tf-input" type="password" placeholder="Min. 6 characters" value={nw} onChange={e=>setNw(e.target.value)} style={{ height:38 }} />
            {nw.length>0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                {[1,2,3].map(i=><div key={i} style={{ height:3, flex:1, borderRadius:2, background:i<=str?sc:"#ddd", transition:"background .2s" }} />)}
                <span style={{ fontSize:11, color:sc, fontWeight:500, minWidth:36 }}>{sl}</span>
              </div>
            )}
          </SettField>
          <SettField label="Confirm new password" sub={T.sub}>
            <input className="tf-input" type="password" placeholder="Re-enter new password" value={conf} onChange={e=>setConf(e.target.value)} style={{ height:38 }} />
            {conf.length>0 && nw!==conf && <p style={{ fontSize:11, color:"#A32D2D", marginTop:3 }}>Passwords don't match</p>}
          </SettField>
          <button className="tf-btn tf-btn-primary" onClick={changePassword} style={{ height:38, borderRadius:9, fontSize:13, fontWeight:600 }}>Update password</button>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab({ dark, setDark, T }) {
  const [accent, setAccent] = useState("#185FA5");
  const [density, setDensity] = useState("comfortable");
  const accents = ["#185FA5","#1D9E75","#7F77DD","#D4537E","#E24B4A","#EF9F27"];

  return (
    <div style={{ maxWidth:540 }}>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem", display:"flex", flexDirection:"column", gap:20 }}>
        <SettingRow label="Theme" desc="Switch between light and dark mode" T={T}>
          <div style={{ display:"flex", gap:8 }}>
            {["light","dark"].map(m=>(
              <button key={m} onClick={()=>setDark(m==="dark")} className="tf-btn tf-btn-ghost" style={{ height:34, padding:"0 14px", fontSize:12.5, borderRadius:8, color:((dark&&m==="dark")||(!dark&&m==="light"))?"#185FA5":T.sub, borderColor:((dark&&m==="dark")||(!dark&&m==="light"))?"#185FA5":T.bdr2 }}>
                {m==="light"?"☀ Light":"🌙 Dark"}
              </button>
            ))}
          </div>
        </SettingRow>

        <div style={{ borderTop:`1px solid ${T.bdr}`, paddingTop:18 }}>
          <SettingRow label="Accent color" desc="Customize the primary interface color" T={T}>
            <div style={{ display:"flex", gap:8 }}>
              {accents.map(c=>(
                <button key={c} onClick={()=>setAccent(c)} style={{ width:26, height:26, borderRadius:"50%", background:c, border:accent===c?"3px solid "+T.txt:"3px solid transparent", cursor:"pointer", transition:"border .1s" }} />
              ))}
            </div>
          </SettingRow>
        </div>

        <div style={{ borderTop:`1px solid ${T.bdr}`, paddingTop:18 }}>
          <SettingRow label="Density" desc="Control the spacing of the interface" T={T}>
            <div style={{ display:"flex", gap:8 }}>
              {["compact","comfortable","spacious"].map(d=>(
                <button key={d} onClick={()=>setDensity(d)} className="tf-btn tf-btn-ghost" style={{ height:34, padding:"0 12px", fontSize:12, borderRadius:8, color:density===d?"#185FA5":T.sub, borderColor:density===d?"#185FA5":T.bdr2 }}>
                  {d.charAt(0).toUpperCase()+d.slice(1)}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ T }) {
  const [prefs, setPrefs] = useState({ dueSoon:true, overdue:true, newTask:false, comments:true, weeklyDigest:false });
  function toggle(k) { setPrefs(p=>({...p,[k]:!p[k]})); }

  const items = [
    { key:"dueSoon",      label:"Due soon reminders", desc:"Get notified 24 hours before a task is due" },
    { key:"overdue",      label:"Overdue alerts", desc:"Alert when a task passes its due date" },
    { key:"newTask",      label:"New task assigned", desc:"When a new task is added to your workspace" },
    { key:"comments",     label:"Task updates", desc:"When a task you own is edited" },
    { key:"weeklyDigest", label:"Weekly digest", desc:"A summary of your task progress every Monday" },
  ];

  return (
    <div style={{ maxWidth:540 }}>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.bdr}`, padding:"1.5rem" }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.txt, marginBottom:16 }}>Notification preferences</p>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {items.map((it,i)=>(
            <div key={it.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 0", borderBottom:i<items.length-1?`1px solid ${T.bdr}`:"none" }}>
              <div>
                <p style={{ fontSize:13, color:T.txt, fontWeight:500 }}>{it.label}</p>
                <p style={{ fontSize:12, color:T.sub, marginTop:2 }}>{it.desc}</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={prefs[it.key]} onChange={()=>toggle(it.key)} />
                <span className="toggle-track" style={{ background:prefs[it.key]?"#185FA5":T.bdr2 }}></span>
                <span className="toggle-thumb"></span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children, T }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
      <div>
        <p style={{ fontSize:13, color:T.txt, fontWeight:500 }}>{label}</p>
        <p style={{ fontSize:12, color:T.sub, marginTop:2 }}>{desc}</p>
      </div>
      {children}
    </div>
  );
}

function SettField({ label, children, sub }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:500, color:sub, display:"block", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

/* ══ TASK CARD ════════════════════════════════════════════ */
function TaskCard({ task, onOpen, onDragStart, T, dark }) {
  const pm = PM[task.priority];
  return (
    <div className="task-card" draggable onDragStart={onDragStart} onClick={onOpen}
      style={{ background:T.card, border:`1px solid ${T.bdr}`, borderRadius:11, padding:"13px 14px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:7, marginBottom:7 }}>
        <p style={{ fontWeight:500, fontSize:13.5, color:task.status==="done"?T.sub:T.txt, lineHeight:1.45, textDecoration:task.status==="done"?"line-through":"none" }}>{task.title}</p>
        <span className="tag" style={{ background:pm.bg, color:pm.color, flexShrink:0 }}><span style={{ width:5, height:5, borderRadius:"50%", background:pm.dot }}></span>{pm.label}</span>
      </div>
      {task.description && <p style={{ fontSize:12, color:T.sub, lineHeight:1.55, marginBottom:9, display:"-webkit-box", overflow:"hidden", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{task.description}</p>}
      {task.tags?.length>0 && <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>{task.tags.map(tg=><span key={tg} style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:T.hover, color:T.sub, border:`1px solid ${T.bdr}` }}>{tg}</span>)}</div>}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <CategoryChip c={task.category} />
        {task.due && <span style={{ fontSize:11, color:isOverdue(task.due,task.status)?"#E24B4A":T.sub }}>📅 {fmtDate(task.due)}</span>}
      </div>
    </div>
  );
}

/* ══ TASK MODAL ═══════════════════════════════════════════ */
function TaskModal({ task, onSave, onDelete, onClose, T }) {
  const [f, setF] = useState({ title:task?.title||"", description:task?.description||"", priority:task?.priority||"medium", category:task?.category||"work", status:task?.status||"todo", due:task?.due||"", tags:(task?.tags||[]).join(", ") });
  const upd = (k,v) => setF(x=>({...x,[k]:v}));
  function save() {
    if (!f.title.trim()) return;
    const tags = f.tags.split(",").map(t=>t.trim()).filter(Boolean);
    onSave({ ...f, tags });
  }
  return (
    <div className="modal-box" onClick={e=>e.stopPropagation()}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.txt }}>{task?"Edit task":"New task"}</h2>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:21, color:T.sub, lineHeight:1 }}>×</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <SettField label="Title *" sub={T.sub}>
          <input className="tf-input" value={f.title} onChange={e=>upd("title",e.target.value)} placeholder="What needs to be done?" style={{ height:38 }} />
        </SettField>
        <SettField label="Description" sub={T.sub}>
          <textarea className="tf-input" value={f.description} onChange={e=>upd("description",e.target.value)} placeholder="Add more context…" style={{ resize:"vertical", minHeight:76, paddingTop:9 }} />
        </SettField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <SettField label="Priority" sub={T.sub}><select className="tf-input" value={f.priority} onChange={e=>upd("priority",e.target.value)} style={{ height:38 }}>{PRIORITIES.map(p=><option key={p} value={p}>{PM[p].label}</option>)}</select></SettField>
          <SettField label="Category" sub={T.sub}><select className="tf-input" value={f.category} onChange={e=>upd("category",e.target.value)} style={{ height:38 }}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></SettField>
          <SettField label="Status" sub={T.sub}><select className="tf-input" value={f.status} onChange={e=>upd("status",e.target.value)} style={{ height:38 }}>{COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></SettField>
          <SettField label="Due date" sub={T.sub}><input className="tf-input" type="date" value={f.due} onChange={e=>upd("due",e.target.value)} style={{ height:38 }} /></SettField>
        </div>
        <SettField label="Tags (comma-separated)" sub={T.sub}>
          <input className="tf-input" value={f.tags} onChange={e=>upd("tags",e.target.value)} placeholder="bug, urgent, api…" style={{ height:38 }} />
        </SettField>
        <div style={{ display:"flex", gap:8, justifyContent:"space-between", marginTop:4 }}>
          {onDelete ? <button className="tf-btn tf-btn-danger" onClick={onDelete} style={{ height:38, borderRadius:9, fontSize:13 }}>Delete</button> : <span/>}
          <div style={{ display:"flex", gap:8 }}>
            <button className="tf-btn tf-btn-ghost" onClick={onClose} style={{ height:38, borderRadius:9, fontSize:13 }}>Cancel</button>
            <button className="tf-btn tf-btn-primary" onClick={save} disabled={!f.title.trim()} style={{ height:38, borderRadius:9, fontSize:13, fontWeight:600 }}>{task?"Save changes":"Create task"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ SHARED COMPONENTS ════════════════════════════════════ */
function Avatar({ user, size=36, onClick }) {
  const s = { width:size, height:size, borderRadius:"50%", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:onClick?"pointer":"default", background:"linear-gradient(135deg,#185FA5,#7F77DD)", fontSize:size*0.36, fontWeight:700, color:"#fff" };
  if (user.photo) return <img src={user.photo} style={{ ...s, objectFit:"cover" }} onClick={onClick} alt="avatar" />;
  return <div style={s} onClick={onClick}>{user.initials||user.name?.slice(0,2).toUpperCase()}</div>;
}

function PriorityBadge({ p }) {
  const pm=PM[p];
  return <span className="tag" style={{ background:pm.bg, color:pm.color }}><span style={{ width:5,height:5,borderRadius:"50%",background:pm.dot }}></span>{pm.label}</span>;
}
function StatusBadge({ s }) {
  const m={todo:{label:"To Do",bg:"#E6F1FB",color:"#0C447C"},"in-progress":{label:"In Progress",bg:"#FAEEDA",color:"#854F0B"},done:{label:"Done",bg:"#EAF3DE",color:"#3B6D11"}}[s];
  return <span className="chip" style={{ background:m.bg, color:m.color }}>{m.label}</span>;
}
function CategoryChip({ c }) {
  const color=CC[c]||"#888";
  return <span className="chip" style={{ background:color+"20", color, border:`1px solid ${color}40` }}>{c}</span>;
}
function NavItem({ icon, label, active, collapsed, onClick }) {
  return (
    <button className={`nav-item${active?" nav-active":""}`} onClick={onClick} title={collapsed?label:undefined} style={{ justifyContent:collapsed?"center":"flex-start", color:active?"#185FA5":"inherit" }}>
      <span style={{ display:"flex", flexShrink:0 }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

/* ── Icons ─────────────────────────────────────────────── */
const I = (p) => (d) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p?.style}><path d={d}/></svg>;
const BoardIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/></svg>;
const ListIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const CalIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const ChartIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const LogoutIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const SearchIcon   = ({ style }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CollapseIcon = ({ flipped }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ transform:flipped?"scaleX(-1)":"none" }}><polyline points="15 18 9 12 15 6"/></svg>;

/* ── Helpers ─────────────────────────────────────────────── */
function fmtDate(s) { return new Date(s+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function isOverdue(due,status) { return status!=="done"&&due&&new Date(due+"T00:00:00")<new Date(); }
