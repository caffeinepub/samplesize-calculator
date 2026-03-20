type StudyCategory = "descriptive" | "analytic" | "clinical";

interface HeroBandProps {
  activeStudy: StudyCategory;
  onStudyChange: (s: StudyCategory) => void;
}

const PILLS: { id: StudyCategory; label: string }[] = [
  { id: "descriptive", label: "Descriptive Studies" },
  { id: "analytic", label: "Analytic Studies" },
  { id: "clinical", label: "Clinical Trials" },
];

export function HeroBand({ activeStudy, onStudyChange }: HeroBandProps) {
  return (
    <div
      className="w-full py-10"
      style={{
        background:
          "linear-gradient(135deg, oklch(25% 0.03 220), oklch(30% 0.03 220))",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Sample Size Calculator
        </h1>
        <p className="text-white/70 text-sm mb-8">
          Evidence-based calculations for research &amp; clinical studies
        </p>
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur">
          {PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              data-ocid={`hero.${pill.id}.tab`}
              onClick={() => onStudyChange(pill.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeStudy === pill.id
                  ? "bg-white text-foreground shadow"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
