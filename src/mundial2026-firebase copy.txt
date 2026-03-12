import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDL2FV0gfT5b58f5mXmAPJMqSbwKde0IV0",
  authDomain: "mundial2026-2026.firebaseapp.com",
  projectId: "mundial2026-2026",
  storageBucket: "mundial2026-2026.firebasestorage.app",
  messagingSenderId: "76029862427",
  appId: "1:76029862427:web:23f21566a32e1c40610ebe"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PARTICIPANTS_DOC = doc(db, "tournament", "participants");
const MATCHES_DOC = doc(db, "tournament", "matches");
const SETTINGS_DOC = doc(db, "tournament", "settings");

// ─── DATA ────────────────────────────────────────────────────────────────────
const GROUPS = {
  A: ["Mexico", "Sudafrica", "Corea del Sur", "Rep. UEFA D*"],
  B: ["Canada", "Suiza", "Qatar", "Rep. UEFA A*"],
  C: ["Brasil", "Marruecos", "Escocia", "Haiti"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Rep. UEFA C*"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Paises Bajos", "Japon", "Tunez", "Rep. UEFA B*"],
  G: ["Belgica", "Egipto", "Nueva Zelanda", "Rep. Intercont. 2*"],
  H: ["Espana", "Uruguay", "Arabia Saudita", "Cabo Verde"],
  I: ["Francia", "Senegal", "Noruega", "Rep. Intercont. 2*"],
  J: ["Argentina", "Austria", "Argelia", "Jordania"],
  K: ["Portugal", "Colombia", "Uzbekistan", "Rep. Intercont. 1*"],
  L: ["Inglaterra", "Croacia", "Panama", "Ghana"],
};

const GROUP_COLORS = {
  A:"#1A5276",B:"#1F618D",C:"#117A65",D:"#1E8449",
  E:"#7D6608",F:"#784212",G:"#6E2FD6",H:"#943126",
  I:"#7B241C",J:"#4A235A",K:"#1B2631",L:"#0B6E4F",
};

const LOCK_DATES = {
  groups:  new Date("2026-06-10T00:00:00"),
  round32: new Date("2026-07-01T00:00:00"),
  quarters:new Date("2026-07-03T00:00:00"),
  semis:   new Date("2026-07-14T00:00:00"),
  third:   new Date("2026-07-17T00:00:00"),
  final:   new Date("2026-07-18T00:00:00"),
};

function isPhaseLocked(phase, adminUnlocked = {}) {
  if (adminUnlocked[phase]) return false;
  const lockDate = LOCK_DATES[phase];
  if (!lockDate) return false;
  return new Date() >= lockDate;
}

function generateGroupMatches() {
  const matches = [];
  let id = 1;
  const dates = {
    A:["11 Jun","12 Jun","16 Jun","16 Jun","20 Jun","24 Jun"],
    B:["12 Jun","16 Jun","17 Jun","20 Jun","21 Jun","25 Jun"],
    C:["13 Jun","17 Jun","18 Jun","21 Jun","22 Jun","26 Jun"],
    D:["12 Jun","13 Jun","17 Jun","18 Jun","22 Jun","26 Jun"],
    E:["15 Jun","15 Jun","19 Jun","19 Jun","23 Jun","27 Jun"],
    F:["14 Jun","14 Jun","18 Jun","18 Jun","22 Jun","26 Jun"],
    G:["13 Jun","13 Jun","17 Jun","17 Jun","21 Jun","25 Jun"],
    H:["14 Jun","15 Jun","18 Jun","19 Jun","22 Jun","26 Jun"],
    I:["15 Jun","16 Jun","19 Jun","20 Jun","23 Jun","27 Jun"],
    J:["16 Jun","16 Jun","20 Jun","20 Jun","24 Jun","28 Jun"],
    K:["14 Jun","15 Jun","18 Jun","19 Jun","23 Jun","27 Jun"],
    L:["13 Jun","14 Jun","17 Jun","18 Jun","21 Jun","25 Jun"],
  };
  Object.entries(GROUPS).forEach(([grp, teams]) => {
    [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]].forEach(([i,j], idx) => {
      matches.push({ id: id++, phase:"groups", group:grp,
        date: dates[grp]?.[idx]||"TBD",
        home:teams[i], away:teams[j],
        realHome:null, realAway:null });
    });
  });
  return matches;
}

function generateElimMatches() {
  const rounds = [
    {phase:"round32", label:"Octavos de Final", count:16, date:"2-3 Jul"},
    {phase:"quarters", label:"Cuartos de Final", count:8, date:"4-5 Jul"},
    {phase:"semis", label:"Semifinales", count:4, date:"15-16 Jul"},
    {phase:"third", label:"Tercer Lugar", count:1, date:"18 Jul"},
    {phase:"final", label:"Gran Final", count:1, date:"19 Jul"},
  ];
  const matches = [];
  let id = 1000;
  rounds.forEach(r => {
    for (let k = 0; k < r.count; k++) {
      matches.push({ id:id++, phase:r.phase, label:r.label,
        date:r.date, matchNum:k+1,
        home:"Por definir", away:"Por definir",
        realHome:null, realAway:null });
    }
  });
  return matches;
}

const INITIAL_MATCHES = [...generateGroupMatches(), ...generateElimMatches()];

// ─── SCORING ─────────────────────────────────────────────────────────────────
function calcPoints(predH, predA, realH, realA) {
  if (realH===null||realA===null||predH===null||predA===null) return null;
  const ph=Number(predH),pa=Number(predA),rh=Number(realH),ra=Number(realA);
  if (isNaN(ph)||isNaN(pa)||isNaN(rh)||isNaN(ra)) return null;
  if (ph===rh&&pa===ra) return 5;
  const pw=ph>pa?"H":ph<pa?"A":"D";
  const rw=rh>ra?"H":rh<ra?"A":"D";
  if (pw===rw) return 3;
  return 0;
}

function calcParticipantPoints(predictions, matches) {
  let total=0, exact=0, correct=0;
  matches.forEach(m => {
    const pred=predictions?.[m.id];
    if (!pred) return;
    const pts=calcPoints(pred.home,pred.away,m.realHome,m.realAway);
    if (pts===null) return;
    total+=pts;
    if (pts===5) exact++;
    if (pts>=3) correct++;
  });
  return {total,exact,correct};
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight:"100vh", background:"#0a0e1a",
    fontFamily:"'Segoe UI', sans-serif", color:"#e8eaf0",
  },
  header: {
    background:"linear-gradient(135deg,#0d1b2a,#1a2744)",
    borderBottom:"2px solid #c9a84c",
    position:"sticky", top:0, zIndex:100,
    boxShadow:"0 4px 30px rgba(0,0,0,0.5)",
  },
  headerInner: {
    maxWidth:1000, margin:"0 auto",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"12px 16px", flexWrap:"wrap", gap:8,
  },
  logo: {
    display:"flex", alignItems:"center", gap:8,
    fontSize:"1.3rem", fontWeight:800,
    letterSpacing:2, color:"#c9a84c",
  },
  nav: {display:"flex", gap:4, flexWrap:"wrap"},
  navBtn: (active) => ({
    background: active?"#c9a84c":"transparent",
    color: active?"#0a0e1a":"#8899bb",
    border:"1px solid "+(active?"#c9a84c":"#2a3a5e"),
    borderRadius:6, padding:"6px 12px",
    cursor:"pointer", fontSize:"0.78rem",
    fontWeight:700, letterSpacing:1,
  }),
  main: {maxWidth:1000, margin:"0 auto", padding:"20px 14px"},
  card: {
    background:"#111827", border:"1px solid #1e2d4a",
    borderRadius:12, padding:18, marginBottom:14,
  },
  sectionTitle: {
    fontSize:"1rem", fontWeight:800, letterSpacing:2,
    color:"#c9a84c", borderBottom:"1px solid #1e2d4a",
    paddingBottom:8, marginBottom:14,
  },
  input: {
    background:"#1a2540", border:"1px solid #2a3a5e",
    color:"#e8eaf0", borderRadius:6, padding:"8px 12px",
    fontSize:"0.95rem", width:"100%",
    fontFamily:"inherit", outline:"none",
    boxSizing:"border-box",
  },
  scoreInput: {
    background:"#1a2540", border:"1px solid #2a3a5e",
    color:"#e8eaf0", borderRadius:6, padding:"5px 0",
    fontSize:"1rem", fontWeight:700, width:46,
    textAlign:"center", fontFamily:"inherit", outline:"none",
  },
  btn: (color="#c9a84c", outline=false) => ({
    background: outline?"transparent":color,
    color: outline?color:"#0a0e1a",
    border:"2px solid "+color,
    borderRadius:8, padding:"8px 18px",
    cursor:"pointer", fontSize:"0.85rem",
    fontWeight:800, fontFamily:"inherit",
  }),
  matchRow: {
    display:"grid",
    gridTemplateColumns:"1fr 46px 10px 46px 1fr",
    gap:5, alignItems:"center",
    background:"#0d1520", border:"1px solid #1e2d4a",
    borderRadius:8, padding:"7px 10px", marginBottom:5,
  },
  badge: (pts) => ({
    display:"inline-block",
    background:pts===5?"#27ae60":pts===3?"#2980b9":pts===0?"#c0392b":"#2a3a5e",
    color:"#fff", borderRadius:20,
    padding:"2px 8px", fontSize:"0.78rem", fontWeight:700,
    minWidth:26, textAlign:"center",
  }),
  leaderRow: (i) => ({
    background:i===0?"#1a1200":i===1?"#141414":i===2?"#110a05":"#111827",
    border:"1px solid "+(i===0?"#c9a84c":i===1?"#9e9e9e":i===2?"#cd7f32":"#1e2d4a"),
    borderRadius:10, padding:"10px 16px",
    display:"flex", alignItems:"center", gap:12,
    marginBottom:7,
  }),
  groupHeader: (color) => ({
    background:color+"22", borderLeft:"4px solid "+color,
    padding:"6px 12px", borderRadius:"0 8px 8px 0",
    marginBottom:7, marginTop:14,
    fontSize:"0.95rem", fontWeight:800,
    letterSpacing:2, color:color,
  }),
  phaseHeader: (color) => ({
    background:color, borderRadius:8,
    padding:"8px 14px", fontSize:"0.9rem",
    fontWeight:800, letterSpacing:2,
    marginBottom:8, marginTop:16,
    color:"#fff",
  }),
};

// ─── GOOGLE FONTS ────────────────────────────────────────────────────────────
const FontStyle = () => (
  <style>{`
    * { box-sizing:border-box; }
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input[type=number] { -moz-appearance:textfield; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-thumb { background:#2a3a5e; border-radius:3px; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .fi { animation:fadeIn .3s ease forwards; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .pulse { animation:pulse 2s infinite; }
    button:hover { opacity:.85; }
  `}</style>
);

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Leaderboard({ participants, matches }) {
  const ranked = [...participants]
    .map(p => ({...p, ...calcParticipantPoints(p.predictions, matches)}))
    .sort((a,b) => b.total-a.total || b.exact-a.exact);
  const medals = ["1", "2", "3"];

  return (
    <div className="fi">
      <div style={S.sectionTitle}>Tabla de Clasificacion</div>
      {ranked.length===0 && (
        <div style={{textAlign:"center",color:"#4a5a7e",padding:40}}>
          Aun no hay participantes registrados
        </div>
      )}
      {ranked.map((p,i) => (
        <div key={p.id} style={S.leaderRow(i)}>
          <div style={{fontSize:"1.4rem",width:28,textAlign:"center"}}>
            {i===0?"":i===1?"":i===2?"":
              <span style={{color:"#4a5a7e",fontSize:"0.9rem",fontWeight:700}}>#{i+1}</span>}
            {i<3 && <span>{["","",""][i]}</span>}
          </div>
          <div style={{fontSize:"1.5rem"}}>{i===0?"":i===1?"":i===2?"":""}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:"1rem"}}>{p.name}</div>
            <div style={{color:"#4a5a7e",fontSize:"0.75rem",marginTop:2}}>
              {p.exact} exactos &middot; {p.correct} acertados
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"1.8rem",fontWeight:800,
              color:i===0?"#c9a84c":i===1?"#9e9e9e":i===2?"#cd7f32":"#e8eaf0",
              lineHeight:1}}>{p.total}</div>
            <div style={{color:"#4a5a7e",fontSize:"0.7rem"}}>PUNTOS</div>
          </div>
        </div>
      ))}
      <div style={{...S.card, marginTop:20}}>
        <div style={S.sectionTitle}>Sistema de Puntos</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
          {[["5 pts","Resultado exacto","#27ae60"],["3 pts","Ganador correcto","#2980b9"],["0 pts","Resultado fallado","#c0392b"]].map(([pts,desc,color])=>(
            <div key={pts} style={{background:"#0d1520",border:"1px solid "+color+"44",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:"1.8rem",fontWeight:800,color}}>{pts}</div>
              <div style={{color:"#8899bb",fontSize:"0.82rem",marginTop:3}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTICIPANT FORM
// ══════════════════════════════════════════════════════════════════════════════
function ParticipantForm({ participants, setParticipants, matches, adminUnlocked }) {
  const [step, setStep] = useState("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [preds, setPreds] = useState({});
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const [activePh, setActivePh] = useState("round32");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];
  const phaseLabels = {round32:"Octavos",quarters:"Cuartos",semis:"Semifinales",third:"3er Lugar",final:"Gran Final"};
  const phaseColors = {round32:"#c0392b",quarters:"#8e44ad",semis:"#e67e22",third:"#2980b9",final:"#c9a84c"};

  const groupsLocked = isPhaseLocked("groups", adminUnlocked);

  function getLockMsg(phase) {
    const locked = isPhaseLocked(phase, adminUnlocked);
    if (!locked) {
      const d = LOCK_DATES[phase];
      if (d) {
        const diff = Math.ceil((d - new Date())/(1000*60*60*24));
        if (diff>0) return {locked:false, msg:"Abierto - se bloquea en "+diff+" dia"+(diff!==1?"s":"")};
      }
      return {locked:false, msg:"Abierto"};
    }
    return {locked:true, msg:"Bloqueado - ya no se pueden modificar"};
  }

  function handleLogin() {
    setError("");
    if (!name.trim()) { setError("Ingresa tu nombre"); return; }
    if (!pin.trim()||pin.length<4) { setError("PIN debe tener al menos 4 digitos"); return; }
    const existing = participants.find(p=>p.name.toLowerCase()===name.trim().toLowerCase());
    if (existing) {
      if (existing.pin!==pin) { setError("PIN incorrecto"); return; }
      setCurrentUser(existing);
      setPreds(existing.predictions||{});
    } else {
      const newUser = {id:Date.now(), name:name.trim(), pin, predictions:{}, createdAt:new Date().toISOString()};
      setCurrentUser(newUser);
      setPreds({});
    }
    setStep("form");
  }

  function setPred(matchId, side, val) {
    const v = val===""?null:Math.max(0,parseInt(val)||0);
    setPreds(prev=>({...prev, [matchId]:{...(prev[matchId]||{}), [side]:v}}));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updatedUser = {...currentUser, predictions:preds};
      const newParticipants = [...participants.filter(p=>p.id!==currentUser.id), updatedUser];
      await setDoc(PARTICIPANTS_DOC, {list: newParticipants});
      setParticipants(newParticipants);
      setStep("done");
    } catch(e) {
      alert("Error al guardar: "+e.message);
    } finally {
      setSaving(false);
    }
  }

  function renderMatchRow(m, locked=false) {
    const pred = preds[m.id]||{};
    const pts = calcPoints(pred.home, pred.away, m.realHome, m.realAway);
    return (
      <div key={m.id} style={{...S.matchRow, opacity:m.home==="Por definir"?.55:1}}>
        <div style={{textAlign:"right",fontSize:"0.85rem",fontWeight:600}}>{m.home}</div>
        <input type="number" min="0" max="99" placeholder="-"
          style={{...S.scoreInput, background:locked?"#0d1520":"#1a2540", cursor:locked?"not-allowed":"text"}}
          value={pred.home??""} disabled={locked}
          onChange={e=>!locked&&setPred(m.id,"home",e.target.value)} />
        <div style={{textAlign:"center",color:"#4a5a7e",fontSize:"0.68rem",fontWeight:700}}>VS</div>
        <input type="number" min="0" max="99" placeholder="-"
          style={{...S.scoreInput, background:locked?"#0d1520":"#1a2540", cursor:locked?"not-allowed":"text"}}
          value={pred.away??""} disabled={locked}
          onChange={e=>!locked&&setPred(m.id,"away",e.target.value)} />
        <div style={{textAlign:"left",fontSize:"0.85rem",fontWeight:600}}>{m.away}</div>
        {pts!==null && <div style={{...S.badge(pts),marginLeft:6}}>{pts}pts</div>}
      </div>
    );
  }

  if (step==="login") return (
    <div className="fi" style={{maxWidth:400,margin:"0 auto"}}>
      <div style={S.card}>
        <div style={S.sectionTitle}>Acceso al Concurso</div>
        <p style={{color:"#8899bb",marginBottom:16,fontSize:"0.88rem",lineHeight:1.6}}>
          Nuevo: escribe tu nombre y crea un PIN de 4+ digitos.<br/>
          Ya participas: usa el mismo nombre y PIN.
        </p>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:"0.75rem",color:"#c9a84c",letterSpacing:2,display:"block",marginBottom:5}}>TU NOMBRE</label>
          <input style={S.input} placeholder="Ej: Carlos Perez"
            value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:"0.75rem",color:"#c9a84c",letterSpacing:2,display:"block",marginBottom:5}}>PIN (minimo 4 digitos)</label>
          <input style={S.input} type="password" placeholder="****"
            value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        </div>
        {error && <div style={{color:"#e74c3c",marginBottom:10,fontSize:"0.85rem"}}>{error}</div>}
        <button style={S.btn()} onClick={handleLogin}>Entrar / Registrarse</button>
        <div style={{marginTop:10,color:"#4a5a7e",fontSize:"0.75rem"}}>{participants.length} participante{participants.length!==1?"s":""} registrado{participants.length!==1?"s":""}</div>
      </div>
    </div>
  );

  if (step==="done") return (
    <div className="fi" style={{maxWidth:440,margin:"0 auto",textAlign:"center"}}>
      <div style={S.card}>
        <div style={{fontSize:"3rem",marginBottom:12}}>OK</div>
        <div style={{fontSize:"1.3rem",fontWeight:800,color:"#c9a84c",marginBottom:8}}>Pronosticos guardados!</div>
        <div style={{color:"#8899bb",marginBottom:18}}>Hola <strong style={{color:"#e8eaf0"}}>{currentUser?.name}</strong>, tus predicciones quedaron guardadas.</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <button style={S.btn()} onClick={()=>setStep("form")}>Editar Pronosticos</button>
          <button style={S.btn("#8899bb",true)} onClick={()=>{setStep("login");setName("");setPin("");}}>Cambiar Usuario</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fi">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <span style={{color:"#c9a84c",fontWeight:800}}>{currentUser?.name}</span>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.btn("#27ae60"),fontSize:"0.8rem",padding:"6px 14px"}} onClick={handleSave} disabled={saving}>
            {saving?"Guardando...":"Guardar Todo"}
          </button>
          <button style={{...S.btn("#8899bb",true),fontSize:"0.8rem",padding:"6px 12px"}} onClick={()=>{setStep("login");setName("");setPin("");}}>Salir</button>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["groups","elim"].map(ph=>(
          <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
            {ph==="groups"?"Fase de Grupos":"Eliminatorias"}
          </button>
        ))}
      </div>

      {activePhase==="groups" && (
        <>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} style={{
                ...S.navBtn(activeGroup===g),
                background:activeGroup===g?GROUP_COLORS[g]:"transparent",
                borderColor:GROUP_COLORS[g], color:activeGroup===g?"#fff":GROUP_COLORS[g],
                padding:"4px 10px",fontSize:"0.75rem",
              }} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
            ))}
          </div>
          {(()=>{const lk=getLockMsg("groups"); return(
            <div style={{background:lk.locked?"#2a0a0a":"#0a2215",border:"1px solid "+(lk.locked?"#c0392b88":"#27ae6066"),borderRadius:7,padding:"7px 12px",marginBottom:10,fontSize:"0.8rem",color:lk.locked?"#e74c3c":"#2ecc71"}}>
              {lk.locked?"Pronosticos de grupos cerrados":lk.msg}
            </div>
          );})()}
          <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
          {groupMatches.filter(m=>m.group===activeGroup).map(m=>renderMatchRow(m, groupsLocked))}
          {!groupsLocked && (
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
              <button style={{...S.btn("#27ae60"),fontSize:"0.8rem"}} onClick={handleSave} disabled={saving}>
                {saving?"Guardando...":"Guardar"}
              </button>
            </div>
          )}
        </>
      )}

      {activePhase==="elim" && (
        <>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {phases.map(ph=>(
              <button key={ph} style={{
                ...S.navBtn(activePh===ph),
                background:activePh===ph?phaseColors[ph]:"transparent",
                borderColor:phaseColors[ph]+"88", color:activePh===ph?"#fff":phaseColors[ph],
                fontSize:"0.75rem",padding:"4px 10px",
              }} onClick={()=>setActivePh(ph)}>{phaseLabels[ph]}</button>
            ))}
          </div>
          {(()=>{const lk=getLockMsg(activePh); return(
            <div style={{background:lk.locked?"#2a0a0a":"#0a2215",border:"1px solid "+(lk.locked?"#c0392b88":"#27ae6066"),borderRadius:7,padding:"7px 12px",marginBottom:10,fontSize:"0.8rem",color:lk.locked?"#e74c3c":"#2ecc71"}}>
              {lk.locked?"Cerrado - ya no se pueden modificar":lk.msg}
            </div>
          );})()}
          {(()=>{const phaseLocked=isPhaseLocked(activePh,adminUnlocked); return(
            <>
              {elimMatches.filter(m=>m.phase===activePh).map(m=>renderMatchRow(m,phaseLocked))}
              {!phaseLocked && (
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                  <button style={{...S.btn("#27ae60"),fontSize:"0.8rem"}} onClick={handleSave} disabled={saving}>
                    {saving?"Guardando...":"Guardar"}
                  </button>
                </div>
              )}
            </>
          );})()}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURE VIEW
// ══════════════════════════════════════════════════════════════════════════════
function FixtureView({ matches }) {
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const phaseColors = {round32:"#c0392b",quarters:"#8e44ad",semis:"#e67e22",third:"#2980b9",final:"#c9a84c"};
  const phaseLabels = {round32:"Octavos de Final",quarters:"Cuartos de Final",semis:"Semifinales",third:"Tercer Lugar",final:"Gran Final"};
  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];

  function renderMatch(m) {
    const hasResult = m.realHome!==null&&m.realAway!==null;
    return (
      <div key={m.id} style={{...S.matchRow,gridTemplateColumns:"1fr auto auto auto 1fr",opacity:m.home==="Por definir"?.5:1}}>
        <div style={{textAlign:"right",fontWeight:600,fontSize:"0.85rem"}}>{m.home}</div>
        <div style={{background:hasResult?"#1e3a2e":"#1a2540",border:"1px solid "+(hasResult?"#27ae6066":"#2a3a5e"),borderRadius:6,padding:"3px 8px",fontSize:"1rem",fontWeight:800,color:hasResult?"#27ae60":"#4a5a7e",minWidth:32,textAlign:"center"}}>
          {hasResult?m.realHome:"-"}
        </div>
        <div style={{color:"#4a5a7e",fontWeight:700,fontSize:"0.68rem",padding:"0 3px"}}>VS</div>
        <div style={{background:hasResult?"#1e3a2e":"#1a2540",border:"1px solid "+(hasResult?"#27ae6066":"#2a3a5e"),borderRadius:6,padding:"3px 8px",fontSize:"1rem",fontWeight:800,color:hasResult?"#27ae60":"#4a5a7e",minWidth:32,textAlign:"center"}}>
          {hasResult?m.realAway:"-"}
        </div>
        <div style={{textAlign:"left",fontWeight:600,fontSize:"0.85rem"}}>{m.away}</div>
      </div>
    );
  }

  return (
    <div className="fi">
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["groups","elim"].map(ph=>(
          <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
            {ph==="groups"?"Grupos":"Eliminatorias"}
          </button>
        ))}
      </div>
      {activePhase==="groups" && (
        <>
          <div style={{background:"#0d1520",border:"1px solid #c9a84c44",borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:"0.78rem",color:"#8899bb",lineHeight:1.7}}>
            6 plazas por repechaje (marzo 2026): UEFA A/B/C/D e Intercont. 1 y 2
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {Object.keys(GROUPS).map(g=>(
              <button key={g} style={{...S.navBtn(activeGroup===g),background:activeGroup===g?GROUP_COLORS[g]:"transparent",borderColor:GROUP_COLORS[g],color:activeGroup===g?"#fff":GROUP_COLORS[g],padding:"4px 10px",fontSize:"0.75rem"}} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
            ))}
          </div>
          <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
          {groupMatches.filter(m=>m.group===activeGroup).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{color:"#4a5a7e",fontSize:"0.72rem",minWidth:38}}>{m.date}</span>
              {renderMatch(m)}
            </div>
          ))}
        </>
      )}
      {activePhase==="elim" && (
        <>
          {phases.map(ph=>(
            <div key={ph}>
              <div style={S.phaseHeader(phaseColors[ph])}>{phaseLabels[ph]}</div>
              {elimMatches.filter(m=>m.phase===ph).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{color:"#4a5a7e",fontSize:"0.72rem",minWidth:38}}>{m.date}</span>
                  {renderMatch(m)}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════
function AdminPanel({ matches, setMatches, participants, setParticipants, adminUnlocked, setAdminUnlocked }) {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [activeGroup, setActiveGroup] = useState("A");
  const [activePhase, setActivePhase] = useState("groups");
  const [activePh, setActivePh] = useState("round32");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const ADMIN = "2026";

  const phaseColors = {round32:"#c0392b",quarters:"#8e44ad",semis:"#e67e22",third:"#2980b9",final:"#c9a84c"};
  const phaseLabels = {round32:"Octavos de Final",quarters:"Cuartos de Final",semis:"Semifinales",third:"Tercer Lugar",final:"Gran Final"};
  const groupMatches = matches.filter(m=>m.phase==="groups");
  const elimMatches = matches.filter(m=>m.phase!=="groups");
  const phases = [...new Set(elimMatches.map(m=>m.phase))];

  function setResult(matchId, side, val) {
    const v = val===""?null:Math.max(0,parseInt(val)||0);
    setMatches(prev=>prev.map(m=>m.id===matchId?{...m,[side==="home"?"realHome":"realAway"]:v}:m));
  }

  function setTeamName(matchId, side, val) {
    setMatches(prev=>prev.map(m=>m.id===matchId?{...m,[side==="home"?"home":"away"]:val}:m));
  }

  async function handleSave() {
    try {
      await setDoc(MATCHES_DOC, {list: matches});
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    } catch(e) {
      alert("Error: "+e.message);
    }
  }

  async function toggleUnlock(phase) {
    const updated = {...adminUnlocked, [phase]:!adminUnlocked[phase]};
    setAdminUnlocked(updated);
    await setDoc(SETTINGS_DOC, {adminUnlocked: updated});
  }

  function removeParticipant(id) {
    if (!window.confirm("Eliminar este participante?")) return;
    const updated = participants.filter(p=>p.id!==id);
    setParticipants(updated);
    setDoc(PARTICIPANTS_DOC, {list: updated});
  }

  if (!authed) return (
    <div style={{maxWidth:360,margin:"0 auto"}}>
      <div style={S.card}>
        <div style={S.sectionTitle}>Panel de Administrador</div>
        <p style={{color:"#8899bb",marginBottom:14,fontSize:"0.85rem"}}>PIN de admin (defecto: 2026)</p>
        <input style={{...S.input,marginBottom:14}} type="password" placeholder="PIN administrador"
          value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(pinInput===ADMIN?setAuthed(true):alert("PIN incorrecto"))} />
        <button style={S.btn()} onClick={()=>pinInput===ADMIN?setAuthed(true):alert("PIN incorrecto")}>
          Entrar como Admin
        </button>
      </div>
    </div>
  );

  return (
    <div className="fi">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["results","Resultados"],["teams","Equipos"],["locks","Bloqueos"],["users","Participantes"]].map(([t,l])=>(
            <button key={t} style={S.navBtn(activeTab===t)} onClick={()=>setActiveTab(t)}>{l}</button>
          ))}
        </div>
        <button style={{...S.btn(saved?"#27ae60":"#c9a84c"),fontSize:"0.8rem"}} onClick={handleSave}>
          {saved?"Guardado!":"Guardar Resultados"}
        </button>
      </div>

      {activeTab==="results" && (
        <>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {["groups","elim"].map(ph=>(
              <button key={ph} style={S.navBtn(activePhase===ph)} onClick={()=>setActivePhase(ph)}>
                {ph==="groups"?"Grupos":"Eliminatorias"}
              </button>
            ))}
          </div>
          {activePhase==="groups" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} style={{...S.navBtn(activeGroup===g),background:activeGroup===g?GROUP_COLORS[g]:"transparent",borderColor:GROUP_COLORS[g],color:activeGroup===g?"#fff":GROUP_COLORS[g],padding:"4px 10px",fontSize:"0.75rem"}} onClick={()=>setActiveGroup(g)}>Grp {g}</button>
                ))}
              </div>
              <div style={S.groupHeader(GROUP_COLORS[activeGroup])}>GRUPO {activeGroup}</div>
              {groupMatches.filter(m=>m.group===activeGroup).map(m=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"40px 1fr 46px 12px 46px 1fr 24px",gap:6,alignItems:"center",background:"#0d1520",border:"1px solid #1e2d4a",borderRadius:8,padding:"6px 10px",marginBottom:5}}>
                  <span style={{color:"#4a5a7e",fontSize:"0.7rem"}}>{m.date}</span>
                  <div style={{textAlign:"right",fontWeight:600,fontSize:"0.82rem"}}>{m.home}</div>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realHome??""} onChange={e=>setResult(m.id,"home",e.target.value)} />
                  <span style={{color:"#4a5a7e",fontSize:"0.68rem",textAlign:"center"}}>VS</span>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realAway??""} onChange={e=>setResult(m.id,"away",e.target.value)} />
                  <div style={{fontWeight:600,fontSize:"0.82rem"}}>{m.away}</div>
                  <span style={{fontSize:"0.8rem",color:m.realHome!==null?"#27ae60":"#4a5a7e"}}>
                    {m.realHome!==null?"OK":"..."}
                  </span>
                </div>
              ))}
            </>
          )}
          {activePhase==="elim" && (
            <>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {phases.map(ph=>(
                  <button key={ph} style={{...S.navBtn(activePh===ph),background:activePh===ph?phaseColors[ph]:"transparent",borderColor:phaseColors[ph]+"88",color:activePh===ph?"#fff":phaseColors[ph],fontSize:"0.75rem",padding:"4px 10px"}} onClick={()=>setActivePh(ph)}>{phaseLabels[ph]}</button>
                ))}
              </div>
              <div style={S.phaseHeader(phaseColors[activePh])}>{phaseLabels[activePh]}</div>
              {elimMatches.filter(m=>m.phase===activePh).map(m=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"40px 1fr 46px 12px 46px 1fr 24px",gap:6,alignItems:"center",background:"#0d1520",border:"1px solid #1e2d4a",borderRadius:8,padding:"6px 10px",marginBottom:5}}>
                  <span style={{color:"#4a5a7e",fontSize:"0.7rem"}}>{m.date}</span>
                  <div style={{textAlign:"right",fontWeight:600,fontSize:"0.82rem",color:"#8899bb"}}>{m.home}</div>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realHome??""} onChange={e=>setResult(m.id,"home",e.target.value)} />
                  <span style={{color:"#4a5a7e",fontSize:"0.68rem",textAlign:"center"}}>VS</span>
                  <input type="number" min="0" max="99" placeholder="-" style={S.scoreInput}
                    value={m.realAway??""} onChange={e=>setResult(m.id,"away",e.target.value)} />
                  <div style={{fontWeight:600,fontSize:"0.82rem",color:"#8899bb"}}>{m.away}</div>
                  <span style={{fontSize:"0.8rem",color:m.realHome!==null?"#27ae60":"#4a5a7e"}}>
                    {m.realHome!==null?"OK":"..."}
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {activeTab==="teams" && (
        <div>
          <p style={{color:"#8899bb",marginBottom:14,fontSize:"0.85rem"}}>Actualiza los equipos de la fase eliminatoria a medida que avanzan.</p>
          {phases.map(ph=>(
            <div key={ph}>
              <div style={S.phaseHeader(phaseColors[ph])}>{phaseLabels[ph]}</div>
              {elimMatches.filter(m=>m.phase===ph).map((m,i)=>(
                <div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 30px 1fr",gap:6,alignItems:"center",marginBottom:7}}>
                  <input style={{...S.input,textAlign:"right",marginBottom:0}} value={m.home}
                    onChange={e=>setTeamName(m.id,"home",e.target.value)} />
                  <div style={{textAlign:"center",color:"#4a5a7e",fontWeight:700}}>VS</div>
                  <input style={{...S.input,marginBottom:0}} value={m.away}
                    onChange={e=>setTeamName(m.id,"away",e.target.value)} />
                </div>
              ))}
            </div>
          ))}
          <button style={{...S.btn(),marginTop:14}} onClick={handleSave}>Guardar Equipos</button>
        </div>
      )}

      {activeTab==="locks" && (
        <div>
          <p style={{color:"#8899bb",marginBottom:14,fontSize:"0.85rem"}}>Desbloquea una fase si un participante cometio un error legitimo.</p>
          {[
            {phase:"groups",label:"Fase de Grupos",lockDate:"10 Jun 2026",color:"#1F618D"},
            {phase:"round32",label:"Octavos de Final",lockDate:"1 Jul 2026",color:"#c0392b"},
            {phase:"quarters",label:"Cuartos de Final",lockDate:"3 Jul 2026",color:"#8e44ad"},
            {phase:"semis",label:"Semifinales",lockDate:"14 Jul 2026",color:"#e67e22"},
            {phase:"third",label:"Tercer Lugar",lockDate:"17 Jul 2026",color:"#2980b9"},
            {phase:"final",label:"Gran Final",lockDate:"18 Jul 2026",color:"#c9a84c"},
          ].map(({phase,label,lockDate,color})=>{
            const autoLocked=isPhaseLocked(phase,{});
            const manUnlocked=!!adminUnlocked[phase];
            const currentlyLocked=autoLocked&&!manUnlocked;
            return (
              <div key={phase} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0d1520",border:"1px solid "+color+"44",borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.95rem"}}>{label}</div>
                  <div style={{fontSize:"0.75rem",color:"#4a5a7e",marginTop:2}}>Bloqueo: {lockDate}</div>
                  <div style={{fontSize:"0.8rem",marginTop:3,color:currentlyLocked?"#e74c3c":"#2ecc71"}}>
                    {currentlyLocked?"Bloqueado":autoLocked?"Desbloqueado por admin":"Abierto"}
                  </div>
                </div>
                {autoLocked && (
                  <button style={{...S.btn(manUnlocked?"#27ae60":"#c0392b",true),fontSize:"0.78rem",padding:"6px 12px"}}
                    onClick={()=>toggleUnlock(phase)}>
                    {manUnlocked?"Volver a Bloquear":"Desbloquear"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab==="users" && (
        <div>
          <div style={{...S.sectionTitle,marginBottom:12}}>{participants.length} Participantes</div>
          {participants.length===0 && <div style={{color:"#4a5a7e",padding:16}}>Sin participantes</div>}
          {[...participants].sort((a,b)=>{
            const pa=calcParticipantPoints(a.predictions,matches);
            const pb=calcParticipantPoints(b.predictions,matches);
            return pb.total-pa.total;
          }).map((p,i)=>{
            const pts=calcParticipantPoints(p.predictions,matches);
            const predCount=Object.keys(p.predictions||{}).length;
            return (
              <div key={p.id} style={{...S.leaderRow(i),justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{color:"#4a5a7e",fontWeight:700,minWidth:24}}>#{i+1}</span>
                  <div>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    <div style={{fontSize:"0.72rem",color:"#4a5a7e"}}>{predCount} pronosticos</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"1.3rem",fontWeight:800,color:"#c9a84c"}}>{pts.total}</div>
                    <div style={{fontSize:"0.68rem",color:"#4a5a7e"}}>pts</div>
                  </div>
                  <button onClick={()=>removeParticipant(p.id)}
                    style={{background:"transparent",border:"1px solid #c0392b44",color:"#c0392b",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem"}}>
                    X
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("leaderboard");
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [participants, setParticipants] = useState([]);
  const [adminUnlocked, setAdminUnlocked] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubP = onSnapshot(PARTICIPANTS_DOC, snap => {
      if (snap.exists()) setParticipants(snap.data().list || []);
    });
    const unsubM = onSnapshot(MATCHES_DOC, snap => {
      if (snap.exists()) setMatches(snap.data().list || INITIAL_MATCHES);
    });
    const unsubS = onSnapshot(SETTINGS_DOC, snap => {
      if (snap.exists()) setAdminUnlocked(snap.data().adminUnlocked || {});
      setLoading(false);
    });
    setTimeout(() => setLoading(false), 3000);
    return () => { unsubP(); unsubM(); unsubS(); };
  }, []);

  const tabs = [
    {id:"leaderboard", label:"Clasificacion"},
    {id:"form", label:"Mis Pronosticos"},
    {id:"fixture", label:"Fixture"},
    {id:"admin", label:"Admin"},
  ];

  const totalMatches = matches.filter(m=>m.realHome!==null).length;

  if (loading) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <FontStyle />
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"2.5rem",marginBottom:10}} className="pulse">...</div>
        <div style={{color:"#c9a84c",fontSize:"1rem",letterSpacing:3}}>CARGANDO...</div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <FontStyle />
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>Mundial 2026</div>
          <nav style={S.nav}>
            {tabs.map(t=>(
              <button key={t.id} style={S.navBtn(view===t.id)} onClick={()=>setView(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{background:"#0a0e1a",borderTop:"1px solid #1e2d4a",padding:"4px 16px",textAlign:"center",fontSize:"0.7rem",color:"#4a5a7e"}}>
          {participants.length} PARTICIPANTES &nbsp;|&nbsp; {totalMatches} PARTIDOS COMPLETADOS &nbsp;|&nbsp; 11 JUN - 19 JUL 2026
        </div>
      </header>

      <main style={S.main}>
        {view==="leaderboard" && <Leaderboard participants={participants} matches={matches} />}
        {view==="form" && <ParticipantForm participants={participants} setParticipants={setParticipants} matches={matches} adminUnlocked={adminUnlocked} />}
        {view==="fixture" && <FixtureView matches={matches} />}
        {view==="admin" && <AdminPanel matches={matches} setMatches={setMatches} participants={participants} setParticipants={setParticipants} adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} />}
      </main>
    </div>
  );
}
