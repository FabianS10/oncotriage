import React, { useState, useEffect, useContext, createContext } from 'react';
import Login from './components/views/Login';
import Dashboard from './components/views/Dashboard';
import Queue from './components/views/Queue';
import Analysis from './components/views/Analysis';
import History from './components/views/History';
import Analytics from './components/views/Analytics';
import Settings from './components/views/Settings';
import Titlebar from './components/ui/Titlebar';
import Sidebar from './components/ui/Sidebar1';

/* ── Context ── */
export const AppContext = createContext();
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp debe usarse dentro de un AppContext.Provider");
  return context;
}

/* ── In-browser persistent store ── */
export const store = {
  getCases: (filters = {}) => {
    const all = JSON.parse(localStorage.getItem('oncotriage_cases') || '[]');
    return all.filter(c => {
      if (filters.status   && c.status   !== filters.status)   return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.search   && !c.patient_name?.toLowerCase().includes(filters.search.toLowerCase())
                           && !c.patient_id?.includes(filters.search)) return false;
      return true;
    }).sort((a, b) => {
      const ord = { URGENT: 0, HIGH: 1, REVIEW: 2, NORMAL: 3 };
      return (ord[a.priority] ?? 4) - (ord[b.priority] ?? 4);
    });
  },
  addCase: (c) => {
    const all = JSON.parse(localStorage.getItem('oncotriage_cases') || '[]');
    all.unshift(c);
    localStorage.setItem('oncotriage_cases', JSON.stringify(all));
    return c;
  },
  updateCase: (id, patch) => {
    const all = JSON.parse(localStorage.getItem('oncotriage_cases') || '[]');
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...patch }; localStorage.setItem('oncotriage_cases', JSON.stringify(all)); }
  },
  deleteCase: (id) => {
    const all = JSON.parse(localStorage.getItem('oncotriage_cases') || '[]');
    localStorage.setItem('oncotriage_cases', JSON.stringify(all.filter(c => c.id !== id)));
  },
  computeStats: (all) => {
    const today = new Date().toISOString().slice(0, 10);
    const byDay = {};
    all.forEach(c => {
      const d = c.created_at?.slice(0,10);
      if (d) byDay[d] = (byDay[d] || 0) + 1;
    });
    return {
      total:    all.length,
      today_n:  all.filter(c => c.created_at?.startsWith(today)).length,
      urgent:   all.filter(c => c.priority === 'URGENT').length,
      high:     all.filter(c => c.priority === 'HIGH').length,
      review:   all.filter(c => c.priority === 'REVIEW').length,
      normal:   all.filter(c => c.priority === 'NORMAL').length,
      pending:  all.filter(c => c.status === 'pending').length,
      reviewed: all.filter(c => c.status === 'reviewed').length,
      avg_unc:  all.length ? all.reduce((s,c) => s + (c.uncertainty||0), 0) / all.length : 0,
      avg_prob: all.length ? all.reduce((s,c) => s + (c.probability||0), 0) / all.length : 0,
      by_day: Object.entries(byDay).sort().slice(-10).map(([day,n]) => ({day,n})),
      by_priority: ['URGENT','HIGH','REVIEW','NORMAL'].map(p => ({
        priority: p, n: all.filter(c => c.priority === p).length
      })).filter(x => x.n > 0),
      urgent_pending: all.filter(c => c.priority === 'URGENT' && c.status === 'pending').length,
    };
  },
};

/* ── Global styles — GOLD/BLACK PREMIUM THEME ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── Core palette ── */
    --nero:       #070A0F;
    --bg:         #070A0F;
    --bg2:        #0D1117;
    --bg3:        #111927;
    --bg4:        #1A2235;
    --surface:    #111927;
    --surface2:   #1A2235;
    --border:     #1F2D42;
    --border2:    #263347;

    /* ── Text ── */
    --text:       #E8EDF5;
    --muted:      #7A8BA3;
    --dim:        #3D5068;
    --pure-white: #FFFFFF;

    /* ── Gold accent — the hero colour ── */
    --gold:       #C9A84C;
    --gold-light: #E6C360;
    --gold-dark:  #9E7C30;
    --gold2:      #F0C860;
    --gold3:      rgba(201,168,76,0.12);
    --gold4:      rgba(201,168,76,0.06);

    /* ── Triage colours ── */
    --urgent:     #EF4444;
    --high:       #F97316;
    --review:     #EAB308;
    --normal:     #22C55E;

    /* ── Accent ── */
    --teal:       #0EA5E9;
    --teal2:      #38BDF8;
    --purple:     #8B5CF6;

    /* ── Typography ── */
    --font:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --mono:  'JetBrains Mono', 'Fira Code', monospace;
    --r:     8px;
  }

  html, body, #root {
    height: 100%;
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--dim); }

  /* ── Titlebar ── */
  .titlebar { height: 38px; background: #050810; display: flex; align-items: center; justify-content: space-between; padding: 0 0 0 1rem; -webkit-app-region: drag; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .titlebar-left { display: flex; align-items: center; gap: 0.6rem; }
  .titlebar-logo { height: 22px; object-fit: contain; }
  .titlebar-title { font-size: 0.7rem; color: var(--gold); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
  .titlebar-controls { display: flex; -webkit-app-region: no-drag; height: 100%; }
  .titlebar-btn { width: 42px; height: 100%; border: none; background: transparent; color: var(--muted); cursor: pointer; font-size: 0.75rem; transition: background 0.1s; }
  .titlebar-btn:hover { background: rgba(255,255,255,0.05); color: var(--text); }
  .titlebar-btn.close:hover { background: var(--urgent); color: #fff; }

  /* ── Shell ── */
  .shell { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  .body  { flex: 1; display: flex; overflow: hidden; }

  /* ── Sidebar — gold accent on active ── */
  .sidebar { width: 220px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
  .sidebar-logo-wrap { padding: 1rem; border-bottom: 1px solid var(--border); }
  .sidebar-logo { width: 100%; max-height: 44px; object-fit: contain; }
  .sidebar-nav { flex: 1; padding: 0.5rem; overflow-y: auto; }
  .nav-section { font-size: 0.63rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.12em; padding: 0.8rem 0.5rem 0.3rem; }
  .nav-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.75rem; border-radius: 7px; cursor: pointer; font-size: 0.84rem; color: var(--muted); transition: all 0.15s; margin-bottom: 2px; border: 1px solid transparent; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: var(--bg3); color: var(--text); border-color: var(--border); }
  .nav-item.active { background: var(--gold3); color: var(--gold); border-color: rgba(201,168,76,0.25); }
  .nav-item.active svg { color: var(--gold); }
  .nav-badge { margin-left: auto; background: var(--urgent); color: #fff; font-size: 0.63rem; padding: 0.1rem 0.4rem; border-radius: 10px; font-family: var(--mono); font-weight: 600; }
  .nav-badge.warn { background: var(--high); }
  .sidebar-user { padding: 0.75rem; border-top: 1px solid var(--border); }
  .user-card { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem; border-radius: 7px; background: var(--bg3); border: 1px solid var(--border); }
  .user-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--gold-dark), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #000; flex-shrink: 0; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 0.8rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 0.68rem; color: var(--gold); text-transform: capitalize; letter-spacing: 0.04em; }

  /* ── Main layout ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { height: 52px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; flex-shrink: 0; }
  .topbar-title { font-size: 1rem; font-weight: 600; color: var(--text); }
  .topbar-actions { display: flex; align-items: center; gap: 0.6rem; }
  .page { flex: 1; overflow-y: auto; padding: 1.5rem; }

  /* ── Cards ── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }
  .card-header { padding: 1rem 1.2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .card-title { font-size: 0.88rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--text); }
  .card-body { padding: 1.2rem; }

  /* ── Stat cards with gold top accent ── */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.2rem; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .stat-card.urgent::before { background: var(--urgent); }
  .stat-card.high::before   { background: var(--high); }
  .stat-card.review::before { background: var(--review); }
  .stat-card.normal::before { background: var(--normal); }
  .stat-card.teal::before   { background: linear-gradient(90deg, var(--gold), var(--gold-light)); }
  .stat-card.purple::before { background: var(--purple); }
  .stat-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem; font-weight: 500; }
  .stat-value { font-size: 1.9rem; font-weight: 700; font-family: var(--mono); line-height: 1; }
  .stat-sub   { font-size: 0.7rem; color: var(--dim); margin-top: 0.3rem; }

  /* ── Buttons ── */
  .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border-radius: 7px; border: none; cursor: pointer; font-family: var(--font); font-size: 0.82rem; font-weight: 500; transition: all 0.15s; text-decoration: none; }
  .btn-primary { background: var(--gold); color: #000; font-weight: 600; }
  .btn-primary:hover { background: var(--gold-light); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--bg3); color: var(--text); border-color: var(--border2); }
  .btn-danger { background: transparent; color: var(--urgent); border: 1px solid transparent; }
  .btn-danger:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); }
  .btn-success { background: rgba(34,197,94,0.12); color: var(--normal); border: 1px solid rgba(34,197,94,0.3); }
  .btn-success:hover { background: rgba(34,197,94,0.2); }
  .btn-teal { background: rgba(14,165,233,0.12); color: var(--teal); border: 1px solid rgba(14,165,233,0.3); }
  .btn-teal:hover { background: rgba(14,165,233,0.2); }
  .btn-sm { padding: 0.28rem 0.6rem; font-size: 0.76rem; border-radius: 5px; }
  .btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Badges ── */
  .badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; font-family: var(--mono); }
  .badge-urgent  { background: rgba(239,68,68,0.15);  color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
  .badge-high    { background: rgba(249,115,22,0.15); color: #FDB77A; border: 1px solid rgba(249,115,22,0.3); }
  .badge-review  { background: rgba(234,179,8,0.15);  color: #FDE047; border: 1px solid rgba(234,179,8,0.3); }
  .badge-normal  { background: rgba(34,197,94,0.15);  color: #86EFAC; border: 1px solid rgba(34,197,94,0.3); }
  .badge-pending  { background: rgba(201,168,76,0.12); color: var(--gold); border: 1px solid rgba(201,168,76,0.3); }
  .badge-reviewed { background: rgba(34,197,94,0.12);  color: var(--normal); border: 1px solid rgba(34,197,94,0.3); }

  /* ── Tables ── */
  .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { padding: 0.65rem 1rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold); background: var(--bg3); border-bottom: 1px solid var(--border); text-align: left; font-weight: 600; white-space: nowrap; }
  .data-table td { padding: 0.7rem 1rem; font-size: 0.84rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr { transition: background 0.1s; cursor: pointer; }
  .data-table tbody tr:hover { background: var(--bg3); }
  .mono { font-family: var(--mono); font-size: 0.8rem; }

  /* ── Forms ── */
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem; font-weight: 500; }
  .form-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); border-radius: 7px; padding: 0.6rem 0.85rem; color: var(--text); font-family: var(--font); font-size: 0.88rem; outline: none; transition: border-color 0.15s; }
  .form-input:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(201,168,76,0.12); }
  .form-input::placeholder { color: var(--dim); }
  textarea.form-input { resize: vertical; min-height: 80px; line-height: 1.6; }
  select.form-input { cursor: pointer; }

  /* ── Modals ── */
  .modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s; }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; max-width: 95vw; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s; box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
  .modal-title { font-size: 1rem; font-weight: 600; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.5rem; }

  /* ── Alert banner ── */
  .alert-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 1rem; border-radius: 8px; font-size: 0.83rem; margin-bottom: 1rem; }
  .alert-urgent { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); color: #FCA5A5; }
  .alert-btn { padding: 0.3rem 0.75rem; border-radius: 6px; border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.15); color: #FCA5A5; font-size: 0.76rem; cursor: pointer; font-family: var(--font); }

  /* ── Progress ── */
  .progress-wrap { background: var(--bg3); border-radius: 20px; height: 6px; overflow: hidden; }
  .progress-bar { height: 100%; border-radius: 20px; transition: width 0.5s ease; }
  .bg-gold { background: linear-gradient(90deg, var(--gold-dark), var(--gold)); }
  .bg-urgent { background: var(--urgent); }
  .bg-normal { background: var(--normal); }

  /* ── Login ── */
  .login-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at 40% 50%, #0F1A2B 0%, var(--bg) 65%); }
  .login-box { width: 380px; }
  .login-logo { width: 200px; margin: 0 auto 1.5rem; display: block; }
  .login-title { font-size: 1.4rem; font-weight: 700; text-align: center; margin-bottom: 0.3rem; color: var(--gold); letter-spacing: 0.02em; }
  .login-sub   { font-size: 0.8rem; color: var(--muted); text-align: center; margin-bottom: 2rem; letter-spacing: 0.04em; }
  .login-card  { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.8rem; box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
  .login-btn   { width: 100%; padding: 0.75rem; border-radius: 8px; border: none; background: var(--gold); color: #000; font-size: 0.9rem; font-weight: 700; cursor: pointer; margin-top: 0.5rem; transition: background 0.15s; letter-spacing: 0.04em; }
  .login-btn:hover { background: var(--gold-light); }
  .login-error { color: var(--urgent); font-size: 0.8rem; text-align: center; margin-top: 0.5rem; }

  /* ── X-ray viewer ── */
  .xray-wrap { background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border); }
  .xray-img  { max-width: 100%; max-height: 100%; object-fit: contain; }

  /* ── Animations ── */
  @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
  @keyframes pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
  @keyframes spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes scanline{ 0% { top: -10% } 100% { top: 110% } }
  .pulse { animation: pulse 2s infinite; }
  .spin  { animation: spin 0.8s linear infinite; }
  .animate-in { animation: slideUp 0.3s ease forwards; }

  /* ── Layout helpers ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  .flex   { display: flex; }
  .flex-1 { flex: 1; }
  .gap-1  { gap: 0.5rem; }
  .gap-2  { gap: 1rem; }
  .mb-1   { margin-bottom: 0.5rem; }
  .mb-2   { margin-bottom: 1rem; }
  .mb-3   { margin-bottom: 1.5rem; }
  .mt-1   { margin-top: 0.5rem; }
  .mt-2   { margin-top: 1rem; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .text-muted { color: var(--muted); }
  .text-gold  { color: var(--gold); }
  .text-urgent { color: var(--urgent); }
  .text-normal { color: var(--normal); }
  .text-sm    { font-size: 0.82rem; }
  .text-xs    { font-size: 0.72rem; }
  .font-mono  { font-family: var(--mono); }
  .w-full     { width: 100%; }
  .text-right { text-align: right; }
  .empty-state { text-align: center; padding: 3rem; color: var(--dim); }
  .empty-icon  { font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.3; }
  .empty-title { font-size: 1rem; color: var(--muted); margin-bottom: 0.3rem; }

  /* ── Recharts override — gold theme ── */
  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical   line { stroke: var(--border) !important; }
  .recharts-text { fill: var(--muted) !important; font-size: 11px !important; }
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: var(--bg3) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    font-size: 12px !important;
  }
`;

/* ── Helpers ── */
export function getPriority(prob, unc, settings) {
  const tU = parseFloat(settings?.threshold_urgent || 0.85);
  const tH = parseFloat(settings?.threshold_high   || 0.60);
  const tR = parseFloat(settings?.threshold_review || 0.15);
  if (unc > tR)     return 'REVIEW';
  if (prob >= tU)   return 'URGENT';
  if (prob >= tH)   return 'HIGH';
  if (prob >= 0.40) return 'REVIEW';
  return 'NORMAL';
}
export function getAILabel(prob, unc) {
  if (unc > 0.18) return 'Revisión manual requerida — alta incertidumbre';
  if (prob >= 0.85) return 'Hallazgo oncológico — alta confianza';
  if (prob >= 0.60) return 'Hallazgo probable — confianza moderada';
  if (prob >= 0.40) return 'Resultado indeterminado — correlación clínica';
  return 'Sin hallazgos significativos';
}
export function fmtPct(v)  { return `${((v||0)*100).toFixed(1)}%`; }
export function fmtDate(s) { return s ? new Date(s).toLocaleString('es-CO') : '—'; }

export function BadgePriority({ p }) {
  const map = { URGENT:['badge-urgent','🔴'], HIGH:['badge-high','🟠'], REVIEW:['badge-review','🟡'], NORMAL:['badge-normal','🟢'] };
  const [cls, dot] = map[p] || ['badge-normal','⚪'];
  return <span className={`badge ${cls}`}>{dot} {p}</span>;
}
export function BadgeStatus({ s }) {
  return <span className={`badge badge-${s}`}>{s==='pending'?'Pendiente':'Revisado'}</span>;
}

/* ── MC Dropout simulation ── */
export function simulateInference(imageBase64, nSamples = 200) {
  return new Promise(resolve => {
    setTimeout(() => {
      let hash = 0;
      const snippet = imageBase64 ? imageBase64.slice(50, 200) : 'default';
      for (let i = 0; i < snippet.length; i++) { hash = ((hash << 5) - hash) + snippet.charCodeAt(i); hash |= 0; }
      const baseMu = (Math.abs(hash) % 1000) / 1000;
      const samples = [];
      for (let i = 0; i < nSamples; i++) {
        const u1 = Math.random(), u2 = Math.random();
        const noise = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
        let s = baseMu + noise * 0.08;
        s = Math.max(0.001, Math.min(0.999, s));
        samples.push(s);
      }
      const probability = samples.reduce((a,b) => a+b, 0) / nSamples;
      const variance    = samples.reduce((a,b) => a+(b-probability)**2, 0) / (nSamples-1);
      resolve({ probability, uncertainty: Math.sqrt(variance), samples, nSamples });
    }, 2000);
  });
}

/* ── Root Component ── */
export default function App() {
  const [view,         setView]         = useState('dashboard');
  const [user,         setUser]         = useState(null);
  const [alertCount,   setAlertCount]   = useState(0);
  const [cases,        setCases]        = useState([]);
  const [stats,        setStats]        = useState({});
  const [settings,     setSettings]     = useState({});
  const [selectedCase, setSelectedCase] = useState(null);

  const isE = typeof window !== 'undefined' && !!window.api;

  const loadCases = async (filters = {}) => {
    if (isE) { const r = await window.api.getCases(filters); if (r.success) setCases(r.data); }
    else setCases(store.getCases(filters));
  };
  const loadStats = async () => {
    if (isE) { const r = await window.api.getStats(); if (r.success) { setStats(r.data); setAlertCount(r.data.urgent||0); } }
    else { const all = store.getCases(); const s = store.computeStats(all); setStats(s); setAlertCount(s.urgent||0); }
  };
  const loadSettings = async () => {
    if (isE) { const r = await window.api.getSettings(); if (r.success) setSettings(r.data); }
  };

  useEffect(() => {
    if (!user) return;
    loadCases(); loadStats(); loadSettings();
    const t = setInterval(loadStats, 30000);
    return () => clearInterval(t);
  }, [user]);

  const openCase = (c) => { setSelectedCase(c); setView('analysis'); };

  if (!user) return <><style>{CSS}</style><Login onLogin={u => setUser(u)} /></>;

  return (
    <AppContext.Provider value={{ user, cases, stats, settings, loadCases, loadStats, loadSettings, openCase, selectedCase, setSelectedCase, store }}>
      <style>{CSS}</style>
      <div className="shell">
        <Titlebar user={user} onLogout={() => setUser(null)} />
        <div className="body">
          <Sidebar view={view} setView={setView} alertCount={alertCount} user={user} />
          <div className="main">
            {view === 'dashboard' && <Dashboard setView={setView} />}
            {view === 'queue'     && <Queue />}
            {view === 'analysis'  && <Analysis />}
            {view === 'history'   && <History />}
            {view === 'analytics' && <Analytics />}
            {view === 'settings'  && <Settings />}
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
