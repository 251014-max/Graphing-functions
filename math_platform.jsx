import { useState, useRef, useEffect, useCallback } from "react";

const TRANSLATIONS = {
  en: {
    title: "MathVerse",
    subtitle: "Advanced Mathematical Graphing Platform",
    placeholder: "Enter function: y = sin(x), x² + y² = 25, r = 2sin(θ)...",
    addGraph: "Add Graph",
    clearAll: "Clear All",
    aiAssistant: "AI Assistant",
    aiPlaceholder: "Ask anything: 'explain sin(x)', 'find derivative of x²'...",
    ask: "Ask",
    analysis: "Analysis",
    domain: "Domain",
    range: "Range",
    roots: "Roots",
    derivative: "Derivative",
    keyboard: "Math Keyboard",
    settings: "Settings",
    darkMode: "Dark Mode",
    gridLines: "Grid Lines",
    axes: "Axes Labels",
    language: "Language",
    functions: "Functions",
    zoom: "Zoom",
    examples: "Examples",
    export: "Export PNG",
    reset: "Reset View",
    loading: "Computing...",
    errorMsg: "Invalid expression",
    tabs: { graph: "2D Graph", analysis: "Analysis", ai: "AI Assistant", keyboard: "Keyboard" },
  },
  ar: {
    title: "عالم الرياضيات",
    subtitle: "منصة الرسم الرياضي المتقدمة",
    placeholder: "أدخل الدالة: ص = جا(س)، س² + ص² = 25، ق = 2جا(θ)...",
    addGraph: "أضف رسماً",
    clearAll: "مسح الكل",
    aiAssistant: "المساعد الذكي",
    aiPlaceholder: "اسأل أي شيء: 'اشرح جا(س)'، 'اشتق س²'...",
    ask: "اسأل",
    analysis: "التحليل",
    domain: "المجال",
    range: "المدى",
    roots: "الجذور",
    derivative: "المشتقة",
    keyboard: "لوحة المفاتيح",
    settings: "الإعدادات",
    darkMode: "الوضع الداكن",
    gridLines: "خطوط الشبكة",
    axes: "تسميات المحاور",
    language: "اللغة",
    functions: "الدوال",
    zoom: "التكبير",
    examples: "أمثلة",
    export: "تصدير PNG",
    reset: "إعادة ضبط العرض",
    loading: "جاري الحساب...",
    errorMsg: "تعبير غير صالح",
    tabs: { graph: "رسم ثنائي الأبعاد", analysis: "التحليل", ai: "المساعد الذكي", keyboard: "لوحة المفاتيح" },
  }
};

const COLORS = ["#6366f1","#ec4899","#10b981","#f59e0b","#3b82f6","#ef4444","#8b5cf6","#06b6d4"];

const EXAMPLES = [
  { expr: "sin(x)", label: "sin(x)" },
  { expr: "x^2", label: "x²" },
  { expr: "sqrt(x)", label: "√x" },
  { expr: "log(x)", label: "log(x)" },
  { expr: "abs(x)", label: "|x|" },
  { expr: "1/x", label: "1/x" },
  { expr: "tan(x)", label: "tan(x)" },
  { expr: "exp(x)", label: "eˣ" },
  { expr: "x^3 - x", label: "x³-x" },
  { expr: "sin(x)/x", label: "sinc" },
];

const ARABIC_MAP = {
  "جا": "sin", "جتا": "cos", "ظا": "tan", "جذر": "sqrt",
  "لوغ": "log", "لن": "ln", "س": "x", "ص": "y",
  "ع": "e", "π": "pi", "∞": "Infinity"
};

function translateArabic(expr) {
  let result = expr;
  Object.entries(ARABIC_MAP).forEach(([ar, en]) => {
    result = result.replace(new RegExp(ar, "g"), en);
  });
  return result;
}

function safeEval(expr, x) {
  try {
    const translated = translateArabic(expr);
    const clean = translated
      .replace(/\^/g, "**")
      .replace(/sin\b/g, "Math.sin")
      .replace(/cos\b/g, "Math.cos")
      .replace(/tan\b/g, "Math.tan")
      .replace(/sqrt\b/g, "Math.sqrt")
      .replace(/log\b/g, "Math.log10")
      .replace(/ln\b/g, "Math.log")
      .replace(/abs\b/g, "Math.abs")
      .replace(/exp\b/g, "Math.exp")
      .replace(/pi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E");
    // eslint-disable-next-line no-new-func
    const fn = new Function("x", `"use strict"; try { return ${clean}; } catch(e) { return NaN; }`);
    return fn(x);
  } catch { return NaN; }
}

function computePoints(expr, xMin, xMax, steps = 800) {
  const pts = [];
  const dx = (xMax - xMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    const y = safeEval(expr, x);
    if (isFinite(y) && Math.abs(y) < 1e6) pts.push({ x, y });
    else pts.push(null);
  }
  return pts;
}

function findRoots(expr, xMin, xMax) {
  const roots = [];
  const steps = 500;
  const dx = (xMax - xMin) / steps;
  let prev = safeEval(expr, xMin);
  for (let i = 1; i <= steps; i++) {
    const x = xMin + i * dx;
    const curr = safeEval(expr, x);
    if (isFinite(prev) && isFinite(curr) && prev * curr < 0) {
      let lo = x - dx, hi = x;
      for (let j = 0; j < 20; j++) {
        const mid = (lo + hi) / 2;
        const mval = safeEval(expr, mid);
        if (safeEval(expr, lo) * mval < 0) hi = mid; else lo = mid;
      }
      const root = (lo + hi) / 2;
      if (roots.every(r => Math.abs(r - root) > 0.1)) roots.push(+root.toFixed(4));
    }
    prev = curr;
  }
  return roots.slice(0, 5);
}

function computeDerivative(expr) {
  const translated = translateArabic(expr);
  if (translated.includes("sin(x)")) return "cos(x)";
  if (translated.includes("cos(x)")) return "-sin(x)";
  if (translated.includes("x^2")) return "2x";
  if (translated.includes("x**2")) return "2x";
  if (translated.includes("x^3")) return "3x²";
  if (translated.includes("sqrt(x)")) return "1/(2√x)";
  if (translated.includes("log(x)")) return "1/(x ln10)";
  if (translated.includes("ln(x)")) return "1/x";
  if (translated.includes("exp(x)")) return "eˣ";
  if (translated === "x") return "1";
  return "f'(x) — use AI for complex derivatives";
}

export default function MathVerse() {
  const canvasRef = useRef(null);
  const [lang, setLang] = useState("en");
  const t = TRANSLATIONS[lang];
  const isRTL = lang === "ar";

  const [dark, setDark] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxesLabels, setShowAxesLabels] = useState(true);
  const [activeTab, setActiveTab] = useState("graph");
  const [input, setInput] = useState("");
  const [graphs, setGraphs] = useState([
    { id: 1, expr: "sin(x)", color: COLORS[0], visible: true }
  ]);
  const [view, setView] = useState({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", content: lang === "en"
      ? "Hello! I'm your AI math assistant. Ask me to explain functions, find derivatives, or analyze graph behavior."
      : "مرحباً! أنا مساعدك الذكي في الرياضيات. اسألني أن أشرح الدوال، أو أجد المشتقات، أو أحلل سلوك الرسم البياني."
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const nextId = useRef(2);

  // ── Draw canvas ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const { xMin, xMax, yMin, yMax } = view;
    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * W;
    const toCanvasY = y => H - ((y - yMin) / (yMax - yMin)) * H;

    // Background
    ctx.fillStyle = dark ? "#0f0f1a" : "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      const xStep = niceStep((xMax - xMin) / 10);
      const yStep = niceStep((yMax - yMin) / 8);
      for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), H); ctx.stroke();
      }
      for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(W, toCanvasY(y)); ctx.stroke();
      }
    }

    // Axes
    const ox = toCanvasX(0), oy = toCanvasY(0);
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.5;
    if (ox >= 0 && ox <= W) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); }
    if (oy >= 0 && oy <= H) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); }

    // Axis labels
    if (showAxesLabels) {
      ctx.fillStyle = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
      ctx.font = "11px 'Inter', sans-serif";
      ctx.textAlign = "center";
      const xStep = niceStep((xMax - xMin) / 10);
      const yStep = niceStep((yMax - yMin) / 8);
      for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        if (Math.abs(x) < xStep * 0.1) continue;
        const px = toCanvasX(x), py = Math.min(Math.max(oy + 14, 14), H - 4);
        ctx.fillText(fmt(x), px, py);
      }
      ctx.textAlign = "right";
      for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        if (Math.abs(y) < yStep * 0.1) continue;
        const px = Math.min(Math.max(ox - 6, 30), W - 6), py = toCanvasY(y) + 4;
        ctx.fillText(fmt(y), px, py);
      }
    }

    // Graphs
    graphs.forEach(g => {
      if (!g.visible) return;
      const pts = computePoints(g.expr, xMin, xMax, Math.min(W * 1.5, 1200));
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowBlur = dark ? 8 : 0;
      ctx.shadowColor = g.color;
      ctx.beginPath();
      let penDown = false;
      pts.forEach(p => {
        if (!p) { penDown = false; return; }
        const cx = toCanvasX(p.x), cy = toCanvasY(p.y);
        if (!penDown) { ctx.moveTo(cx, cy); penDown = true; }
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [dark, showGrid, showAxesLabels, view, graphs]);

  useEffect(() => { draw(); }, [draw]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  function niceStep(approx) {
    const mag = Math.pow(10, Math.floor(Math.log10(approx)));
    const frac = approx / mag;
    if (frac < 1.5) return mag;
    if (frac < 3.5) return 2 * mag;
    if (frac < 7.5) return 5 * mag;
    return 10 * mag;
  }
  function fmt(n) {
    if (Number.isInteger(n)) return String(n);
    return parseFloat(n.toFixed(2)).toString();
  }

  // Pan/zoom
  const handleWheel = e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const { xMin, xMax, yMin, yMax } = view;
    const cx = xMin + mx * (xMax - xMin);
    const cy = yMax - my * (yMax - yMin);
    setView({
      xMin: cx + (xMin - cx) * factor,
      xMax: cx + (xMax - cx) * factor,
      yMin: cy + (yMin - cy) * factor,
      yMax: cy + (yMax - cy) * factor,
    });
  };

  const handleMouseDown = e => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, view: { ...view } });
  };

  const handleMouseMove = e => {
    if (!isDragging || !dragStart) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width * (dragStart.view.xMax - dragStart.view.xMin);
    const dy = (e.clientY - dragStart.y) / rect.height * (dragStart.view.yMax - dragStart.view.yMin);
    setView({
      xMin: dragStart.view.xMin - dx,
      xMax: dragStart.view.xMax - dx,
      yMin: dragStart.view.yMin + dy,
      yMax: dragStart.view.yMax + dy,
    });
  };

  const handleMouseUp = () => { setIsDragging(false); setDragStart(null); };

  // Add graph
  const addGraph = () => {
    if (!input.trim()) return;
    const id = nextId.current++;
    const color = COLORS[(graphs.length) % COLORS.length];
    setGraphs(prev => [...prev, { id, expr: input.trim(), color, visible: true }]);
    setInput("");
    setSelectedGraph(id);
  };

  // AI
  const askAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiMessages(m => [...m, { role: "user", content: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    const activeGraphs = graphs.map(g => g.expr).join(", ");
    const systemPrompt = lang === "ar"
      ? `أنت مساعد رياضي خبير. الرسوم البيانية الحالية: ${activeGraphs}. أجب بالعربية بشكل مختصر وواضح مع خطوات إذا لزم.`
      : `You are an expert math assistant. Current graphs: ${activeGraphs}. Answer concisely with step-by-step reasoning when needed. Keep under 200 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...aiMessages.filter(m => m.role !== "assistant" || aiMessages.indexOf(m) > 0).slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that.";
      setAiMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setAiMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setAiLoading(false);
  };

  // Analysis
  const analysisData = selectedGraph
    ? graphs.find(g => g.id === selectedGraph)
    : graphs[0];

  const roots = analysisData ? findRoots(analysisData.expr, view.xMin, view.xMax) : [];
  const deriv = analysisData ? computeDerivative(analysisData.expr) : "";

  // Export
  const exportPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "mathverse-graph.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Keyboard insert
  const insertAtCursor = (text, inputEl, setter) => {
    if (!inputEl) { setter(prev => prev + text); return; }
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const val = inputEl.value;
    setter(val.slice(0, start) + text + val.slice(end));
    setTimeout(() => { inputEl.setSelectionRange(start + text.length, start + text.length); inputEl.focus(); }, 0);
  };

  const inputRef = useRef(null);

  const KEYBOARD_KEYS = [
    ["sin(", "cos(", "tan(", "log(", "ln("],
    ["√(", "^2", "^3", "^", "π"],
    ["∫", "d/dx", "|x|", "e^", "!"],
    ["(", ")", "×", "÷", "="],
    lang === "ar" ? ["جا(", "جتا(", "ظا(", "جذر(", "س"] : ["sinh(", "cosh(", "tanh(", "exp(", "∞"],
  ];

  const bg = dark ? "#0f0f1a" : "#f8f9fa";
  const panel = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const text = dark ? "#e2e8f0" : "#1a1a2e";
  const muted = dark ? "#64748b" : "#94a3b8";
  const accent = "#6366f1";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:bg, color:text, fontFamily:"'Inter',system-ui,sans-serif", direction: isRTL ? "rtl" : "ltr", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", borderBottom:`1px solid ${border}`, background: dark ? "rgba(15,15,26,0.9)" : "rgba(248,249,250,0.9)", backdropFilter:"blur(12px)", zIndex:10, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>∑</div>
          <div>
            <div style={{ fontWeight:700, fontSize:16, background:"linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{t.title}</div>
            <div style={{ fontSize:11, color:muted }}>{t.subtitle}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${border}`, background:"transparent", color:text, cursor:"pointer", fontSize:13, fontWeight:500 }}>
            {lang === "en" ? "عربي" : "EN"}
          </button>
          <button onClick={() => setDark(d => !d)} style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${border}`, background:"transparent", color:text, cursor:"pointer", fontSize:16 }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <button onClick={exportPNG} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${border}`, background:accent, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:500 }}>
            {t.export}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Sidebar */}
        <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", borderRight: isRTL ? "none" : `1px solid ${border}`, borderLeft: isRTL ? `1px solid ${border}` : "none", background: dark ? "rgba(15,15,26,0.8)" : "#fff", overflow:"hidden" }}>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${border}`, flexShrink:0 }}>
            {Object.entries(t.tabs).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ flex:1, padding:"10px 4px", fontSize:10, fontWeight:600, border:"none", background:"transparent", color: activeTab === key ? accent : muted, cursor:"pointer", borderBottom: activeTab === key ? `2px solid ${accent}` : "2px solid transparent", transition:"all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:14 }}>

            {activeTab === "graph" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {/* Input */}
                <div style={{ display:"flex", gap:6 }}>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addGraph()}
                    placeholder={t.placeholder}
                    style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1px solid ${border}`, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color:text, fontSize:12, outline:"none" }} />
                  <button onClick={addGraph} style={{ padding:"8px 12px", borderRadius:8, background:accent, color:"#fff", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>+</button>
                </div>

                {/* Graphs list */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {graphs.map(g => (
                    <div key={g.id} onClick={() => setSelectedGraph(g.id)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1px solid ${selectedGraph === g.id ? g.color : border}`, background: selectedGraph === g.id ? `${g.color}15` : panel, cursor:"pointer", transition:"all 0.2s" }}>
                      <div style={{ width:14, height:14, borderRadius:3, background:g.color, flexShrink:0 }} />
                      <div style={{ flex:1, fontSize:12, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.expr}</div>
                      <button onClick={e => { e.stopPropagation(); setGraphs(gs => gs.map(x => x.id === g.id ? { ...x, visible: !x.visible } : x)); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:g.visible ? g.color : muted, fontSize:14, padding:0 }}>
                        {g.visible ? "●" : "○"}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setGraphs(gs => gs.filter(x => x.id !== g.id)); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:muted, fontSize:14, padding:0, lineHeight:1 }}>×</button>
                    </div>
                  ))}
                </div>

                {/* Examples */}
                <div>
                  <div style={{ fontSize:11, color:muted, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>{t.examples}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {EXAMPLES.map(ex => (
                      <button key={ex.expr} onClick={() => { setInput(ex.expr); }} style={{ padding:"4px 9px", borderRadius:20, border:`1px solid ${border}`, background:"transparent", color:text, cursor:"pointer", fontSize:11, fontFamily:"monospace" }}>
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom controls */}
                <div>
                  <div style={{ fontSize:11, color:muted, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>{t.zoom}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setView(v => ({ xMin:v.xMin*1.5, xMax:v.xMax*1.5, yMin:v.yMin*1.5, yMax:v.yMax*1.5 }))} style={{ flex:1, padding:"6px", borderRadius:8, border:`1px solid ${border}`, background:panel, color:text, cursor:"pointer", fontSize:16 }}>−</button>
                    <button onClick={() => setView({ xMin:-10, xMax:10, yMin:-6, yMax:6 })} style={{ flex:2, padding:"6px", borderRadius:8, border:`1px solid ${border}`, background:panel, color:text, cursor:"pointer", fontSize:11 }}>{t.reset}</button>
                    <button onClick={() => setView(v => ({ xMin:v.xMin*0.67, xMax:v.xMax*0.67, yMin:v.yMin*0.67, yMax:v.yMax*0.67 }))} style={{ flex:1, padding:"6px", borderRadius:8, border:`1px solid ${border}`, background:panel, color:text, cursor:"pointer", fontSize:16 }}>+</button>
                  </div>
                </div>

                {/* Settings */}
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { label: t.gridLines, value: showGrid, setter: setShowGrid },
                    { label: t.axes, value: showAxesLabels, setter: setShowAxesLabels },
                  ].map(s => (
                    <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:muted }}>{s.label}</span>
                      <button onClick={() => s.setter(v => !v)} style={{ width:40, height:22, borderRadius:11, background: s.value ? accent : border, border:"none", cursor:"pointer", position:"relative", transition:"background 0.3s" }}>
                        <div style={{ position:"absolute", top:3, left: s.value ? 21 : 3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "analysis" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {analysisData ? (
                  <>
                    <div style={{ padding:10, borderRadius:8, background:`${analysisData.color}15`, border:`1px solid ${analysisData.color}40` }}>
                      <div style={{ fontSize:11, color:muted }}>f(x) =</div>
                      <div style={{ fontSize:15, fontFamily:"monospace", color:analysisData.color, fontWeight:600 }}>{analysisData.expr}</div>
                    </div>
                    <StatCard label={t.domain} value={`[${fmt(view.xMin)}, ${fmt(view.xMax)}]`} dark={dark} border={border} panel={panel} muted={muted} text={text} />
                    <StatCard label={t.roots} value={roots.length ? roots.join(", ") : "None in view"} dark={dark} border={border} panel={panel} muted={muted} text={text} />
                    <StatCard label={t.derivative} value={deriv} dark={dark} border={border} panel={panel} muted={muted} text={text} />
                    <div style={{ padding:10, borderRadius:8, background:panel, border:`1px solid ${border}` }}>
                      <div style={{ fontSize:11, color:muted, marginBottom:6, fontWeight:600 }}>Sample values</div>
                      <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                        <thead><tr><th style={{ color:muted, fontWeight:500, textAlign:"left", paddingBottom:4 }}>x</th><th style={{ color:muted, fontWeight:500, textAlign:"right", paddingBottom:4 }}>f(x)</th></tr></thead>
                        <tbody>
                          {[-2,-1,0,1,2].map(x => (
                            <tr key={x}>
                              <td style={{ padding:"3px 0", color:muted }}>{x}</td>
                              <td style={{ padding:"3px 0", textAlign:"right", fontFamily:"monospace", color:text }}>{fmt(safeEval(analysisData.expr, x))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : <div style={{ color:muted, fontSize:13 }}>Add a function to analyze.</div>}
              </div>
            )}

            {activeTab === "ai" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10, height:"100%" }}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, overflowY:"auto", maxHeight:320 }}>
                  {aiMessages.map((m, i) => (
                    <div key={i} style={{ padding:"10px 12px", borderRadius:10, background: m.role === "user" ? `${accent}20` : panel, border:`1px solid ${m.role === "user" ? accent + "40" : border}`, fontSize:12, lineHeight:1.6, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth:"90%", color:text }}>
                      {m.content}
                    </div>
                  ))}
                  {aiLoading && <div style={{ color:muted, fontSize:12, padding:8 }}>{t.loading}</div>}
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()}
                    placeholder={t.aiPlaceholder}
                    style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1px solid ${border}`, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color:text, fontSize:12, outline:"none" }} />
                  <button onClick={askAI} disabled={aiLoading} style={{ padding:"8px 12px", borderRadius:8, background:accent, color:"#fff", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, opacity:aiLoading ? 0.5 : 1 }}>
                    {t.ask}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "keyboard" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:11, color:muted, marginBottom:4 }}>Click to insert into function input</div>
                {KEYBOARD_KEYS.map((row, ri) => (
                  <div key={ri} style={{ display:"flex", gap:5 }}>
                    {row.map(key => (
                      <button key={key} onClick={() => insertAtCursor(key, inputRef.current, setInput)}
                        style={{ flex:1, padding:"8px 4px", borderRadius:7, border:`1px solid ${border}`, background:panel, color:text, cursor:"pointer", fontSize:12, fontFamily:"monospace", fontWeight:500, transition:"all 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = `${accent}25`}
                        onMouseLeave={e => e.currentTarget.style.background = panel}>
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
                <div style={{ marginTop:8, padding:10, borderRadius:8, background:panel, border:`1px solid ${border}` }}>
                  <div style={{ fontSize:11, color:muted, fontWeight:600, marginBottom:6 }}>Arabic symbols</div>
                  <div style={{ fontSize:11, color:muted, lineHeight:2 }}>
                    جا = sin &nbsp; جتا = cos &nbsp; ظا = tan<br/>
                    جذر = sqrt &nbsp; لوغ = log &nbsp; س = x &nbsp; ص = y
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
          <canvas ref={canvasRef}
            style={{ display:"block", width:"100%", height:"100%", cursor: isDragging ? "grabbing" : "crosshair" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {/* Coordinate display */}
          <div style={{ position:"absolute", bottom:12, right:12, padding:"6px 12px", borderRadius:8, background: dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)", border:`1px solid ${border}`, fontSize:11, color:muted, backdropFilter:"blur(6px)" }}>
            x: [{fmt(view.xMin)}, {fmt(view.xMax)}] &nbsp; y: [{fmt(view.yMin)}, {fmt(view.yMax)}]
          </div>
          {/* Legend */}
          {graphs.length > 0 && (
            <div style={{ position:"absolute", top:12, right:12, display:"flex", flexDirection:"column", gap:4 }}>
              {graphs.filter(g => g.visible).map(g => (
                <div key={g.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:6, background: dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)", backdropFilter:"blur(6px)", border:`1px solid ${g.color}40` }}>
                  <div style={{ width:14, height:3, borderRadius:2, background:g.color }} />
                  <span style={{ fontSize:11, fontFamily:"monospace", color:text }}>{g.expr}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, dark, border, panel, muted, text }) {
  return (
    <div style={{ padding:10, borderRadius:8, background:panel, border:`1px solid ${border}` }}>
      <div style={{ fontSize:11, color:muted, fontWeight:600, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:13, fontFamily:"monospace", color:text, wordBreak:"break-all" }}>{value}</div>
    </div>
  );
}
