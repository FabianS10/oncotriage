// src/components/views/Login.js
import React, { useState } from 'react';
import { Shield, AlertTriangle, Lock, User, Key } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!username || !password) {
      setError('Ingrese usuario y contraseña');
      setLoading(false);
      return;
    }

    // Simulación de autenticación
    setTimeout(() => {
      if ((username === 'admin' && password === 'Admin123') || 
          (username === 'doctor' && password === 'Doctor123')) {
        onLogin({
          name: username === 'admin' ? 'Administrador' : 'Dr. Smith',
          role: username,
          username: username
        });
      } else {
        setError('Credenciales incorrectas');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nero to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-full mb-4">
            <Lock className="text-nero" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">OncoTriage</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de Triaje Oncológico</p>
        </div>

        <div className="bg-surface bg-opacity-80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Acceso al Sistema</h2>
              <p className="text-gray-400 text-sm">Ingrese sus credenciales</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">
                  <User size={12} className="inline mr-1" /> Usuario
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">
                  <Key size={12} className="inline mr-1" /> Contraseña
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-nero font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-nero border-t-transparent rounded-full animate-spin"></div>
                  Autenticando...
                </div>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                <Shield size={12} className="text-gold-500" />
                <span>Credenciales de demostración</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div><span className="text-gold-500">Admin:</span> admin / Admin123</div>
                <div><span className="text-gold-500">Doctor:</span> doctor / Doctor123</div>
              </div>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 text-gray-500 text-xs">
          Hospital San Rafael de Fusagasugá · v1.0.0
        </div>
      </div>
    </div>
  );
}
