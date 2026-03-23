"use client";

import { useState, useEffect } from "react";

export function CoordinatorOnboarding() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // R14: Expertise Reversal - only show to novices (first time)
    const hasSeen = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm relative">
      <button 
        onClick={dismiss}
        className="absolute top-2 right-3 text-blue-500 hover:text-blue-800 font-bold"
        aria-label="Dismiss tutorial"
      >
        ✕
      </button>
      <h2 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
        <span>👋</span> Welcome to the CrisisMatch Coordinator Dashboard
      </h2>
      <p className="text-xs text-blue-800 mb-3 leading-relaxed">
        To help you process volunteers quickly under pressure, this system uses 3 different automation modes. 
        As you open the pre-generated tasks below, notice how the UI changes to reduce your mental workload:
      </p>
      
      {/* R15: Concrete Worked Examples built into the tutorial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3 rounded border border-blue-100">
          <p className="font-bold text-orange-700 mb-1">1. Manual (High Risk)</p>
          <p className="text-zinc-600 mb-2">Example: <em>Pro Bono Legal Counsel</em></p>
          <p className="text-zinc-700">Requires you to contact and vet volunteers offline before accepting.</p>
        </div>
        <div className="bg-white p-3 rounded border border-blue-100">
          <p className="font-bold text-blue-700 mb-1">2. Semi-Auto (Med Risk)</p>
          <p className="text-zinc-600 mb-2">Example: <em>Medical Translation</em></p>
          <p className="text-zinc-700">The system scores and ranks applicants. You just click &quot;Approve&quot;.</p>
        </div>
        <div className="bg-white p-3 rounded border border-blue-100">
          <p className="font-bold text-green-700 mb-1">3. Auto (Low Risk)</p>
          <p className="text-zinc-600 mb-2">Example: <em>Sandbag Loading</em></p>
          <p className="text-zinc-700">Click &quot;Run Auto-fill&quot; to instantly batch-accept all valid applicants.</p>
        </div>
      </div>
    </div>
  );
}
