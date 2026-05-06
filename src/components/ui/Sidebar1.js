import React from 'react';
import {
  LayoutDashboard, ListOrdered, Microscope,
  ClipboardList, BarChart2, Settings, Shield
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Principal',   icon: LayoutDashboard },
  { id: 'queue',     label: 'Cola Triaje', icon: ListOrdered      },
  { id: 'analysis',  label: 'Análisis',    icon: Microscope       },
  { id: 'history',   label: 'Registros',   icon: ClipboardList    },
  { id: 'analytics', label: 'Analytics',   icon: BarChart2        },
  { id: 'settings',  label: 'Sistema',     icon: Settings         },
];

export default function Sidebar({ view, setView, alertCount, user }) {
  const urgentCount = alertCount || 0;

  return (
    <div className="sidebar">
      {/* Top padding / logo area */}
      <div style={{ padding: '0.75rem 0.75rem 0.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 0.75rem',
          background: 'rgba(201,168,76,0.06)',
          borderRadius: 8,
          border: '1px solid rgba(201,168,76,0.15)',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🦅</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '.08em', lineHeight: 1.1 }}>
              ONCOTRIAGE
            </div>
            <div style={{ fontSize: '0.58rem', color: 'var(--dim)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Eagle Reaper
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section">Navegación</div>

        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
          const showBadge = id === 'queue' && urgentCount > 0;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setView(id)}
            >
              <Icon
                size={15}
                style={{ color: isActive ? 'var(--gold)' : 'var(--dim)', flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{label}</span>
              {showBadge && (
                <span className="nav-badge">{urgentCount}</span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0.75rem 0.25rem' }} />

        {/* System info */}
        <div style={{
          padding: '0.6rem 0.75rem',
          background: 'var(--bg3)',
          borderRadius: 7,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '0.4rem' }}>
            Modelo activo
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>
            ResNet-50
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 1 }}>
            MC Dropout · GPU/CPU
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--normal)', boxShadow: '0 0 6px var(--normal)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: 'var(--normal)' }}>ONLINE</span>
          </div>
        </div>
      </nav>

      {/* User card */}
      {user && (
        <div className="sidebar-user">
          <div className="user-card">
            <div className="user-avatar">
              {(user.full_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.full_name || user.username}</div>
              <div className="user-role">
                {user.role === 'admin' ? '👑 ' : ''}{user.role}
              </div>
            </div>
            {user.role === 'admin' && (
              <Shield size={12} style={{ color: 'var(--gold)', opacity: 0.7, flexShrink: 0 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
