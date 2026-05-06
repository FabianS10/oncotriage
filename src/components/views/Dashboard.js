import React, { useEffect } from 'react';
import { AlertTriangle, Activity, CheckCircle, Upload, ArrowRight } from 'lucide-react';
import { useApp, BadgePriority, fmtDate, fmtPct } from '../../App';

export default function Dashboard({ setView }) {
  const { stats, cases, user, loadCases, loadStats, setSelectedCase } = useApp();

  useEffect(() => { loadCases(); loadStats(); }, []);

  const s = stats || {};
  const urgentCases = (cases || []).filter(c => c.priority === 'URGENT').slice(0, 5);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  };

  return (
    <div className="page animate-in">

      {/* Alert banner */}
      {(s.urgent_pending || s.urgent) > 0 && (
        <div className="alert-banner alert-urgent mb-2">
          <AlertTriangle size={16} className="pulse" />
          <span style={{ flex: 1 }}>
            <strong>ATENCIÓN:</strong> Hay <strong>{s.urgent_pending || s.urgent}</strong> caso(s) críticos pendientes de revisión inmediata.
          </span>
          <button className="alert-btn" onClick={() => setView('queue')}>
            Priorizar Cola <ArrowRight size={12} style={{ display:'inline' }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:'0.2rem' }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.username || 'Doctor'} 👋
          </h2>
          <p className="text-muted text-sm">
            {new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
          <button className="btn btn-primary" onClick={() => { setSelectedCase(null); setView('analysis'); }}>
          <Upload size={14} /> Iniciar Nuevo Análisis
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {[
          { cls:'urgent', label:'🔴 Urgentes',    value: s.urgent   ?? 0, sub:'Casos críticos' },
          { cls:'high',   label:'🟠 Alto Riesgo', value: s.high     ?? 0, sub:'Prioridad 2' },
          { cls:'review', label:'🟡 Revisión',    value: s.review   ?? 0, sub:'Incertidumbre alta' },
          { cls:'normal', label:'🟢 Normales',    value: s.normal   ?? 0, sub:'Sin hallazgos' },
          { cls:'teal',   label:'Hoy',            value: s.today_n  ?? 0, sub:'Procesados' },
          { cls:'purple', label:'Pendientes',     value: s.pending  ?? 0, sub:'Sin validar' },
        ].map(({ cls, label, value, sub }) => (
          <div key={cls} className={`stat-card ${cls}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: cls==='urgent'?'var(--urgent)':cls==='high'?'var(--high)':cls==='review'?'var(--review)':cls==='normal'?'var(--normal)':'var(--gold)' }}>
              {value}
            </div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Model confidence + Clinical validation */}
      <div className="grid-2 mb-3">
        <div className={`card ${(s.avg_unc||0) > 0.15 ? 'border-warning' : ''}`} style={{ borderColor:(s.avg_unc||0)>0.15?'rgba(239,68,68,0.3)':undefined }}>
          <div className="card-header">
            <div className="card-title">
              <Activity size={15} style={{ color:(s.avg_unc||0)>0.15?'var(--urgent)':'var(--gold)' }} />
              Confianza del Modelo
            </div>
            <span className="font-mono text-sm" style={{ color:'var(--gold)' }}>MC Dropout</span>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontFamily:'var(--mono)', fontSize:'2rem', fontWeight:700, color:(s.avg_unc||0)>0.15?'var(--urgent)':'var(--gold)' }}>
                {fmtPct(s.avg_unc||0)}
              </span>
              <span className="text-muted text-xs">Incertidumbre promedio</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width:`${Math.min((s.avg_unc||0)*100*4, 100)}%`, background:(s.avg_unc||0)>0.15?'var(--urgent)':'linear-gradient(90deg,var(--gold-dark),var(--gold))' }} />
            </div>
            <p className="text-muted text-xs mt-1">
              {(s.avg_unc||0) > 0.15
                ? '⚠ Alerta: variabilidad elevada — revisar calibración del modelo'
                : '✓ Sistema operando dentro de parámetros óptimos de confianza'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={15} style={{ color:'var(--normal)' }} />
              Validación Clínica
            </div>
            <span className="font-mono text-sm" style={{ color:'var(--normal)' }}>Tasa revisión</span>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontFamily:'var(--mono)', fontSize:'2rem', fontWeight:700, color:'var(--normal)' }}>
                {s.total ? Math.round((s.reviewed||0)/s.total*100)+'%' : '0%'}
              </span>
              <span className="text-muted text-xs">casos confirmados</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar bg-normal" style={{ width:`${s.total?((s.reviewed||0)/s.total*100):0}%` }} />
            </div>
            <p className="text-muted text-xs mt-1">
              {s.reviewed??0} de {s.total??0} casos validados por especialista
            </p>
          </div>
        </div>
      </div>

      {/* Urgent cases table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={15} style={{ color:'var(--urgent)' }} />
            Casos Críticos Identificados
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('queue')}>
            Ver cola completa →
          </button>
        </div>

        {urgentCases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-title">Sin casos urgentes pendientes</div>
            <p className="text-muted text-sm mt-1">Buen trabajo, Dr. {user?.full_name?.split(' ')[0] || user?.username}</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>ID</th>
                  <th>Prob. Malignidad</th>
                  <th>Incertidumbre</th>
                  <th>Prioridad</th>
                  <th>Fecha</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {urgentCases.map(c => (
                  <tr key={c.id} onClick={() => { setSelectedCase(c); setView('analysis'); }}>
                    <td style={{ fontWeight:600 }}>{c.patient_name}</td>
                    <td className="mono text-muted">{c.patient_id}</td>
                    <td>
                      <span className="mono" style={{ color:'var(--urgent)', fontWeight:700 }}>
                        {fmtPct(c.probability)}
                      </span>
                    </td>
                    <td className="mono text-muted">±{fmtPct(c.uncertainty)}</td>
                    <td><BadgePriority p={c.priority} /></td>
                    <td className="mono text-muted" style={{ fontSize:'0.75rem' }}>{fmtDate(c.created_at)}</td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm">
                        <ArrowRight size={13} style={{ color:'var(--gold)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
