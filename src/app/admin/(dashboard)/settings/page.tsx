"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ContactInfoTab from "./components/ContactInfoTab";
import AboutTab from "./components/AboutTab";
import CoreValuesTab from "./components/CoreValuesTab";
import ExperienceNumbersTab from "./components/ExperienceNumbersTab";
import PillarsTab from "./components/PillarsTab";
import CrisisTab from "./components/CrisisTab";
import MilestonesTab from "./components/MilestonesTab";

const tabs = [
  { key: "contact", label: "Contact Info" },
  { key: "about", label: "About" },
  { key: "values", label: "Core Values" },
  { key: "numbers", label: "Experience Numbers" },
  { key: "pillars", label: "Pillars" },
  { key: "crisis", label: "Crisis" },
  { key: "milestones", label: "Milestones" },
] as const;

type TabKey = typeof tabs[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("contact");

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 bg-[#1e293b] rounded-xl p-1 flex-wrap w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
              activeTab === tab.key ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6">
        {activeTab === "contact" && <ContactInfoTab />}
        {activeTab === "about" && <AboutTab />}
        {activeTab === "values" && <CoreValuesTab />}
        {activeTab === "numbers" && <ExperienceNumbersTab />}
        {activeTab === "pillars" && <PillarsTab />}
        {activeTab === "crisis" && <CrisisTab />}
        {activeTab === "milestones" && <MilestonesTab />}
      </div>
    </div>
  );
}
