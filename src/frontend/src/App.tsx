import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Footer } from "./components/Footer";
import { FormulasCard } from "./components/FormulasCard";
import { Header } from "./components/Header";
import { HeroBand } from "./components/HeroBand";
import { RandomNumberGenerator } from "./components/RandomNumberGenerator";
import { RecentCalculations } from "./components/RecentCalculations";
import { AnalyticCalculator } from "./components/calculator/AnalyticCalculator";
import { ClinicalTrialCalculator } from "./components/calculator/ClinicalTrialCalculator";
import { ClusterRctCalculator } from "./components/calculator/ClusterRctCalculator";
import { DescriptiveCalculator } from "./components/calculator/DescriptiveCalculator";

type StudyCategory =
  | "descriptive"
  | "analytic"
  | "clinical"
  | "cluster"
  | "rng";

const STUDY_TITLES: Record<StudyCategory, { title: string; subtitle: string }> =
  {
    descriptive: {
      title: "Descriptive Studies",
      subtitle:
        "Calculate sample size to estimate a population parameter with desired precision",
    },
    analytic: {
      title: "Analytic Studies",
      subtitle:
        "Calculate sample size to detect a statistically significant association",
    },
    clinical: {
      title: "Clinical Trials",
      subtitle:
        "Calculate sample size for randomized and controlled trial designs",
    },
    cluster: {
      title: "Cluster Randomised Trial",
      subtitle:
        "Calculate sample size accounting for intracluster correlation (ICC)",
    },
    rng: {
      title: "Random Number Generator",
      subtitle:
        "Generate random integers within a specified range for research randomisation",
    },
  };

export default function App() {
  const [activeStudy, setActiveStudy] = useState<StudyCategory>("descriptive");

  const { title, subtitle } = STUDY_TITLES[activeStudy];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <HeroBand activeStudy={activeStudy} onStudyChange={setActiveStudy} />

      <main
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        id="calculator"
      >
        {/* Main calculator card */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>

          {activeStudy === "descriptive" && <DescriptiveCalculator />}
          {activeStudy === "analytic" && <AnalyticCalculator />}
          {activeStudy === "clinical" && <ClinicalTrialCalculator />}
          {activeStudy === "cluster" && <ClusterRctCalculator />}
          {activeStudy === "rng" && <RandomNumberGenerator />}
        </div>

        {/* Below calculator */}
        {activeStudy !== "rng" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentCalculations />
            <FormulasCard />
          </div>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}
