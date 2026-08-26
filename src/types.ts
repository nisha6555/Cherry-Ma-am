export type SessionState = "disconnected" | "connecting" | "idle" | "listening" | "speaking" | "error";

export type TeachingPhase = "intro" | "concept" | "example" | "doubt" | "transition";

export interface ToolCallPayload {
  id: string;
  name: string;
  args: any;
}

export interface LiveTranscription {
  text: string;
  finished: boolean;
  id?: string;
}

export type ThemeType = "cherry" | "matrix" | "cyber" | "sunset" | "slate" | "ivory";

export interface ThemeColors {
  primary: string; // Tailwind colors like 'indigo-600' or hex
  accent: string;
  glow: string;
  bgGradient: string;
  waveColors: string[];
}

export const THEME_CONFIGS: Record<ThemeType, ThemeColors> = {
  cherry: {
    primary: "#0c201a", // Deep dark teal/forest green board
    accent: "#c4f500",  // Sassy lime neon
    glow: "rgba(196, 245, 0, 0.35)",
    bgGradient: "from-[#f7f9f6] via-[#f7f9f6] to-[#eff2ee]",
    waveColors: ["#0a3641", "#c4f500", "#124e5d", "#a8d400"],
  },
  matrix: {
    primary: "#020a05", // Deep pitch dark terminal board
    accent: "#00ff66",  // Matrix code lime neon green
    glow: "rgba(0, 255, 102, 0.35)",
    bgGradient: "from-[#020a05] via-[#05140b] to-[#010502]",
    waveColors: ["#003311", "#00ff66", "#006622", "#33ff99"],
  },
  cyber: {
    primary: "#120924", // Cyberpunk sleek deep violet indigo board
    accent: "#00f0ff",  // Electric neon cyan
    glow: "rgba(0, 240, 255, 0.35)",
    bgGradient: "from-[#120924] via-[#1a0c30] to-[#0d061c]",
    waveColors: ["#1a0b36", "#00f0ff", "#a100ff", "#ff007f"],
  },
  sunset: {
    primary: "#240a0a", // Fiery twilight dark red-burgundy board
    accent: "#ffaa00",  // Hot amber-gold glow
    glow: "rgba(255, 170, 0, 0.35)",
    bgGradient: "from-[#240a0a] via-[#2f1010] to-[#1a0505]",
    waveColors: ["#300f0f", "#ffaa00", "#ff3300", "#ffea00"],
  },
  slate: {
    primary: "#1e293b", // Professional modern graphite/slate gray board
    accent: "#38bdf8",  // Clean crisp neon sky blue
    glow: "rgba(56, 189, 248, 0.35)",
    bgGradient: "from-[#1e293b] via-[#334155] to-[#0f172a]",
    waveColors: ["#0f172a", "#38bdf8", "#1e293b", "#7dd3fc"],
  },
  ivory: {
    primary: "#ffffff", // Pure Snow White board matching screenshots
    accent: "#0f172a",  // High-contrast deep slate/charcoal for premium text/controls
    glow: "rgba(15, 23, 42, 0.15)",
    bgGradient: "from-white via-white to-[#fafafa]",
    waveColors: ["#b4b1e4", "#fbbfb5", "#b3e5df", "#fcdcb2"],
  },
};

// ==========================================
// 🎨 Universal Subject-Agnostic Infographic / Cheat Sheet Data Types
// ==========================================

export type AcademicDomain = "science" | "math_cs" | "humanities" | "commerce";

export interface ExamTrapItem {
  trapTitle: string; // e.g. "Confusing Dilute vs Conc. Acid" or "Sign Convention Error"
  wrongConcept: string; // e.g. "Assuming focal length is always positive"
  correctConcept: string; // e.g. "Focal length is negative for concave mirror/lens"
  examTip: string; // e.g. "Watch for 'converging' vs 'diverging' keywords in question"
}

export interface OverviewBulletItem {
  label: string; // e.g. "Free State", "Combined State", "Origin / Cause", "Key Characteristic"
  text: string;  // e.g. "Present in small amounts in air and traces in natural water."
  iconKey?: "cloud" | "flask" | "bio" | "sparkles" | "book" | "scale" | "shield" | "atom";
}

export interface FormOrClassificationItem {
  id: number;
  name: string; // e.g. "Gaseous Ammonia", "Liquid Ammonia", "Liquor Ammonia Fortis", "Bench Reagent"
  description: string; // e.g. "Dry ammonia gas", "Saturated solution with relative density of 0.880"
  badge?: string; // e.g. "0.880 density", "Dry", "High Pressure"
  iconKey?: "gas" | "cylinder" | "bottle" | "dropper" | "atom" | "layers" | "cube";
}

export interface FavourableConditionItem {
  parameter: string; // e.g. "Temperature", "Pressure", "Catalyst", "Promoter", "Boundary Condition"
  value: string; // e.g. "450°C - 500°C (Optimum)", "> 200 atm (~250 atm)", "Finely divided Iron (Fe)"
  iconKey?: "temperature" | "pressure" | "catalyst" | "promoter" | "gear" | "zap";
  badge?: string; // e.g. "Crucial", "Optimum", "Exothermic"
}

export interface ProcessFlowStageItem {
  stepNumber: number;
  label: string; // e.g. "Purification & Compression", "Mixing (1 Vol N2 : 3 Vol H2)", "Catalytic Reactor (500°C)", "Cooling Condenser"
  subtext?: string;
}

export interface UnsuitableAlertCallout {
  title: string; // e.g. "Unsuitability of Other Drying Agents" or "Critical Exception / Warning"
  warningText: string; // e.g. "Other common drying agents like conc. H2SO4, P2O5 and anhydrous CaCl2 are unsuitable because they react chemically with basic ammonia."
  reagentsOrExceptions?: string[];
  balancedEquations?: string[];
}

export interface UniversalInfographicSchema {
  metadata: {
    title: string;          // e.g., "AMMONIA (NH3) - KEY ASPECTS SUMMARY", "FRENCH REVOLUTION", "LAWS OF MOTION"
    subtitle: string;       // e.g., "Colourless gas with pungent odour, lighter than air, highly soluble and basic in nature"
    domain: AcademicDomain;
    subjectBadge?: string;  // e.g., "CHEMISTRY", "HISTORY", "PHYSICS", "ECONOMICS"
    gradeBadge?: string;    // e.g., "CLASS 10", "CBSE / ICSE"
    chapterBadge?: string;  // e.g., "CHAPTER 9: STUDY OF COMPOUNDS"
    tagBadge?: string;      // e.g., "HIGH-YIELD REVISION"
    weightageBadge?: string; // e.g., "High-Yield • 8-10 Marks"
    moleculeFormulaLatex?: string; // e.g. "NH_3" or "\vec{F} = m\vec{a}"
    relativeMassOrWeight?: string; // e.g. "17 g/mol" or "SI: N"
    geometricStructure?: string;   // e.g. "Pyramidal Molecule", "Trigonal Planar", "Vector Coordinate"
  };

  // Section 1: Top Overview Grid (Two Parallel Cards: Occurrence/Origin & Forms/Taxonomy)
  overviewSection?: {
    card1_occurrence: {
      cardTitle: string; // e.g. "OCCURRENCE" or "HISTORICAL BACKGROUND" or "AXIOMATIC ORIGIN"
      bullets: OverviewBulletItem[];
    };
    card2_forms: {
      cardTitle: string; // e.g. "FORMS OF AMMONIA" or "CLASSIFICATION & TYPES" or "PHASES / REGIMES"
      items: FormOrClassificationItem[];
    };
  };

  // Section 2: Deep-Dive Lab Prep / Fundamental Derivation
  labOrPrepSection?: {
    sectionNumber?: number; // e.g. 3
    sectionTitle: string;   // e.g. "LABORATORY PREPARATION FROM AMMONIUM CHLORIDE"
    reactantsOrInputs: string; // e.g. "Ammonium chloride (NH4Cl) and an excess of calcium hydroxide [Ca(OH)2]"
    reactionEquationLatex: string; // e.g. "2NH_4Cl + Ca(OH)_2 \xrightarrow{\Delta} CaCl_2 + 2H_2O + 2NH_3\uparrow"
    precautionsAndDrying: string; // e.g. "The round-bottom flask is fitted in a slanting position with mouth downwards so condensed water does not trickle back and crack the heated flask. Dried using quicklime (CaO)."
    collectionMethod: string; // e.g. "Collected by downward displacement of air because it is lighter than air (V.D. = 8.5 vs air 14.4) and highly soluble in water."
    unsuitableAlert?: UnsuitableAlertCallout;
  };

  // Section 3: Industrial Manufacture / Equilibrium Mechanics / Core Laws
  manufactureOrProcessSection?: {
    sectionNumber?: number; // e.g. 4
    sectionTitle: string;   // e.g. "MANUFACTURE BY HABER'S PROCESS"
    reactantsRatio: string; // e.g. "Nitrogen (from liquid air) and Hydrogen (from water gas/natural gas) in ratio of 1 : 3 by volume"
    reactionEquationLatex: string; // e.g. "N_2(g) + 3H_2(g) \rightleftharpoons 2NH_3(g) + \text{Heat}\ (\Delta H = -92.4\text{ kJ/mol})"
    favourableConditions: FavourableConditionItem[];
    flowStages: ProcessFlowStageItem[];
    recoveryAndRecycle: string; // e.g. "Unreacted N2 and H2 are separated via liquefaction or water absorption and recirculated back to achieve 98% eventual yield."
  };

  block1_foundation: {      // Pillar 1: Core Definition & Essential Taxonomy
    sectionTitle: string;   
    coreDefinition: string; 
    visualElement: { 
      type: "svg_vector" | "timeline_points" | "formula_capsule" | "flow_diagram" | "apparatus_schematic"; 
      data: string[]; 
      caption?: string;
    };
  };
  block2_structure: {       // Pillar 2: Master Formulas & Structural Parameters
    sectionTitle: string;   
    attributes: { name: string; value: string; supportsLaTeX: boolean }[];
  };
  block3_mechanics: {       // Pillar 4: 4 Distinct Scenario Case Studies
    sectionTitle: string;   
    scenarios: { title: string; mechanismDescription: string; equationOrEvidence?: string; takeawayOrTip?: string }[];
  };
  block4_impact_uses: {     // Pillar 6: Real-world Applications & Dual-Lens Impact
    sectionTitle: string;   
    points: { category: string; description: string; iconKey: string }[];
  };
  block5_exam_traps?: {     // Pillar 5: Exam Traps & Silly Mistake Alerts
    sectionTitle: string;
    traps: ExamTrapItem[];
  };
  mnemonicHook?: {          // Pillar 6 (Mnemonic component): 10-Second Recall Hook
    acronym: string;
    explanation: string;
  };
  keyTakeaway: string;      // Single line summary footer banner text
}

// Backward compatibility & STEM aliases
export interface InfographicCaseStudy {
  caseNumber: number;
  title: string;
  badgeColor?: string; // e.g. 'green', 'blue', 'orange', 'purple'
  diagramType?: string;
  diagramLabelA?: string;
  diagramLabelB?: string;
  vectorAValue?: string;
  vectorBValue?: string;
  formulaLatex: string;
  observationText: string;
  speedFormulaLatex?: string;
}

export interface InfographicApplication {
  title: string;
  type?: string;
  iconName?: string;
  summaryFormulaLatex?: string;
  explanation: string;
}

export interface ConceptInfographicData extends Partial<UniversalInfographicSchema> {
  header?: {
    subject: string;
    grade: string;
    chapter: string;
    topicTag: string;
    weightageBadge?: string;
  };
  mainTitle?: string;
  definitionPill?: string;
  conceptSection?: {
    badgeText: string;
    definition: string;
    primaryFormulaLatex: string;
  };
  centerVisual?: {
    visualType?: string;
    labelA: string;
    labelB: string;
    vectorALatex: string;
    vectorBLatex: string;
    description: string;
  };
  observationSection?: {
    badgeText: string;
    subHeading: string;
    formulaLatex: string;
    conditions: {
      conditionLatex: string;
      resultText: string;
    }[];
  };
  caseStudies?: InfographicCaseStudy[];
  vectorFormSection?: {
    title: string;
    generalFormulaLatex: string;
    magnitudeFormulaLatex: string;
    thetaExplanation: string;
    diagramType?: string;
  };
  examTrapsSection?: {
    title: string;
    traps: ExamTrapItem[];
  };
  mnemonicSection?: {
    acronym: string;
    explanation: string;
  };
  applicationsSection?: {
    title: string;
    items: InfographicApplication[];
  };
  footerNote?: string;
  originalUploadedImageUrl?: string;
}


