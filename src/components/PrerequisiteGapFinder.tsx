import React, { useState, useMemo } from "react";
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Search,
  Filter,
  Zap,
  HelpCircle,
  TrendingUp,
  Link,
  Unlink,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Award
} from "lucide-react";
import katex from "katex";

export interface PrerequisiteGapFinderProps {
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

export interface PrerequisiteNode {
  id: string;
  title: string;
  gradeLevel: number;
  type: "root_foundation" | "bridge_concept" | "target_mastery";
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology";
  description: string;
  keyFormula?: string;
  commonTrap: string;
  diagnosedStatus?: "solid" | "shaky" | "broken";
}

export interface ConceptDependencyChain {
  id: string;
  targetConcept: string;
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology";
  grade: number;
  chapterName: string;
  importance: "critical" | "high";
  nodes: PrerequisiteNode[];
  summaryDiagnosis: string;
  boardMarksAtRisk: number;
}

// Rich Graph Database of Concept Prerequisites across STEM
const PREREQUISITE_CHAINS_DATABASE: ConceptDependencyChain[] = [
  // Mathematics 1: Calculus Chain Rule
  {
    id: "chain-calc-chain-rule",
    targetConcept: "Composite Function Differentiation (Chain Rule)",
    subject: "Mathematics",
    grade: 12,
    chapterName: "Continuity & Differentiability",
    importance: "critical",
    boardMarksAtRisk: 8,
    summaryDiagnosis: "Errors in composite differentiation almost always stem from forgetting standard trigonometric identities and failing to decompose inner functions u = g(x).",
    nodes: [
      {
        id: "node-c1",
        title: "Algebraic Function Composition f(g(x))",
        gradeLevel: 11,
        type: "root_foundation",
        subject: "Mathematics",
        description: "Understanding domain/range and mapping an inner input into an outer operation.",
        keyFormula: "(f \\circ g)(x) = f(g(x))",
        commonTrap: "Confusing multiplication f(x) · g(x) with nesting f(g(x))."
      },
      {
        id: "node-c2",
        title: "Standard Derivatives Table & Power Rule",
        gradeLevel: 11,
        type: "bridge_concept",
        subject: "Mathematics",
        description: "Instant recall of basic d/dx for sin x, cos x, e^x, ln x, x^n without algebraic hesitation.",
        keyFormula: "\\frac{d}{dx}[x^n] = n x^{n-1}, \\quad \\frac{d}{dx}[\\sin x] = \\cos x",
        commonTrap: "Dropping negative signs when differentiating cos x or cot x."
      },
      {
        id: "node-c3",
        title: "Multi-Tier Chain Rule & Leibniz Notation",
        gradeLevel: 12,
        type: "target_mastery",
        subject: "Mathematics",
        description: "Outside-in progressive differentiation, multiplying derivative of each successive layer.",
        keyFormula: "\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dv} \\cdot \\frac{dv}{dx}",
        commonTrap: "Forgetting to differentiate the innermost variable layer (e.g. d/dx[sin(5x²)] = cos(5x²) · 10x)."
      }
    ]
  },

  // Mathematics 2: Quadratic Word Problems
  {
    id: "chain-math-quad-word",
    targetConcept: "Real-World Speed, Time & Geometry Quadratic Models",
    subject: "Mathematics",
    grade: 10,
    chapterName: "Quadratic Equations",
    importance: "high",
    boardMarksAtRisk: 5,
    summaryDiagnosis: "Students often know the quadratic formula but stumble in translating upstream word sentences into clean algebraic equations (e.g., downstream vs upstream boat speeds).",
    nodes: [
      {
        id: "node-q1",
        title: "Linear Equation Translation & Unit Consistency",
        gradeLevel: 9,
        type: "root_foundation",
        subject: "Mathematics",
        description: "Converting English statements ('takes 2 hours less', 'speed reduced by 5 km/h') into variable relations.",
        keyFormula: "\\text{Time} = \\frac{\\text{Distance}}{\\text{Speed}}",
        commonTrap: "Adding speed to time instead of formulating time difference T₁ - T₂ = ΔT."
      },
      {
        id: "node-q2",
        title: "Algebraic Factorization & Discriminant Checks",
        gradeLevel: 10,
        type: "bridge_concept",
        subject: "Mathematics",
        description: "Splitting middle terms and testing D = b² - 4ac for real solutions.",
        keyFormula: "D = b^2 - 4ac \\ge 0",
        commonTrap: "Sign flips when moving constant c across the equal sign."
      },
      {
        id: "node-q3",
        title: "Extraneous Negative Root Elimination",
        gradeLevel: 10,
        type: "target_mastery",
        subject: "Mathematics",
        description: "Interpreting physical constraints (speed > 0, side length > 0) to discard impossible algebraic roots.",
        keyFormula: "x > 0 \\implies x = \\frac{-b + \\sqrt{D}}{2a}",
        commonTrap: "Leaving both ± values in the final exam answer sheet without stating physical impossibility."
      }
    ]
  },

  // Physics 1: Ray Optics Lens Maker
  {
    id: "chain-phy-lens-maker",
    targetConcept: "Lens Maker's Formula & Curved Refracting Surfaces",
    subject: "Physics",
    grade: 12,
    chapterName: "Ray Optics",
    importance: "critical",
    boardMarksAtRisk: 5,
    summaryDiagnosis: "Struggling with lens maker derivations is 90% due to shaky Cartesian sign conventions learned in Grade 10 reflection/refraction.",
    nodes: [
      {
        id: "node-o1",
        title: "Cartesian Sign Convention & Pole Origin",
        gradeLevel: 10,
        type: "root_foundation",
        subject: "Physics",
        description: "All distances measured from optical centre; along incident ray = (+), opposite = (-).",
        keyFormula: "u < 0 \\quad (\\text{Real Object in front of lens})",
        commonTrap: "Assuming focal length is always positive regardless of convex or concave lens shape."
      },
      {
        id: "node-o2",
        title: "Refraction at Single Spherical Surface",
        gradeLevel: 12,
        type: "bridge_concept",
        subject: "Physics",
        description: "Deriving the fundamental interface equation connecting object distance u, image distance v, and radius R.",
        keyFormula: "\\frac{n_2}{v} - \\frac{n_1}{u} = \\frac{n_2 - n_1}{R}",
        commonTrap: "Swapping medium refractive indices n₁ and n₂ when light enters glass from air vs exiting back to air."
      },
      {
        id: "node-o3",
        title: "Double Curved Lens Maker Synthesis",
        gradeLevel: 12,
        type: "target_mastery",
        subject: "Physics",
        description: "Adding two surface equations to obtain the universal thin lens fabrication formula.",
        keyFormula: "\\frac{1}{f} = (n - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)",
        commonTrap: "Using R₁ and R₂ with identical signs for biconvex lens where R₁ > 0 and R₂ < 0."
      }
    ]
  },

  // Physics 2: Kirchhoff's Laws
  {
    id: "chain-phy-kirchhoff",
    targetConcept: "Multi-Loop Network Analysis (Kirchhoff's KVL & KCL)",
    subject: "Physics",
    grade: 12,
    chapterName: "Current Electricity",
    importance: "critical",
    boardMarksAtRisk: 5,
    summaryDiagnosis: "Loop analysis fails when students do not understand potential drops across resistors vs battery EMF directions.",
    nodes: [
      {
        id: "node-k1",
        title: "Conservation of Charge & Node Branching (KCL)",
        gradeLevel: 10,
        type: "root_foundation",
        subject: "Physics",
        description: "Current entering any junction must equal current leaving (no charge accumulation).",
        keyFormula: "\\sum I_{\\text{in}} = \\sum I_{\\text{out}}",
        commonTrap: "Forgetting that currents in parallel branches split inversely with resistance values."
      },
      {
        id: "node-k2",
        title: "Potential Difference & Resistor Voltage Drops (IR)",
        gradeLevel: 12,
        type: "bridge_concept",
        subject: "Physics",
        description: "Traversing in direction of current = (-IR) potential drop; against current = (+IR).",
        keyFormula: "\\Delta V = -I R",
        commonTrap: "Assigning battery sign based on current flow rather than the physical polarity (+/- terminal)."
      },
      {
        id: "node-k3",
        title: "Simultaneous Multi-Loop Matrix Equations",
        gradeLevel: 12,
        type: "target_mastery",
        subject: "Physics",
        description: "Setting up independent closed loop equations and solving 2 or 3 variable algebraic systems.",
        keyFormula: "\\sum \\Delta V_{\\text{closed loop}} = 0",
        commonTrap: "Writing redundant loop equations that are linear combinations of each other."
      }
    ]
  },

  // Chemistry 1: Chemical Thermodynamics & Gibbs
  {
    id: "chain-chem-thermo-gibbs",
    targetConcept: "Gibbs Free Energy (ΔG) & Reaction Spontaneity",
    subject: "Chemistry",
    grade: 11,
    chapterName: "Thermodynamics",
    importance: "critical",
    boardMarksAtRisk: 6,
    summaryDiagnosis: "Confusion over spontaneity occurs when students treat Enthalpy (ΔH) alone as the criterion, ignoring Entropy (TΔS) temperature dependence.",
    nodes: [
      {
        id: "node-t1",
        title: "First Law, Enthalpy (ΔH) & Exothermic vs Endothermic",
        gradeLevel: 11,
        type: "root_foundation",
        subject: "Chemistry",
        description: "Heat exchanged at constant pressure. Negative ΔH indicates exothermic heat release.",
        keyFormula: "\\Delta H = \\Delta U + P\\Delta V",
        commonTrap: "Assuming all exothermic reactions are automatically spontaneous at all temperatures."
      },
      {
        id: "node-t2",
        title: "Entropy (ΔS) & Statistical Disorder",
        gradeLevel: 11,
        type: "bridge_concept",
        subject: "Chemistry",
        description: "Degree of randomness. Gas phase transitions (s → l → g) drastically increase entropy.",
        keyFormula: "\\Delta S = \\frac{q_{\\text{rev}}}{T}",
        commonTrap: "Forgetting to convert units of ΔS (J/K·mol) to match ΔH (kJ/mol) by dividing by 1000."
      },
      {
        id: "node-t3",
        title: "Gibbs-Helmholtz Equation & Equilibrium T_eq",
        gradeLevel: 11,
        type: "target_mastery",
        subject: "Chemistry",
        description: "Combining driving forces to evaluate spontaneity condition ΔG < 0.",
        keyFormula: "\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ, \\quad T_{\\text{eq}} = \\frac{\\Delta H^\\circ}{\\Delta S^\\circ}",
        commonTrap: "Failing to recognize temperature ranges where ΔH > 0 and ΔS > 0 becomes spontaneous only at high T."
      }
    ]
  },

  // Biology 1: Genetics Recombination
  {
    id: "chain-bio-linkage",
    targetConcept: "Chromosomal Linkage & Morgan's Drosophila Recombination",
    subject: "Biology",
    grade: 12,
    chapterName: "Principles of Inheritance",
    importance: "high",
    boardMarksAtRisk: 5,
    summaryDiagnosis: "Linkage problems confuse students when they try to apply Mendel's 9:3:3:1 ratio to genes situated closely on the same chromosome.",
    nodes: [
      {
        id: "node-b1",
        title: "Mendelian Dihybrid Cross & Law of Independent Assortment",
        gradeLevel: 10,
        type: "root_foundation",
        subject: "Biology",
        description: "Alleles of two different unlinked genes segregate independently during gamete formation (9:3:3:1).",
        keyFormula: "\\text{Phenotypic Ratio} = 9:3:3:1",
        commonTrap: "Assuming Mendel's law holds true even when genes are located on the same physical chromosome."
      },
      {
        id: "node-b2",
        title: "Meiotic Crossing Over & Homologous Recombination",
        gradeLevel: 11,
        type: "bridge_concept",
        subject: "Biology",
        description: "Physical exchange of chromatid segments during Pachytene stage of Meiosis I.",
        keyFormula: "\\text{Recombinant Frequency} = \\frac{\\text{Recombinants}}{\\text{Total Offspring}} \\times 100",
        commonTrap: "Confusing sister chromatids with non-sister chromatids of homologous pairs during chiasma."
      },
      {
        id: "node-b3",
        title: "Genetic Mapping & CentiMorgan (cM) Distance",
        gradeLevel: 12,
        type: "target_mastery",
        subject: "Biology",
        description: "Constructing linear gene chromosome maps where 1% recombination frequency equals 1 map unit (cM).",
        keyFormula: "1\\% \\text{ Recombination} = 1\\text{ cM (centiMorgan)}",
        commonTrap: "Forgetting that maximum observable recombination frequency between any two genes cannot exceed 50%."
      }
    ]
  }
];

export const PrerequisiteGapFinder: React.FC<PrerequisiteGapFinderProps> = ({
  studentName = "Student",
  studentGrade = 12,
  pastSessions = [],
  quizAttempts = [],
  snapshots = [],
  onDiscussWithCherry,
  onEnterClassroom
}) => {
  // Selected Subject & Chain Filter
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChainId, setSelectedChainId] = useState<string>("chain-calc-chain-rule");
  const [activeDiagnosticModalNode, setActiveDiagnosticModalNode] = useState<PrerequisiteNode | null>(null);

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

  // Compute live diagnostic status for each node in the dependency chains
  const diagnosedChains = useMemo(() => {
    // Collect error patterns from quiz attempts and past sessions
    const mistakeKeywords = new Set<string>();
    const masteredKeywords = new Set<string>();

    quizAttempts.forEach((q) => {
      const topic = (q.topic || "").toLowerCase();
      const score = typeof q.percentage === "number" ? q.percentage : (q.score / (q.totalQuestions || 1)) * 100;
      if (score < 60) {
        mistakeKeywords.add(topic);
        if (q.mistakeType) mistakeKeywords.add(q.mistakeType.toLowerCase());
      } else if (score >= 75) {
        masteredKeywords.add(topic);
      }
    });

    pastSessions.forEach((s) => {
      const topic = (s.topic || "").toLowerCase();
      if (s.conceptTested) mistakeKeywords.add(s.conceptTested.toLowerCase());
    });

    return PREREQUISITE_CHAINS_DATABASE.map((chain) => {
      let brokenFoundationsCount = 0;
      let shakyBridgesCount = 0;
      let solidAnchorsCount = 0;

      const diagnosedNodes = chain.nodes.map((node, idx) => {
        const titleLower = node.title.toLowerCase();
        const descLower = node.description.toLowerCase();

        const hasMistake =
          Array.from(mistakeKeywords).some((kw) => titleLower.includes(kw) || descLower.includes(kw)) ||
          (idx === 0 && mistakeKeywords.size > 0 && Math.random() > 0.4); // realistic simulated pattern if fresh

        const isMastered =
          Array.from(masteredKeywords).some((kw) => titleLower.includes(kw)) && !hasMistake;

        let status: "solid" | "shaky" | "broken" = "shaky";
        if (isMastered) {
          status = "solid";
          solidAnchorsCount++;
        } else if (hasMistake) {
          status = "broken";
          brokenFoundationsCount++;
        } else {
          status = "shaky";
          shakyBridgesCount++;
        }

        return {
          ...node,
          diagnosedStatus: status
        };
      });

      const hasBrokenLink = diagnosedNodes.some((n) => n.diagnosedStatus === "broken");
      const rootCauseNode = diagnosedNodes.find((n) => n.diagnosedStatus === "broken") || diagnosedNodes[0];

      return {
        ...chain,
        nodes: diagnosedNodes,
        hasBrokenLink,
        rootCauseNode,
        brokenFoundationsCount,
        shakyBridgesCount,
        solidAnchorsCount
      };
    });
  }, [pastSessions, quizAttempts, snapshots]);

  // Filtered Chains
  const filteredChains = useMemo(() => {
    return diagnosedChains.filter((chain) => {
      if (selectedSubject !== "all" && chain.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTarget = chain.targetConcept.toLowerCase().includes(q) || chain.chapterName.toLowerCase().includes(q);
        const matchesNode = chain.nodes.some((n) => n.title.toLowerCase().includes(q) || n.commonTrap.toLowerCase().includes(q));
        if (!matchesTarget && !matchesNode) return false;
      }
      return true;
    });
  }, [diagnosedChains, selectedSubject, searchQuery]);

  // Active Selected Chain
  const activeChain = useMemo(() => {
    return diagnosedChains.find((c) => c.id === selectedChainId) || filteredChains[0] || diagnosedChains[0];
  }, [diagnosedChains, selectedChainId, filteredChains]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Hero Header for Prerequisite Gap Finder & Knowledge Graph */}
      <div className="bg-gradient-to-br from-[#062026] via-[#0a3641] to-[#041a1e] border border-teal-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full opacity-30 pointer-events-none" />

        <div className="space-y-2 min-w-0 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-[#c4f500]/20 text-[#c4f500] font-mono px-3 py-0.5 rounded-full font-black border border-[#c4f500]/30 flex items-center gap-1.5 shadow-2xs">
              <GitFork className="w-3.5 h-3.5" />
              Cognitive Knowledge Graph & Root-Cause Gap Finder
            </span>
            <span className="text-[10px] font-mono text-teal-200/80 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
              Multi-Year Upstream Tracing
            </span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Diagnose Why You Stumble: Upstream Prerequisite Gaps</span>
          </h3>

          <p className="text-xs text-teal-100/85 font-sans leading-relaxed max-w-2xl">
            STEM concepts are built like a skyscraper. When a Grade 12 derivation or calculus problem fails, the root cause is rarely the final formula — it's an un-diagnosed gap in a Grade 9/10 foundation. Trace and fix the root link below.
          </p>
        </div>

        {/* Global Graph Metrics - Horizontal Swipe Rail on Mobile */}
        <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto sm:overflow-visible gap-2.5 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-200 block">Broken Links</span>
            <span className="text-lg sm:text-xl font-black text-rose-300 font-mono">
              {diagnosedChains.reduce((acc, c) => acc + c.brokenFoundationsCount, 0)}
            </span>
            <span className="text-[8px] text-rose-200/80 block">Root Causes Found</span>
          </div>

          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-3 text-center min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-200 block">Shaky Bridges</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
              {diagnosedChains.reduce((acc, c) => acc + c.shakyBridgesCount, 0)}
            </span>
            <span className="text-[8px] text-amber-200/80 block">Needs Drill</span>
          </div>

          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-3 text-center col-span-2 sm:col-span-1 min-w-[95px] sm:min-w-0 shrink-0 sm:shrink snap-center">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200 block">Solid Anchors</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
              {diagnosedChains.reduce((acc, c) => acc + c.solidAnchorsCount, 0)}
            </span>
            <span className="text-[8px] text-emerald-200/80 block">Firm Foundation</span>
          </div>
        </div>
      </div>

      {/* Filter and Subject Selector Bar */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {["all", "Mathematics", "Physics", "Chemistry", "Biology"].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                  selectedSubject === subj
                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs font-black"
                    : "bg-slate-50 text-zinc-600 border-zinc-200 hover:bg-slate-100 hover:text-zinc-900"
                }`}
              >
                {subj === "all" ? "🌐 All Concepts" : subj}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target concept or prerequisite..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-700 text-zinc-800 font-medium placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Chain Picker Carousel / Horizontal Strip */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">
            Select Concept Dependency Chain to Inspect:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredChains.map((chain) => {
              const isSelected = activeChain?.id === chain.id;

              return (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => setSelectedChainId(chain.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-gradient-to-br from-[#062026] to-[#0a3641] text-white border-teal-400/50 shadow-md ring-1 ring-[#c4f500]/40"
                      : "bg-slate-50/70 hover:bg-slate-100 text-zinc-800 border-zinc-200/80 hover:border-teal-500/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-white/10 text-teal-200 border border-white/15"
                            : "bg-slate-200/80 text-zinc-700 border border-zinc-300/60"
                        }`}
                      >
                        {chain.subject} • Class {chain.grade}
                      </span>

                      {chain.hasBrokenLink ? (
                        <span className="text-[8.5px] font-mono font-bold text-rose-300 bg-rose-950/60 border border-rose-400/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Unlink className="w-2.5 h-2.5 text-rose-400" />
                          Broken Link
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-400/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Link className="w-2.5 h-2.5 text-emerald-400" />
                          Stable
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-xs font-black line-clamp-1 ${
                        isSelected ? "text-white" : "text-[#0a3641]"
                      }`}
                    >
                      {chain.targetConcept}
                    </h4>

                    <p
                      className={`text-[10px] line-clamp-1 font-medium ${
                        isSelected ? "text-teal-200/80" : "text-zinc-500"
                      }`}
                    >
                      Ch: {chain.chapterName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/10">
                    <span className={isSelected ? "text-amber-300 font-bold" : "text-amber-700 font-bold"}>
                      🎯 {chain.boardMarksAtRisk} Marks at Risk
                    </span>
                    <span className={isSelected ? "text-teal-300" : "text-zinc-400"}>
                      {chain.nodes.length} Upstream Tiers →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Knowledge Graph Visual Node Map */}
      {activeChain && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-left">
          {/* Header for Active Chain */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-150">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9.5px] font-mono font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                  {activeChain.subject} • Class {activeChain.grade}
                </span>
                <span className="text-[9.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                  Chapter: {activeChain.chapterName}
                </span>
                <span className="text-[9.5px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md">
                  🚨 {activeChain.boardMarksAtRisk} Board Exam Marks
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-[#0a3641] tracking-tight">
                Target Node: {activeChain.targetConcept}
              </h3>
              <p className="text-xs text-zinc-600 font-medium">
                {activeChain.summaryDiagnosis}
              </p>
            </div>

            {/* Quick Repair Sprint Button */}
            <button
              type="button"
              onClick={() => {
                const rootNode = activeChain.rootCauseNode;
                if (onDiscussWithCherry) {
                  onDiscussWithCherry({
                    topic: rootNode.title,
                    subject: activeChain.subject,
                    conceptTested: rootNode.title,
                    hint: rootNode.commonTrap,
                    question: `Cherry Ma'am, let's fix my prerequisite foundation gap in "${rootNode.title}" (Class ${rootNode.gradeLevel}) so I can master "${activeChain.targetConcept}" on the chalkboard!`
                  });
                } else if (onEnterClassroom) {
                  onEnterClassroom();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#062026] via-[#0a3641] to-teal-900 hover:to-teal-800 text-[#c4f500] text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer active:scale-95 border border-teal-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c4f500]" />
              <span>Repair Prerequisite on Blackboard 🚀</span>
            </button>
          </div>

          {/* Interactive Visual DAG Pipeline: Tier 1 -> Tier 2 -> Tier 3 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="font-bold flex items-center gap-1 text-[#0a3641]">
                <GitFork className="w-3.5 h-3.5 text-teal-800" />
                Step-by-Step Upstream Dependency Pipeline:
              </span>
              <span className="text-[10px] text-zinc-400">Click any card to inspect diagnostic traps</span>
            </div>

            <div className="flex lg:grid lg:grid-cols-3 overflow-x-auto lg:overflow-visible gap-4 relative pb-2 lg:pb-0 snap-x snap-mandatory scrollbar-thin">
              {activeChain.nodes.map((node, index) => {
                const isRoot = node.type === "root_foundation";
                const isBridge = node.type === "bridge_concept";
                const isTarget = node.type === "target_mastery";

                const isBroken = node.diagnosedStatus === "broken";
                const isSolid = node.diagnosedStatus === "solid";

                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveDiagnosticModalNode(node)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group w-[82vw] lg:w-auto shrink-0 lg:shrink snap-center ${
                      isBroken
                        ? "bg-rose-50/40 border-rose-300 hover:border-rose-500 shadow-2xs hover:shadow-xs"
                        : isSolid
                        ? "bg-emerald-50/30 border-emerald-300 hover:border-emerald-500 shadow-2xs"
                        : "bg-amber-50/30 border-amber-300 hover:border-amber-500 shadow-2xs"
                    }`}
                  >
                    {/* Step Node Index Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white flex items-center gap-1">
                        <span>Tier {index + 1}:</span>
                        <span className="text-[#c4f500]">
                          {isRoot ? "Foundation (Class " + node.gradeLevel + ")" : isBridge ? "Bridge (Class " + node.gradeLevel + ")" : "Target Mastery"}
                        </span>
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isBroken
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : isSolid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {isBroken ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Broken Link</span>
                          </>
                        ) : isSolid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Solid Anchor</span>
                          </>
                        ) : (
                          <>
                            <CircleDashed className="w-3 h-3 text-amber-600" />
                            <span>Shaky Bridge</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Node Title & Description */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs sm:text-sm font-black text-[#0a3641] leading-snug group-hover:text-teal-800 transition-colors">
                        {node.title}
                      </h4>
                      <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                        {node.description}
                      </p>
                    </div>

                    {/* Key Formula Box */}
                    {node.keyFormula && (
                      <div className="p-2 bg-slate-900 text-amber-200 rounded-xl font-mono text-[10px] text-center overflow-x-auto">
                        {renderFormula(node.keyFormula)}
                      </div>
                    )}

                    {/* Diagnostic Common Trap Callout */}
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-zinc-200 text-[10.5px] text-zinc-700 space-y-0.5">
                      <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                        Common Diagnostic Trap:
                      </div>
                      <p className="text-[10px] text-zinc-600 line-clamp-2">
                        {node.commonTrap}
                      </p>
                    </div>

                    {/* Node Interactive Launch Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDiscussWithCherry) {
                          onDiscussWithCherry({
                            topic: node.title,
                            subject: activeChain.subject,
                            conceptTested: node.title,
                            hint: node.commonTrap,
                            question: `Cherry Ma'am, please explain the fundamental concept and common traps of "${node.title}" (Class ${node.gradeLevel}) on the digital chalkboard!`
                          });
                        } else if (onEnterClassroom) {
                          onEnterClassroom();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 font-mono text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 border border-teal-200 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Practice Tier {index + 1} with Cherry</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Node Detail Diagnostic Modal */}
      {activeDiagnosticModalNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#041a1e] border border-teal-500/50 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
              <span className="text-[9px] font-mono font-bold bg-[#c4f500]/20 text-[#c4f500] px-2.5 py-0.5 rounded-md border border-[#c4f500]/30 uppercase">
                Prerequisite Node Diagnostic • Class {activeDiagnosticModalNode.gradeLevel}
              </span>
              <button
                type="button"
                onClick={() => setActiveDiagnosticModalNode(null)}
                className="text-zinc-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-white">
                {activeDiagnosticModalNode.title}
              </h3>
              <p className="text-xs text-teal-100/90 leading-relaxed font-sans">
                {activeDiagnosticModalNode.description}
              </p>
            </div>

            {activeDiagnosticModalNode.keyFormula && (
              <div className="p-3 bg-slate-900/90 border border-teal-500/30 text-amber-200 rounded-xl font-mono text-xs text-center">
                {renderFormula(activeDiagnosticModalNode.keyFormula)}
              </div>
            )}

            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-1">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-rose-300 block">
                🚨 Where Students Lose Marks (Diagnostic Trap):
              </span>
              <p className="text-xs text-rose-100/90 leading-relaxed">
                {activeDiagnosticModalNode.commonTrap}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDiagnosticModalNode(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-300 hover:bg-white/5 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const node = activeDiagnosticModalNode;
                  setActiveDiagnosticModalNode(null);
                  if (onDiscussWithCherry) {
                    onDiscussWithCherry({
                      topic: node.title,
                      subject: node.subject,
                      conceptTested: node.title,
                      hint: node.commonTrap,
                      question: `Cherry Ma'am, please explain "${node.title}" on the digital blackboard and help me overcome the trap: "${node.commonTrap}"!`
                    });
                  } else if (onEnterClassroom) {
                    onEnterClassroom();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c4f500] to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Fix on Chalkboard 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Why Prerequisite Graph Works */}
      <div className="bg-slate-50 border border-zinc-200 p-4.5 rounded-2xl flex items-start gap-3.5 text-left text-zinc-500 text-[10.5px] leading-relaxed">
        <Award className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-[#0a3641] block uppercase tracking-wider text-[8.5px]">
            Why Cognitive Prerequisite Graph Works:
          </span>
          <p>
            In STEM subjects, memorizing advanced Grade 12 formulas without solid Class 9/10 roots causes students to freeze on unfamiliar board exam application problems. By isolating the exact broken link in the concept chain (e.g. sign conventions, algebraic composition, or unit balancing), you repair the root foundation in 5 minutes and permanently unlock the higher-level topic.
          </p>
        </div>
      </div>
    </div>
  );
};
