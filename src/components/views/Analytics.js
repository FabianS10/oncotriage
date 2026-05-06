import React, { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { useApp, fmtPct } from '../../App';

const PRIORITY_COLORS = {
  URGENT: '#EF4444',
  HIGH:   '#F97316',
  REVIEW: '#EAB308',
  NORMAL: '#22C55E',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:7, padding:'0.5rem 0.85rem', fontSize:12 }}>
      <div style={{ color:'var(--muted)', marginBottom:2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:'var(--gold)', fontFamily:'var(--mono)', fontWeight:700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { stats, cases, loadCases, loadStats } = useApp();
  useEffect(() => { loadCases(); loadStats(); }, []);

  const s = stats || {};

  // Build uncertainty distribution from real cases
  const uncBuckets = [0, 0, 0, 0, 0];
  (cases||[]).forEach(c => {
    const i = Math.min(4, Math.floor((c.uncertainty||0) / 0.05 * 5));
    uncBuckets[i]++;
  });
  const uncData = ['0–5%','5–10%','10–15%','15–20%','20%+'].map((l,i) => ({ label:l, n:uncBuckets[i] }));

  // True/false positives from reviewed cases
  const tp = (cases||[]).filter(c => c.probability >= 0.6 && c.doctor_review === 'confirm').length;
  const fp = (cases||[]).filter(c => c.probability >= 0.6 && c.doctor_review === 'override_normal').length;

  const pieData = (s.by_priority||[]).map(r => ({ name:r.priority, value:r.n }));
  const dayData = (s.by_day||[]).slice(-10).map(r => ({ day:r.day?.slice(5), n:r.n }));

  return (
    <div className="page animate-in">
      <div className="mb-3">
        <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'0.2rem' }}>Analytics e Insights</h2>
        <p className="text-muted text-sm">Métricas del sistema y rendimiento del modelo OncoTriage</p>
      </div>

      {/* KPI row */}
      <div className="stat-grid mb-3">
        <div className="stat-card teal">
          <div className="stat-label">Total analizados</div>
          <div className="stat-value" style={{ color:'var(--gold)' }}>{s.total??0}</div>
          <div className="stat-sub">imágenes procesadas</div>
        </div>
        <div className="stat-card normal">
          <div className="stat-label">Tasa revisión</div>
          <div className="stat-value" style={{ color:'var(--normal)', fontSize:'1.5rem' }}>
            {s.total ? Math.round((s.reviewed||0)/s.total*100)+'%' : '—'}
          </div>
          <div className="stat-sub">{s.reviewed??0} de {s.total??0}</div>
        </div>
        <div className="stat-card review">
          <div className="stat-label">Incertidumbre prom.</div>
          <div className="stat-value" style={{ color:'var(--review)', fontSize:'1.5rem' }}>
            {s.avg_unc != null ? fmtPct(s.avg_unc) : '—'}
          </div>
          <div className="stat-sub">promedio del modelo</div>
        </div>
        <div className="stat-card urgent">
          <div className="stat-label">Urgentes detectados</div>
          <div className="stat-value" style={{ color:'var(--urgent)' }}>{s.urgent??0}</div>
          <div className="stat-sub">casos críticos</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Confirmados (TP)</div>
          <div className="stat-value" style={{ color:'var(--purple)' }}>{tp}</div>
          <div className="stat-sub">por médico validado</div>
        </div>
        <div className="stat-card high">
          <div className="stat-label">Falsos positivos</div>
          <div className="stat-value" style={{ color:'var(--high)' }}>{fp}</div>
          <div className="stat-sub">reclasificados normal</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-3">
        {/* Cases by day */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Casos por día</div>
            <span className="text-muted text-xs">últimos 10 días</span>
          </div>
          <div className="card-body">
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dayData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="n" name="Casos" radius={[4,4,0,0]}
                    fill="url(#goldGrad)"
                  >
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" />
                        <stop offset="100%" stopColor="var(--gold-dark)" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding:'2rem' }}>
                <div className="empty-icon">📊</div>
                <div className="empty-title">Sin datos aún</div>
              </div>
            )}
          </div>
        </div>

        {/* Priority pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Distribución por prioridad</div>
          </div>
          <div className="card-body" style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
            {pieData.length > 0 ? (
              <>
                <PieChart width={130} height={130}>
                  <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={58}
                    dataKey="value" paddingAngle={3} stroke="none">
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div style={{ flex:1 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', fontSize:'0.8rem' }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:PRIORITY_COLORS[d.name]||'#888', flexShrink:0 }} />
                      <span className="text-muted" style={{ flex:1 }}>{d.name}</span>
                      <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:PRIORITY_COLORS[d.name] }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding:'2rem', width:'100%' }}>
                <div className="empty-icon">🥧</div>
                <div className="empty-title">Sin datos aún</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uncertainty distribution */}
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">Distribución de incertidumbre epistémica (MC Dropout)</div>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={uncData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="n" name="Casos" radius={[4,4,0,0]}>
                {uncData.map((_,i) => (
                  <Cell key={i} fill={i < 2 ? 'var(--normal)' : i < 3 ? 'var(--review)' : 'var(--urgent)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-muted text-xs mt-2" style={{ textAlign: 'center' }}>
            {/* Ensure the text is a string literal or properly wrapped */}
            Distribución concentrada en valores bajos (0–10%) indica alta confianza.
            {" "}Valores {">"} 15% activan revisión manual.
          </p>
        </div>
      </div>

      {/* Throughput model card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Modelo de Throughput — dΩ̃/dt + γΩ̃(t) = T̂[fθ] / μ₀</div>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {[
              { label:'Ω̃ (Throughput norm.)',  value: s.total ? Math.min(1, (s.total / 100)).toFixed(3) : '—',   color:'var(--gold)' },
              { label:'γ (Fricción sistema)',   value:'0.050',                                                       color:'var(--review)' },
              { label:'T̂ (Eficiencia modelo)', value: s.avg_unc ? (1/Math.max(s.avg_unc,0.01)).toFixed(2) : '—',  color:'var(--teal)' },
            ].map(m => (
              <div key={m.label} style={{ textAlign:'center', padding:'0.75rem', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.65rem', color:'var(--dim)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'0.4rem' }}>{m.label}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'1.3rem', fontWeight:700, color:m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <p className="text-muted text-xs mt-2" style={{ textAlign:'center' }}>
            El modelo cuantifica cómo la incertidumbre epistémica afecta el throughput diagnóstico real del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
