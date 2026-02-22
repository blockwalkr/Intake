/**
 * IPS Questionnaire — Main App
 *
 * Multi-client intake tool with persistent storage,
 * LLM-optimized export, and progress tracking.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import SECTIONS, { ALL_QUESTION_IDS } from "./questions";
import {
  loadClientList, saveClientList, loadClientData,
  saveClientData, deleteClientData, freshClientData,
  isAnswered, buildLLMExport,
} from "./storage";
import { Icons, Toast, SectionCard } from "./components";

// Precompute the starting question number per section
const SECTION_STARTS = {};
let _runningQ = 0;
SECTIONS.forEach((s) => {
  SECTION_STARTS[s.num] = _runningQ + 1;
  s.subsections.forEach((sub) => { _runningQ += sub.questions.length; });
});

export default function App() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const saveTimer = useRef(null);

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  // ── Load / switch clients ──

  useEffect(() => {
    (async () => { setClients(await loadClientList()); setLoading(false); })();
  }, []);

  useEffect(() => {
    if (!activeId) { setClientData(null); return; }
    (async () => { setClientData((await loadClientData(activeId)) || freshClientData("")); })();
  }, [activeId]);

  // ── Auto-save with debounce ──

  const autoSave = useCallback((data) => {
    if (!activeId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const updated = { ...data, updatedAt: Date.now() };
      await saveClientData(activeId, updated);
      setClients((prev) => {
        const next = prev.map((c) =>
          c.id === activeId ? { ...c, name: updated.clientName, updatedAt: updated.updatedAt } : c
        );
        saveClientList(next);
        return next;
      });
    }, 800);
  }, [activeId]);

  const updateField = (field, value) => {
    setClientData((prev) => { const next = { ...prev, [field]: value }; autoSave(next); return next; });
  };

  const updateAnswer = (questionId, value) => {
    setClientData((prev) => {
      const next = { ...prev, answers: { ...prev.answers, [questionId]: value } };
      autoSave(next);
      return next;
    });
  };

  // ── Client CRUD ──

  const createClient = async () => {
    const name = newName.trim();
    if (!name) return;
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const data = freshClientData(name);
    await saveClientData(id, data);
    const entry = { id, name, createdAt: data.createdAt, updatedAt: data.updatedAt };
    const next = [entry, ...clients];
    await saveClientList(next);
    setClients(next);
    setActiveId(id);
    setNewName("");
    setShowModal(false);
  };

  const deleteClient = async (id) => {
    if (!confirm("Delete this client and all data?")) return;
    await deleteClientData(id);
    const next = clients.filter((c) => c.id !== id);
    await saveClientList(next);
    setClients(next);
    if (activeId === id) { setActiveId(null); setClientData(null); }
  };

  // ── Export helpers ──

  const tryDownload = (blob, filename) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    } catch {
      showToast("Open in a new browser tab to export");
    }
  };

  const safeName = (n) => (n || "export").replace(/\s+/g, "_");

  const exportLLM = () => {
    if (!clientData) return;
    tryDownload(new Blob([buildLLMExport(clientData)], { type: "text/plain" }), `IPS_LLM_${safeName(clientData.clientName)}.txt`);
  };

  const exportJSON = () => {
    if (!clientData) return;
    tryDownload(new Blob([JSON.stringify(clientData, null, 2)], { type: "application/json" }), `IPS_Data_${safeName(clientData.clientName)}.json`);
  };

  const copyLLMPrompt = async () => {
    if (!clientData) return;
    try {
      await navigator.clipboard.writeText(buildLLMExport(clientData));
      showToast("Copied to clipboard!");
    } catch {
      showToast("Open in a new browser tab to copy");
    }
  };

  // ── Progress tracking ──

  const totalAnswered = clientData
    ? ALL_QUESTION_IDS.filter((id) => isAnswered(clientData.answers[id])).length : 0;
  const totalQuestions = ALL_QUESTION_IDS.length;
  const progressPct = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

  // ── Jump to first unanswered ──

  const jumpToFirstUnanswered = () => {
    if (!clientData) return;
    const firstId = ALL_QUESTION_IDS.find((id) => !isAnswered(clientData.answers[id]));
    if (!firstId) { showToast("All questions answered!"); return; }
    for (const s of SECTIONS) {
      for (const sub of s.subsections) {
        for (const q of sub.questions) {
          if (q.id === firstId) {
            setCollapsed((prev) => ({ ...prev, [s.num]: false }));
            setTimeout(() => {
              const el = document.querySelector(`[data-qid="${firstId}"]`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 150);
            return;
          }
        }
      }
    }
  };

  // ── Filtered client list ──

  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ──

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#475569" }}>
        Loading…
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "7px 0", border: "none", borderBottom: "2px solid #e2e8f0",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: "#1e293b",
    background: "transparent", outline: "none",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: "flex", height: "100vh", overflow: "hidden", background: "#f1f5f9" }}>
      <Toast message={toast.message} visible={toast.visible} />

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? 280 : 0, minWidth: sidebarOpen ? 280 : 0,
        background: "#0f2a44", color: "#fff", display: "flex", flexDirection: "column",
        transition: "all .25s", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#c9a84c" }}>IPS</span> Client Manager
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }}>{Icons.search}</div>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search clients..."
              style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" }} />
          </div>

          <button onClick={() => { setShowModal(true); setNewName(""); }} style={{
            width: "100%", padding: "9px 0", borderRadius: 8, border: "1.5px dashed rgba(201,168,76,.5)",
            background: "rgba(201,168,76,.08)", color: "#c9a84c", fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>{Icons.plus} New Client</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {filteredClients.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 13, marginTop: 40 }}>
              {clients.length === 0 ? "No clients yet" : "No matches"}
            </div>
          )}
          {filteredClients.map((c) => (
            <div key={c.id} onClick={() => setActiveId(c.id)} style={{
              padding: "10px 12px", borderRadius: 10, marginBottom: 4, cursor: "pointer",
              background: activeId === c.id ? "rgba(43,108,176,.25)" : "transparent",
              border: activeId === c.id ? "1px solid rgba(43,108,176,.4)" : "1px solid transparent",
              display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: activeId === c.id ? "#2b6cb0" : "rgba(255,255,255,.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: activeId === c.id ? "#fff" : "rgba(255,255,255,.4)",
              }}>{Icons.user}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{new Date(c.updatedAt).toLocaleDateString()}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.2)", cursor: "pointer", padding: 4, borderRadius: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.2)")}>
                {Icons.trash}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ minHeight: 52, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "8px 20px", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#475569" }}>
            {Icons.menu}
          </button>
          {clientData && <>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: "#0f2a44", whiteSpace: "nowrap" }}>{clientData.clientName || "Untitled"}</span>
              <div onClick={jumpToFirstUnanswered} title="Click to jump to first unanswered question" style={{ height: 6, flex: 1, maxWidth: 200, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #c9a84c, #e8c75a)", borderRadius: 3, transition: "width .4s" }} />
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{totalAnswered}/{totalQuestions}</span>
            </div>
            {[
              { label: "Copy LLM Prompt", icon: Icons.file, onClick: copyLLMPrompt, bg: "transparent", color: "#2b6cb0", border: "1px solid #2b6cb0" },
              { label: "Export for LLM", icon: Icons.dl, onClick: exportLLM, bg: "#c9a84c", color: "#0f2a44", border: "none" },
              { label: "JSON", icon: Icons.dl, onClick: exportJSON, bg: "transparent", color: "#475569", border: "1px solid #e2e8f0" },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.onClick} style={{
                padding: "6px 12px", borderRadius: 6, border: btn.border, background: btn.bg,
                color: btn.color, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
              }}>{btn.icon} {btn.label}</button>
            ))}
          </>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 60px" }}>
          {!clientData ? (
            /* Empty state */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e8f0fa", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#2b6cb0" }}>{Icons.user}</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#0f2a44", marginBottom: 6 }}>Select or Create a Client</h2>
              <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 400, lineHeight: 1.6 }}>Choose a client from the sidebar or create a new one. All data saves automatically.</p>
              <button onClick={() => { setShowModal(true); setNewName(""); }} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none", background: "#0f2a44", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                {Icons.plus} New Client
              </button>
            </div>
          ) : (
            /* Questionnaire */
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              {/* Tip banner */}
              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#92400e" }}>
                <span style={{ flexShrink: 0 }}>{Icons.info}</span>
                <span><strong>Tip:</strong> To use Copy/Export, open this artifact in a new browser tab.</span>
              </div>

              {/* Client info fields */}
              <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(15,42,68,.06)", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Client Name", field: "clientName", placeholder: "Full legal name" },
                  { label: "Date", field: "date", placeholder: "", type: "date" },
                  { label: "Advisor", field: "advisor", placeholder: "Advisor name" },
                ].map((f) => (
                  <div key={f.field}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>{f.label}</div>
                    <input type={f.type || "text"} value={clientData[f.field] || ""} onChange={(e) => updateField(f.field, e.target.value)}
                      placeholder={f.placeholder} style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = "#2b6cb0")}
                      onBlur={(e) => (e.target.style.borderBottomColor = "#e2e8f0")} />
                  </div>
                ))}
              </div>

              {/* Section cards */}
              {SECTIONS.map((s) => (
                <SectionCard key={s.num} section={s} answers={clientData.answers}
                  onAnswer={updateAnswer} startNum={SECTION_STARTS[s.num]}
                  collapsed={!!collapsed[s.num]}
                  onToggle={() => setCollapsed((p) => ({ ...p, [s.num]: !p[s.num] }))} />
              ))}

              {/* Acknowledgment / signatures */}
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(15,42,68,.06)", border: "1px solid #e2e8f0", padding: 28, marginTop: 12 }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#0f2a44", marginBottom: 10 }}>Acknowledgment</h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 24 }}>
                  I confirm that the information provided is accurate and complete. I agree to notify my advisor of material changes.
                </p>
                {["Client Signature", "Co-Client / Spouse (if applicable)", "Investment Advisor Representative"].map((label) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>{label}</div>
                      <input type="text" placeholder="Type full name" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>Date</div>
                      <input type="date" style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New client modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,42,68,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#0f2a44", marginBottom: 16 }}>New Client</h3>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createClient()}
              placeholder="Client full name"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#1e293b", outline: "none", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={createClient} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: "#0f2a44", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
