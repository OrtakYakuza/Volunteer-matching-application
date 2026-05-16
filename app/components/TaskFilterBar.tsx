"use client";

import { Skill } from "@/lib/enums";
import { TaskFilterState, EMPTY_FILTER, isFilterActive } from "@/lib/task-filter";

const SKILL_LABELS: Record<Skill, string> = {
  [Skill.HEAVY_PHYSICAL]: "Heavy Physical",
  [Skill.MEDIUM_PHYSICAL]: "Medium Physical",
  [Skill.LIGHT_PHYSICAL]: "Light Physical",
  [Skill.MEDICAL]: "Medical",
  [Skill.TRANSLATION]: "Translation",
  [Skill.CHILDCARE]: "Childcare",
  [Skill.ADMINISTRATION]: "Administration",
  [Skill.INFORMATION_RETRIEVAL]: "Information Retrieval",
  [Skill.OTHER]: "Other",
};

type Props = {
  value: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  onUseMySkills?: () => void;
  mySkillsCount?: number;
};

export function TaskFilterBar({ value, onChange, onUseMySkills, mySkillsCount }: Props) {
  const active = isFilterActive(value);

  const toggleSkill = (skill: Skill) => {
    const next = value.skills.includes(skill)
      ? value.skills.filter((s) => s !== skill)
      : [...value.skills, skill];
    onChange({ ...value, skills: next });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-zinc-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-700">Filter tasks</p>
        {active && (
          <button
            onClick={() => onChange(EMPTY_FILTER)}
            className="text-[11px] text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.values(Skill) as Skill[]).map((skill) => {
            const selected = value.skills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  selected
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {SKILL_LABELS[skill]}
              </button>
            );
          })}
        </div>
        {onUseMySkills && (
          <button
            onClick={onUseMySkills}
            disabled={!mySkillsCount}
            className="mt-2 text-[11px] text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            Show tasks matching my skills{mySkillsCount ? ` (${mySkillsCount})` : ""}
          </button>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Postal code</p>
        <input
          type="text"
          placeholder="e.g. 10"
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          className="w-36 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 placeholder-zinc-400 focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
