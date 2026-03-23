"use client";

import { useState } from "react";
import { Skill, AssignmentStatus } from "@/lib/enums";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  postalCode: string | null;
  phoneNumber?: string | null;
  skills?: Skill[] | string;
  description?: string | null;
};

type Props = {
  volunteer: Volunteer;
  status?: AssignmentStatus | string;
  explanation?: string;
  actionButtons?: React.ReactNode;
  warningNote?: string;
};

export function VolunteerProfileCard({ volunteer, status, explanation, actionButtons, warningNote }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  let parsedSkills: string[] = [];
  if (Array.isArray(volunteer.skills)) {
    parsedSkills = volunteer.skills;
  } else if (typeof volunteer.skills === "string") {
    try {
      parsedSkills = JSON.parse(volunteer.skills);
    } catch (e) {
      console.error("Failed to parse skills", e);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full p-3 rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-2">
        {/* Chunk 1: Identity */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{volunteer.name}</h3>
            {status && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide
                ${status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200' : 
                  status === 'PROPOSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                  'bg-zinc-100 text-zinc-800 border-zinc-200'}`}
              >
                {status}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            {volunteer.email} {volunteer.phoneNumber ? `• ${volunteer.phoneNumber}` : ""}
          </p>
        </div>

        {/* Chunk 2: Logistics & Context */}
        <div className="flex flex-col gap-2 mt-1">
          {volunteer.postalCode && (
            <p className="text-xs text-zinc-600 flex items-center gap-1">
              <span>📍</span> Area Code: {volunteer.postalCode}
            </p>
          )}
          {explanation && (
            <div className="mt-1 inline-block bg-blue-50 border border-blue-100 text-blue-800 text-[11px] px-2 py-1 rounded">
              <span className="font-semibold">System Match:</span> {explanation}
            </div>
          )}
          
          {(parsedSkills.length > 0 || volunteer.description) && (
            <div className="mt-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                {isExpanded ? "Hide details ▲" : "View details ▼"}
              </button>
              
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-col gap-2">
                  {parsedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parsedSkills.map(skill => (
                        <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-medium">
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {volunteer.description && (
                     <p className="text-xs text-zinc-600 italic border-l-2 border-zinc-200 pl-2">
                       &quot;{volunteer.description}&quot;
                     </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chunk 3: Actions */}
      <div className="flex flex-col items-end gap-2 sm:min-w-[120px]">
        {warningNote && (
          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-right w-full">
            {warningNote}
          </span>
        )}
        <div className="flex gap-2 justify-end w-full">
          {actionButtons}
        </div>
      </div>
    </div>
  );
}
