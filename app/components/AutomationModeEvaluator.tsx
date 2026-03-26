"use client";

import { useState } from "react";
import { AutomationMode, Priority } from "@/lib/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type RiskScore = 1 | 2 | 3;

type RiskFactor = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  value: AutomationMode;
  onChange: (mode: AutomationMode) => void;
  /** Task priority already selected on the form — used to pre-seed Urgency */
  taskPriority?: Priority;
};

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const RISK_FACTORS: RiskFactor[] = [
  {
    id: "physicalDanger",
    label: "Physical Danger",
    description: "Volunteers could be harmed (e.g. hazardous environments, heavy machinery).",
  },
  {
    id: "legalLiability",
    label: "Legal Liability",
    description: "Task involves regulated activities, contracts, or professional licences.",
  },
  {
    id: "dataSensitivity",
    label: "Data Sensitivity",
    description: "Volunteers handle personal, medical, or confidential information.",
  },
  {
    id: "certificationRequired",
    label: "Special Certification Required",
    description: "A formal qualification is needed and must be manually verified.",
  },
];

const RISK_SCORE_LABELS: { value: RiskScore; label: string; color: string }[] = [
  { value: 1, label: "Low", color: "green" },
  { value: 2, label: "Med", color: "yellow" },
  { value: 3, label: "High", color: "red" },
];

// ---------------------------------------------------------------------------
// Pure calculation helpers (easy to unit-test in isolation)
// ---------------------------------------------------------------------------

export function calcRiskLevel(scores: Record<string, RiskScore>): RiskLevel {
  const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
  if (total <= 5) return "LOW";
  if (total <= 8) return "MEDIUM";
  return "HIGH";
}

export function calcRiskTotal(scores: Record<string, RiskScore>): number {
  return Object.values(scores).reduce((sum, s) => sum + s, 0);
}

export function decisionMatrix(
  risk: RiskLevel,
  urgency: RiskLevel,
  certificationHigh = false,
): AutomationMode {
  // Hard constraint: high certification risk always requires manual oversight.
  if (certificationHigh) return AutomationMode.MANUAL;

  if (urgency === "LOW") {
    if (risk === "LOW") return AutomationMode.AUTO;
    return AutomationMode.SEMI_AUTO;
  }
  if (urgency === "MEDIUM") {
    if (risk === "LOW") return AutomationMode.AUTO;
    if (risk === "MEDIUM") return AutomationMode.SEMI_AUTO;
    return AutomationMode.MANUAL;
  }
  // urgency HIGH
  if (risk === "LOW") return AutomationMode.SEMI_AUTO;
  return AutomationMode.MANUAL;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ModeInfo = {
  label: string;
  tagline: string;
  detail: string;
  badge: string;
  ring: string;
  badgeBg: string;
};

const MODE_INFO: Record<AutomationMode, ModeInfo> = {
  [AutomationMode.MANUAL]: {
    label: "Mode 1 — Strict Manual Oversight",
    tagline: "You review every applicant",
    detail:
      "High risk or high urgency. No automatic actions — you contact and vet volunteers offline before accepting each one.",
    badge: "text-orange-800 border-orange-300 bg-orange-50",
    ring: "ring-orange-500 border-orange-400",
    badgeBg: "bg-orange-100",
  },
  [AutomationMode.SEMI_AUTO]: {
    label: "Mode 2 — Shared Control",
    tagline: "System scores; you approve",
    detail:
      "Balanced risk and urgency. The system ranks applicants by skill & location fit. You confirm or override each suggestion.",
    badge: "text-blue-800 border-blue-300 bg-blue-50",
    ring: "ring-blue-500 border-blue-400",
    badgeBg: "bg-blue-100",
  },
  [AutomationMode.AUTO]: {
    label: "Mode 3 — High Automation, Light Oversight",
    tagline: "Instant acceptance up to capacity",
    detail:
      "Low risk, low urgency. Valid applicants are auto-accepted the moment they apply. You can review after the fact.",
    badge: "text-green-800 border-green-300 bg-green-50",
    ring: "ring-green-500 border-green-400",
    badgeBg: "bg-green-100",
  },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = {
    LOW: "bg-green-100 text-green-800 border-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    HIGH: "bg-red-100 text-red-800 border-red-200",
  }[level];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cfg}`}>
      {level}
    </span>
  );
}

function ScoreButton({
  score,
  selected,
  onClick,
}: {
  score: RiskScore;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = RISK_SCORE_LABELS.find((s) => s.value === score)!;
  const colors: Record<string, { active: string; idle: string }> = {
    green: {
      active: "bg-green-600 text-white border-green-600",
      idle: "bg-white text-green-700 border-green-300 hover:bg-green-50",
    },
    yellow: {
      active: "bg-yellow-500 text-white border-yellow-500",
      idle: "bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50",
    },
    red: {
      active: "bg-red-600 text-white border-red-600",
      idle: "bg-white text-red-700 border-red-300 hover:bg-red-50",
    },
  };
  const c = colors[cfg.color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${selected ? c.active : c.idle}`}
    >
      {cfg.label}
    </button>
  );
}

// Map Priority enum → RiskLevel for pre-seeding urgency
function priorityToUrgency(p?: Priority): RiskLevel {
  if (!p) return "MEDIUM";
  if (p === Priority.LOW) return "LOW";
  if (p === Priority.CRITICAL || p === Priority.HIGH) return "HIGH";
  return "MEDIUM";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AutomationModeEvaluator({ value, onChange, taskPriority }: Props) {
  // "direct" — show plain radio cards; "guided" — show the evaluator wizard
  const [uiMode, setUiMode] = useState<"direct" | "guided">("direct");

  // Guided-mode state
  const defaultScores = Object.fromEntries(
    RISK_FACTORS.map((f) => [f.id, 1 as RiskScore]),
  ) as Record<string, RiskScore>;
  const [riskScores, setRiskScores] = useState<Record<string, RiskScore>>(defaultScores);
  const [urgency, setUrgency] = useState<RiskLevel>(priorityToUrgency(taskPriority));
  const [applied, setApplied] = useState(false);

  const certificationHigh = riskScores["certificationRequired"] === 3;
  const riskLevel = calcRiskLevel(riskScores);
  const riskTotal = calcRiskTotal(riskScores);
  const recommendedMode = decisionMatrix(riskLevel, urgency, certificationHigh);

  function applyRecommendation() {
    onChange(recommendedMode);
    setApplied(true);
  }

  function handleDirectChange(mode: AutomationMode) {
    onChange(mode);
    setApplied(false);
  }

  // -------------------------------------------------------------------------
  // Render: Direct mode
  // -------------------------------------------------------------------------

  const directSection = (
    <div className="grid gap-3 sm:grid-cols-3">
      {([AutomationMode.MANUAL, AutomationMode.SEMI_AUTO, AutomationMode.AUTO] as AutomationMode[]).map(
        (mode) => {
          const info = MODE_INFO[mode];
          const selected = value === mode;
          return (
            <label
              key={mode}
              className={`flex cursor-pointer flex-col rounded-md border p-3 transition-all ${
                selected
                  ? `${info.ring} ring-1 bg-white`
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="automationMode"
                  value={mode}
                  checked={selected}
                  onChange={() => handleDirectChange(mode)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600"
                />
                <span className="font-semibold text-sm">{info.label}</span>
              </div>
              <p className="mt-1 ml-6 text-xs text-zinc-500">{info.tagline}</p>
              <p className="mt-1 ml-6 text-[11px] text-zinc-400 leading-relaxed">{info.detail}</p>
            </label>
          );
        },
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Render: Guided evaluator
  // -------------------------------------------------------------------------

  const guidedSection = (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-5">
      {/* Risk factors table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-800">Step 1 — Rate each risk factor</h3>
        <div className="space-y-2">
          {RISK_FACTORS.map((factor) => (
            <div
              key={factor.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800">{factor.label}</p>
                <p className="text-[11px] text-zinc-500 leading-snug">{factor.description}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {([1, 2, 3] as RiskScore[]).map((s) => (
                  <ScoreButton
                    key={s}
                    score={s}
                    selected={riskScores[factor.id] === s}
                    onClick={() =>
                      setRiskScores((prev) => ({ ...prev, [factor.id]: s }))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Urgency selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-800">Step 2 — Select task urgency</h3>
        <div className="flex gap-2">
          {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((u) => {
            const colors = {
              LOW: { active: "bg-green-600 text-white border-green-600", idle: "bg-white text-green-700 border-green-300 hover:bg-green-50" },
              MEDIUM: { active: "bg-yellow-500 text-white border-yellow-500", idle: "bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50" },
              HIGH: { active: "bg-red-600 text-white border-red-600", idle: "bg-white text-red-700 border-red-300 hover:bg-red-50" },
            }[u];
            return (
              <button
                key={u}
                type="button"
                onClick={() => { setUrgency(u); setApplied(false); }}
                className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition-colors ${urgency === u ? colors.active : colors.idle}`}
              >
                {u}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live result panel */}
      <div className={`rounded-md border-2 p-4 space-y-3 transition-all ${MODE_INFO[recommendedMode].ring}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            <span>
              Risk score: <strong className="text-zinc-800">{riskTotal} / 12</strong>
            </span>
            <span className="flex items-center gap-1">
              Overall risk: <RiskBadge level={riskLevel} />
            </span>
            <span className="flex items-center gap-1">
              Urgency: <RiskBadge level={urgency} />
            </span>
          </div>
        </div>

        {certificationHigh && (
          <p className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-[11px] font-semibold text-orange-800">
            Override active — Special Certification is rated High. Manual oversight is required regardless of other factors.
          </p>
        )}

        <div className={`rounded-md border px-3 py-2 ${MODE_INFO[recommendedMode].badge}`}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5">Recommendation</p>
          <p className="text-sm font-semibold">{MODE_INFO[recommendedMode].label}</p>
          <p className="text-[11px] mt-0.5 leading-relaxed">{MODE_INFO[recommendedMode].detail}</p>
        </div>

        <button
          type="button"
          onClick={applyRecommendation}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          {applied && value === recommendedMode ? "Applied" : "Apply recommendation"}
        </button>
      </div>

      {/* 3x3 matrix legend */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800 select-none list-none flex items-center gap-1">
          <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
          View full decision matrix
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="border border-zinc-200 bg-zinc-100 px-2 py-1 text-left font-semibold">Urgency \ Risk</th>
                <th className="border border-zinc-200 bg-green-50 px-2 py-1 font-semibold text-green-800">LOW Risk</th>
                <th className="border border-zinc-200 bg-yellow-50 px-2 py-1 font-semibold text-yellow-800">MEDIUM Risk</th>
                <th className="border border-zinc-200 bg-red-50 px-2 py-1 font-semibold text-red-800">HIGH Risk</th>
              </tr>
            </thead>
            <tbody>
              {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((u) => (
                <tr key={u}>
                  <td className="border border-zinc-200 bg-zinc-50 px-2 py-1 font-semibold">{u}</td>
                  {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((r) => {
                    const m = decisionMatrix(r, u);
                    const isActive = r === riskLevel && u === urgency && !certificationHigh;
                    const cellBg = isActive ? MODE_INFO[m].badgeBg : "bg-white";
                    const modeLabels: Record<AutomationMode, string> = {
                      [AutomationMode.MANUAL]: "Mode 1 — Manual",
                      [AutomationMode.SEMI_AUTO]: "Mode 2 — Semi-Auto",
                      [AutomationMode.AUTO]: "Mode 3 — Auto",
                    };
                    return (
                      <td
                        key={r}
                        className={`border border-zinc-200 px-2 py-1 ${cellBg} ${isActive ? "font-bold ring-2 ring-inset ring-zinc-400" : ""}`}
                      >
                        {modeLabels[m]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );

  // -------------------------------------------------------------------------
  // Render: outer shell with toggle
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setUiMode("direct")}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
            uiMode === "direct"
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          Choose directly
        </button>
        <button
          type="button"
          onClick={() => { setUiMode("guided"); setApplied(false); }}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
            uiMode === "guided"
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          Guide me through mode selection
        </button>
        {/* Show currently applied mode badge whenever a selection exists */}
        {value && (
          <span className={`ml-auto rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide ${MODE_INFO[value].badge}`}>
            {value === AutomationMode.MANUAL ? "Mode 1" : value === AutomationMode.SEMI_AUTO ? "Mode 2" : "Mode 3"} selected
          </span>
        )}
      </div>

      {uiMode === "direct" ? directSection : guidedSection}
    </div>
  );
}
