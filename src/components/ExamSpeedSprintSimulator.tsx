import React, { useState, useMemo } from "react";
import {
  Timer,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BarChart2,
  Flame,
  ArrowRight,
  ShieldAlert,
  Award,
  Filter,
  Brain,
  Gauge
} from "lucide-react";

export interface ExamSpeedSprintSimulatorProps {
  studentName?: string;
  studentGrade?: string | number;
  pastSessions?: any[];
  quizAttempts?: any[];
  snapshots?: any[];
  onDiscussWithCherry?: (params: {
    topic: string;
    subject: string;
    conceptTested?: string;
    hint?: string;
    question?: string;
  }) => void;
  onEnterClassroom?: () => void;
}

export interface SpeedQuestion {
  id: string;
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology";
  topic: string;
  questionText: string;
  formulaOrContext?: string;
  idealSeconds: number; // Target speed (e.g. 45s, 60s, 90s)
  options: { label: string; text: string }[];
  correctIndex: number;
  explanation: string;
  speedTrap: string; // The cognitive trick that steals student time
  shortcutTip: string; // The 10-second mental shortcut
}

export interface ExamPacingProfile {
  id: string;
  examName: string;
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology";
  totalExamQuestions: number;
  totalExamMinutes: number;
  targetSecondsPerQuestion: number;
  paceBand: "rapid_mcq" | "balanced_application" | "step_by_step_numerical";
  description: string;
  questions: SpeedQuestion[];
}

// Curated Bank of Speed Pacing Modules across CBSE/ICSE/JEE/NEET
const EXAM_PACING_DATA: ExamPacingProfile[] = [
  {
    id: "pacing-jee-neet-phy",
    examName: "CBSE & NEET Physics Speed Drill",
    subject: "Physics",
    totalExamQuestions: 45,
    totalExamMinutes: 45,
    targetSecondsPerQuestion: 60,
    paceBand: "rapid_mcq",
    description: "Rapid dimensional analysis, ratio scaling, and mental shortcut elimination for high-pressure Physics MCQs.",
    questions: [
      {
        id: "q-phy-1",
        subject: "Physics",
        topic: "Current Electricity & Resistance",
        questionText: "A uniform cylindrical wire of resistance R is stretched uniformly so that its length increases by 10%. What is the new approximate resistance?",
        idealSeconds: 40,
        options: [
          { label: "A", text: "1.10 R (+10%)" },
          { label: "B", text: "1.21 R (+21%)" },
          { label: "C", text: "0.90 R (-10%)" },
          { label: "D", text: "1.44 R (+44%)" }
        ],
        correctIndex: 1,
        speedTrap: "Students multiply only length L by 1.10 and forget that volume is constant, so area A shrinks by factor of 1.10.",
        shortcutTip: "Use percentage shortcut: For small stretch x%, R increases by ~2x% (exact: R' = R(1+x/100)² = 1.1² = 1.21R). Takes 5 seconds!",
        explanation: "Volume V = A · L = constant. When L' = 1.10 L, A' = A / 1.10. Therefore R' = ρ L' / A' = ρ (1.10 L) / (A / 1.10) = 1.21 (ρL/A) = 1.21 R."
      },
      {
        id: "q-phy-2",
        subject: "Physics",
        topic: "Ray Optics & Total Internal Reflection",
        questionText: "A ray of light enters from glass (μ = 1.5) into water (μ = 4/3). The critical angle θ_c for this interface is:",
        idealSeconds: 45,
        options: [
          { label: "A", text: "sin⁻¹(8/9)" },
          { label: "B", text: "sin⁻¹(9/8)" },
          { label: "C", text: "sin⁻¹(1/2)" },
          { label: "D", text: "sin⁻¹(2/3)" }
        ],
        correctIndex: 0,
        speedTrap: "Dividing glass index by water index (1.5 / 1.33 = 9/8 > 1), which gives an undefined sine value.",
        shortcutTip: "Critical angle is ALWAYS sin θ_c = (μ_rarer / μ_denser). Since sine cannot exceed 1, smaller number goes on top: (4/3) / (3/2) = 8/9.",
        explanation: "By Snell's Law at critical angle: μ₁ sin θ_c = μ₂ sin 90°. (3/2) sin θ_c = (4/3)(1) ⟹ sin θ_c = (4/3) × (2/3) = 8/9 ⟹ θ_c = sin⁻¹(8/9)."
      },
      {
        id: "q-phy-3",
        subject: "Physics",
        topic: "Gravitation & Escape Velocity",
        questionText: "If the radius of the Earth shrinks by 1% while its mass remains constant, the acceleration due to gravity 'g' on its surface will:",
        idealSeconds: 35,
        options: [
          { label: "A", text: "Decrease by 1%" },
          { label: "B", text: "Increase by 2%" },
          { label: "C", text: "Decrease by 2%" },
          { label: "D", text: "Increase by 1%" }
        ],
        correctIndex: 1,
        speedTrap: "Writing out full Newton calculations with numerical values G, M, R instead of power differentiation.",
        shortcutTip: "Formula g = GM / R⁻². Log differentiation: Δg/g = -2(ΔR/R). If R shrinks by -1%, g increases by -2(-1%) = +2%. Done in 4 seconds.",
        explanation: "g = GM/R². Differentiating for small fractional changes: dg/g = -2(dR/R). Given dR/R = -1%, dg/g = -2(-1%) = +2% increase."
      }
    ]
  },
  {
    id: "pacing-math-calculus-speed",
    examName: "Class 12 Board Maths Blitz Sprint",
    subject: "Mathematics",
    totalExamQuestions: 38,
    totalExamMinutes: 180,
    targetSecondsPerQuestion: 75,
    paceBand: "balanced_application",
    description: "Calculus limits, matrix determinant properties, and quick vectors where eliminating steps saves 20+ exam minutes.",
    questions: [
      {
        id: "q-math-1",
        subject: "Mathematics",
        topic: "Matrices & Determinants",
        questionText: "If A is a 3 × 3 non-singular matrix and |A| = 4, then the determinant |2 adj(A)| is equal to:",
        idealSeconds: 50,
        options: [
          { label: "A", text: "32" },
          { label: "B", text: "64" },
          { label: "C", text: "128" },
          { label: "D", text: "16" }
        ],
        correctIndex: 2,
        speedTrap: "Pulling 2 out as 2¹ instead of 2ⁿ = 2³ = 8, or misremembering |adj(A)| = |A|ⁿ⁻¹ = 4² = 16.",
        shortcutTip: "Two quick rules: |k M| = kⁿ |M| (here 2³ = 8) and |adj(A)| = |A|ⁿ⁻¹ (here 4² = 16). Result = 8 × 16 = 128. Mental math only.",
        explanation: "For an n × n matrix, |k B| = kⁿ |B|. Here n=3, so |2 adj(A)| = 2³ |adj(A)|. Since |adj(A)| = |A|ⁿ⁻¹ = |A|² = 4² = 16, total = 8 × 16 = 128."
      },
      {
        id: "q-math-2",
        subject: "Mathematics",
        topic: "Definite Integrals (King's Property)",
        questionText: "The value of the definite integral ∫₀^(π/2) (sin³ x / (sin³ x + cos³ x)) dx is:",
        idealSeconds: 30,
        options: [
          { label: "A", text: "π / 2" },
          { label: "B", text: "π / 4" },
          { label: "C", text: "1" },
          { label: "D", text: "0" }
        ],
        correctIndex: 1,
        speedTrap: "Trying to perform trigonometric substitution or integration by parts on sin³ x.",
        shortcutTip: "King's symmetry property: Whenever numerator f(x) and denominator f(x)+f(a-x) are symmetric over [a, b], integral is ALWAYS (b - a)/2 = (π/2 - 0)/2 = π/4.",
        explanation: "Using property ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx: 2I = ∫₀^(π/2) 1 dx = π/2 ⟹ I = π/4."
      },
      {
        id: "q-math-3",
        subject: "Mathematics",
        topic: "Vector Triple & Dot Product",
        questionText: "If vectors a⃗ and b⃗ are unit vectors such that |a⃗ + b⃗| = √3, then the value of (2a⃗ - 5b⃗) · (3a⃗ + b⃗) is:",
        idealSeconds: 60,
        options: [
          { label: "A", text: "-11/2" },
          { label: "B", text: "-9/2" },
          { label: "C", text: "5/2" },
          { label: "D", text: "-13/2" }
        ],
        correctIndex: 0,
        speedTrap: "Trying to find individual angles θ for each vector in space instead of finding a⃗ · b⃗ directly from |a⃗ + b⃗|².",
        shortcutTip: "Square |a⃗+b⃗|: 1 + 1 + 2(a⃗·b⃗) = 3 ⟹ a⃗·b⃗ = 1/2. Expand target: 6|a⃗|² - 13(a⃗·b⃗) - 5|b⃗|² = 6(1) - 13(0.5) - 5(1) = 1 - 6.5 = -5.5 = -11/2.",
        explanation: "|a⃗ + b⃗|² = |a⃗|² + |b⃗|² + 2(a⃗·b⃗) = 1 + 1 + 2(a⃗·b⃗) = 3 ⟹ a⃗·b⃗ = 1/2. Expand (2a⃗ - 5b⃗) · (3a⃗ + b⃗) = 6|a⃗|² + 2(a⃗·b⃗) - 15(a⃗·b⃗) - 5|b⃗|² = 6(1) - 13(1/2) - 5(1) = 1 - 6.5 = -5.5 = -11/2."
      }
    ]
  },
  {
    id: "pacing-chem-physical-inorganic",
    examName: "Chemistry Speed Calculation & Elimination",
    subject: "Chemistry",
    totalExamQuestions: 40,
    totalExamMinutes: 60,
    targetSecondsPerQuestion: 50,
    paceBand: "rapid_mcq",
    description: "Nernst potentials, rate laws, and valence oxidation states designed for lightning-fast elimination.",
    questions: [
      {
        id: "q-chem-1",
        subject: "Chemistry",
        topic: "Chemical Kinetics & Half Life",
        questionText: "A first-order reaction has a rate constant k = 2.303 × 10⁻³ s⁻¹. The time required for 90% completion of the reaction is approximately:",
        idealSeconds: 45,
        options: [
          { label: "A", text: "500 s" },
          { label: "B", text: "1000 s" },
          { label: "C", text: "2303 s" },
          { label: "D", text: "300 s" }
        ],
        correctIndex: 1,
        speedTrap: "Plugging all natural logs into paper calculations without noticing 2.303 cancellation.",
        shortcutTip: "For 90% completion, [R]/[R]₀ = 10/100 = 1/10. t₉₀% = (2.303 / k) log(10) = (2.303 / 2.303×10⁻³) × 1 = 1000 seconds. 6 seconds flat.",
        explanation: "t = (2.303 / k) log (100 / (100 - 90)) = (2.303 / 2.303 × 10⁻³) log(10) = 10³ × 1 = 1000 s."
      },
      {
        id: "q-chem-2",
        subject: "Chemistry",
        topic: "Electrochemistry & Cell EMF",
        questionText: "For the cell reaction Zn + Cu²⁺(0.1 M) → Zn²⁺(0.01 M) + Cu with E°_cell = 1.10 V at 298 K, the actual cell EMF is:",
        idealSeconds: 50,
        options: [
          { label: "A", text: "1.10 V" },
          { label: "B", text: "1.13 V" },
          { label: "C", text: "1.07 V" },
          { label: "D", text: "0.98 V" }
        ],
        correctIndex: 1,
        speedTrap: "Writing Q = [Cu²⁺]/[Zn²⁺] (inverted ratio) and subtracting 0.03 V instead of adding.",
        shortcutTip: "Q = [Zn²⁺]/[Cu²⁺] = 0.01 / 0.1 = 10⁻¹. log Q = -1. Term is - (0.059/2)(-1) = +0.0295 V ≈ +0.03 V. So E = 1.10 + 0.03 = 1.13 V.",
        explanation: "E = E° - (0.0591/n) log ([Zn²⁺]/[Cu²⁺]) = 1.10 - (0.0591/2) log(0.01/0.1) = 1.10 - 0.0295(-1) = 1.10 + 0.0295 ≈ 1.13 V."
      }
    ]
  }
];

export const ExamSpeedSprintSimulator: React.FC<ExamSpeedSprintSimulatorProps> = ({
  studentName = "Student",
  studentGrade = 12,
  pastSessions = [],
  quizAttempts = [],
  snapshots = [],
  onDiscussWithCherry,
  onEnterClassroom
}) => {
  // Active selected module
  const [selectedModuleId, setSelectedModuleId] = useState<string>("pacing-jee-neet-phy");
  
  // Interactive Simulator State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Score & Pacing Log
  const [sprintLogs, setSprintLogs] = useState<{
    questionId: string;
    secondsTaken: number;
    idealSeconds: number;
    isCorrect: boolean;
    paceStatus: "lightning" | "optimal" | "overtime";
  }[]>([]);

  // Active Profile
  const activeProfile = useMemo(() => {
    return EXAM_PACING_DATA.find((p) => p.id === selectedModuleId) || EXAM_PACING_DATA[0];
  }, [selectedModuleId]);

  // Current Active Question
  const activeQuestion = useMemo(() => {
    return activeProfile.questions[currentQuestionIndex] || activeProfile.questions[0];
  }, [activeProfile, currentQuestionIndex]);

  // Live Timer Effect
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isAnswerSubmitted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isAnswerSubmitted]);

  // Reset question state on module switch
  const handleSelectModule = (id: string) => {
    setSelectedModuleId(id);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  };

  // Start Sprint
  const handleStartQuestion = () => {
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  };

  // Submit Answer & Calculate Speed Rating
  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null) return;
    setIsAnswerSubmitted(true);
    setIsTimerRunning(false);

    const isCorrect = selectedOptionIndex === activeQuestion.correctIndex;
    const ratio = elapsedSeconds / activeQuestion.idealSeconds;
    let paceStatus: "lightning" | "optimal" | "overtime" = "optimal";
    if (ratio < 0.75) {
      paceStatus = "lightning";
    } else if (ratio > 1.25) {
      paceStatus = "overtime";
    }

    setSprintLogs((prev) => [
      ...prev,
      {
        questionId: activeQuestion.id,
        secondsTaken: elapsedSeconds,
        idealSeconds: activeQuestion.idealSeconds,
        isCorrect,
        paceStatus
      }
    ]);
  };

  // Next Question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeProfile.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
      setElapsedSeconds(0);
      setIsTimerRunning(true);
    }
  };

  // Aggregated Performance Statistics
  const sprintStats = useMemo(() => {
    if (sprintLogs.length === 0) {
      return {
        totalAnswered: 0,
        accuracy: 0,
        avgSeconds: 0,
        timeSavedSeconds: 0,
        lightningCount: 0,
        overtimeCount: 0
      };
    }

    const totalAnswered = sprintLogs.length;
    const correctCount = sprintLogs.filter((l) => l.isCorrect).length;
    const accuracy = Math.round((correctCount / totalAnswered) * 100);
    const totalTime = sprintLogs.reduce((acc, l) => acc + l.secondsTaken, 0);
    const avgSeconds = Math.round(totalTime / totalAnswered);
    const idealTotal = sprintLogs.reduce((acc, l) => acc + l.idealSeconds, 0);
    const timeSavedSeconds = idealTotal - totalTime;
    const lightningCount = sprintLogs.filter((l) => l.paceStatus === "lightning").length;
    const overtimeCount = sprintLogs.filter((l) => l.paceStatus === "overtime").length;

    return {
      totalAnswered,
      accuracy,
      avgSeconds,
      timeSavedSeconds,
      lightningCount,
      overtimeCount
    };
  }, [sprintLogs]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Hero Header for Exam Speed & Time-Pacing Simulator */}
      <div className="bg-gradient-to-br from-[#121c24] via-[#1a2936] to-[#0c1318] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full opacity-30 pointer-events-none" />

        <div className="space-y-2 min-w-0 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-[#c4f500]/20 text-[#c4f500] font-mono px-3 py-0.5 rounded-full font-black border border-[#c4f500]/30 flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5" />
              Exam Speed Pacing & Cognitive Agility Simulator
            </span>
            <span className="text-[10px] font-mono text-cyan-200/80 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
              Stopwatch Pacing Analytics
            </span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Master Exam Time Allocation: Shave 25+ Minutes Off Board & Entrance Tests</span>
          </h3>

          <p className="text-xs text-cyan-100/85 font-sans leading-relaxed max-w-2xl">
            90% of students lose marks not because they don't know the concept, but because they spend 4 minutes on a 45-second MCQ. Train yourself to spot mental shortcut traps, eliminate dead algebraic steps, and pace with surgical precision.
          </p>
        </div>

        {/* Live Speed Bento Scoreboard - Horizontal Swipe Rail on Mobile */}
        <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto sm:overflow-visible gap-2.5 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
          <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-200 block">Avg Speed</span>
            <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
              {sprintStats.avgSeconds > 0 ? `${sprintStats.avgSeconds}s` : "--"}
            </span>
            <span className="text-[8px] text-cyan-200/80 block">Per Question</span>
          </div>

          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200 block">Accuracy</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
              {sprintStats.totalAnswered > 0 ? `${sprintStats.accuracy}%` : "--"}
            </span>
            <span className="text-[8px] text-emerald-200/80 block">Under Time Pressure</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center col-span-2 sm:col-span-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-200 block">Time Saved</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
              {sprintStats.timeSavedSeconds > 0 ? `+${sprintStats.timeSavedSeconds}s` : sprintStats.timeSavedSeconds < 0 ? `${sprintStats.timeSavedSeconds}s` : "0s"}
            </span>
            <span className="text-[8px] text-amber-200/80 block">vs. Target Pace</span>
          </div>
        </div>
      </div>

      {/* Module Selector Strip */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-cyan-700" />
            Select High-Stakes Speed Drill Track:
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            Pacing Target: {activeProfile.targetSecondsPerQuestion}s / question
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAM_PACING_DATA.map((mod) => {
            const isSelected = selectedModuleId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectModule(mod.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? "bg-gradient-to-br from-[#121c24] to-[#1a2936] text-white border-cyan-400/50 shadow-md ring-1 ring-[#c4f500]/50"
                    : "bg-slate-50 hover:bg-slate-100 text-zinc-800 border-zinc-200 hover:border-cyan-500/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-white/10 text-cyan-200 border border-white/15"
                          : "bg-slate-200 text-zinc-700"
                      }`}
                    >
                      {mod.subject}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {mod.targetSecondsPerQuestion}s target
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-black line-clamp-1 ${
                      isSelected ? "text-white" : "text-[#121c24]"
                    }`}
                  >
                    {mod.examName}
                  </h4>
                  <p
                    className={`text-[10px] line-clamp-2 leading-relaxed ${
                      isSelected ? "text-cyan-100/80" : "text-zinc-500"
                    }`}
                  >
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/10">
                  <span className={isSelected ? "text-[#c4f500]" : "text-zinc-500"}>
                    {mod.questions.length} Rapid Speed Drills
                  </span>
                  <span className={isSelected ? "text-cyan-200" : "text-zinc-400"}>
                    Launch Track →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Live Speed Sprint Arena */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-left">
        {/* Arena Header: Progress & Active Stopwatch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-150">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono font-black uppercase tracking-wider bg-cyan-50 text-cyan-900 border border-cyan-200 px-2.5 py-0.5 rounded-md">
                Question {currentQuestionIndex + 1} of {activeProfile.questions.length}
              </span>
              <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-zinc-700 px-2 py-0.5 rounded-md">
                Topic: {activeQuestion.topic}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#121c24]">
              {activeProfile.examName} • Rapid Decision Drill
            </h3>
          </div>

          {/* Interactive Stopwatch Gauge */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono font-black text-sm transition-all ${
                elapsedSeconds > activeQuestion.idealSeconds
                  ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                  : elapsedSeconds > activeQuestion.idealSeconds * 0.75
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-cyan-50 border-cyan-300 text-cyan-900"
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  elapsedSeconds > activeQuestion.idealSeconds
                    ? "text-rose-600 animate-spin"
                    : "text-cyan-700"
                }`}
              />
              <span>{elapsedSeconds}s</span>
              <span className="text-[9.5px] opacity-70 font-normal">
                / {activeQuestion.idealSeconds}s ideal
              </span>
            </div>

            {isAnswerSubmitted && currentQuestionIndex < activeProfile.questions.length - 1 && (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-3.5 py-1.5 rounded-xl bg-[#0a3641] hover:bg-teal-900 text-[#c4f500] text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next Drill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Question Statement Box */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/80">
            <span>EXAM SIMULATION PROMPT</span>
            <span>Target Speed: {activeQuestion.idealSeconds} seconds</span>
          </div>

          <p className="text-xs sm:text-sm md:text-base font-semibold leading-relaxed text-slate-100">
            {activeQuestion.questionText}
          </p>

          {activeQuestion.formulaOrContext && (
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-amber-200">
              {activeQuestion.formulaOrContext}
            </div>
          )}
        </div>

        {/* MCQ Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeQuestion.options.map((opt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === activeQuestion.correctIndex;

            let buttonClass =
              "p-3.5 rounded-2xl border text-left font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-3 ";

            if (isAnswerSubmitted) {
              if (isCorrect) {
                buttonClass += "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-500 font-bold shadow-xs";
              } else if (isSelected && !isCorrect) {
                buttonClass += "bg-rose-50 border-rose-400 text-rose-950 font-bold";
              } else {
                buttonClass += "bg-slate-50 border-zinc-200 text-zinc-400 opacity-60";
              }
            } else {
              if (isSelected) {
                buttonClass += "bg-cyan-50 border-cyan-600 text-cyan-950 ring-1 ring-cyan-500 shadow-xs font-bold";
              } else {
                buttonClass += "bg-slate-50/80 hover:bg-slate-100 border-zinc-200 text-zinc-800 hover:border-cyan-400";
              }
            }

            return (
              <button
                key={opt.label}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => {
                  setSelectedOptionIndex(idx);
                  if (!isTimerRunning) setIsTimerRunning(true);
                }}
                className={buttonClass}
              >
                <span
                  className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-[#0a3641] text-[#c4f500]"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="flex-1 leading-snug">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button: Lock In Speed Decision */}
        {!isAnswerSubmitted && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={selectedOptionIndex === null}
              onClick={handleSubmitAnswer}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                selectedOptionIndex !== null
                  ? "bg-gradient-to-r from-cyan-700 to-teal-800 hover:from-cyan-600 hover:to-teal-700 text-white active:scale-95"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <Zap className="w-4 h-4 text-[#c4f500]" />
              <span>Lock In Answer & Clock Time</span>
            </button>
          </div>
        )}

        {/* Post-Submission Speed Diagnosis & Shortcut Deconstruction */}
        {isAnswerSubmitted && (
          <div className="p-4 sm:p-5 rounded-2xl border space-y-4 animate-scale-up bg-slate-50 border-zinc-200">
            {/* Speed Pacing Feedback Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                {selectedOptionIndex === activeQuestion.correctIndex ? (
                  <span className="text-xs font-mono font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Correct Answer!
                  </span>
                ) : (
                  <span className="text-xs font-mono font-black uppercase text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-700" />
                    Incorrect Choice
                  </span>
                )}

                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                    elapsedSeconds <= activeQuestion.idealSeconds
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  Clocked: {elapsedSeconds}s (Target: {activeQuestion.idealSeconds}s)
                </span>
              </div>

              {/* Discuss With Cherry Button */}
              <button
                type="button"
                onClick={() => {
                  if (onDiscussWithCherry) {
                    onDiscussWithCherry({
                      topic: activeQuestion.topic,
                      subject: activeProfile.subject,
                      conceptTested: activeQuestion.topic,
                      hint: activeQuestion.shortcutTip,
                      question: `Cherry Ma'am, please demonstrate the 10-second mental shortcut on the chalkboard for this question: "${activeQuestion.questionText}"!`
                    });
                  } else if (onEnterClassroom) {
                    onEnterClassroom();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#062026] to-[#0a3641] text-[#c4f500] font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c4f500]" />
                <span>Explain 10-Sec Shortcut on Blackboard 🚀</span>
              </button>
            </div>

            {/* The 10-Second Mental Shortcut Box */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl space-y-1 text-left">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                ⚡ The 10-Second Mental Shortcut (Exam-Winner Technique):
              </span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {activeQuestion.shortcutTip}
              </p>
            </div>

            {/* The Time-Stealing Speed Trap Callout */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-left">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                🚨 Time-Stealing Cognitive Trap (Where 80% waste minutes):
              </span>
              <p className="text-xs text-rose-900 font-medium leading-relaxed">
                {activeQuestion.speedTrap}
              </p>
            </div>

            {/* Complete Algebraic Proof */}
            <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 text-left">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                Standard Detailed Derivation:
              </span>
              <p className="text-xs text-zinc-700 font-sans leading-relaxed">
                {activeQuestion.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Educational Callout */}
      <div className="bg-slate-50 border border-zinc-200 p-4.5 rounded-2xl flex items-start gap-3.5 text-left text-zinc-500 text-[10.5px] leading-relaxed">
        <Award className="w-5 h-5 text-cyan-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-[#121c24] block uppercase tracking-wider text-[8.5px]">
            Why Speed Pacing Training Boosts Percentiles:
          </span>
          <p>
            In competitive exams (JEE, NEET, CBSE Boards), 20% of the questions are intentionally crafted with mental shortcuts. Students who write out 10-line equations for every question run out of time on high-weightage numericals. By practicing rapid elimination and cognitive shortcuts, you bank 25+ minutes of buffer time to verify your entire paper.
          </p>
        </div>
      </div>
    </div>
  );
};
