import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useApp, BadgePriority, BadgeStatus, fmtDate, fmtPct } from '../../App';

export default function Queue() {
  const { cases, loadCases, loadStats, openCase } = useApp();

  useEffect(() => { loadCases(); loadStats(); }, []);

  const [search,   setSearch]   = useState('');
  const [priority, setPriority] = useState('all');
  const [status,   setStatus]   = useState('all');

  const filtered = cases.filter(c => {
    const matchQ = !search ||
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patient_id?.includes(search);
    const matchP = priority === 'all' || c.priority === priority;
    const matchS = status   === 'all' || c.status   === status;
    return matchQ && matchP && matchS;
  });

  const priorityOrder = { URGENT: 0, HIGH: 1, REVIEW: 2, NORMAL: 3 };
  const sorted = [...filtered].sort((a, b) =>
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );

  return (
    <div className="page animate-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            Cola de Triaje
          </h2>
          <p className="text-muted text-sm">
            {sorted.length} caso{sorted.length !== 1 ? 's' : ''} · Ordenados por prioridad clínica
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { loadCases(); loadStats(); }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body" style={{ padding: '0.75rem 1rem' }}>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2rem', height: '2rem', fontSize: '0.82rem' }}
                placeholder="Buscar paciente o ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Priority filter */}
            {['all','URGENT','HIGH','REVIEW','NORMAL'].map(p => (
              <button
                key={p}
                className={`btn btn-sm ${priority === p ? 'btn-primary' : 'btn-ghost'}`}
                style={ priority === p ? { background: 'var(--gold)', color: '#000' } : {} }
                onClick={() => setPriority(p)}
              >
                {p === 'all' ? 'Todos' : p}
              </button>
            ))}

            {/* Status filter */}
            <select
              className="form-input"
              style={{ width: 130, height: '2rem', fontSize: '0.82rem', padding: '0 0.5rem' }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">Todo estado</option>
              <option value="pending">Pendiente</option>
              <option value="reviewed">Revisado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">
              {cases.length === 0 ? 'Sin casos — inicie un análisis para comenzar' : 'Sin resultados para este filtro'}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Prioridad</th>
                <th>ID Paciente</th>
                <th>Nombre</th>
                <th>Probabilidad μ</th>
                <th>Incertidumbre σ</th>
                <th>Risk R</th>
                <th>Imagen</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const R = (0.7 * (c.probability||0) + 0.3 * (c.uncertainty||0)).toFixed(3);
                return (
                  <tr key={c.id} onClick={() => openCase(c)}>
                    <td><BadgePriority p={c.priority} /></td>
                    <td className="mono text-muted">{c.patient_id}</td>
                    <td style={{ fontWeight: 500 }}>{c.patient_name}</td>
                    <td>
                      <span className="mono" style={{ color: c.probability >= 0.6 ? 'var(--urgent)' : c.probability >= 0.4 ? 'var(--review)' : 'var(--normal)', fontWeight: 700 }}>
                        {fmtPct(c.probability)}
                      </span>
                    </td>
                    <td className="mono" style={{ color: 'var(--review)' }}>
                      ±{fmtPct(c.uncertainty)}
                    </td>
                    <td className="mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>{R}</td>
                    <td className="text-muted text-sm" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.image_name || '—'}
                    </td>
                    <td><BadgeStatus s={c.status} /></td>
                    <td className="mono text-muted" style={{ fontSize: '0.72rem' }}>
                      {fmtDate(c.created_at)}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-primary" onClick={() => openCase(c)}
                        style={{ background: 'var(--gold)', color: '#000', fontSize: '0.72rem' }}>
                        Ver análisis
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
