import React, { useState, useMemo } from "react";
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Target,
  Brain,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  Check,
  Zap,
  Award
} from "lucide-react";
import katex from "katex";

export interface CurriculumBlindspotTrackerProps {
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

interface SubtopicNode {
  id: string;
  title: string;
  weightagePercent: number; // contribution to chapter
  keyFormula?: string;
  difficulty: "easy" | "medium" | "hard";
  examType: string; // e.g. "3-Mark Numerical", "5-Mark Derivation", "1-Mark MCQ"
  coreTakeaway: string;
}

interface ChapterCurriculum {
  id: string;
  chapterNumber: number;
  title: string;
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology";
  grade: number; // 9, 10, 11, 12
  boardWeightageMarks: number; // e.g. 10 marks in 80-mark board paper
  tier: "critical" | "high" | "moderate";
  subtopics: SubtopicNode[];
}

// Comprehensive Official Curriculum Database (CBSE, ICSE, State Boards & Competitions)
const CURRICULUM_DATABASE: ChapterCurriculum[] = [
  // Class 10 / 12 Mathematics
  {
    id: "math-quad",
    chapterNumber: 4,
    title: "Quadratic Equations & Roots",
    subject: "Mathematics",
    grade: 10,
    boardWeightageMarks: 6,
    tier: "high",
    subtopics: [
      {
        id: "math-quad-1",
        title: "Standard Form & Nature of Roots (Discriminant D)",
        weightagePercent: 40,
        keyFormula: "D = b^2 - 4ac",
        difficulty: "easy",
        examType: "1-Mark MCQ & 2-Mark Short Answer",
        coreTakeaway: "D > 0: Real & distinct roots; D = 0: Equal roots; D < 0: Imaginary conjugate roots."
      },
      {
        id: "math-quad-2",
        title: "Solving by Factorization & Quadratic Formula",
        weightagePercent: 35,
        keyFormula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        difficulty: "medium",
        examType: "3-Mark Problem Solving",
        coreTakeaway: "Apply Sridharacharya quadratic formula accurately with double sign checks."
      },
      {
        id: "math-quad-3",
        title: "Real-Life Word Problems (Speed, Time, Area)",
        weightagePercent: 25,
        difficulty: "hard",
        examType: "5-Mark Long Application Case Study",
        coreTakeaway: "Translating word statements into quadratic algebra and rejecting negative extraneous roots."
      }
    ]
  },
  {
    id: "math-trig",
    chapterNumber: 8,
    title: "Introduction to Trigonometry & Identities",
    subject: "Mathematics",
    grade: 10,
    boardWeightageMarks: 10,
    tier: "critical",
    subtopics: [
      {
        id: "math-trig-1",
        title: "Trigonometric Ratios & Specific Angles (0°, 30°, 45°, 60°, 90°)",
        weightagePercent: 30,
        keyFormula: "\\sin 30^\\circ = \\frac{1}{2}, \\; \\tan 45^\\circ = 1",
        difficulty: "easy",
        examType: "2-Mark Direct Evaluation",
        coreTakeaway: "Memorize the standard ratio table and exact reciprocal transformations."
      },
      {
        id: "math-trig-2",
        title: "Fundamental Pythagorean Identities & Proofs",
        weightagePercent: 45,
        keyFormula: "\\sin^2 \\theta + \\cos^2 \\theta = 1, \\; 1 + \\tan^2 \\theta = \\sec^2 \\theta",
        difficulty: "hard",
        examType: "5-Mark Step-by-Step Proof",
        coreTakeaway: "Conversions to sin/cos and algebraic rationalization are the core proof techniques."
      },
      {
        id: "math-trig-3",
        title: "Heights and Distances (Angles of Elevation & Depression)",
        weightagePercent: 25,
        keyFormula: "\\tan \\theta = \\frac{\\text{Opposite (Height)}}{\\text{Adjacent (Distance)}}",
        difficulty: "medium",
        examType: "4-Mark Case-Based Diagram Problem",
        coreTakeaway: "Draw clean geometry triangles and apply tan θ for two-level angle problems."
      }
    ]
  },
  {
    id: "math-calc",
    chapterNumber: 5,
    title: "Continuity, Differentiability & Derivatives",
    subject: "Mathematics",
    grade: 12,
    boardWeightageMarks: 12,
    tier: "critical",
    subtopics: [
      {
        id: "math-calc-1",
        title: "Continuity Tests & Left/Right Hand Limits",
        weightagePercent: 30,
        keyFormula: "\\lim_{x \\to a^-} f(x) = \\lim_{x \\to a^+} f(x) = f(a)",
        difficulty: "medium",
        examType: "3-Mark Limit Evaluation",
        coreTakeaway: "A function must be defined and both directional limits must coincide."
      },
      {
        id: "math-calc-2",
        title: "Chain Rule, Product & Quotient Derivatives",
        weightagePercent: 40,
        keyFormula: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)",
        difficulty: "medium",
        examType: "4-Mark Differentiation",
        coreTakeaway: "Systematic outside-in differentiation without dropping intermediate differential terms."
      },
      {
        id: "math-calc-3",
        title: "Logarithmic & Parametric Differentiation",
        weightagePercent: 30,
        keyFormula: "\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}",
        difficulty: "hard",
        examType: "5-Mark Derivation",
        coreTakeaway: "Taking natural log on both sides simplifies complex exponents and variable powers."
      }
    ]
  },

  // Physics
  {
    id: "phy-optics",
    chapterNumber: 9,
    title: "Ray Optics & Optical Instruments",
    subject: "Physics",
    grade: 12,
    boardWeightageMarks: 9,
    tier: "critical",
    subtopics: [
      {
        id: "phy-optics-1",
        title: "Snell's Law & Total Internal Reflection (TIR)",
        weightagePercent: 35,
        keyFormula: "\\sin \\theta_c = \\frac{n_{\\text{rarer}}}{n_{\\text{denser}}}",
        difficulty: "easy",
        examType: "2-Mark Theory & Prism Application",
        coreTakeaway: "TIR occurs when light travels from denser to rarer medium with angle > critical angle."
      },
      {
        id: "phy-optics-2",
        title: "Lens Maker's Formula & Thin Lens Combinations",
        weightagePercent: 40,
        keyFormula: "\\frac{1}{f} = (n - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)",
        difficulty: "hard",
        examType: "5-Mark Derivation with Sign Convention",
        coreTakeaway: "Cartesian sign convention (+/-) on curvature radii determines focal length sign."
      },
      {
        id: "phy-optics-3",
        title: "Compound Microscope & Astronomical Telescope Magnification",
        weightagePercent: 25,
        keyFormula: "m = -\\frac{L}{f_o} \\cdot \\frac{D}{f_e}",
        difficulty: "medium",
        examType: "3-Mark Ray Diagram & Numerical",
        coreTakeaway: "Ray diagrams with labeled focal points and virtual/real image orientation."
      }
    ]
  },
  {
    id: "phy-elec",
    chapterNumber: 3,
    title: "Current Electricity & Circuit Networks",
    subject: "Physics",
    grade: 12,
    boardWeightageMarks: 8,
    tier: "high",
    subtopics: [
      {
        id: "phy-elec-1",
        title: "Drift Velocity, Current Density & Ohm's Microscopic Law",
        weightagePercent: 30,
        keyFormula: "I = n e A v_d, \\quad v_d = \\frac{e E \\tau}{m}",
        difficulty: "medium",
        examType: "3-Mark Derivation",
        coreTakeaway: "Direct proportionality between relaxation time τ and temperature conductivity."
      },
      {
        id: "phy-elec-2",
        title: "Kirchhoff's Laws (KCL & KVL) & Mesh Analysis",
        weightagePercent: 45,
        keyFormula: "\\sum I = 0 \\quad (\\text{Charge}), \\quad \\sum \\Delta V = 0 \\quad (\\text{Energy})",
        difficulty: "hard",
        examType: "5-Mark Complex Loop Numerical",
        coreTakeaway: "Loop direction conventions determine battery EMF and resistor IR potential drops."
      },
      {
        id: "phy-elec-3",
        title: "Balanced Wheatstone Bridge & Potentiometer Sensitivity",
        weightagePercent: 25,
        keyFormula: "\\frac{P}{Q} = \\frac{R}{S} \\implies I_{\\text{galv}} = 0",
        difficulty: "easy",
        examType: "3-Mark Null-Point Calculation",
        coreTakeaway: "Null-point bridge nullifies internal meter resistance for exact potential measurement."
      }
    ]
  },

  // Chemistry
  {
    id: "chem-bond",
    chapterNumber: 4,
    title: "Chemical Bonding & Molecular Orbital Theory",
    subject: "Chemistry",
    grade: 11,
    boardWeightageMarks: 7,
    tier: "high",
    subtopics: [
      {
        id: "chem-bond-1",
        title: "VSEPR Theory & Hybridization (sp, sp², sp³, dsp³)",
        weightagePercent: 40,
        difficulty: "medium",
        examType: "3-Mark Molecular Geometry",
        coreTakeaway: "Lone pair - lone pair repulsions compress ideal bond angles (e.g. NH3 107°, H2O 104.5°)."
      },
      {
        id: "chem-bond-2",
        title: "Molecular Orbital Theory (MOT) & Magnetic Properties",
        weightagePercent: 40,
        keyFormula: "\\text{Bond Order} = \\frac{N_b - N_a}{2}",
        difficulty: "hard",
        examType: "4-Mark Energy Diagram & Paramagnetism",
        coreTakeaway: "Unpaired electrons in degenerate antibonding π* orbitals explain O2 paramagnetism."
      },
      {
        id: "chem-bond-3",
        title: "Intermolecular Forces & Hydrogen Bonding Effects",
        weightagePercent: 20,
        difficulty: "easy",
        examType: "2-Mark Boiling Point Reasoning",
        coreTakeaway: "Intramolecular vs intermolecular H-bonding directly controls volatility and solubility."
      }
    ]
  },
  {
    id: "chem-thermo",
    chapterNumber: 6,
    title: "Chemical Thermodynamics & Gibbs Free Energy",
    subject: "Chemistry",
    grade: 11,
    boardWeightageMarks: 8,
    tier: "critical",
    subtopics: [
      {
        id: "chem-thermo-1",
        title: "First Law of Thermodynamics & Enthalpy of Reaction",
        weightagePercent: 30,
        keyFormula: "\\Delta U = q + w, \\quad \\Delta H = \\Delta U + \\Delta n_g R T",
        difficulty: "medium",
        examType: "3-Mark State Function Numerical",
        coreTakeaway: "Work w = -P_ext ΔV in reversible/irreversible gas expansions."
      },
      {
        id: "chem-thermo-2",
        title: "Hess's Law of Constant Heat Summation",
        weightagePercent: 30,
        keyFormula: "\\Delta H_r^\\circ = \\sum \\Delta H_f^\\circ(\\text{Products}) - \\sum \\Delta H_f^\\circ(\\text{Reactants})",
        difficulty: "easy",
        examType: "3-Mark Thermochemical Addition",
        coreTakeaway: "Total enthalpy change is path-independent; flip signs when reversing equations."
      },
      {
        id: "chem-thermo-3",
        title: "Second Law, Entropy (ΔS) & Gibbs Spontaneity Criterion",
        weightagePercent: 40,
        keyFormula: "\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ < 0",
        difficulty: "hard",
        examType: "4-Mark Feasibility Prediction",
        coreTakeaway: "Negative ΔG dictates strictly spontaneous reactions; at equilibrium ΔG = 0."
      }
    ]
  },

  // Biology
  {
    id: "bio-gen",
    chapterNumber: 5,
    title: "Principles of Inheritance & Genetics",
    subject: "Biology",
    grade: 12,
    boardWeightageMarks: 10,
    tier: "critical",
    subtopics: [
      {
        id: "bio-gen-1",
        title: "Mendelian Monohybrid & Dihybrid Crosses (3:1, 9:3:3:1)",
        weightagePercent: 35,
        difficulty: "easy",
        examType: "3-Mark Punnett Square Cross",
        coreTakeaway: "Law of Segregation and Independent Assortment govern unlinked allele distribution."
      },
      {
        id: "bio-gen-2",
        title: "Chromosomal Linkage & Morgan's Drosophila Experiments",
        weightagePercent: 40,
        keyFormula: "\\text{Recombination Freq (cM)} = \\frac{\\text{Recombinants}}{\\text{Total}} \\times 100",
        difficulty: "hard",
        examType: "5-Mark Genetic Mapping Problem",
        coreTakeaway: "Tight linkage reduces recombination frequency, violating independent assortment."
      },
      {
        id: "bio-gen-3",
        title: "Sex Determination, Pedigree Analysis & Mendelian Disorders",
        weightagePercent: 25,
        difficulty: "medium",
        examType: "4-Mark Pedigree Chart Interpretation",
        coreTakeaway: "Tracing Autosomal vs X-linked recessive patterns (Hemophilia, Sickle Cell Anemia)."
      }
    ]
  }
];

export const CurriculumBlindspotTracker: React.FC<CurriculumBlindspotTrackerProps> = ({
  studentName = "Student",
  studentGrade = 12,
  pastSessions = [],
  quizAttempts = [],
  snapshots = [],
  onDiscussWithCherry,
  onEnterClassroom
}) => {
  // Filters & State
  const [selectedBoard, setSelectedBoard] = useState<"CBSE" | "ICSE" | "State Board" | "NEET" | "JEE">("CBSE");
  const [selectedGrade, setSelectedGrade] = useState<number>(typeof studentGrade === "number" ? studentGrade : 12);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "blindspot" | "review" | "mastered">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({
    "math-trig": true,
    "phy-optics": true
  });

  // Toggle chapter collapse
  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // Helper to render math formulas safely
  const renderFormula = (formula?: string) => {
    if (!formula) return null;
    try {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(formula, { displayMode: false, throwOnError: false })
          }}
        />
      );
    } catch {
      return <span>{formula}</span>;
    }
  };

  // Compute Topic Mastery & Blindspot Status from Student Real History
  const computedCurriculum = useMemo(() => {
    // Collect all topics touched in past sessions or quiz attempts
    const studiedTopicNames = new Set<string>();
    const highScoredTopicNames = new Set<string>();

    pastSessions.forEach((s) => {
      if (s.topic) studiedTopicNames.add(s.topic.toLowerCase());
      if (s.subject) studiedTopicNames.add(s.subject.toLowerCase());
    });

    quizAttempts.forEach((q) => {
      const topic = (q.topic || "").toLowerCase();
      studiedTopicNames.add(topic);
      const score = typeof q.percentage === "number" ? q.percentage : (q.score / (q.totalQuestions || 1)) * 100;
      if (score >= 70) {
        highScoredTopicNames.add(topic);
      }
    });

    snapshots.forEach((snap) => {
      if (snap.topic) studiedTopicNames.add(snap.topic.toLowerCase());
    });

    let totalCurriculumMarks = 0;
    let lockedCurriculumMarks = 0;
    let totalSubtopicsCount = 0;
    let masteredCount = 0;
    let inProgressCount = 0;
    let blindspotCount = 0;

    const chapters = CURRICULUM_DATABASE.filter((ch) => {
      if (selectedGrade !== 0 && ch.grade !== selectedGrade) {
        // Also allow showing relevant chapters if selected
        if (selectedGrade === 10 && ch.grade !== 10) return false;
        if (selectedGrade === 12 && ch.grade < 11) return false;
      }
      if (selectedSubject !== "all" && ch.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      return true;
    }).map((chapter) => {
      totalCurriculumMarks += chapter.boardWeightageMarks;

      const subtopicsWithStatus = chapter.subtopics.map((sub) => {
        totalSubtopicsCount++;
        const titleLower = sub.title.toLowerCase();
        const chapterLower = chapter.title.toLowerCase();

        // Check if student has touched this topic
        const hasStudied =
          studiedTopicNames.has(titleLower) ||
          studiedTopicNames.has(chapterLower) ||
          Array.from(studiedTopicNames).some((t) => titleLower.includes(t) || t.includes(titleLower));

        const isMastered =
          hasStudied &&
          (highScoredTopicNames.has(titleLower) ||
            highScoredTopicNames.has(chapterLower) ||
            Array.from(highScoredTopicNames).some((t) => titleLower.includes(t)));

        let status: "blindspot" | "review" | "mastered" = "blindspot";
        if (isMastered) {
          status = "mastered";
          masteredCount++;
        } else if (hasStudied) {
          status = "review";
          inProgressCount++;
        } else {
          status = "blindspot";
          blindspotCount++;
        }

        return {
          ...sub,
          status
        };
      });

      // Chapter Completion Percentage
      const masteredSubtopics = subtopicsWithStatus.filter((s) => s.status === "mastered").length;
      const reviewSubtopics = subtopicsWithStatus.filter((s) => s.status === "review").length;
      const chapterScoreFraction =
        (masteredSubtopics * 1.0 + reviewSubtopics * 0.5) / (subtopicsWithStatus.length || 1);
      const chapterCompletionPercent = Math.round(chapterScoreFraction * 100);

      const chapterLockedMarks = Number((chapter.boardWeightageMarks * chapterScoreFraction).toFixed(1));
      lockedCurriculumMarks += chapterLockedMarks;

      return {
        ...chapter,
        subtopics: subtopicsWithStatus,
        chapterCompletionPercent,
        chapterLockedMarks,
        isFullyCovered: chapterCompletionPercent >= 80,
        hasBlindspots: subtopicsWithStatus.some((s) => s.status === "blindspot")
      };
    });

    // Filter by search query & status filter
    const filteredChapters = chapters.filter((ch) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesChapter = ch.title.toLowerCase().includes(q) || ch.subject.toLowerCase().includes(q);
        const matchesSub = ch.subtopics.some((s) => s.title.toLowerCase().includes(q) || s.examType.toLowerCase().includes(q));
        if (!matchesChapter && !matchesSub) return false;
      }

      if (selectedStatusFilter === "blindspot") {
        return ch.subtopics.some((s) => s.status === "blindspot");
      }
      if (selectedStatusFilter === "review") {
        return ch.subtopics.some((s) => s.status === "review");
      }
      if (selectedStatusFilter === "mastered") {
        return ch.subtopics.some((s) => s.status === "mastered");
      }

      return true;
    });

    const overallSyllabusPercent =
      totalCurriculumMarks > 0 ? Math.round((lockedCurriculumMarks / totalCurriculumMarks) * 100) : 0;

    return {
      chapters: filteredChapters,
      allChapters: chapters,
      totalCurriculumMarks,
      lockedCurriculumMarks: Number(lockedCurriculumMarks.toFixed(1)),
      overallSyllabusPercent,
      totalSubtopicsCount,
      masteredCount,
      inProgressCount,
      blindspotCount
    };
  }, [selectedBoard, selectedGrade, selectedSubject, selectedStatusFilter, searchQuery, pastSessions, quizAttempts, snapshots]);

  // Find next highest-yield blindspot recommendation
  const topYieldBlindspot = useMemo(() => {
    for (const ch of computedCurriculum.allChapters) {
      const blindspot = ch.subtopics.find((s) => s.status === "blindspot");
      if (blindspot) {
        return {
          chapter: ch,
          subtopic: blindspot
        };
      }
    }
    return null;
  }, [computedCurriculum.allChapters]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Hero Header for Curriculum & Blindspot Intelligence */}
      <div className="bg-gradient-to-br from-[#062026] via-[#0a3641] to-[#041a1e] border border-teal-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full opacity-30 pointer-events-none" />

        <div className="space-y-2 min-w-0 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-[#c4f500]/20 text-[#c4f500] font-mono px-3 py-0.5 rounded-full font-black border border-[#c4f500]/30 flex items-center gap-1.5 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              Official Board Curriculum & Blindspot Radar
            </span>
            <span className="text-[10px] font-mono text-teal-200/80 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
              Exam Blueprint Synchronized
            </span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Syllabus Mastery, Weightage Locks & Uncovered Blindspots</span>
          </h3>

          <p className="text-xs text-teal-100/85 font-sans leading-relaxed max-w-2xl">
            Real board exam performance isn't just about random question practice — it requires 100% syllabus coverage.
            Track exactly which high-yield derivations, definitions, and formulas remain un-touched.
          </p>
        </div>

        {/* High-Level Benchmark Bento Badges - Horizontal Swipe Rail on Mobile */}
        <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto sm:overflow-visible gap-2.5 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-200 block">Syllabus Done</span>
            <span className="text-lg sm:text-xl font-black text-[#c4f500] font-mono">{computedCurriculum.overallSyllabusPercent}%</span>
            <span className="text-[8px] text-teal-200/70 block">Coverage</span>
          </div>

          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200 block">Board Marks</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
              {computedCurriculum.lockedCurriculumMarks} / {computedCurriculum.totalCurriculumMarks}
            </span>
            <span className="text-[8px] text-emerald-200/80 block">Guaranteed Locked</span>
          </div>

          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-200 block">Blindspots</span>
            <span className="text-lg sm:text-xl font-black text-rose-300 font-mono">{computedCurriculum.blindspotCount}</span>
            <span className="text-[8px] text-rose-200/80 block">Un-Touched Topics</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-200 block">Mastered</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">{computedCurriculum.masteredCount}</span>
            <span className="text-[8px] text-amber-200/80 block">Exam Ready</span>
          </div>
        </div>
      </div>

      {/* Recommended Sprint: Highest Yield Blindspot Alert */}
      {topYieldBlindspot && (
        <div className="bg-gradient-to-r from-rose-900/90 via-[#0a3641] to-slate-900 border border-rose-400/40 rounded-2xl p-4.5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/50 flex items-center justify-center shrink-0 text-rose-300">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-md border border-rose-400/30">
                  Priority 1 Exam Blindspot
                </span>
                <span className="text-[9.5px] font-mono text-amber-300 font-bold">
                  +{topYieldBlindspot.chapter.boardWeightageMarks} Marks in Board Exam
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white truncate">
                {topYieldBlindspot.chapter.title}: <span className="text-teal-200">{topYieldBlindspot.subtopic.title}</span>
              </h4>
              <p className="text-[10.5px] text-slate-300/90 font-medium line-clamp-1">
                {topYieldBlindspot.subtopic.coreTakeaway}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onDiscussWithCherry) {
                onDiscussWithCherry({
                  topic: topYieldBlindspot.subtopic.title,
                  subject: topYieldBlindspot.chapter.subject,
                  conceptTested: topYieldBlindspot.subtopic.title,
                  hint: topYieldBlindspot.subtopic.coreTakeaway,
                  question: `Cherry Ma'am, let's cover this crucial board exam blindspot: "${topYieldBlindspot.subtopic.title}" from ${topYieldBlindspot.chapter.title} step-by-step on the blackboard!`
                });
              } else if (onEnterClassroom) {
                onEnterClassroom();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c4f500] to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Eliminate Blindspot Now 🚀</span>
          </button>
        </div>
      )}

      {/* Filter & Control Bar */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-150">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-800" />
              Target Blueprint:
            </span>

            {/* Board Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-zinc-200 text-xs font-mono">
              {(["CBSE", "ICSE", "State Board", "NEET", "JEE"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBoard(b)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedBoard === b
                      ? "bg-[#0a3641] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-slate-200/70"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Grade Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-zinc-200 text-xs font-mono">
              {[
                { label: "Class 10", grade: 10 },
                { label: "Class 11", grade: 11 },
                { label: "Class 12", grade: 12 },
                { label: "All Grades", grade: 0 }
              ].map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => setSelectedGrade(g.grade)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedGrade === g.grade
                      ? "bg-teal-800 text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-slate-200/70"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic, theorem or formula..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-700 text-zinc-800 font-medium placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Secondary Subject & Status Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {["all", "Mathematics", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                  selectedSubject === subj
                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs font-black"
                    : "bg-slate-50 text-zinc-600 border-zinc-200 hover:bg-slate-100 hover:text-zinc-900"
                }`}
              >
                {subj === "all" ? "🌐 All Subjects" : subj}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-zinc-200/80 font-mono text-[10px]">
            {[
              { key: "all", label: "All Topics", count: computedCurriculum.totalSubtopicsCount },
              { key: "blindspot", label: "⚪ Uncovered Blindspots", count: computedCurriculum.blindspotCount },
              { key: "review", label: "🟡 In-Progress", count: computedCurriculum.inProgressCount },
              { key: "mastered", label: "🟢 Mastered", count: computedCurriculum.masteredCount }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.key as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === tab.key
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-black"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapters & Subtopics Interactive Tree */}
      <div className="space-y-4">
        {computedCurriculum.chapters.length > 0 ? (
          computedCurriculum.chapters.map((ch) => {
            const isExpanded = expandedChapterIds[ch.id] ?? false;

            return (
              <div
                key={ch.id}
                className={`bg-white border rounded-3xl transition-all overflow-hidden ${
                  ch.hasBlindspots
                    ? "border-zinc-200 shadow-2xs hover:border-teal-500/50"
                    : "border-emerald-200/80 shadow-2xs bg-gradient-to-br from-white to-emerald-50/20"
                }`}
              >
                {/* Chapter Main Bar (Accordion Header) */}
                <div
                  onClick={() => toggleChapter(ch.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500 transition-colors mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-slate-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                          {ch.subject} • Class {ch.grade}
                        </span>

                        <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          🎯 {ch.boardWeightageMarks} Marks in Board
                        </span>

                        {ch.tier === "critical" && (
                          <span className="text-[8.5px] font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 uppercase">
                            High-Yield Chapter
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-[#0a3641] tracking-tight">
                        Chapter {ch.chapterNumber}: {ch.title}
                      </h4>
                    </div>
                  </div>

                  {/* Chapter Completion Bar & Actions */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
                    <div className="space-y-1 text-right min-w-[120px]">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400 font-bold">Coverage:</span>
                        <strong
                          className={`font-black ${
                            ch.chapterCompletionPercent >= 80
                              ? "text-emerald-700"
                              : ch.chapterCompletionPercent > 0
                              ? "text-amber-700"
                              : "text-rose-600"
                          }`}
                        >
                          {ch.chapterCompletionPercent}% ({ch.chapterLockedMarks}/{ch.boardWeightageMarks} M)
                        </strong>
                      </div>

                      <div className="w-full bg-zinc-150 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ch.chapterCompletionPercent >= 80
                              ? "bg-emerald-500"
                              : ch.chapterCompletionPercent > 0
                              ? "bg-amber-500"
                              : "bg-rose-400"
                          }`}
                          style={{ width: `${Math.max(6, ch.chapterCompletionPercent)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDiscussWithCherry) {
                          onDiscussWithCherry({
                            topic: ch.title,
                            subject: ch.subject,
                            conceptTested: ch.title,
                            question: `Cherry Ma'am, please guide me through an official board blueprint revision of Chapter ${ch.chapterNumber}: ${ch.title} on the blackboard!`
                          });
                        } else if (onEnterClassroom) {
                          onEnterClassroom();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#c4f500] text-[10.5px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Brain className="w-3.5 h-3.5 text-[#c4f500]" />
                      <span>Learn with Cherry</span>
                    </button>
                  </div>
                </div>

                {/* Subtopics Accordion Content */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 pt-1 space-y-3 bg-slate-50/50 border-t border-zinc-150">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider pt-2">
                      Subtopic Blueprint & Board Exam Question Types:
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ch.subtopics.map((sub) => {
                        const isBlindspot = sub.status === "blindspot";
                        const isMastered = sub.status === "mastered";

                        return (
                          <div
                            key={sub.id}
                            className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2.5 transition-all text-left ${
                              isMastered
                                ? "bg-white border-emerald-300/80 shadow-2xs"
                                : isBlindspot
                                ? "bg-white border-dashed border-rose-300 shadow-2xs hover:border-rose-400"
                                : "bg-white border-amber-200/80 shadow-2xs"
                            }`}
                          >
                            {/* Subtopic Header */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    isMastered
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : isBlindspot
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {isMastered ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Mastered</span>
                                    </>
                                  ) : isBlindspot ? (
                                    <>
                                      <CircleDashed className="w-3 h-3 text-rose-500" />
                                      <span>Blindspot</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>Review Due</span>
                                    </>
                                  )}
                                </span>

                                <span className="text-[8px] font-mono text-zinc-400">
                                  {sub.weightagePercent}% of Ch
                                </span>
                              </div>

                              <h5 className="text-xs font-black text-[#0a3641] leading-tight">
                                {sub.title}
                              </h5>

                              <span className="text-[9px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 block w-fit">
                                📋 {sub.examType}
                              </span>
                            </div>

                            {/* Core Takeaway & Formula */}
                            <div className="space-y-1.5 text-[10px] text-zinc-600 bg-slate-50 p-2 rounded-xl border border-zinc-150">
                              {sub.keyFormula && (
                                <div className="p-1.5 bg-slate-900 text-amber-200 rounded-lg font-mono text-[9.5px] text-center overflow-x-auto">
                                  {renderFormula(sub.keyFormula)}
                                </div>
                              )}
                              <p className="font-medium text-zinc-700 leading-normal">
                                {sub.coreTakeaway}
                              </p>
                            </div>

                            {/* Launch Action */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onDiscussWithCherry) {
                                  onDiscussWithCherry({
                                    topic: sub.title,
                                    subject: ch.subject,
                                    conceptTested: sub.title,
                                    hint: sub.coreTakeaway,
                                    question: `Cherry Ma'am, please explain the concept and board exam questions for "${sub.title}" from ${ch.title} on the chalkboard!`
                                  });
                                } else if (onEnterClassroom) {
                                  onEnterClassroom();
                                }
                              }}
                              className={`w-full py-2 px-2.5 rounded-xl font-mono text-[9.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                                isBlindspot
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200"
                                  : "bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200"
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>{isBlindspot ? "Solve Blindspot" : "Revise Subtopic"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-zinc-200 space-y-2">
            <Compass className="w-8 h-8 text-zinc-300 mx-auto" />
            <h4 className="text-xs font-bold text-zinc-700">No chapters found for this filter</h4>
            <p className="text-[10px] text-zinc-400 font-mono">Try clearing your search query or adjusting Grade and Subject filters.</p>
          </div>
        )}
      </div>

      {/* Why Curriculum & Blindspot Mapping Matters */}
      <div className="bg-slate-50 border border-zinc-200 p-4.5 rounded-2xl flex items-start gap-3.5 text-left text-zinc-500 text-[10.5px] leading-relaxed">
        <Award className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-[#0a3641] block uppercase tracking-wider text-[8.5px]">
            Why Blueprint-Synchronized Blindspot Elimination Wins Exams:
          </span>
          <p>
            Unlike open-ended studying where students repeatedly practice what they already find comfortable, competitive and board exams penalize skipped chapters. By mapping every single subtopic against the official board marks blueprint, Cherry Classroom ensures zero surprise questions in the exam hall.
          </p>
        </div>
      </div>
    </div>
  );
};
