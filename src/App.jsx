import { useState, useEffect, useCallback, useRef } from "react";
import SECTIONS, { ALL_QUESTION_IDS, CPS_SECTIONS, ALL_CPS_QUESTION_IDS } from "./questions";
import {
  loadClientList,
  createClient as apiCreateClient,
  loadClientData,
  saveClientData,
  deleteClientData,
  isAnswered,
  buildLLMExport,
  buildCPSExport,
} from "./storage";
import { Icons, Toast, SectionCard } from "./components";

// Precompute starting question number per section
const SECTION_STARTS = {};
let _q = 0;
SECTIONS.forEach((s) => {
  SECTION_STARTS[s.num] = _q + 1;
  s.subsections.forEach((sub) => {
    _q += sub.questions.length;
  });
});

const CPS_SECTION_STARTS = {};
let _cq = 0;
CPS_SECTIONS.forEach((s) => {
  CPS_SECTION_STARTS[s.num] = _cq + 1;
  s.subsections.forEach((sub) => {
    _cq += sub.questions.length;
  });
});

export default function App() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [activeTab, setActiveTab] = useState("ips");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const saveTimer = useRef(null);

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  // ── Load clients on mount ──

  useEffect(() => {
    loadClientList()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Switch active client ──

  useEffect(() => {
    if (!activeId) {
      setClientData(null);
      return;
    }
    loadClientData(activeId).then((data) => setClientData(data || null));
  }, [activeId]);

  // ── Auto-save with debounce ──

  const autoSave = useCallback(
    (data) => {
      if (!activeId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const updated = await saveClientData(activeId, data);
        setClients((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, name: updated.clientName, updatedAt: updated.updatedAt }
              : c
          )
        );
      }, 800);
    },
    [activeId]
  );

  const updateField = (field, value) => {
    setClientData((prev) => {
      const next = { ...prev, [field]: value };
      autoSave(next);
      return next;
    });
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
    try {
      const created = await apiCreateClient(name);
      const entry = {
        id: created.id || `c_${Date.now()}`,
        name: created.clientName,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
      setClients((prev) => [entry, ...prev]);
      setActiveId(entry.id);
      setNewName("");
      setShowModal(false);
    } catch {
      showToast("Failed to create client");
    }
  };

  const deleteClient = async (id) => {
    if (!confirm("Delete this client and all data?")) return;
    await deleteClientData(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setClientData(null);
    }
  };

  // ── Exports ──

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const safeName = (n) => (n || "export").replace(/\s+/g, "_");
  const tabLabel = activeTab === "ips" ? "IPS" : "CPS";

  const exportLLM = () => {
    if (!clientData) return;
    const builder = activeTab === "ips" ? buildLLMExport : buildCPSExport;
    download(
      new Blob([builder(clientData)], { type: "text/plain" }),
      `${tabLabel}_LLM_${safeName(clientData.clientName)}.txt`
    );
  };

  const exportJSON = () => {
    if (!clientData) return;
    download(
      new Blob([JSON.stringify(clientData, null, 2)], {
        type: "application/json",
      }),
      `Client_Data_${safeName(clientData.clientName)}.json`
    );
  };

  const copyLLMPrompt = async () => {
    if (!clientData) return;
    const builder = activeTab === "ips" ? buildLLMExport : buildCPSExport;
    try {
      await navigator.clipboard.writeText(builder(clientData));
      showToast(`${tabLabel} prompt copied to clipboard!`);
    } catch {
      showToast("Failed to copy — check browser permissions");
    }
  };

  // ── Progress (tab-aware) ──

  const currentQIds = activeTab === "ips" ? ALL_QUESTION_IDS : ALL_CPS_QUESTION_IDS;
  const totalAnswered = clientData
    ? currentQIds.filter((id) => isAnswered(clientData.answers[id])).length
    : 0;
  const totalQuestions = currentQIds.length;
  const progressPct =
    totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

  // ── Jump to first unanswered (tab-aware) ──

  const jumpToFirstUnanswered = () => {
    if (!clientData) return;
    const sections = activeTab === "ips" ? SECTIONS : CPS_SECTIONS;
    const qIds = activeTab === "ips" ? ALL_QUESTION_IDS : ALL_CPS_QUESTION_IDS;
    const prefix = activeTab === "ips" ? "" : "cps_";
    const firstId = qIds.find(
      (id) => !isAnswered(clientData.answers[id])
    );
    if (!firstId) {
      showToast(`All ${tabLabel} questions answered!`);
      return;
    }
    for (const s of sections) {
      for (const sub of s.subsections) {
        for (const q of sub.questions) {
          if (q.id === firstId) {
            setCollapsed((prev) => ({ ...prev, [`${prefix}${s.num}`]: false }));
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

  // ── Filtered list ──

  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ──

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#475569",
        }}
      >
        Loading…
      </div>
    );
  }

  const underlineInput = {
    width: "100%",
    padding: "7px 0",
    border: "none",
    borderBottom: "2px solid #e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14.5,
    color: "#1e293b",
    background: "transparent",
    outline: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      <Toast message={toast.message} visible={toast.visible} />

      {/* ── Sidebar ── */}
      <div
        style={{
          width: sidebarOpen ? 280 : 0,
          minWidth: sidebarOpen ? 280 : 0,
          background: "#000000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          transition: "all .25s",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "18px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 17,
              fontWeight: 600,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#5E4D9C" }}>IPS</span> Client Manager
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <div
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,.3)",
              }}
            >
              {Icons.search}
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients..."
              style={{
                width: "100%",
                padding: "8px 10px 8px 32px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {/* New client button */}
          <button
            onClick={() => {
              setShowModal(true);
              setNewName("");
            }}
            style={{
              width: "100%",
              padding: "9px 0",
              borderRadius: 8,
              border: "1.5px dashed rgba(94,77,156,.5)",
              background: "rgba(94,77,156,.08)",
              color: "#5E4D9C",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {Icons.plus} New Client
          </button>
        </div>

        {/* Client list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {filteredClients.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,.3)",
                fontSize: 13,
                marginTop: 40,
              }}
            >
              {clients.length === 0 ? "No clients yet" : "No matches"}
            </div>
          )}
          {filteredClients.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 4,
                cursor: "pointer",
                background:
                  activeId === c.id ? "rgba(43,108,176,.25)" : "transparent",
                border:
                  activeId === c.id
                    ? "1px solid rgba(43,108,176,.4)"
                    : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    activeId === c.id ? "#5E4D9C" : "rgba(255,255,255,.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: activeId === c.id ? "#fff" : "rgba(255,255,255,.4)",
                }}
              >
                {Icons.user}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                  {new Date(c.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClient(c.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,.2)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#f87171")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,.2)")
                }
              >
                {Icons.trash}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            minHeight: 52,
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            padding: "8px 20px",
            gap: 10,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "5px 8px",
              cursor: "pointer",
              color: "#475569",
            }}
          >
            {Icons.menu}
          </button>

          {clientData && (
            <>
              {/* Progress */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 200,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#000000",
                    whiteSpace: "nowrap",
                  }}
                >
                  {clientData.clientName || "Untitled"}
                </span>
                <div
                  onClick={jumpToFirstUnanswered}
                  title="Click to jump to first unanswered question"
                  style={{
                    height: 6,
                    flex: 1,
                    maxWidth: 200,
                    background: "#e2e8f0",
                    borderRadius: 3,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPct}%`,
                      background: "linear-gradient(90deg, #5E4D9C, #8b7bc7)",
                      borderRadius: 3,
                      transition: "width .4s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {totalAnswered}/{totalQuestions}
                </span>
              </div>

              {/* Export buttons */}
              {[
                {
                  label: `Export ${tabLabel} for LLM`,
                  icon: Icons.download,
                  onClick: exportLLM,
                  bg: "#5E4D9C",
                  color: "#FFFFFF",
                  border: "none",
                },
                {
                  label: "JSON",
                  icon: Icons.download,
                  onClick: exportJSON,
                  bg: "transparent",
                  color: "#545459",
                  border: "1px solid #e2e8f0",
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: btn.border,
                    background: btn.bg,
                    color: btn.color,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 60px" }}>
          {!clientData ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#E5E5DE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  color: "#5E4D9C",
                }}
              >
                {Icons.user}
              </div>
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 22,
                  color: "#000000",
                  marginBottom: 6,
                }}
              >
                Select or Create a Client
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#94a3b8",
                  maxWidth: 400,
                  lineHeight: 1.6,
                }}
              >
                Choose a client from the sidebar or create a new one. All data
                saves automatically.
              </p>
              <button
                onClick={() => {
                  setShowModal(true);
                  setNewName("");
                }}
                style={{
                  marginTop: 20,
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#000000",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {Icons.plus} New Client
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              {/* Client info */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  boxShadow: "0 2px 8px rgba(15,42,68,.06)",
                  border: "1px solid #e2e8f0",
                  padding: "20px 24px",
                  marginBottom: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                }}
              >
                {[
                  {
                    label: "Client Name",
                    field: "clientName",
                    placeholder: "Full legal name",
                  },
                  { label: "Date", field: "date", placeholder: "", type: "date" },
                  {
                    label: "Advisor",
                    field: "advisor",
                    placeholder: "Advisor name",
                  },
                ].map((f) => (
                  <div key={f.field}>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        color: "#94a3b8",
                        marginBottom: 5,
                      }}
                    >
                      {f.label}
                    </div>
                    <input
                      type={f.type || "text"}
                      value={clientData[f.field] || ""}
                      onChange={(e) => updateField(f.field, e.target.value)}
                      placeholder={f.placeholder}
                      style={underlineInput}
                      onFocus={(e) =>
                        (e.target.style.borderBottomColor = "#5E4D9C")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderBottomColor = "#e2e8f0")
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  marginBottom: 20,
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15,42,68,.04)",
                }}
              >
                {[
                  { key: "ips", label: "Investment Policy Statement", short: "IPS" },
                  { key: "cps", label: "Custody Policy Statement", short: "CPS" },
                ].map((tab) => {
                  const active = activeTab === tab.key;
                  const ids = tab.key === "ips" ? ALL_QUESTION_IDS : ALL_CPS_QUESTION_IDS;
                  const answered = ids.filter((id) => isAnswered(clientData.answers[id])).length;
                  const total = ids.length;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        border: "none",
                        background: active ? "#000000" : "transparent",
                        color: active ? "#fff" : "#475569",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all .2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontFamily: "'Fraunces', serif", color: active ? "#5E4D9C" : "#94a3b8", fontWeight: 700 }}>
                        {tab.short}
                      </span>
                      <span style={{ display: "inline", fontSize: 12, opacity: 0.7 }}>
                        {tab.label.replace(tab.short + " ", "").replace("Statement", "Stmt")}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: active ? "rgba(94,77,156,.2)" : "#E5E5DE",
                          color: active ? "#5E4D9C" : "#94a3b8",
                          marginLeft: 4,
                        }}
                      >
                        {answered}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* IPS Sections */}
              {activeTab === "ips" && (
                <>
                  {SECTIONS.map((s) => (
                    <SectionCard
                      key={s.num}
                      section={s}
                      answers={clientData.answers}
                      onAnswer={updateAnswer}
                      startNum={SECTION_STARTS[s.num]}
                      collapsed={!!collapsed[s.num]}
                      onToggle={() =>
                        setCollapsed((p) => ({ ...p, [s.num]: !p[s.num] }))
                      }
                    />
                  ))}
                </>
              )}

              {/* CPS Sections */}
              {activeTab === "cps" && (
                <>
                  {CPS_SECTIONS.map((s) => (
                    <SectionCard
                      key={`cps_${s.num}`}
                      section={s}
                      answers={clientData.answers}
                      onAnswer={updateAnswer}
                      startNum={CPS_SECTION_STARTS[s.num]}
                      collapsed={!!collapsed[`cps_${s.num}`]}
                      onToggle={() =>
                        setCollapsed((p) => ({ ...p, [`cps_${s.num}`]: !p[`cps_${s.num}`] }))
                      }
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,68,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "28px 32px",
              width: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 20,
                color: "#000000",
                marginBottom: 16,
              }}
            >
              New Client
            </h3>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createClient()}
              placeholder="Client full name"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1.5px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 15,
                color: "#1e293b",
                outline: "none",
                marginBottom: 16,
              }}
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "transparent",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={createClient}
                style={{
                  padding: "8px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "#000000",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
