import React, { useState, useEffect, useRef } from 'react';
import { Upload, Brain, AlertTriangle, RefreshCw, Eye, EyeOff, FileText, Thermometer } from 'lucide-react';
import { useApp, getPriority, getAILabel, fmtPct } from '../../App';
import buildReportHTML from '../../utils/buildReportHTML';

const isE = typeof window !== 'undefined' && !!window.api;
// ✅ CHANGED: Use your local FastAPI backend instead of Render cloud

const CLOUD_API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TRIAGE_CONFIG = {
  URGENT:    { color:'var(--urgent)',  bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.3)',  label:'URGENTE',    dot:'🔴', action:'Revisión especialista inmediata' },
  HIGH:      { color:'var(--high)',    bg:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.3)', label:'ALTO RIESGO',dot:'🟠', action:'Consulta oncológica prioritaria' },
  REVIEW:    { color:'var(--review)',  bg:'rgba(234,179,8,0.1)',  border:'rgba(234,179,8,0.3)',  label:'REVISIÓN',   dot:'🟡', action:'Revisión radiológica manual' },
  NORMAL:    { color:'var(--normal)',  bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.3)',  label:'NORMAL',     dot:'🟢', action:'Seguimiento de rutina' },
};

/* ── Confidence ring ── */
function ConfRing({ value=0, color='var(--gold)', label, size=110 }) {
  const r = size * 0.38, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  const dash  = circ * Math.min(1, Math.max(0, value));
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={size*0.07} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transform:`rotate(-90deg)`, transformOrigin:`${cx}px ${cy}px`, transition:'stroke-dasharray 0.9s ease' }}
        />
        <text x={cx} y={cy-4} textAnchor="middle" fill={color} fontSize={size*0.15} fontWeight="700" fontFamily="var(--mono)">
          {Math.round(value*100)}%
        </text>
        <text x={cx} y={cy+size*0.12} textAnchor="middle" fill="var(--muted)" fontSize={size*0.09} fontFamily="var(--font)">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ── MC distribution histogram ── */
function MCHistogram({ samples=[] }) {
  if (!samples.length) return null;
  const BINS = 20;
  const counts = new Array(BINS).fill(0);
  samples.forEach(p => { const i = Math.min(BINS-1, Math.floor(p*BINS)); counts[i]++; });
  const maxC = Math.max(...counts, 1);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:64, marginBottom:4 }}>
        {counts.map((c, i) => {
          const x = i / BINS;
          const col = x < 0.4 ? 'var(--normal)' : x < 0.7 ? 'var(--review)' : 'var(--urgent)';
          return (
            <div key={i} style={{ flex:1, background:col, opacity:0.8, borderRadius:'2px 2px 0 0',
              height:`${(c/maxC)*100}%`, minHeight: c ? 2 : 0, transition:'height 0.4s' }} />
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'var(--dim)', fontFamily:'var(--mono)' }}>
        <span>p=0.0</span><span>p=0.5</span><span>p=1.0</span>
      </div>
    </div>
  );
}

/* ── Uncertainty 2×2 matrix ── */
function UncMatrix({ mu, sigma }) {
  const quads = [
    { mu:'Alto', sigma:'Bajo',  desc:'Positivo confiable', color:'var(--urgent)', active: mu>=0.6&&sigma<0.12 },
    { mu:'Alto', sigma:'Alto',  desc:'Escalar urgente',    color:'var(--high)',   active: mu>=0.6&&sigma>=0.12 },
    { mu:'Bajo', sigma:'Alto',  desc:'Ambiguo',            color:'var(--review)', active: mu<0.6&&sigma>=0.12 },
    { mu:'Bajo', sigma:'Bajo',  desc:'Negativo seguro',    color:'var(--normal)', active: mu<0.6&&sigma<0.12 },
  ];
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:3, fontSize:'0.65rem', color:'var(--dim)', marginBottom:4 }}>
        <div/>
        <div style={{ textAlign:'center', fontWeight:600 }}>σ Bajo</div>
        <div style={{ textAlign:'center', fontWeight:600 }}>σ Alto</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:3, alignItems:'center' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--dim)', fontWeight:600, writingMode:'vertical-rl', textAlign:'center', marginRight:4 }}>μ→</div>
        {quads.map((q,i) => (
          <div key={i} style={{
            padding:'0.5rem', borderRadius:6, border:`1.5px solid ${q.active?q.color:'var(--border)'}`,
            background: q.active ? `${q.color}18` : 'var(--bg3)', opacity: q.active ? 1 : 0.4,
            textAlign:'center', transition:'all 0.3s',
          }}>
            <div style={{ fontSize:'0.62rem', color:q.color, fontWeight:700, fontFamily:'var(--mono)' }}>μ {q.mu}</div>
            <div style={{ fontSize:'0.62rem', color:q.color, fontFamily:'var(--mono)' }}>σ {q.sigma}</div>
            <div style={{ fontSize:'0.6rem', color:'var(--muted)', marginTop:2 }}>{q.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Analysis component ── */
export default function Analysis() {
  const fileInputRef = useRef(null);
  const { user, settings, store, loadCases, loadStats, selectedCase, setSelectedCase } = useApp();

  const [phase, setPhase] = useState('upload');
  const [image,        setImage]        = useState(null);
  const [result,       setResult]       = useState(null);
  const [heatmap,      setHeatmap]      = useState(null);
  const [showHeatmap,  setShowHeatmap]  = useState(false);
  const [loadingHmap,  setLoadingHmap]  = useState(false);
  const [error,        setError]        = useState('');
  const [saved,        setSaved]        = useState(false);
  const [savedId,      setSavedId]      = useState(null);
  const [reviewing,    setReviewing]    = useState(false);
  const [notes,        setNotes]        = useState('');
  const [reviewOpt,    setReviewOpt]    = useState('');
  const [patientId,    setPatientId]    = useState('');
  const [patientName,  setPatientName]  = useState('');
  const [age,          setAge]          = useState('');
  const [inferMode,    setInferMode]    = useState('');

  useEffect(() => {
    if (!selectedCase) {
      setPhase('upload'); 
      setImage(null); setResult(null); setHeatmap(null); setShowHeatmap(false);
      setSaved(false); setSavedId(null); setPatientId(''); setPatientName('');
      setAge(''); setNotes(''); setReviewOpt(''); setReviewing(false); setError('');
      return;
    }
    
    setPhase('final'); 
    setPatientId(selectedCase.patient_id || '');
    setPatientName(selectedCase.patient_name || '');
    setAge(selectedCase.age || '');
    setSaved(true);
    setSavedId(selectedCase.id);
    setNotes(selectedCase.doctor_notes || '');
    setReviewOpt(selectedCase.doctor_review || '');
    if (selectedCase.status === 'reviewed') setReviewing(true);
    setResult({
      probability: selectedCase.probability,
      uncertainty: selectedCase.uncertainty,
      priority:    selectedCase.priority,
      label:       selectedCase.ai_label || getAILabel(selectedCase.probability, selectedCase.uncertainty),
      samples:     [],
    });
    if (selectedCase.image_path && isE && window.api?.getImageBase64) {
      window.api.getImageBase64(selectedCase.image_path).then(r => {
        if (r.success) setImage({ base64: r.base64, path: selectedCase.image_path, name: selectedCase.image_name });
        else setImage({ path: selectedCase.image_path, name: selectedCase.image_name, base64: null });
      }).catch(() => {});
    }
  }, [selectedCase]);

    const openFile = async () => {
    // If Electron desktop app
    if (isE && window.api?.openImageDialog) {
      const f = await window.api.openImageDialog();
      if (f) { setImage(f); setResult(null); setHeatmap(null); setShowHeatmap(false); setSaved(false); setSavedId(null); setSelectedCase(null); setError(''); }
    } else {
      // ✅ THIS FORCES THE BROWSER TO OPEN THE PICKER
      document.getElementById('secret-file-input').click();
    }
  };

  // ✅ FIXED: Actually calls your Python FastAPI Backend
  const runInference = async () => {
    if (!image) return;
    setPhase('processing'); setError(''); setInferMode('');
    
    try {
      let probability, uncertainty, samples = [];
      const nSamples = parseInt(settings?.mc_samples || 50);

      if (isE && typeof window.api?.runInference === 'function') {
        try {
          const cleanB64 = image.base64?.includes(',') ? image.base64.split(',')[1] : image.base64;
          const res = await window.api.runInference(cleanB64);
          if (res?.success) {
            probability  = res.prediction.probability;
            uncertainty  = res.prediction.uncertainty;
            samples      = res.prediction.samples || [];
            setInferMode('desktop');
          } else throw new Error(res?.error || 'Desktop API failed');
        } catch (desktopErr) {
          console.warn('Desktop failed, using local backend:', desktopErr.message);
          const res = await fetch(`${CLOUD_API}/predict`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: image.base64, mc_samples: nSamples }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Backend error');
          probability = data.probability; uncertainty = data.uncertainty; samples = []; 
          setInferMode('local');
        }
      } else {
        // ✅ THIS IS THE MAGIC LINE FOR YOUR BROWSER:
        const res = await fetch(`${CLOUD_API}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image_base64: image.base64, 
            mc_samples: nSamples 
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error en el servidor local');
        
        probability = data.probability;
        uncertainty = data.uncertainty;
        samples = []; // Your FastAPI endpoint returns summary, not raw 200 samples
        setInferMode('local');
      }

      const priority = getPriority(probability, uncertainty, settings);
      const label    = getAILabel(probability, uncertainty);
      setResult({ probability, uncertainty, priority, label, samples });
      setPhase('review'); 
      
    } catch (err) {
      setError('Error de análisis: ' + err.message);
      setPhase('upload'); 
    }
  };

  // ✅ FIXED: Use local backend for Heatmap
  const fetchHeatmap = async () => {
    if (!image?.base64) return;
    setLoadingHmap(true);
    try {
      const res = await fetch(`${CLOUD_API}/heatmap`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: image.base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Heatmap error');
      setHeatmap(data.heatmap_base64);
      setShowHeatmap(true);
    } catch (err) {
      setHeatmap('__css_fallback__');
      setShowHeatmap(true);
      setError('Grad-CAM: Backend local no disponible — mostrando aproximación visual');
    } finally {
      setLoadingHmap(false);
    }
  };

  const saveCase = async () => {
    if (!result || !image) return;
    const newCase = {
      id: Date.now(), patient_id: patientId || `ONC-${Date.now()}`,
      patient_name: patientName || 'Paciente Anónimo', age: age || null,
      image_path: image.path || '', image_name: image.name || 'imagen.jpg',
      probability: result.probability, uncertainty: result.uncertainty,
      priority: result.priority, ai_label: result.label, processed_by: user?.username || 'sistema',
      status: 'pending', created_at: new Date().toISOString(),
    };
    if (isE && window.api?.addCase) {
      const r = await window.api.addCase(newCase);
      if (r?.success) { setSaved(true); setSavedId(r.id); } else { setError('Error al guardar: ' + r?.error); return; }
    } else {
      store.addCase(newCase); setSaved(true); setSavedId(newCase.id);
    }
    await new Promise(r => setTimeout(r, 150));
    await loadCases(); await loadStats();
  };

  const submitReview = async () => {
    if (!reviewOpt) return alert('Seleccione un dictamen clínico.');
    const caseId = selectedCase?.id ?? savedId;
    if (!caseId) return alert('Guarde el caso antes de revisar.');
    const patch = { doctor_notes: notes, doctor_review: reviewOpt, reviewed_by: user?.username || 'admin', status: 'reviewed' };
    if (isE && window.api?.reviewCase) {
      await window.api.reviewCase({ id: caseId, ...patch });
    } else {
      store.updateCase(caseId, patch);
    }
    await loadCases(); await loadStats();
    setSelectedCase(null);
  };

  const exportPDF = async () => {
    if (!result) return;
    const html = buildReportHTML({ image, result, patientId, patientName, age, user, settings, heatmap: showHeatmap ? heatmap : null });
    if (isE && window.api?.exportPdf) {
      await window.api.exportPdf(html);
    } else {
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 800); }
    }
  };

  const tc = result ? TRIAGE_CONFIG[result.priority] || TRIAGE_CONFIG.NORMAL : null;

  const ResultsMetrics = () => (
    <>
      <div style={{ background:tc.bg, border:`1px solid ${tc.border}`, borderRadius:10, padding:'1rem', textAlign:'center' }}>
        <div style={{ fontSize:'1.8rem', marginBottom:'0.3rem' }}>{tc.dot}</div>
        <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:'1.1rem', color:tc.color, letterSpacing:'.1em' }}>{tc.label}</div>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:'0.35rem', lineHeight:1.5 }}>{tc.action}</div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-around' }}>
            <ConfRing value={result.probability} color={tc.color} label="Prob." size={105} />
            <ConfRing value={result.uncertainty} color="var(--review)" label="Incert." size={105} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', marginTop:'0.75rem', fontSize:'0.72rem', textAlign:'center' }}>
            {[
              ['Probabilidad μ', fmtPct(result.probability), tc.color],
              ['Incertidumbre σ', `±${fmtPct(result.uncertainty)}`, 'var(--review)'],
              ['Riesgo R', `${(0.7*result.probability+0.3*result.uncertainty).toFixed(3)}`, 'var(--gold)'],
              ['Prioridad', result.priority, tc.color],
            ].map(([k,v,c]) => (
              <div key={k} style={{ background:'var(--bg3)', borderRadius:6, padding:'0.4rem' }}>
                <div style={{ color:'var(--dim)', marginBottom:2 }}>{k}</div>
                <div style={{ fontFamily:'var(--mono)', fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderLeft:`3px solid ${tc.color}`, background:tc.bg, borderRadius:'0 8px 8px 0', padding:'0.75rem 1rem' }}>
        <div style={{ fontSize:'0.68rem', color:'var(--dim)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'0.3rem' }}>Resultado IA</div>
        <div style={{ fontSize:'0.84rem', color:tc.color, fontWeight:600 }}>{result.label}</div>
      </div>

      <div className="card">
        <div className="card-header" style={{ padding:'0.65rem 1rem' }}>
          <div className="card-title" style={{ fontSize:'0.78rem' }}>Matriz de Incertidumbre</div>
        </div>
        <div className="card-body" style={{ padding:'0.75rem' }}>
          <UncMatrix mu={result.probability} sigma={result.uncertainty} />
        </div>
      </div>
    </>
  );

      return (
    <>
      {/* BULLETPROOF HIDDEN FILE PICKER */}
      <input
        id="magic-file-picker"
        type="file"
        accept="image/*"
        style={{ position: 'absolute', left: '-9999px' }}
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            setImage({ base64: ev.target.result, name: file.name, path: file.name });
            setResult(null); setHeatmap(null); setShowHeatmap(false);
            setSaved(false); setSavedId(null); setSelectedCase(null); setError('');
          };
          reader.readAsDataURL(file);
        }}
      />

      <div className="page animate-in" style={{ paddingBottom:'2rem' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'0.2rem' }}>Análisis Oncológico</h2>
            <p className="text-muted text-sm">ResNet-50 + Monte Carlo Dropout — Detección de malignidad</p>
          </div>
          <div className="flex gap-1">
            {(selectedCase || saved) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCase(null)}>
                + Nuevo análisis
              </button>
            )}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem', alignItems:'start' }}>
          
          {/* ── LEFT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Brain size={15} style={{ color:'var(--gold)' }} /> Imagen Médica</div>
                <div className="flex gap-1">
                  {result && (
                    <button className={`btn btn-sm ${loadingHmap ? 'btn-ghost' : showHeatmap ? 'btn-teal' : 'btn-ghost'}`}
                      onClick={async () => { if (!heatmap) { await fetchHeatmap(); } else setShowHeatmap(v => !v); }}
                      disabled={loadingHmap}>
                      {loadingHmap ? 'Calculando...' : showHeatmap ? 'Ocultar Heatmap' : 'Grad-CAM'}
                    </button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => document.getElementById('magic-file-picker').click()}>
                    <Upload size={12} /> {image ? 'Cambiar' : 'Cargar'}
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ padding:'0.75rem' }}>
                <div 
                  className="xray-wrap" 
                  style={{ height:360, position:'relative', border: !image ? '2px dashed var(--border)' : 'none', borderRadius: 6 }} 
                  onClick={!image ? () => document.getElementById('magic-file-picker').click() : undefined}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setImage({ base64: ev.target.result, name: file.name, path: file.name });
                        setResult(null); setHeatmap(null); setShowHeatmap(false); setSaved(false); setSavedId(null); setSelectedCase(null); setError('');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  {image?.base64 ? (
                    <img src={showHeatmap && heatmap && heatmap !== '__css_fallback__' ? heatmap : image.base64} alt="Scan" className="xray-img" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
                  ) : (
                    <div style={{ color:'var(--dim)', textAlign:'center', cursor:'pointer', padding:'2rem' }}>
                      <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem', opacity:0.3 }}>🩻</div>
                      <div style={{ fontSize:'0.9rem' }}>Haga clic o arrastre una imagen aquí</div>
                      <div style={{ fontSize:'0.75rem', marginTop:4, opacity:0.6 }}>PNG · JPG · JPEG</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Datos del Paciente</div></div>
              <div className="card-body">
                <div className="grid-3">
                  {[
                    { label:'ID Paciente', val:patientId, set:setPatientId, ph:'ONC-2026-001' },
                    { label:'Nombre', val:patientName, set:setPatientName, ph:'Nombre paciente' },
                    { label:'Edad', val:age, set:setAge, ph:'45', type:'number' },
                  ].map(f => (
                    <div className="form-group" key={f.label} style={{ margin:0 }}>
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" value={f.val} type={f.type||'text'} onChange={e=>f.set(e.target.value)} placeholder={f.ph} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {!reviewing ? (
              <>
                {/* 1. UPLOAD STATE: Show the Yellow Button */}
                {phase === 'upload' && !image && (
                  <>
                    <div style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--dim)', marginBottom:'0.5rem' }}>
                      🦅 Motor local Eagle Reaper (FastAPI)
                    </div>
                    <button 
                      style={{ 
                        width:'100%', padding:'0.85rem', fontSize:'0.95rem', 
                        background: '#eab308', color: '#000', fontWeight: 700,
                        border: 'none', borderRadius: '8px', cursor: 'pointer'
                      }} 
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('magic-file-picker').click();
                      }}
                    >
                      CARGAR & PROCESAR
                    </button>
                  </>
                )}

                {/* 2. UPLOAD STATE: Image selected, show Execute Button */}
                {phase === 'upload' && image && (
                  <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.75rem', fontSize:'0.9rem' }}
                    onClick={runInference}>
                    <Brain size={16} /> Ejecutar Análisis IA
                  </button>
                )}

                {/* 3. PROCESSING STATE */}
                {phase === 'processing' && (
                  <div className="card" style={{ textAlign:'center', padding:'1.5rem' }}>
                    <Brain size={32} style={{ color:'var(--gold)', margin:'0 auto 0.75rem' }} className="pulse" />
                    <div style={{ fontSize:'0.88rem', marginBottom:4 }}>Analizando imagen…</div>
                    <div className="text-muted text-xs font-mono">RUNNING EFFICIENTNET-B4 KERNELS...</div>
                    <div className="text-muted text-xs font-mono">Cuantificando Incertidumbre Bayesiana...</div>
                  </div>
                )}

                {/* 4. REVIEW STATE */}
                {phase === 'review' && result && (
                  <>
                    <ResultsMetrics />
                    <div style={{ background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:8, padding:'0.7rem', fontSize:'0.8rem', color:'#FDE68A' }}>
                      ⚠️ Verifique los resultados antes de registrar.
                    </div>
                    <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
                      onClick={() => setPhase('final')}>
                      ✅ Confirmar y Registrar
                    </button>
                    <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }}
                      onClick={() => { setPhase('upload'); setResult(null); }}>
                      Descartar
                    </button>
                  </>
                )}

                {/* 5. FINAL STATE */}
                {phase === 'final' && result && (
                  <>
                    <ResultsMetrics />
                    <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
                      onClick={saveCase} disabled={saved}>
                      {saved ? '✓ Guardado' : '💾 Guardar en sistema'}
                    </button>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                      <button className="btn btn-ghost" style={{ justifyContent:'center' }} onClick={exportPDF} disabled={!saved}>
                        <FileText size={13} /> PDF
                      </button>
                      <button className="btn btn-teal" style={{ justifyContent:'center' }} onClick={() => setReviewing(true)} disabled={!saved}>
                        Dictamen
                      </button>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'0.7rem', fontSize:'0.8rem', color:'#FCA5A5' }}>
                    ⚠️ {error}
                  </div>
                )}
              </>
            ) : (
              <div className="card">
                <div className="card-header"><div className="card-title">✍️ Dictamen Médico</div></div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Decisión clínica</label>
                    <select className="form-input" value={reviewOpt} onChange={e=>setReviewOpt(e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      <option value="confirm">✅ Confirmar IA</option>
                      <option value="override_normal">🟢 Reclasificar Normal</option>
                      <option value="override_malign">🔴 Reclasificar Maligno</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Observaciones</label>
                    <textarea className="form-input" rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas..." />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                    <button className="btn btn-ghost" style={{ justifyContent:'center' }} onClick={() => setReviewing(false)}>Atrás</button>
                    <button className="btn btn-primary" style={{ justifyContent:'center' }} onClick={submitReview}>Finalizar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}