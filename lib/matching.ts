import {
  Task,
  Volunteer,
  Availability,
} from "@prisma/client";
import { Skill, Priority, AssignmentStatus } from "./enums";

export type ScoredVolunteer = {
  volunteer: Volunteer & { availabilityBlocks: Availability[] };
  score: number;
  explanation: string;
};

export function scoreVolunteerForTask(
  volunteer: Volunteer & { availabilityBlocks: Availability[] },
  task: Task,
): ScoredVolunteer | null {
  // Since skills are stored as JSON strings in SQLite, we need to parse them
  const volunteerSkills = JSON.parse(volunteer.skills) as Skill[];
  const requiredSkills = JSON.parse(task.requiredSkills) as Skill[];

  const skillScore = computeSkillScore(volunteerSkills, requiredSkills);
  if (skillScore <= 0) {
    return null;
  }

  const locationScore = computeLocationScore(
    volunteer.postalCode ?? null,
    task.postalCode,
  );

  const availabilityOk = hasAvailabilityForTask(
    volunteer.availabilityBlocks,
    task.startTime,
    task.endTime,
  );
  if (!availabilityOk) {
    return null;
  }

  const priorityBoost = computePriorityBoost(task.priority as Priority);

  const score = skillScore * 3 + locationScore * 2 + priorityBoost;

  const explanationParts: string[] = [];
  explanationParts.push(`Skills match score: ${skillScore}`);
  if (locationScore > 0) {
    explanationParts.push("Same or nearby postal code");
  }
  explanationParts.push("Available during task time window");

  return {
    volunteer,
    score,
    explanation: explanationParts.join("; "),
  };
}

export function computeSkillScore(
  volunteerSkills: Skill[],
  requiredSkills: Skill[],
): number {
  if (requiredSkills.length === 0) return 1;
  const matched = requiredSkills.filter((s) =>
    volunteerSkills.includes(s),
  ).length;
  return matched;
}

export function computeLocationScore(
  volunteerPostal: string | null,
  taskPostal: string | null,
): number {
  if (!volunteerPostal || !taskPostal) return 0;
  if (volunteerPostal === taskPostal) return 2;
  if (
    volunteerPostal.slice(0, 2) === taskPostal.slice(0, 2) ||
    volunteerPostal.slice(0, 3) === taskPostal.slice(0, 3)
  ) {
    return 1;
  }
  return 0;
}

export function hasAvailabilityForTask(
  availabilityBlocks: Availability[],
  taskStart: Date,
  taskEnd: Date,
): boolean {
  if (availabilityBlocks.length === 0) {
    return true;
  }
  return availabilityBlocks.some((block) => {
    const start = block.start;
    const end = block.end;
    return start <= taskStart && end >= taskEnd;
  });
}

export function computePriorityBoost(priority: Priority): number {
  switch (priority) {
    case Priority.CRITICAL:
      return 3;
    case Priority.HIGH:
      return 2;
    case Priority.MEDIUM:
      return 1;
    case Priority.LOW:
    default:
      return 0;
  }
}

export function isAssignmentActive(status: string): boolean {
  return (
    status === AssignmentStatus.PROPOSED ||
    status === AssignmentStatus.ACCEPTED
  );
}
