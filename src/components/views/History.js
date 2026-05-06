// src/components/views/History.js
import React, { useState } from 'react';
import { Search, Trash2, FileText } from 'lucide-react';

export default function History() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Datos de ejemplo
  const cases = [
    {id: 1, patient: 'Juan Pérez', patientId: 'PAC-001', age: 45, prob: 0.92, unc: 0.08, priority: 'URGENT', status: 'reviewed', reviewedBy: 'Dr. Smith', date: '2024-01-15 10:30'},
    {id: 2, patient: 'María Gómez', patientId: 'PAC-002', age: 67, prob: 0.78, unc: 0.15, priority: 'HIGH', status: 'pending', reviewedBy: '', date: '2024-01-15 09:15'}
  ];

  const filtered = cases.filter(c => {
    const matchQ = !search || 
      c.patient.toLowerCase().includes(search.toLowerCase()) || 
      c.patientId.includes(search);
    return matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial de Casos</h1>
        <div className="text-gray-500 text-sm">{filtered.length} registros</div>
      </div>

      <div className="bg-surface border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="Buscar paciente o ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <input 
            type="date"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <select 
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Alto</option>
            <option value="REVIEW">Revisión</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Paciente</th>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Edad</th>
              <th className="text-left p-4">Probabilidad</th>
              <th className="text-left p-4">Incertidumbre</th>
              <th className="text-left p-4">Prioridad</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Revisado por</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-700">
                <td className="p-4 text-gray-500">{i + 1}</td>
                <td className="p-4 font-medium">{c.patient}</td>
                <td className="p-4 text-gray-500">{c.patientId}</td>
                <td className="p-4 text-gray-500">{c.age}</td>
                <td className="p-4">
                  <span className="font-mono text-gold-500">
                    {(c.prob * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="p-4 text-gray-500">±{(c.unc * 100).toFixed(1)}%</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    c.priority === 'URGENT' ? 'bg-red-900 text-red-400' :
                    c.priority === 'HIGH' ? 'bg-orange-900 text-orange-400' :
                    c.priority === 'REVIEW' ? 'bg-yellow-900 text-yellow-400' :
                    'bg-green-900 text-green-400'
                  }`}>
                    {c.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    c.status === 'pending' ? 'bg-purple-900 text-purple-400' : 'bg-blue-900 text-blue-400'
                  }`}>
                    {c.status === 'pending' ? 'Pendiente' : 'Revisado'}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{c.reviewedBy || '—'}</td>
                <td className="p-4 text-gray-500 text-xs">{c.date}</td>
                <td className="p-4 text-right">
                  <button className="p-1 text-gray-500 hover:text-white">
                    <FileText size={14} />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
