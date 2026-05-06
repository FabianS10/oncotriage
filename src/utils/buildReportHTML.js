/**
 * buildReportHTML.js
 * Reaper Eagle — OncoTriage Diagnostic Report
 * F.A.S.C. Machine Learning Solutions S.A.S.
 */
export default function buildReportHTML({ image, result, patientId, patientName, age, user, settings, heatmap }) {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
  const fileTS  = now.toISOString().slice(0,10).replace(/-/g,'');

  const prob     = result?.probability ?? 0;
  const unc      = result?.uncertainty ?? 0;
  const priority = result?.priority    ?? 'NORMAL';
  const label    = result?.label       ?? '—';
  const riskR    = (0.7 * prob + 0.3 * unc).toFixed(4);

  const TIER = {
    URGENT: { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', dot:'🔴', es:'URGENTE',    band:'5 — Alto Riesgo',     barBg:'#FED7D7' },
    HIGH:   { color:'#EA580C', bg:'#FFF7ED', border:'#FED7AA', dot:'🟠', es:'ALTO RIESGO',band:'4 — Riesgo Elevado', barBg:'#FEF3C7' },
    REVIEW: { color:'#CA8A04', bg:'#FEFCE8', border:'#FDE68A', dot:'🟡', es:'REVISIÓN',   band:'3 — Indeterminado',   barBg:'#FEF9C3' },
    NORMAL: { color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0', dot:'🟢', es:'NORMAL',     band:'1 — Sin Hallazgos',    barBg:'#DCFCE7' },
  };
  const tc = TIER[priority] || TIER.NORMAL;

  // ── Transparent eagle logo (white-print-friendly SVG) ──
  const logoDataUri = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 68'%3E%3Cpath d='M40 8C40 8 39.8 8 39.8C8 39.8 4 34 4 28c0-3.5.5-6.8 1.5-9.8 2.2-5.3 5.3-9 9.8-9h56c-3.7 0-6.8 3.7-9 7.5-1.5 3-3.5 5-5.8 9.8-9 28c0 6 3.5 11.8 7.8 15.8 3.2 2.8 6.3 5.3 9.8 9.8z' fill='none' stroke='%2392400' stroke-width='0.5'/%3E%3Cpath d='M4 28L20 16l-2 3-1.5-2.5L28 36H4z' fill='%2392400' opacity='0.85'/%3E%3Cpath d='M76 28L60 16l2 3 1.5-2.5L52 36h24z' fill='%2392400' opacity='0.85'/%3E%3Cpath d='M28 36l12-20 12 20h8l-8-20z' fill='%2392400' opacity='0.7'/%3E%3Cpath d='M52 36l-12-20-12 20h-8l8-20z' fill='%2392400' opacity='0.7'/%3E%3Cpath d='M20 16L4 28' stroke='%2392400' stroke-width='1.2' fill='none'/%3E%3Cpath d='M60 16l16 12' stroke='%2392400' stroke-width='1' fill='none'/%3E%3Ccircle cx='40' cy='12' r='2.5' fill='none' stroke='%2392400' stroke-width='0.8'/%3E%3Cpath d='M37 12h6M40 9v6M40 21v6' stroke='%2392400' stroke-width='0.7' fill='none'/%3E%3Cpath d='M24 28h32' stroke='%2392400' stroke-width='0.3' opacity='0.4'/%3E%3Cpath d='M20 12h40' stroke='%2392400' stroke-width='0.3' opacity='0.3'/%3E%3C/svg%3E`;

  // ── Narrative computation ──────────────────────────────────────
  const probPct = Math.round(prob * 100);
  const uncPct  = Math.round(unc  * 100);

  const confLevel =
    unc < 0.08 ? 'muy alta' :
    unc < 0.12 ? 'alta' :
    unc < 0.18 ? 'moderada' : 'baja';

  const findingDesc =
    prob >= 0.85 ? 'hallazgos altamente sugestivos de malignidad' :
    prob >= 0.70 ? 'hallazgos probablemente malignos que requieren correlación clínica' :
    prob >= 0.50 ? 'hallazgos indeterminados con características sospechosas' :
    prob >= 0.30 ? 'hallazgos inespecíficos de bajo potencial maligno' :
    'ausencia de hallazgos sugestivos de malignidad';

  const regionDesc =
    prob >= 0.60 ? 'La activación de Grad-CAM localiza la región de mayor atención del modelo en el área de interés clínico, con un patrón de activación compatible con proceso patológico.' :
    prob >= 0.40 ? 'El mapa de calor muestra activación distribuida sin focalización clara, consistente con el resultado indeterminado del análisis.' :
    'No se observa activación focal significativa, lo que es consistente con la ausencia de hallazgos patológicos.';

  const uncertaintyInterp =
    unc < 0.08  ? `La incertidumbre epistémica es excepcionalmente baja (σ=${uncPct}%), lo que indica que el modelo tiene alta consistencia en sus predicciones a través de las muestras. Este resultado puede considerarse confiable.` :
    unc < 0.12  ? `La incertidumbre epistémica es aceptable (σ=${uncPct}%), dentro del rango operativo óptimo del sistema. Se recomienda correlación clínica estándar.` :
    unc < 0.18  ? `La incertidumbre epistémica es moderada (σ=${uncPct}%), lo que sugiere variabilidad en las predicciones del modelo. Se recomienda revisión radiológica manual antes de tomar decisiones clínicas.` :
    `La incertidumbre epistémica es elevada (σ=${uncPct}%), indicando que el modelo presenta alta variabilidad entre sus muestras de inferencia. Este resultado DEBE ser validado por un especialista calificado antes de cualquier acción clínica.`;

  const clinicalRec =
    priority === 'URGENT' ? 'Se recomienda INTERCONSULTA URGENTE con oncología. El caso debe ser revisado dentro de las próximas 24 horas. Considerar estudios complementarios de imagen (TAC/PET) y toma de muestra histológica según criterio clínico.' :
    priority === 'HIGH'   ? 'Se recomienda programar consulta con oncología en los próximos 7 días. Completar historia clínica y considerar estudios de extensión según localización del hallazgo.' :
    priority === 'REVIEW' ? 'Se recomienda revisión por radiólogo experto. Considerar repetir el estudio con técnica optimizada o solicitar segunda opinión especializada antes de concluir.' :
    'No se requiere acción inmediata. Continuar con seguimiento rutinario según protocolo institucional. Repetir estudio en el período establecido por la guía de práctica clínica correspondiente.';

  // ── Active row backgrounds ──
  const rowBg = (tier) => tier && priority === tier
    ? `style="background:${TIER[tier].bg};color:#1A202C"`
    : '';

  // ── Image ─────────────────────────────────────────────────
  const imageSrc  = heatmap && heatmap !== '__css_fallback__' ? heatmap : image?.base64;
  const imageHtml = imageSrc
    ? `<img src="${imageSrc}" alt="Imagen analizada" style="max-width:460px;width:100%;max-height:340px;object-fit:contain;border-radius:6px;display:block;margin:0 auto;border:1px solid #D1D5DB"/>`
    : `<div style="padding:40px;text-align:center;background:#F8FAFC;border:1px dashed #D1D5DB;border-radius:6px;color:#9CA3AF">Imagen no disponible</div>`;

  const heatmapNote = heatmap
    ? (heatmap === '__css_fallback__'
        ? '<div style="text-align:center;font-size:10px;color:#6B7280;margin-top:6px">⚠ Aproximación visual — Grad-CAM del servidor no disponible</div>'
        : '<div style="text-align:center;font-size:10px;color:#0284C7;margin-top:6px">🔥 Grad-CAM activo — mapa de activación neuronal superpuesto</div>')
    : '<div style="text-align:center;font-size:10px;color:#6B7280;margin-top:6px">Imagen original (Grad-CAM no solicitado)</div>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Reaper Eagle — Reporte OncoTriage ${fileTS}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#FFFFFF;color:#1A202C;padding:0;margin:0;font-size:12px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wrap{max-width:820px;margin:0 auto;padding:36px 44px 52px;min-height:100vh}

  /* ── Header ── */
  .header{display:grid;grid-template-columns:68px 1fr auto;align-items:center;gap:18px;padding-bottom:20px;margin-bottom:24px;border-bottom:1px solid #D1D5DB;position:relative}
  .header::after{content:'';position:absolute;bottom:-1px;left:0;width:200px;height:2px;background:linear-gradient(90deg,#92400E,transparent)}
  .logo-img{width:68px;height:68px;object-fit:contain}
  .brand-name{font-size:20px;font-weight:800;letter-spacing:.08em;color:#1A202C;line-height:1;margin-bottom:3px}
  .brand-name span{color:#92400E}
  .brand-tagline{font-size:9px;color:#6B7280;letter-spacing:.12em;text-transform:uppercase}
  .brand-sub{font-size:9px;color:#92400E;margin-top:3px}
  .header-right{text-align:right;font-size:10px;color:#4A5568;line-height:1.8}
  .report-id{font-family:'JetBrains Mono',monospace;color:#92400E;font-size:10px;font-weight:600;margin-bottom:2px}
  .conf-badge{display:inline-block;margin-top:4px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:4px;padding:2px 8px;font-size:9px;color:#92400E;letter-spacing:.04em}

  /* ── Triage Banner ── */
  .triage-banner{display:flex;align-items:center;justify-content:space-between;border-radius:8px;padding:14px 20px;margin-bottom:20px;border:1px solid ${tc.border};background:${tc.bg}}
  .triage-left{display:flex;align-items:center;gap:12px}
  .triage-dot{font-size:1.8rem;line-height:1}
  .triage-tier{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:16px;color:${tc.color};letter-spacing:.1em}
  .triage-action{font-size:10px;color:#4A5568;margin-top:2px}
  .triage-right{text-align:right}
  .risk-label{font-size:9px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
  .risk-value{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:${tc.color}}
  .risk-formula{font-size:9px;color:#6B7280;margin-top:2px}

  /* ── Metric Cards ── */
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .mc{background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:12px;text-align:center;position:relative;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .mc-top{position:absolute;top:0;left:0;right:0;height:2px;background:var(--mc-color,#92400E)}
  .ml{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#6B7280;margin-bottom:4px;font-weight:600}
  .mv{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700}

  /* ── Sections ── */
  .section{margin-bottom:22px}
  .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#92400E;border-bottom:1px solid #D1D5DB;padding-bottom:6px;margin-bottom:14px;display:flex;align-items:center;gap:6px}

  /* ── Patient Info Grid ── */
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:14px 16px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .info-row{display:flex;flex-direction:column;gap:2px}
  .info-key{font-size:9px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
  .info-val{font-family:'JetBrains Mono',monospace;font-size:12px;color:#1A202C}

  /* ── Image Card ── */
  .image-card{background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:20px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .image-card img{max-width:460px;width:100%;max-height:340px;object-fit:contain;border-radius:6px;display:block;margin:0 auto;border:1px solid #D1D5DB}
  .image-note{text-align:center;font-size:10px;color:#6B7280;margin-top:8px}

  /* ── Diagnosis Box ── */
  .diagnosis-box{background:#FFFFFF;border:1px solid #D1D5DB;border-left:3px solid #92400E;border-radius:0 8px 8px 0;padding:16px 20px;font-size:12px;color:#374151;line-height:1.8;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .diagnosis-box p{margin-bottom:10px}
  .diagnosis-box p:last-child{margin-bottom:0}
  .diagnosis-box strong{color:#1A202C}
  .hl{color:#92400E;font-weight:600}
  .hl-u{color:#DC2626;font-weight:600}

  /* ── Uncertainty Cards ── */
  .unc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .unc-card{background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:12px 14px;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .uc-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#6B7280;margin-bottom:4px;font-weight:600}
  .uc-value{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;margin-bottom:4px}
  .uc-desc{font-size:10px;color:#4A5568;line-height:1.5}
  .bar-track{background:#E2E8F0;border-radius:20px;height:4px;overflow:hidden;margin-top:6px}
  .bar-fill{height:100%;border-radius:20px}

  /* ── Triage Table ── */
  .t-table{width:100%;border-collapse:collapse;border:1px solid #D1D5DB}
  .t-table th{padding:7px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#6B7280;background:#F8FAFC;border-bottom:2px solid #D1D5DB;text-align:left}
  .t-table td{padding:7px 10px;font-size:11px;border-bottom:1px solid #E2E8F0;color:#4A5568}
  .t-table tr:last-child td{border-bottom:none}

  /* ── Disclaimer ── */
  .disclaimer{background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;font-size:10px;color:#4A5568;margin-bottom:18px;line-height:1.6;box-shadow:0 1px 2px rgba(0,0,0,0.04)}
  .disclaimer strong{color:#CA8A04}

  /* ── Footer ── */
  .footer{display:flex;justify-content:space-between;align-items:flex-end;padding-top:14px;border-top:1px solid #D1D5DB;font-size:9px;color:#6B7280;line-height:1.7}
  .footer-logo{font-size:10px;color:#92400E;font-weight:700;letter-spacing:.06em}

  /* ── Print ── */
  @page{margin:0;size:A4}
  @media print{body{background:#FFFFFF!important}
  .wrap{padding:22px 30px 36px}
  .mc{box-shadow:none}
  .info-grid,.image-card,.unc-card,.diagnosis-box,.disclaimer{box-shadow:none}
  .header::after{background:linear-gradient(90deg,#92400E,transparent)}
</style>
</head>
<body>
<div class="wrap">

  <!-- ── HEADER ── -->
  <div class="header">
    <img src="${logoDataUri}" alt="Reaper Eagle" class="logo-img"/>
    <div>
      <div class="brand-name">REAPER <span>EAGLE</span></div>
      <div class="brand-tagline">OncoTriage &middot; F.A.S.C. Machine Learning Solutions S.A.S.</div>
      <div class="brand-sub">Inteligencia. Incertidumbre. <strong style="color:#92400E">Impacto.</strong></div>
    </div>
    <div class="header-right">
      <div class="report-id">REPORTE #ONC-${fileTS}-${Math.floor(Math.random()*9000+1000)}</div>
      <div>${dateStr}</div>
      <div>Hora: ${timeStr}</div>
      <div class="conf-badge">CONFIDENCIAL &mdash; USO CL&Iacute;NICO</div>
    </div>
  </div>

  <!-- ── TRIAGE BANNER ── -->
  <div class="triage-banner">
    <div class="triage-left">
      <div class="triage-dot">${tc.dot}</div>
      <div>
        <div class="triage-tier">${tc.es}</div>
        <div class="triage-action">${priority === 'URGENT' ? 'Revisión especialista inmediata requerida' : priority === 'HIGH' ? 'Consulta oncológica prioritaria — 7 días' : priority === 'REVIEW' ? 'Revisión radiológica manual obligatoria' : 'Seguimiento rutinario — sin acción inmediata'}</div>
      </div>
    </div>
    <div class="triage-right">
      <div class="risk-label">Risk Score &nbsp; R = &alpha;&mu; + &beta;&sigma;</div>
      <div class="risk-value">${riskR}</div>
      <div class="risk-formula">&alpha; = 0.70 &middot; &beta; = 0.30</div>
    </div>
  </div>

  <!-- ── METRICS ── -->
  <div class="metrics">
    <div class="mc" style="--mc-color:${tc.color}">
      <div class="mc-top"></div>
      <div class="ml">Probabilidad &mu;</div>
      <div class="mv" style="color:${tc.color}">${probPct}%</div>
    </div>
    <div class="mc" style="--mc-color:#CA8A04">
      <div class="mc-top"></div>
      <div class="ml">Incertidumbre &sigma;</div>
      <div class="mv" style="color:#CA8A04">&plusmn;${uncPct}%</div>
    </div>
    <div class="mc" style="--mc-color:#92400E">
      <div class="mc-top"></div>
      <div class="ml">Risk Score R</div>
      <div class="mv" style="color:#92400E">${riskR}</div>
    </div>
    <div class="mc" style="--mc-color:${tc.color}">
      <div class="mc-top"></div>
      <div class="ml">Banda cl&iacute;nica</div>
      <div class="mv" style="color:${tc.color};font-size:10px;margin-top:4px">${tc.band}</div>
    </div>
  </div>

  <!-- ── PATIENT INFO ── -->
  <div class="section">
    <div class="sec-title">INFORMACI&Oacute;N DEL PACIENTE</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-key">ID Paciente</span><span class="info-val">${patientId || '—'}</span></div>
      <div class="info-row"><span class="info-key">Nombre completo</span><span class="info-val">${patientName || 'Paciente An&oacute;nimo'}</span></div>
      <div class="info-row"><span class="info-key">Edad</span><span class="infoVal">${age || '—'}</span></div>
      <div class="info-row"><span class="info-key">Procesado por</span><span class="info-val">${user?.username || 'sistema'}</span></div>
      <div class="info-row"><span class="info-key">Modalidad</span><span class="info-val">Radiograf&iacute;a de T&oacute;rax PA</span></div>
      <div class="info-row"><span class="info-key">Modelo IA</span><span class="info-val">ResNet-50 + MC Dropout (${settings?.mc_samples || 200} muestras)</span></div>
    </div>
  </div>

  <!-- ── IMAGE ── -->
  <div class="section">
    <div class="sec-title">IMAGEN ANALIZADA${heatmap ? ' + GRAD-CAM' : ''}</div>
    <div class="image-card">
      ${imageHtml}
      ${heatmapNote}
    </div>
    <p style="font-size:10px;color:#6B7280;margin-top:6px;line-height:1.5">
      ${heatmap && heatmap !== '__css_fallback__'
        ? 'Las regiones rojo/amarillo en el mapa de calor representan las &aacute;reas de mayor activaci&oacute;n de la red neuronal, indicando d&oacute;nde el modelo centr&oacute; su atenci&oacute;n para la predicci&oacute;n. Generado mediante backpropagaci&oacute;n sobre la &uacute;ltima capa convolucional (Grad-CAM).'
        : 'Imagen original sin superposici&oacute;n de mapa de calor. Para visualizaci&oacute;n Grad-CAM, activar la funci&oacute;n desde el panel de an&aacute;lisis.'}
    </p>
  </div>

  <!-- ── DIAGNOSIS NARRATIVE ── -->
  <div class="section">
    <div class="sec-title">DIAGN&Oacute;STICO ASISTIDO POR IA &mdash; NARRATIVA CL&Iacute;NICA</div>
    <div class="diagnosis-box">
      <p>
        El sistema <strong>Reaper Eagle OncoTriage</strong> (ResNet-50 con incertidumbre epist&eacute;mica via Monte Carlo Dropout, <span class="hl">${settings?.mc_samples || 200} muestras</span>) analiz&oacute; la imagen m&eacute;dica del paciente
        <strong>${patientName ? `"${patientName}"` : 'registrado'}</strong>
        ${age ? `de ${age} a&ntilde;os` : ''}
        y encontr&oacute; <span class="hl">${findingDesc}</span>.
      </p>
      <p>
        La probabilidad de malignidad estimada es de <span class="hl">${probPct}%</span>
        con una confianza <strong>${confLevel}</strong> (incertidumbre epist&eacute;mica &sigma; = <span class="hl">&plusmn;${uncPct}%</span>).
        ${uncertaintyInterp}
      </p>
      <p>${regionDesc}</p>
      <p>
        El score de riesgo compuesto R = &alpha;&mu; + &beta;&sigma; = <span class="hl">${riskR}</span>
        (ponderando 70% probabilidad + 30% incertidumbre) ubica a este paciente en la categor&iacute;a
        <strong style="color:${tc.color}">${tc.es}</strong>.
      </p>
      <p style="margin-bottom:0">
        <strong>Recomendaci&oacute;n cl&iacute;nica:</strong>
        <span class="${priority === 'URGENT' ? 'hl-u' : 'hl'}">${clinicalRec}</span>
      </p>
    </div>
  </div>

  <!-- ── UNCERTAINTY ANALYSIS ── -->
  <div class="section">
    <div class="sec-title">AN&Aacute;LISIS DE INCERTIDUMBRE EPIST&Eacute;MICA</div>
    <div class="unc-grid">
      <div class="unc-card">
        <div class="uc-label">Probabilidad media &mu;</div>
        <div class="uc-value" style="color:${tc.color}">${probPct}%</div>
        <div class="bar-track"><div class="bar-fill" style="width:${probPct}%;background:${tc.color}"></div></div>
        <div class="uc-desc">${prob >= 0.7 ? 'Se&ntilde;al fuerte — por encima del umbral de decisi&oacute;n (85%)' : prob >= 0.4 ? 'Se&ntilde; moderada — requiere correlaci&oacute;n cl&iacute;nica' : 'Se&ntilde; d&eacute;bil — compatible con benignidad'}</div>
      </div>
      <div class="unc-card">
        <div class="uc-label">Incertidumbre &sigma;</div>
        <div class="uc-value" style="color:#CA8A04">&plusmn;${uncPct}%</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(uncPct*4,100)}%;background:${unc<0.10?'#16A34A':unc<0.15?'#CA8A04':'#DC2626'}"></div></div>
        <div class="uc-desc">${unc < 0.08 ? 'Muy baja — predicci&oacute;n altamente consistente' : unc < 0.12 ? 'Aceptable — dentro del rango operativo' : unc < 0.18 ? 'Moderada — revisi&oacute;n manual recomendada' : 'Elevada — validaci&oacute;n especializada obligatoria'}</div>
      </div>
      <div class="unc-card">
        <div class="uc-label">Cuadrante de decisi&oacute;n</div>
        <div class="uc-value" style="color:${tc.color};font-size:11px;margin-bottom:4px">&mu; ${prob >= 0.6 ? 'Alto' : 'Bajo'} / &sigma; ${unc >= 0.12 ? 'Alto' : 'Bajo'}</div>
        <div class="uc-desc">${
          prob >= 0.6 && unc < 0.12  ? 'Positivo confiable — acci&oacute;n inmediata justificada' :
          prob >= 0.6 && unc >= 0.12 ? 'Se&ntilde; alta con variabilidad — escalar con cautela' :
          prob < 0.6  && unc >= 0.12 ? 'Ambiguo — no concluyente, repetir estudio' :
          'Negativo seguro — seguimiento rutinario'
        }</div>
      </div>
      <div class="unc-card">
        <div class="uc-label">Throughput &nbsp; d&Omega;&#771;/dt + &gamma;&Omega;&#771; = T&#770;/&mu;&#8320;</div>
        <div class="uc-value" style="color:#92400E;font-size:11px;margin-bottom:4px">T&#770; = ${unc > 0 ? (1/unc).toFixed(1) : '∞'} &middot; &Omega;&#771; = ${Math.min(1, 1/(1+unc)).toFixed(3)}</div>
        <div class="uc-desc">&gamma; = 0.05 &middot; ${Math.min(1, 1/(1+unc)).toFixed(0)*100}% del throughput diagn&oacute;stico te&oacute;rico</div>
      </div>
    </div>
  </div>

  <!-- ── TRIAGE TABLE ── -->
  <div class="section">
    <div class="sec-title">PROTOCOLO DE TRIAJE</div>
    <div style="background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;overflow:hidden">
      <table class="t-table">
        <thead>
          <tr><th>Nivel</th><th>Condici&oacute;n</th><th>Protocolo</th><th>Plazo</th></tr>
        </thead>
        <tbody>
          <tr ${rowBg('URGENT')}>
            <td style="color:#DC2626;font-weight:700">&#128308; URGENTE</td>
            <td>&mu; &gt; 0.85 AND &sigma; &lt; 0.08</td>
            <td>Interconsulta urgente + TAC/histolog&iacute;a</td>
            <td style="color:#DC2626;font-weight:600">&lt; 24 h</td>
          </tr>
          <tr ${rowBg('HIGH')}>
            <td style="color:#EA580C;font-weight:700">&#128992; ALTO RIESGO</td>
            <td>&mu; &gt; 0.70 OR &sigma; elevado</td>
            <td>Oncolog&iacute;a prioritaria + estudios de extensi&oacute;n</td>
            <td style="color:#EA580C;font-weight:600">7 d&iacute;as</td>
          </tr>
          <tr ${rowBg('REVIEW')}>
            <td style="color:#CA8A04;font-weight:700">&#128993; REVISI&Oacute;N</td>
            <td>&sigma; &gt; 0.12</td>
            <td>Revisi&oacute;n radiol&oacute;gica manual + segunda opini&oacute;n</td>
            <td style="color:#CA8A04;font-weight:600">14 d&iacute;as</td>
          </tr>
          <tr ${rowBg('NORMAL')}>
            <td style="color:#16A34A;font-weight:700">&#128994; NORMAL</td>
            <td>&mu; bajo AND &sigma; bajo</td>
            <td>Seguimiento rutinario institucional</td>
            <td style="color:#16A34A;font-weight:600">Control anual</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── DISCLAIMER ── -->
  <div class="disclaimer">
    <strong>&#9888; Aviso legal — Uso exclusivo como herramienta de soporte cl&iacute;nico:</strong>
    Este reporte fue generado autom&aacute;ticamente por el sistema Reaper Eagle OncoTriage (F.A.S.C. Machine Learning Solutions S.A.S.). Los resultados presentados son output de un modelo de aprendizaje profundo y <strong>NO constituyen un diagn&oacute;stico m&eacute;dico definitivo</strong>. Toda decisi&oacute;n cl&iacute;nica debe ser tomada por un profesional de salud debidamente certificado, quien debe correlacionar estos hallazgos con la presentaci&oacute;n cl&iacute;nica completa del paciente, estudios adicionales y su criterio profesional. El uso indebido de este reporte es responsabilidad exclusiva del usuario.
  </div>

  <!-- ── FOOTER ── -->
  <div class="footer">
    <div>
      <div class="footer-logo">🦅 REAPER EAGLE — ONCOTRIAGE</div>
      <div>F.A.S.C. Machine Learning Solutions S.A.S. &middot; Fusagasug&aacute;, Colombia</div>
      <div>Inteligencia. Incertidumbre. Impacto.</div>
    </div>
    <div style="text-align:right">
      <div>Reporte generado: ${dateStr} ${timeStr}</div>
      <div>ResNet-50 + MC Dropout (${settings?.mc_samples || 200} muestras)</div>
      <div>Reaper Eagle OncoTriage v2.1</div>
    </div>
  </div>

</div>
</body>
</html>`;
}