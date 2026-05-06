import React from 'react';
import { Minus, Square, X, Shield } from 'lucide-react';

const isE = typeof window !== 'undefined' && !!window.api;

export default function Titlebar({ user, onLogout }) {
  return (
    <div className="titlebar">
      <div className="titlebar-left">
        {/* Eagle icon inline — no external image dependency */}
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🦅</span>
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.72rem',
            letterSpacing: '.1em', color: 'var(--gold)', lineHeight: 1.1,
          }}>
            EAGLE REAPER
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--dim)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            OncoTriage · F.A.S.C. ML Solutions
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 0.5rem' }} />

        {/* User chip */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: '#000',
            }}>
              {(user.full_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              {user.full_name || user.username}
            </span>
            {user.role === 'admin' && (
              <Shield size={10} style={{ color: 'var(--gold)', opacity: 0.7 }} />
            )}
          </div>
        )}
      </div>

      {/* Right: date + window controls */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--dim)', marginRight: '1rem', fontFamily: 'var(--mono)' }}>
          {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>

        {/* Logout (browser) */}
        {!isE && onLogout && (
          <button
            onClick={onLogout}
            className="titlebar-btn"
            style={{ fontSize: '0.65rem', padding: '0 0.75rem', letterSpacing: '.06em' }}
            title="Cerrar sesión"
          >
            SALIR
          </button>
        )}

        {/* Window controls (Electron) */}
        {isE && (
          <div className="titlebar-controls">
            <button className="titlebar-btn" onClick={() => window.api?.minimize?.()} title="Minimizar">
              <Minus size={11} />
            </button>
            <button className="titlebar-btn" onClick={() => window.api?.maximize?.()} title="Maximizar">
              <Square size={10} />
            </button>
            <button className="titlebar-btn close" onClick={() => window.api?.close?.()} title="Cerrar">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
