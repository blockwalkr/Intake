/**
 * Persistent storage helpers (uses window.storage API)
 * and LLM-optimized export builder.
 */
import SECTIONS from "./questions";

// ── Storage ──────────────────────────────────────────

async function get(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

async function set(key, value) {
  await window.storage.set(key, JSON.stringify(value));
}

async function remove(key) {
  try { await window.storage.delete(key); } catch { /* noop */ }
}

export async function loadClientList() { return (await get("ips-cl")) || []; }
export async function saveClientList(list) { await set("ips-cl", list); }
export async function loadClientData(id) { return get(`ips-d-${id}`); }
export async function saveClientData(id, data) { await set(`ips-d-${id}`, data); }
export async function deleteClientData(id) { await remove(`ips-d-${id}`); }

export function freshClientData(name) {
  return {
    clientName: name || "",
    date: new Date().toISOString().split("T")[0],
    advisor: "",
    answers: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Answer detection ─────────────────────────────────

export function isAnswered(answer) {
  if (!answer) return false;
  const { selections, value, followUpChecks, goals, accountValues } = answer;
  return (
    (selections?.length > 0) ||
    (value?.trim()?.length > 0) ||
    (followUpChecks?.length > 0) ||
    (goals?.some((g) => g.goal || g.amount || g.timeline)) ||
    (accountValues && Object.keys(accountValues).length > 0)
  );
}

// ── LLM export ───────────────────────────────────────

export function buildLLMExport(clientData) {
  const line = (s) => s;
  const rule = (ch, n = 72) => ch.repeat(n);
  const L = [];

  L.push(rule("="));
  L.push("INVESTMENT POLICY STATEMENT — CLIENT INTAKE DATA");
  L.push(rule("="));
  L.push("");
  L.push(`Client Name: ${clientData.clientName || "[Not provided]"}`);
  L.push(`Date: ${clientData.date || "[Not provided]"}`);
  L.push(`Advisor: ${clientData.advisor || "[Not provided]"}`);
  L.push(`Updated: ${new Date(clientData.updatedAt).toLocaleString()}`);
  L.push("");

  let questionNumber = 0;

  SECTIONS.forEach((section) => {
    L.push(rule("-"));
    L.push(`SECTION ${section.num}: ${section.title.toUpperCase()}`);
    L.push(rule("-"));
    L.push("");

    section.subsections.forEach((sub) => {
      if (sub.label) L.push(`### ${sub.label}`);

      sub.questions.forEach((qDef) => {
        questionNumber++;
        const a = clientData.answers[qDef.id] || {};

        const selections = a.selections?.length ? a.selections : null;
        const freeText = a.value?.trim() || null;
        const followUpChecks = a.followUpChecks?.length ? a.followUpChecks.join(", ") : null;
        const goals = a.goals?.filter((g) => g.goal || g.amount || g.timeline);
        const accountValues = a.accountValues && Object.keys(a.accountValues).length ? a.accountValues : null;

        const hasAny = selections || freeText || followUpChecks || goals?.length || accountValues;

        L.push(`Q${questionNumber}. ${qDef.q}`);

        if (!hasAny) {
          L.push("   → [NO RESPONSE PROVIDED]");
        } else {
          if (selections && accountValues) {
            selections.forEach((s) => {
              const v = accountValues[s];
              L.push(`   → ${s}${v ? ": $" + v : ""}`);
            });
          } else if (selections) {
            L.push(`   → Selected: ${selections.join(", ")}`);
          }
          if (followUpChecks) L.push(`   → Also: ${followUpChecks}`);
          if (freeText) L.push(`   → ${freeText}`);
          if (goals?.length) {
            goals.forEach((g, i) =>
              L.push(`   → Goal ${i + 1}: ${g.goal || "[unnamed]"} | Target: ${g.amount || "[not specified]"} | Timeline: ${g.timeline || "[not specified]"}`)
            );
          }
        }
        L.push("");
      });
    });
  });

  L.push(rule("="));
  L.push("END OF CLIENT INTAKE DATA");
  L.push(rule("="));
  L.push("");
  L.push(rule("─"));
  L.push("INSTRUCTIONS FOR IPS GENERATION");
  L.push(rule("─"));
  L.push("");
  L.push(
    "You are an investment advisor representative drafting a formal Investment Policy Statement (IPS) for the client above.",
    "Using the intake data provided, generate a comprehensive, personalized IPS document following this structure:",
    "",
    "1. EXECUTIVE SUMMARY — Brief overview of situation, goals, recommended strategy.",
    "",
    "2. INVESTOR PROFILE — Personal background, employment, income, net worth, dependents, insurance, accounts from Section 1.",
    "",
    "3. INVESTMENT OBJECTIVES",
    "   A. Return Objectives: Derive a reasonable return target from goals, milestones, income needs, and growth preferences (Section 2). Justify a range based on goals and time horizon — do NOT simply restate a client-provided number.",
    "   B. Risk Objectives: Synthesize willingness (Section 3 behavioral responses) with capacity (financial cushion, income stability). Classify as Conservative / Moderately Conservative / Moderate / Moderately Aggressive / Aggressive with rationale.",
    "",
    "4. INVESTMENT CONSTRAINTS",
    "   A. Time Horizon — from Section 4 with flexibility notes.",
    "   B. Liquidity — from Section 5 with quantified needs.",
    "   C. Tax — from Section 6 with asset location recommendations.",
    "   D. Legal & Regulatory — from Section 7.",
    "   E. Unique Circumstances — from Section 8.",
    "",
    "5. ASSET ALLOCATION POLICY — Target percentages, ±5% permissible ranges, prohibited investments per client preferences, vehicle preferences.",
    "",
    "6. REBALANCING POLICY — Consistent with Section 10 review preferences.",
    "",
    "7. PERFORMANCE BENCHMARKS — Blended benchmark matching the proposed allocation.",
    "",
    "8. MONITORING & REVIEW — Reporting frequency, review schedule, communication preferences, revision triggers from Section 10.",
    "",
    "9. ROLES & RESPONSIBILITIES — Advisor and client duties. Incorporate delegation/authority from Section 9.",
    "",
    "10. SIGNATURES — Blocks for client, co-client/spouse (if applicable per marital status), and advisor.",
    "",
    "FORMATTING REQUIREMENTS:",
    "- Use formal, professional language appropriate for a legal/financial document.",
    "- Where the client left a question unanswered ([NO RESPONSE PROVIDED]), note it as \"To be discussed\" or \"Pending client input\" — do not guess.",
    "- Include the client's name and date throughout as appropriate.",
    "- The IPS should be a standalone document ready for client review, not a summary of the questionnaire."
  );

  return L.join("\n");
}
