import { useEffect, useRef } from "react";
import { isAnswered } from "./storage";

// ── Icons ────────────────────────────────────────────

export const Icons = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M5.3 4V2.7a1.3 1.3 0 011.3-1.3h2.8a1.3 1.3 0 011.3 1.3V4m2 0v9.3a1.3 1.3 0 01-1.3 1.3H4.6a1.3 1.3 0 01-1.3-1.3V4h9.4z" />
    </svg>
  ),
  download: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1.5a1 1 0 001 1h10a1 1 0 001-1V12" />
    </svg>
  ),
  file: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1H4a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 004 15h8a1.5 1.5 0 001.5-1.5V5.5L9 1z" />
      <path d="M9 1v5h4.5" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6l4 4 4-4" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3.5 3.5" />
    </svg>
  ),
  info: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7v4M8 5.5v0" />
    </svg>
  ),
  menu: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  ),
};

// ── Style helpers ────────────────────────────────────

const pill = (selected) => ({
  padding: "7px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: selected ? 600 : 500,
  cursor: "pointer",
  border: selected ? "1.5px solid #2b6cb0" : "1.5px solid #cbd5e1",
  background: selected ? "#d0e2f4" : "#fff",
  color: selected ? "#0f2a44" : "#475569",
  transition: "all .15s",
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'DM Sans', sans-serif",
});

const smallPill = (selected) => ({
  ...pill(selected),
  padding: "6px 12px",
  fontSize: 12.5,
  border: selected ? "1.5px solid #2b6cb0" : "1.5px solid #e2e8f0",
  background: selected ? "#e8f0fa" : "#fafbfd",
  color: selected ? "#0f2a44" : "#64748b",
});

const inputBase = {
  width: "100%",
  padding: "8px 10px",
  border: "1.5px solid #cbd5e1",
  borderRadius: 7,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  background: "#fff",
};

// ── AutoTextarea ─────────────────────────────────────

export function AutoTextarea({ value, onChange, placeholder, style, minRows }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      rows={minRows || 1}
      style={{
        width: "100%",
        padding: "9px 12px",
        border: "1.5px solid #cbd5e1",
        borderRadius: 8,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13.5,
        color: "#1e293b",
        resize: "none",
        overflow: "hidden",
        outline: "none",
        lineHeight: 1.6,
        background: "#fff",
        ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = "#2b6cb0")}
      onBlur={(e) =>
        (e.target.style.borderColor = style?.borderColor || "#cbd5e1")
      }
    />
  );
}

// ── Toast ────────────────────────────────────────────

export function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        background: "#0f2a44",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 30px rgba(0,0,0,.2)",
        opacity: visible ? 1 : 0,
        transition: "all .3s",
        pointerEvents: "none",
        zIndex: 999,
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Icons.info} {message}
    </div>
  );
}

// ── QuestionBlock ────────────────────────────────────

export function QuestionBlock({ qDef, answer, onChange, num }) {
  const q = qDef;
  const a = answer || {};

  // Radio toggle (click again to deselect)
  const toggleRadio = (opt) => {
    onChange(
      a.selections?.includes(opt)
        ? { ...a, selections: [] }
        : { ...a, selections: [opt] }
    );
  };

  // Checkbox with none-exclusion
  const toggleCheck = (opt) => {
    const prev = a.selections || [];
    const isNone = q.noneOptions?.includes(opt);
    if (prev.includes(opt))
      onChange({ ...a, selections: prev.filter((x) => x !== opt) });
    else if (isNone) onChange({ ...a, selections: [opt] });
    else
      onChange({
        ...a,
        selections: [
          ...prev.filter((x) => !q.noneOptions?.includes(x)),
          opt,
        ],
      });
  };

  // Follow-up chips
  const toggleFollowUpCheck = (opt) => {
    const prev = a.followUpChecks || [];
    onChange({
      ...a,
      followUpChecks: prev.includes(opt)
        ? prev.filter((x) => x !== opt)
        : [...prev, opt],
    });
  };

  // Checkval (checkbox + inline value)
  const accountValues = a.accountValues || {};
  const toggleCheckVal = (opt) => {
    const prev = a.selections || [];
    const isNone = q.noneOptions?.includes(opt);
    let nextSel;
    let nextVals = { ...accountValues };
    if (prev.includes(opt)) {
      nextSel = prev.filter((x) => x !== opt);
      delete nextVals[opt];
    } else if (isNone) {
      nextSel = [opt];
      nextVals = {};
    } else {
      nextSel = [...prev.filter((x) => !q.noneOptions?.includes(x)), opt];
    }
    onChange({ ...a, selections: nextSel, accountValues: nextVals });
  };
  const setAccountValue = (opt, val) =>
    onChange({ ...a, accountValues: { ...accountValues, [opt]: val } });

  // Goals
  const goals = a.goals || [{ goal: "", amount: "", timeline: "" }];
  const setGoalField = (i, field, val) => {
    const g = [...goals];
    g[i] = { ...g[i], [field]: val };
    onChange({ ...a, goals: g });
  };
  const addGoal = () =>
    onChange({
      ...a,
      goals: [...goals, { goal: "", amount: "", timeline: "" }],
    });
  const removeGoal = (i) => {
    const g = goals.filter((_, j) => j !== i);
    onChange({
      ...a,
      goals: g.length ? g : [{ goal: "", amount: "", timeline: "" }],
    });
  };

  const answered = isAnswered(a);

  return (
    <div
      data-qid={q.id}
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        marginBottom: 12,
        border: answered ? "1px solid #86efac" : "1px solid transparent",
        borderLeft: answered ? "3px solid #16a34a" : "3px solid transparent",
        background: answered ? "#f0fdf4" : "transparent",
        transition: "all .2s",
      }}
    >
      {/* Question label */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 14,
            color: "#2b6cb0",
            minWidth: 28,
          }}
        >
          {num}.
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.55,
            color: "#1e293b",
          }}
        >
          {q.q}
        </span>
      </div>

      {/* text */}
      {q.type === "text" && (
        <AutoTextarea
          value={a.value}
          onChange={(e) => onChange({ ...a, value: e.target.value })}
          placeholder="Type answer here..."
          minRows={2}
        />
      )}

      {/* combo (single-select) */}
      {q.type === "combo" && (
        <>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}
          >
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => toggleRadio(o)}
                style={pill(a.selections?.includes(o))}
              >
                {a.selections?.includes(o) && (
                  <span
                    style={{ fontSize: 11, fontWeight: 800, color: "#2b6cb0" }}
                  >
                    ●
                  </span>
                )}
                {o}
              </button>
            ))}
          </div>
          {q.followUpCheck && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginTop: 8,
              }}
            >
              {q.followUpCheck.map((o) => {
                const c = a.followUpChecks?.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleFollowUpCheck(o)}
                    style={smallPill(c)}
                  >
                    {c && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#2b6cb0",
                        }}
                      >
                        ✓
                      </span>
                    )}
                    {o}
                  </button>
                );
              })}
            </div>
          )}
          {q.followUp && (
            <AutoTextarea
              value={a.value}
              onChange={(e) => onChange({ ...a, value: e.target.value })}
              placeholder={q.followUp}
              minRows={1}
              style={{ marginTop: 8, borderColor: "#e2e8f0" }}
            />
          )}
        </>
      )}

      {/* check (multi-select) */}
      {q.type === "check" && (
        <>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}
          >
            {q.options.map((o) => {
              const c = a.selections?.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleCheck(o)}
                  style={pill(c)}
                >
                  {c && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#2b6cb0",
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {o}
                </button>
              );
            })}
          </div>
          {q.followUp && (
            <AutoTextarea
              value={a.value}
              onChange={(e) => onChange({ ...a, value: e.target.value })}
              placeholder={q.followUp}
              minRows={1}
              style={{ marginTop: 4, borderColor: "#e2e8f0" }}
            />
          )}
        </>
      )}

      {/* goals (repeating rows) */}
      {q.type === "goals" && (
        <div>
          {goals.map((g, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <input
                value={g.goal}
                onChange={(e) => setGoalField(i, "goal", e.target.value)}
                placeholder="Goal (e.g., Retirement)"
                style={{ ...inputBase, flex: 2 }}
                onFocus={(e) => (e.target.style.borderColor = "#2b6cb0")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
              <input
                value={g.amount}
                onChange={(e) => setGoalField(i, "amount", e.target.value)}
                placeholder="Target amount"
                style={{ ...inputBase, flex: 1 }}
                onFocus={(e) => (e.target.style.borderColor = "#2b6cb0")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
              <input
                value={g.timeline}
                onChange={(e) => setGoalField(i, "timeline", e.target.value)}
                placeholder="Timeline"
                style={{ ...inputBase, flex: 1 }}
                onFocus={(e) => (e.target.style.borderColor = "#2b6cb0")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addGoal}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1.5px dashed #2b6cb0",
              background: "rgba(43,108,176,.04)",
              color: "#2b6cb0",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            + Add Goal
          </button>
        </div>
      )}

      {/* checkval (checkbox + inline balance) */}
      {q.type === "checkval" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((o) => {
            const sel = a.selections?.includes(o);
            const isNone = q.noneOptions?.includes(o);
            return (
              <div
                key={o}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <button
                  type="button"
                  onClick={() => toggleCheckVal(o)}
                  style={{ ...pill(sel), flexShrink: 0 }}
                >
                  {sel && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#2b6cb0",
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {o}
                </button>
                {sel && !isNone && (
                  <input
                    value={accountValues[o] || ""}
                    onChange={(e) => setAccountValue(o, e.target.value)}
                    placeholder="$ Balance"
                    style={{ ...inputBase, maxWidth: 180 }}
                    onFocus={(e) => (e.target.style.borderColor = "#2b6cb0")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SectionCard ──────────────────────────────────────

export function SectionCard({
  section,
  answers,
  onAnswer,
  startNum,
  collapsed,
  onToggle,
}) {
  let localNum = startNum;
  const totalQuestions = section.subsections.reduce(
    (n, sub) => n + sub.questions.length,
    0
  );
  const answeredCount = section.subsections.reduce(
    (n, sub) =>
      n + sub.questions.filter((q) => isAnswered(answers[q.id])).length,
    0
  );
  const complete = answeredCount === totalQuestions && totalQuestions > 0;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 1px 4px rgba(15,42,68,.06)",
        border: "1px solid #e2e8f0",
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          background: "linear-gradient(135deg, #0f2a44, #1a3a5c)",
          color: "#fff",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "1.5px solid #c9a84c",
            background: "rgba(201,168,76,.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 15,
            color: "#c9a84c",
            flexShrink: 0,
          }}
        >
          {section.num}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {section.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,.5)",
              marginTop: 1,
            }}
          >
            {section.subtitle}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: complete
              ? "rgba(34,197,94,.25)"
              : "rgba(255,255,255,.12)",
            color: complete ? "#86efac" : "rgba(255,255,255,.65)",
          }}
        >
          {answeredCount}/{totalQuestions}
        </div>
        <div
          style={{
            transition: "transform .25s",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0)",
            color: "rgba(255,255,255,.45)",
          }}
        >
          {Icons.chevron}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: "6px 22px 22px" }}>
          {section.instruction && (
            <div
              style={{
                fontSize: 13,
                color: "#475569",
                fontStyle: "italic",
                background: "#e8f0fa",
                borderLeft: "3px solid #2b6cb0",
                padding: "9px 13px",
                borderRadius: "0 6px 6px 0",
                margin: "12px 0 14px",
              }}
            >
              {section.instruction}
            </div>
          )}
          {section.subsections.map((sub, si) => (
            <div key={si}>
              {sub.label && (
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".09em",
                    color: "#2b6cb0",
                    margin: "20px 0 10px",
                    paddingBottom: 5,
                    borderBottom: "2px solid #e8f0fa",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 14,
                      background: "#2b6cb0",
                      borderRadius: 2,
                    }}
                  />
                  {sub.label}
                </div>
              )}
              {sub.questions.map((qDef) => {
                const displayNum = ++localNum;
                return (
                  <QuestionBlock
                    key={qDef.id}
                    qDef={qDef}
                    answer={answers[qDef.id]}
                    onChange={(val) => onAnswer(qDef.id, val)}
                    num={displayNum - 1}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
