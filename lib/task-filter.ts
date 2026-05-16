import { Skill } from "./enums";

export type TaskFilterState = { skills: Skill[]; postalCode: string };

export const EMPTY_FILTER: TaskFilterState = { skills: [], postalCode: "" };

type FilterableTask = { requiredSkills: string; postalCode: string | null };

export function parseSkills(json: string): Skill[] {
  try {
    return JSON.parse(json) as Skill[];
  } catch {
    return [];
  }
}

export function isFilterActive(f: TaskFilterState): boolean {
  return f.skills.length > 0 || f.postalCode.trim() !== "";
}

export function filterTasks<T extends FilterableTask>(tasks: T[], f: TaskFilterState): T[] {
  if (!isFilterActive(f)) return tasks;
  const pc = f.postalCode.trim().toLowerCase();
  return tasks.filter((t) => {
    if (f.skills.length > 0) {
      const req = parseSkills(t.requiredSkills);
      if (!f.skills.some((s) => req.includes(s))) return false;
    }
    if (pc !== "") {
      if (!t.postalCode || !t.postalCode.toLowerCase().startsWith(pc)) return false;
    }
    return true;
  });
}
