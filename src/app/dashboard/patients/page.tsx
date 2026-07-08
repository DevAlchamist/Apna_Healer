"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn, hoverLiftTransition, morphTransition } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";

type Patient = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Archived";
  assignedDate: string;
  lastSessionDate: string;
  notes: string;
  tags: string[];
};

const MOCK_PATIENTS: Patient[] = [
  { id: "p-1", name: "Kirti Saxena", email: "kirti@gmail.com", status: "Active", assignedDate: "2026-05-10", lastSessionDate: "2026-07-01", notes: "Caseload highlights: client is experiencing mild anxiety related to career changes. Emphasized mindfulness and daily journaling practices.", tags: ["Anxiety", "Career Stress"] },
  { id: "p-2", name: "Sanjana Singh", email: "sanjana@yahoo.com", status: "Active", assignedDate: "2026-06-02", lastSessionDate: "2026-07-04", notes: "Working on stress tolerance and deep breathing techniques. Responding well to CBT.", tags: ["Stress Management"] },
  { id: "p-3", name: "Rahul Verma", email: "rahul@outlook.com", status: "Archived", assignedDate: "2026-01-12", lastSessionDate: "2026-04-15", notes: "Addressed social isolation issues. Successfully achieved program milestones.", tags: ["Social Isolation", "Completed"] },
];

export default function PatientsPage() {
  const [activeTab, setActiveTab] = useState<"Active" | "Archived">("Active");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [notesText, setNotesText] = useState("");

  const userQuery = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiFetch<ApiUser>("/api/users/me"),
  });

  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      const matchStatus = p.status === activeTab;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [activeTab, search]);

  const handleOpenNotes = (patient: Patient) => {
    setSelectedPatient(patient);
    setNotesText(patient.notes);
  };

  const handleSaveNotes = () => {
    if (selectedPatient) {
      selectedPatient.notes = notesText;
      alert(`Notes saved successfully for ${selectedPatient.name}!`);
      setSelectedPatient(null);
    }
  };

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f745f] border-t-transparent" />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <section className="text-left space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1c2826]">
          Caseload Patients
        </h1>
        <p className="text-sm text-neutral-500">
          Manage clinical logs, check progress notes, and view active client directories.
        </p>
      </section>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {["Active", "Archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "bg-[#2f745f] text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <section className="bg-white border border-neutral-200 rounded-xl p-6 text-left shadow-2xs">
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-4">
            {activeTab} Patients Directory
          </h2>
          {filteredPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-neutral-600">
                <thead className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Assigned Date</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-neutral-800">{patient.name}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{patient.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {patient.tags.map((tag) => (
                            <span key={tag} className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[9px] font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{patient.assignedDate}</td>
                      <td className="px-4 py-3.5">{patient.lastSessionDate}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenNotes(patient)}
                          className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-3 py-1.5 transition"
                        >
                          Clinical Notes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400">
              <span className="text-4xl">📁</span>
              <p className="mt-2 text-sm font-semibold">No patients assigned yet.</p>
              <p className="text-xs mt-1">Confirmed patient files and records will appear here.</p>
            </div>
          )}
        </section>

        {/* Side Panel Notes Panel */}
        <section className="bg-[#fcfdfd] border border-neutral-200 rounded-xl p-6 text-left shadow-2xs">
          <h3 className="font-display text-base font-bold text-neutral-800 mb-3">
            Quick Notes Panel
          </h3>
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="text-xs">
                <p className="font-bold text-neutral-800">{selectedPatient.name}</p>
                <p className="text-neutral-400">{selectedPatient.email}</p>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full h-48 rounded-lg border border-neutral-200 bg-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#2f745f]"
                placeholder="Type clinician notes or observations here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="rounded bg-[#2f745f] hover:bg-[#204e40] text-white text-[10px] uppercase font-bold px-4 py-2 transition"
                >
                  Save Notes
                </button>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] uppercase font-bold px-4 py-2 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 text-xs">
              <p>Select &ldquo;Clinical Notes&rdquo; on a patient to view and update files here.</p>
            </div>
          )}
        </section>
      </div>
    </FadeIn>
  );
}
