// src/components/views/Settings.js
import React, { useState } from 'react';
import { Save, Plus, Trash2, Shield } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({
    threshold_urgent: '0.85',
    threshold_high: '0.60',
    threshold_review: '0.15',
    mc_samples: '200'
  });

  const [users] = useState([
    {id: 1, username: 'admin', full_name: 'Administrador', role: 'admin'},
    {id: 2, username: 'doctor', full_name: 'Dr. Smith', role: 'doctor'}
  ]);

  const saveSettings = () => {
    console.log('Configuración guardada');
  };

  const addUser = () => {
    console.log('Usuario agregado');
  };

  const deleteUser = (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    console.log('Usuario eliminado', id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
        <p className="text-gray-500">Solo administradores pueden modificar estos parámetros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-surface border border-gray-700 rounded-xl mb-4">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-medium">Umbrales de Triaje</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-500 text-xs mb-1">🔴 Umbral URGENTE (probabilidad ≥)</label>
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1"
                  value={form.threshold_urgent}
                  onChange={e => setForm({...form, threshold_urgent: e.target.value})}
                />
                <p className="text-gray-500 text-xs mt-1">Por encima de este valor → Urgente</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1">🟠 Umbral ALTO (probabilidad ≥)</label>
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1"
                  value={form.threshold_high}
                  onChange={e => setForm({...form, threshold_high: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1">🟡 Umbral REVISIÓN (incertidumbre ≥)</label>
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1"
                  value={form.threshold_review}
                  onChange={e => setForm({...form, threshold_review: e.target.value})}
                />
                <p className="text-gray-500 text-xs mt-1">Incertidumbre por encima → Revisión manual</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-gray-700 rounded-xl">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-medium">Configuración del Modelo</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-500 text-xs mb-1">Muestras Monte Carlo Dropout</label>
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  type="number" 
                  min="50" 
                  max="500"
                  value={form.mc_samples}
                  onChange={e => setForm({...form, mc_samples: e.target.value})}
                />
                <p className="text-gray-500 text-xs mt-1">Recomendado: 200. Más muestras = mayor precisión</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-1">URL del modelo API (FastAPI)</label>
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="http://localhost:8000/predict"
                  value={form.model_api_url || ''}
                  onChange={e => setForm({...form, model_api_url: e.target.value})}
                />
                <p className="text-gray-500 text-xs mt-1">Dejar vacío para usar simulación local</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-gray-700 rounded-xl mt-4">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-medium">Hospital</h2>
            </div>
            <div className="p-4">
              <label className="block text-gray-500 text-xs mb-1">Nombre del hospital</label>
              <input 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                value={form.hospital_name || ''}
                onChange={e => setForm({...form, hospital_name: e.target.value})}
              />
            </div>
          </div>

          <button 
            className="w-full btn bg-gold-500 text-nero py-3 rounded-lg mt-4"
            onClick={saveSettings}
          >
            <Save size={14} className="mr-2" /> Guardar configuración
          </button>
        </div>

        <div className="bg-surface border border-gray-700 rounded-xl">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-gold-500" />
              <span className="font-medium">Gestión de Usuarios</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Rol</th>
                  <th className="text-right p-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">{u.username}</td>
                    <td className="p-2">{u.full_name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.role === 'admin' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {u.id !== 1 && (
                        <button 
                          className="p-1 text-gray-500 hover:text-red-400"
                          onClick={() => deleteUser(u.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-500 text-xs mb-2">Agregar nuevo usuario</p>
              <div className="space-y-3">
                <input 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="Nombre completo"
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    placeholder="Usuario"
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                  />
                  <input 
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    type="password"
                    placeholder="Contraseña"
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <select 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrador</option>
                </select>
                <button 
                  className="w-full btn bg-gold-500 text-nero py-2 rounded-lg"
                  onClick={addUser}
                >
                  <Plus size={14} className="mr-2" /> Agregar usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
