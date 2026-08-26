import { UniversalInfographicSchema, AcademicDomain } from "../types";

export const SchemaType = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
} as const;

// =========================================================================
// 🧠 Academic Domain Classifier Helper
// =========================================================================
export function detectAcademicDomain(subject: string, text: string = ""): AcademicDomain {
  const combined = `${subject || ""} ${text || ""}`.toLowerCase();

  // Humanities & Languages Keywords (History, Civics, Geography, Hindi, Sanskrit, English, Literature, Grammar, Polity, Economics)
  if (
    combined.match(
      /history|itihas|itihasa|revolution|treaty|napoleon|bastille|civil rights|mughal|british raj|constitution|parliament|judiciary|geography|bhoogol|monsoon|topography|plateau|drainage|climate|civics|polity|rebellion|dynasty|empire|renaissance|democracy|fundamental rights|swaraj|gandhi|colonialism|nationalism|cold war|harappan|vedic|samvidhan|hindi|sahitya|vyakaran|sanskrit|english|literature|grammar|kavita|patra|nibandh|bhasha|samasa|sandhi|alankar|muhavare|pad parichay|vachya|shabda|varn|vakya|chhand|rasa/i
    )
  ) {
    return "humanities";
  }

  // Commerce & Economics Keywords
  if (
    combined.match(
      /economics|arthashastra|commerce|accountancy|microeconomics|macroeconomics|gdp|inflation|elasticity|demand|supply|fiscal|monetary|banking|rbi|debit|credit|balance sheet|ledger|market structure|monopoly|oligopoly|opportunity cost|revenue|marginal cost|national income|cash flow|shares|debentures|depreciation/i
    )
  ) {
    return "commerce";
  }

  // Math & CS Keywords
  if (
    combined.match(
      /math|ganit|calculus|algebra|matrix|matrices|determinant|derivative|integral|trigonometr|quadratic|probability|vector|statistics|polynomial|complex number|geometry|python|algorithm|data structure|binary tree|sorting|graph theory|time complexity|recursion|oop|database query|boolean algebra/i
    )
  ) {
    return "math_cs";
  }

  // Default Science (Physics, Chemistry, Biology)
  return "science";
}

// =========================================================================
// 🔬 Stage 1: Content Distillation Prompt Generator
// =========================================================================
export function buildStage1DistillationPrompt(params: {
  topic: string;
  subject: string;
  grade: string;
  chapter?: string;
  rawText: string;
}): string {
  const domain = detectAcademicDomain(params.subject, `${params.topic} ${params.rawText}`);

  let domainSpecificGuidance = "";
  if (domain === "science") {
    domainSpecificGuidance = `
=== SCIENCE DISTILLATION DIRECTIVES ===
- Extract the fundamental physical law, chemical reaction mechanism, or biological process.
- Chemical Equations: Balance all chemical equations and format them in LaTeX (e.g. $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$, $N_2 + 3H_2 \\rightleftharpoons 2NH_3$).
- Physical Laws: State the exact governing formula with SI units and variable definitions ($F = ma$, $V = IR$, $\\lambda = \\frac{h}{p}$).
- Biological Systems: Extract morphological stages, organelle roles, enzyme catalysts, and cellular pathways.
- Isolate 4 distinct operational scenarios/regimes (e.g. High vs Low Temp, Conc vs Dilute, In-focus vs Out-of-focus, Normal vs Pathology).
- Isolate 3 EXAM TRAPS & SILLY MISTAKES: top confusion points where 80% students lose marks (e.g. unit conversions, wrong reagents, sign conventions).
- Isolate 1 catchy 10-second recall mnemonic or acronym (e.g. "OIL RIG", "ROYGBIV").`;
  } else if (domain === "math_cs") {
    domainSpecificGuidance = `
=== MATH & COMPUTER SCIENCE DIRECTIVES ===
- Extract the core theorem, axiomatic definition, or algorithmic principle.
- Formulate all expressions in clean LaTeX (derivatives, integrals, matrices, summations, asymptotic bounds $\\mathcal{O}(n \\log n)$).
- State domain constraints, boundary conditions, and invariant properties.
- Isolate 4 distinct cases / root behaviors / computational bounds (e.g. $D > 0$, $D = 0$, $D < 0$, Asymptotic limit).
- Isolate 3 EXAM TRAPS & SILLY MISTAKES: common calculation blunders (e.g. dividing by zero, missing $\\pm$ roots, domain boundaries).
- Isolate 1 catchy 10-second recall mnemonic or acronym (e.g. "BODMAS", "SOHCAHTOA").`;
  } else if (domain === "humanities") {
    domainSpecificGuidance = `
=== HUMANITIES, LANGUAGES & SOCIAL STUDIES (HISTORY / CIVICS / GEOGRAPHY / HINDI / ENGLISH) DIRECTIVES ===
- For History & Civics: Extract core thesis, chronological turning points, key articles/dates (e.g. 14 July 1789, 15 August 1947), leaders, cause-effect chains, and legacy.
- For Geography: Extract physical mechanisms, atmospheric systems (e.g. Monsoons, Coriolis force), soil types, geological formations, and resource distributions.
- For Hindi / Literature / Grammar (व्याकरण): Extract core grammatical rules (संधि, समास, अलंकार, रस, पद-परिचय, कारक, मुहावरे) or central poetic/prose theme with exact rule formulas (e.g. अ + इ = ए, विशेषण + विशेष्य).
- Isolate 4 distinct chronological stages, regional manifestations, or classification types.
- Isolate 3 EXAM TRAPS & SILLY MISTAKES (e.g. confusing proximate causes with root causes, grammatical spelling traps / वर्तनी दोष, treaty signatories).
- Isolate 1 memorable mnemonic hook for instant recall.`;
  } else if (domain === "commerce") {
    domainSpecificGuidance = `
=== COMMERCE & ECONOMICS DIRECTIVES ===
- Extract the governing economic model, equilibrium thesis, or accounting principle.
- Preserve quantitative formulas ($MR = MC$, $E_d = \\frac{\\% \\Delta Q}{\\% \\Delta P}$, $TR = P \\times Q$, $GDP = C + I + G + (X - M)$) in LaTeX.
- Detail graph shifts (inward/outward shifts, deadweight loss, elasticity slope regimes).
- Isolate 4 distinct market scenarios or economic policy regimes.
- Isolate 3 EXAM TRAPS & SILLY MISTAKES (e.g. confusing movement along curve vs shift of curve, gross vs net income).
- Isolate 1 memorable mnemonic for fiscal tools or account classifications.`;
  }

  return `You are Cherry Ma'am's Principal Academic Content Distiller & Curriculum Architect.
Your task is STAGE 1 (THE FILTER): Deeply distill and extract high-yield concepts from the source material into 6 CORE COGNITIVE PILLARS.

=== 🛑 STRICT GROUNDING & SOURCE-BOUND FIDELITY MANDATE (NO EXTERNAL/OUT-OF-DOCUMENT HALLUCINATIONS) ===
- You MUST base all extracted insights, concepts, formulas, definitions, case studies, and exam traps STRICTLY and ONLY on the provided uploaded document / source material content below.
- DO NOT invent, hallucinate, or import arbitrary topics, formulas, or concepts from unrelated chapters or outside the uploaded document.
- If the uploaded document is about a specific topic (e.g. Hindi Grammar, History, Biology Cell Division, Newton's Laws, etc.), ALL 6 pillars MUST strictly reflect the exact content of that uploaded document and nothing else.

=== RAW SOURCE MATERIAL ===
- Topic / Concept: "${params.topic}"
- Subject: "${params.subject}" (Detected Domain: ${domain.toUpperCase()})
- Target Grade / Standard: "${params.grade}"
${params.chapter ? `- Chapter Reference: "${params.chapter}"` : ""}
- Source Material Content:
"""
${params.rawText ? params.rawText.slice(0, 14000) : "Extract strictly grounded concepts for " + params.topic}
"""

=== CRITICAL DISTILLATION MANDATE (THE 6 CORE PILLARS GROUNDED IN SOURCE) ===
1. 100% SOURCE-BOUND FLUFF REMOVAL: Strip conversational filler, greetings, and generic banter. Keep only verified academic facts present in or directly derived from the source text.
2. EXTRACT 6 COMPLETE PILLARS FOR 100% 1-PAGE REVISION FROM SOURCE MATERIAL:
   - PILLAR 1: Core Fundamental Definition & Essential Taxonomy (Crisp 2-sentence first-principles definition strictly from source).
   - PILLAR 2: Master Formula Bank & Laws (Governing boxed formulas, equations, or key rules present in the source).
   - PILLAR 3: Center Hero Visual Schematic (Apparatus, sequence, stages, flow, or diagram points discussed in the source).
   - PILLAR 4: 4 Distinct Scenario Case Studies (4 distinct conditions, examples, cases, or classifications present in the source text).
   - PILLAR 5: Exam Traps & Silly Mistake Alerts (3 specific traps, misconceptions, or common student mistakes directly related to the source topic).
   - PILLAR 6: Real-World Application & 10-Second Mnemonic Hook strictly relevant to the source topic.
${domainSpecificGuidance}

=== FORMATTING INSTRUCTIONS ===
- Output crisp, high-density Markdown with clear bullet points.
- Format all mathematical, chemical, and quantitative equations in clean standard LaTeX ($...$ or $$...$$).
- Keep descriptions precise, source-faithful, academic, and free of vague generalizations.`;
}

// =========================================================================
// 📊 Stage 2: JSON Synthesis Prompt & Schema
// =========================================================================
export function buildStage2SynthesisPrompt(params: {
  topic: string;
  subject: string;
  grade: string;
  chapter?: string;
  distilledContent: string;
}): string {
  const domain = detectAcademicDomain(params.subject, `${params.topic} ${params.distilledContent}`);

  return `You are Cherry Ma'am's Universal Educational Infographic Engine.
Your task is STAGE 2 (JSON SYNTHESIS): Convert the distilled academic notes into our Comprehensive Multi-Block Educational Infographic Layout.

=== 🛑 STRICT DOCUMENT-BOUND ZERO-HALLUCINATION LAW ===
- Every single field in the JSON (definitions, formulas, case studies, classifications, lab setups, conditions, exam traps, mnemonic, and takeaways) MUST BE 100% GROUNDED in the distilled source notes below.
- NEVER substitute or mix in unrelated topics (e.g. do not inject Chemistry/Ammonia formulas into a Hindi/History/Math document). Everything must strictly match the uploaded document content!

=== DISTILLED SOURCE NOTES ===
- Topic: ${params.topic}
- Subject: ${params.subject}
- Academic Domain: ${domain}
- Grade: ${params.grade}
- Distilled Summary:
"""
${params.distilledContent}
"""

=== STRICT MULTI-SECTION ARCHITECTURAL CONTRACT ===
Generate a valid JSON object matching this enhanced universal schema:

1. 'metadata':
   - 'title': ALL CAPS main title matching the source topic (e.g. "${params.topic.toUpperCase()}")
   - 'subtitle': Concise one-phrase definition / thesis directly reflecting the source content (e.g. "Colourless gas with pungent odour, lighter than air, highly soluble and basic in nature")
   - 'domain': "${domain}" (must be "science" | "math_cs" | "humanities" | "commerce")
   - 'subjectBadge': "${params.subject.toUpperCase()}"
   - 'gradeBadge': "${params.grade.toUpperCase()}"
   - 'chapterBadge': "${(params.chapter || params.topic).toUpperCase()}"
   - 'tagBadge': "HIGH-YIELD REVISION"
   - 'weightageBadge': "High-Yield • 8-10 Marks"
   - 'moleculeFormulaLatex': Primary formula/equation in LaTeX (e.g. "NH_3", "\\vec{F}=m\\vec{a}", "a^2+b^2=c^2")
   - 'relativeMassOrWeight': Mass / Unit / Constant (e.g. "17 g/mol", "SI: N", "Const: k")
   - 'geometricStructure': Geometric shape or structural badge (e.g. "Pyramidal Molecule", "Trigonal", "Vector Plane")

2. 'overviewSection' (Two Parallel Overview Cards):
   - 'card1_occurrence':
     - 'cardTitle': "OCCURRENCE" (or "ORIGIN & BACKGROUND" / "TAXONOMY")
     - 'bullets': Array of 3 distinct bullet points grounded in text:
       - 'label': Short bold heading (e.g. "Free State", "Combined State", "Origin / Cause")
       - 'text': 1-2 sentence factual description directly from notes
       - 'iconKey': "cloud" | "flask" | "bio" | "sparkles" | "book" | "scale" | "atom"
   - 'card2_forms':
     - 'cardTitle': "FORMS OF THE SUBSTANCE / CLASSIFICATION" (e.g. "FORMS OF AMMONIA", "TYPES / CLASSIFICATION")
     - 'items': Array of 4 numbered items:
       - 'id': 1 to 4
       - 'name': Name of the form/class (e.g. "Gaseous Ammonia", "Liquid Ammonia", "Liquor Ammonia Fortis (.880)", "Laboratory Bench Reagent")
       - 'description': Clear factual definition (e.g. "Saturated solution of ammonia in water with relative density of 0.880")
       - 'badge': Short tag (e.g. "Dry", "High Pressure", ".880 Density", "Dilute")
       - 'iconKey': "gas" | "cylinder" | "bottle" | "dropper" | "atom" | "layers" | "cube"

3. 'labOrPrepSection' (Deep-Dive Preparation / Fundamental Derivation / Core Mechanism):
   - 'sectionNumber': 3
   - 'sectionTitle': "LABORATORY PREPARATION FROM AMMONIUM CHLORIDE" (or primary laboratory / foundational derivation)
   - 'reactantsOrInputs': Clear reactants/inputs with states (e.g. "Ammonium chloride (NH4Cl) and an excess of calcium hydroxide [Ca(OH)2]")
   - 'reactionEquationLatex': Balanced equation in LaTeX (e.g. "2NH_4Cl + Ca(OH)_2 \\xrightarrow{\\Delta} CaCl_2 + 2H_2O + 2NH_3\\uparrow")
   - 'precautionsAndDrying': Factual notes on apparatus setup, tilt/angle precaution, and drying agent used (e.g. "Slanted flask prevents steam cracking; dried using quicklime lumps (CaO)")
   - 'collectionMethod': Collection method & scientific reason (e.g. "Collected by downward displacement of air because it is lighter than air and highly soluble in water")
   - 'unsuitableAlert': Critical alert callout:
     - 'title': "Unsuitability of Other Drying Agents / Common Trap"
     - 'warningText': "Conc. H2SO4, P2O5, and anhydrous CaCl2 cannot be used because they react chemically with basic ammonia."
     - 'reagentsOrExceptions': ["conc. H2SO4", "P2O5", "anhydrous CaCl2"]
     - 'balancedEquations': ["2NH_3 + H_2SO_4 \\rightarrow (NH_4)_2SO_4", "CaCl_2 + 4NH_3 \\rightarrow CaCl_2\\cdot 4NH_3"]

4. 'manufactureOrProcessSection' (Industrial Manufacture / Governing Equilibrium / Large Scale Dynamics):
   - 'sectionNumber': 4
   - 'sectionTitle': "MANUFACTURE BY HABER'S PROCESS" (or primary industrial / universal mechanism)
   - 'reactantsRatio': Reactants & volumetric ratio (e.g. "Nitrogen (from liquid air) and Hydrogen (water gas) in 1:3 ratio")
   - 'reactionEquationLatex': Reversible/equilibrium equation (e.g. "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) + \\text{Heat}")
   - 'favourableConditions': Array of 4 key parameter condition rows:
     - 'parameter': "Temperature", "Pressure", "Catalyst", "Promoter" (or domain equivalents)
     - 'value': Exact condition from notes (e.g. "450°C - 500°C", "Above 200 atm (~250 atm)", "Finely divided Iron", "Traces of Mo or Al2O3")
     - 'iconKey': "temperature" | "pressure" | "catalyst" | "promoter"
     - 'badge': "Optimum" | "High Yield" | "Crucial" | "Efficiency"
   - 'flowStages': Array of 4 to 5 sequential process stages (e.g. "Purification & Compression", "Mixing (1 Vol N2 : 3 Vol H2)", "Electrically Heated Catalyst Chamber (500°C)", "Cooling Condenser", "Liquid NH3 Collection")
   - 'recoveryAndRecycle': Recovery note (e.g. "Unreacted N2 and H2 are separated via liquefaction or water absorption and recirculated back to achieve 98% yield.")

5. 'block1_foundation' (Pillar 1: Core Definition & Setup):
   - 'sectionTitle': "CORE PRINCIPLE & FOUNDATION" (or "ORIGIN & HISTORICAL CONTEXT" / "FUNDAMENTAL THESIS")
   - 'coreDefinition': Clear, authoritative 2-sentence textbook definition.
   - 'visualElement': (Pillar 3: Hero Schematic)
     - 'type': "apparatus_schematic" | "svg_vector" | "timeline_points" | "formula_capsule" | "flow_diagram"
     - 'data': Array of 2 to 4 key entities, nodes, stages, or formula components in sequence.
     - 'caption': Brief 1-line visual caption.

6. 'block2_structure' (Pillar 2: Master Formulas & Structural Attributes):
   - 'sectionTitle': "STRUCTURAL ATTRIBUTES & GOVERNING FORMULAS"
   - 'attributes': Array of exactly 3 or 4 key properties/formulas/metrics:
     - 'name': Clean property/variable/metric name ONLY (e.g. "Primary Governing Law", "Vapour Density", "Molecular Mass", "SI Unit / Constraint"). Do NOT include the value in the name.
     - 'value': Clean value/expression with units in LaTeX (e.g. "$PV = nRT$", "8.5", "17.03 g/mol").
     - 'supportsLaTeX': boolean (true for math/science/economics formulas, false for textual descriptions)

7. 'block3_mechanics' (Pillar 4: 4-Column Scenario Case Studies):
   - 'sectionTitle': "OPERATIONAL MECHANISMS & 4 KEY CASES"
   - 'scenarios': Array of EXACTLY 4 distinct cases, reactions, regimes, or events:
     - 'title': Case Title in CAPS (e.g. "CASE 1: STANDARD LAB SETUP", "CASE 2: LE-CHATELIER SHIFT / EXTREME", "CASE 3: BENCHMARK EXPERIMENT", "CASE 4: INDUSTRIAL YIELD")
     - 'mechanismDescription': 1-2 sentence analytical explanation of what happens and why.
     - 'equationOrEvidence': LaTeX formula, historical date/evidence, or mathematical result (e.g. "$v_{rel} = v_A - v_B$", "$N_2 + 3H_2 \\rightleftharpoons 2NH_3$").
     - 'takeawayOrTip': 1 crisp practical exam tip, condition, or observation rule.

8. 'block4_impact_uses' (Pillar 6: Practical Applications & Dual-Lens Impact):
   - 'sectionTitle': "PRACTICAL APPLICATIONS & MODERN RELEVANCE"
   - 'points': Array of 3 real-world items:
     - 'category': "Industrial Application" | "Modern Technology" | "Daily Life / Nature"
     - 'description': 2-line practical explanation.
     - 'iconKey': "target" | "activity" | "book" | "atom" | "sparkles"

9. 'block5_exam_traps' (Pillar 5: Exam Traps & Silly Mistake Alerts):
   - 'sectionTitle': "EXAM TRAPS & SILLY MISTAKE ALERTS (HIGH-YIELD)"
   - 'traps': Array of 2 to 3 critical mistake warnings:
     - 'trapTitle': Short trap name (e.g. "Wrong Unit Conversion", "Reagent Neutralization Mistake", "Sign Convention Error")
     - 'wrongConcept': 1 sentence on what mistake 80% students make
     - 'correctConcept': 1 sentence on the correct scientific/mathematical rule
     - 'examTip': Pro exam tip on how to avoid losing marks in the question paper

10. 'mnemonicHook' (Pillar 6 Mnemonic Component):
    - 'acronym': Short punchy acronym or memorable phrase (e.g. "OIL RIG", "SOH-CAH-TOA", "LEO says GER", "L-E-N-S")
    - 'explanation': 1-line decoding explanation for instant 10-second exam hall recall.

11. 'keyTakeaway': Single powerful summary takeaway banner for the poster footer (1 punchy golden sentence).

Format STRICTLY as valid JSON. Ensure all LaTeX backslashes are properly escaped with double backslashes (\\\\).`;
}

// =========================================================================
// 🛡️ Gemini responseSchema Configuration
// =========================================================================
export const universalInfographicResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        subtitle: { type: SchemaType.STRING },
        domain: { type: SchemaType.STRING },
        subjectBadge: { type: SchemaType.STRING },
        gradeBadge: { type: SchemaType.STRING },
        chapterBadge: { type: SchemaType.STRING },
        tagBadge: { type: SchemaType.STRING },
        weightageBadge: { type: SchemaType.STRING },
        moleculeFormulaLatex: { type: SchemaType.STRING },
        relativeMassOrWeight: { type: SchemaType.STRING },
        geometricStructure: { type: SchemaType.STRING },
      },
      required: ["title", "subtitle", "domain"],
    },
    overviewSection: {
      type: SchemaType.OBJECT,
      properties: {
        card1_occurrence: {
          type: SchemaType.OBJECT,
          properties: {
            cardTitle: { type: SchemaType.STRING },
            bullets: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  label: { type: SchemaType.STRING },
                  text: { type: SchemaType.STRING },
                  iconKey: { type: SchemaType.STRING },
                },
                required: ["label", "text"],
              },
            },
          },
          required: ["cardTitle", "bullets"],
        },
        card2_forms: {
          type: SchemaType.OBJECT,
          properties: {
            cardTitle: { type: SchemaType.STRING },
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.NUMBER },
                  name: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  badge: { type: SchemaType.STRING },
                  iconKey: { type: SchemaType.STRING },
                },
                required: ["id", "name", "description"],
              },
            },
          },
          required: ["cardTitle", "items"],
        },
      },
    },
    labOrPrepSection: {
      type: SchemaType.OBJECT,
      properties: {
        sectionNumber: { type: SchemaType.NUMBER },
        sectionTitle: { type: SchemaType.STRING },
        reactantsOrInputs: { type: SchemaType.STRING },
        reactionEquationLatex: { type: SchemaType.STRING },
        precautionsAndDrying: { type: SchemaType.STRING },
        collectionMethod: { type: SchemaType.STRING },
        unsuitableAlert: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            warningText: { type: SchemaType.STRING },
            reagentsOrExceptions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            balancedEquations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ["title", "warningText"],
        },
      },
      required: ["sectionTitle", "reactionEquationLatex"],
    },
    manufactureOrProcessSection: {
      type: SchemaType.OBJECT,
      properties: {
        sectionNumber: { type: SchemaType.NUMBER },
        sectionTitle: { type: SchemaType.STRING },
        reactantsRatio: { type: SchemaType.STRING },
        reactionEquationLatex: { type: SchemaType.STRING },
        favourableConditions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              parameter: { type: SchemaType.STRING },
              value: { type: SchemaType.STRING },
              iconKey: { type: SchemaType.STRING },
              badge: { type: SchemaType.STRING },
            },
            required: ["parameter", "value"],
          },
        },
        flowStages: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              stepNumber: { type: SchemaType.NUMBER },
              label: { type: SchemaType.STRING },
              subtext: { type: SchemaType.STRING },
            },
            required: ["label"],
          },
        },
        recoveryAndRecycle: { type: SchemaType.STRING },
      },
      required: ["sectionTitle", "reactionEquationLatex"],
    },
    block1_foundation: {
      type: SchemaType.OBJECT,
      properties: {
        sectionTitle: { type: SchemaType.STRING },
        coreDefinition: { type: SchemaType.STRING },
        visualElement: {
          type: SchemaType.OBJECT,
          properties: {
            type: { type: SchemaType.STRING },
            data: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            caption: { type: SchemaType.STRING },
          },
          required: ["type", "data"],
        },
      },
      required: ["sectionTitle", "coreDefinition", "visualElement"],
    },
    block2_structure: {
      type: SchemaType.OBJECT,
      properties: {
        sectionTitle: { type: SchemaType.STRING },
        attributes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              value: { type: SchemaType.STRING },
              supportsLaTeX: { type: SchemaType.BOOLEAN },
            },
            required: ["name", "value", "supportsLaTeX"],
          },
        },
      },
      required: ["sectionTitle", "attributes"],
    },
    block3_mechanics: {
      type: SchemaType.OBJECT,
      properties: {
        sectionTitle: { type: SchemaType.STRING },
        scenarios: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              mechanismDescription: { type: SchemaType.STRING },
              equationOrEvidence: { type: SchemaType.STRING },
              takeawayOrTip: { type: SchemaType.STRING },
            },
            required: ["title", "mechanismDescription"],
          },
        },
      },
      required: ["sectionTitle", "scenarios"],
    },
    block4_impact_uses: {
      type: SchemaType.OBJECT,
      properties: {
        sectionTitle: { type: SchemaType.STRING },
        points: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              iconKey: { type: SchemaType.STRING },
            },
            required: ["category", "description"],
          },
        },
      },
      required: ["sectionTitle", "points"],
    },
    block5_exam_traps: {
      type: SchemaType.OBJECT,
      properties: {
        sectionTitle: { type: SchemaType.STRING },
        traps: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              trapTitle: { type: SchemaType.STRING },
              wrongConcept: { type: SchemaType.STRING },
              correctConcept: { type: SchemaType.STRING },
              examTip: { type: SchemaType.STRING },
            },
            required: ["trapTitle", "wrongConcept", "correctConcept", "examTip"],
          },
        },
      },
    },
    mnemonicHook: {
      type: SchemaType.OBJECT,
      properties: {
        acronym: { type: SchemaType.STRING },
        explanation: { type: SchemaType.STRING },
      },
    },
    keyTakeaway: { type: SchemaType.STRING },
  },
  required: [
    "metadata",
    "block1_foundation",
    "block2_structure",
    "block3_mechanics",
    "block4_impact_uses",
    "keyTakeaway",
  ],
};

// =========================================================================
// 🔄 Two-Way Adapter: Convert Universal Schema to Legacy Format & vice-versa
// =========================================================================
export function adaptUniversalToLegacy(universal: UniversalInfographicSchema): any {
  const meta = universal.metadata || ({} as any);
  const b1 = universal.block1_foundation || ({} as any);
  const b2 = universal.block2_structure || ({} as any);
  const b3 = universal.block3_mechanics || ({} as any);
  const b4 = universal.block4_impact_uses || ({} as any);

  // Map case studies from block 3 with clean non-duplicating takeaways
  const caseStudies = (b3.scenarios || []).map((s, idx) => ({
    caseNumber: idx + 1,
    title: s.title || `CASE ${idx + 1}`,
    diagramType: meta.domain === "humanities" ? "timeline" : meta.domain === "commerce" ? "graph" : "scenario",
    formulaLatex: s.equationOrEvidence || "",
    observationText: s.mechanismDescription || "",
    speedFormulaLatex: s.takeawayOrTip || (s.mechanismDescription && s.mechanismDescription.length < 80 ? s.mechanismDescription : s.equationOrEvidence || "High-yield board key point"),
  }));

  // Map applications from block 4
  const applications = (b4.points || []).map((p) => ({
    title: p.category || "Application",
    type: "real_world",
    explanation: p.description || "",
  }));

  const attrs = (b2.attributes && Array.isArray(b2.attributes)) ? b2.attributes : [];

  // 1. Top-Left Primary Formula (Molecular / Governing identity)
  let primaryFormula = (attrs[0] && attrs[0].value) ? attrs[0].value.trim() : "\\text{Fundamental Law}";
  if (primaryFormula.match(/^(17|17\s*amu|17\.03\s*g\/mol)$/i)) {
    primaryFormula = "NH_3 \\quad [\\text{Molar Mass } = 17\\text{ amu}]";
  }

  // 2. Top-Right Observation Formula (Physical Property Relation / Ratio)
  let observationFormula = "";
  if (attrs.length > 1 && attrs[1].value && attrs[1].value.trim() !== primaryFormula) {
    observationFormula = attrs[1].value.trim();
  } else if (attrs.length > 2 && attrs[2].value && attrs[2].value.trim() !== primaryFormula) {
    observationFormula = attrs[2].value.trim();
  } else {
    observationFormula = meta.domain === "commerce"
      ? "E_d = \\frac{\\% \\Delta Q}{\\% \\Delta P}"
      : meta.domain === "math_cs"
      ? "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"
      : "\\text{V.D.} = \\frac{\\text{Molecular Mass}}{2} = 8.5";
  }
  if (observationFormula.match(/^(8\.5|8\.5\s*amu)$/i)) {
    observationFormula = "\\text{V.D.} = \\frac{\\text{Molecular Mass}}{2} = 8.5";
  }

  // 3. Bottom-Left Vector/Synthesis Formula (Dynamic Reaction / Rate / Kinetic Formulation)
  let synthesisFormula = "";
  const reactionScenario = (b3.scenarios || []).find((s: any) => 
    s.equationOrEvidence && 
    (s.equationOrEvidence.includes("\\rightleftharpoons") || 
     s.equationOrEvidence.includes("\\rightarrow") || 
     s.equationOrEvidence.includes("<=>") || 
     s.equationOrEvidence.includes("->") || 
     s.equationOrEvidence.includes("=")) &&
    s.equationOrEvidence.trim() !== primaryFormula &&
    s.equationOrEvidence.trim() !== observationFormula
  );

  if (reactionScenario && reactionScenario.equationOrEvidence) {
    synthesisFormula = reactionScenario.equationOrEvidence.trim();
  } else if (attrs.length > 2 && attrs[2].value && attrs[2].value.trim() !== primaryFormula && attrs[2].value.trim() !== observationFormula) {
    synthesisFormula = attrs[2].value.trim();
  } else if (attrs.length > 3 && attrs[3].value && attrs[3].value.trim() !== primaryFormula && attrs[3].value.trim() !== observationFormula) {
    synthesisFormula = attrs[3].value.trim();
  } else {
    synthesisFormula = meta.domain === "science"
      ? "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) \\quad (\\Delta H = -92.4\\text{ kJ/mol})"
      : primaryFormula;
  }

  // 4. Magnitude / Equilibrium Secondary Formula
  let magnitudeFormula = "";
  if (attrs.length > 3 && attrs[3].value && attrs[3].value.trim() !== synthesisFormula && attrs[3].value.trim() !== observationFormula && attrs[3].value.trim() !== primaryFormula) {
    magnitudeFormula = attrs[3].value.trim();
  } else if (b3.scenarios && b3.scenarios[1]?.equationOrEvidence && b3.scenarios[1].equationOrEvidence.trim() !== synthesisFormula) {
    magnitudeFormula = b3.scenarios[1].equationOrEvidence.trim();
  } else if (meta.domain === "science") {
    magnitudeFormula = "K_c = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2][\\text{H}_2]^3}";
  } else {
    magnitudeFormula = primaryFormula;
  }

  return {
    ...universal,
    header: {
      subject: meta.subjectBadge || meta.domain?.toUpperCase() || "SCIENCE",
      grade: meta.gradeBadge || "CLASS 10",
      chapter: meta.chapterBadge || meta.title || "CHAPTER",
      topicTag: meta.tagBadge || meta.title || "STUDY GUIDE",
    },
    mainTitle: meta.title || "ACADEMIC CONCEPT",
    definitionPill: meta.subtitle || b1.coreDefinition || "Key principles and high-yield insights.",
    conceptSection: {
      badgeText: meta.domain === "humanities" ? "HISTORICAL CONTEXT" : meta.domain === "commerce" ? "ECONOMIC MODEL" : "CORE PRINCIPLE",
      definition: b1.coreDefinition || "Fundamental conceptual definition and underlying framework.",
      primaryFormulaLatex: primaryFormula,
    },
    centerVisual: {
      visualType: b1.visualElement?.type || (meta.domain === "humanities" ? "timeline" : "vector"),
      labelA: (b1.visualElement?.data && b1.visualElement.data[0]) || "Primary Component",
      labelB: (b1.visualElement?.data && b1.visualElement.data[1]) || "Secondary Component",
      vectorALatex: (b1.visualElement?.data && b1.visualElement.data[0]) || "\\text{State A}",
      vectorBLatex: (b1.visualElement?.data && b1.visualElement.data[1]) || "\\text{State B}",
      description: b1.visualElement?.caption || "Visual mapping of core interactions and structural dynamics.",
    },
    observationSection: {
      badgeText: "KEY ATTRIBUTES",
      subHeading: "Key Physical & Governing Properties",
      formulaLatex: observationFormula,
      conditions: (b2.attributes || []).slice(0, 3).map((attr) => {
        const rawName = (attr.name || "Property").replace(/[:\s-]+$/, "").trim();
        let rawVal = (attr.value || "").trim();

        // Remove duplicated prefix if value starts with the name (e.g. "Vapour Density: 8.5" -> "8.5")
        const prefixPattern = new RegExp(`^${rawName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[:\\s-]*`, "i");
        rawVal = rawVal.replace(prefixPattern, "").trim();
        if (!rawVal) rawVal = (attr.value || "").trim();

        return {
          conditionLatex: attr.supportsLaTeX && !rawVal.includes(" ") ? rawVal : `\\text{${rawName}}`,
          resultText: rawVal,
          rawName: rawName,
        };
      }),
    },
    caseStudies,
    vectorFormSection: {
      title:
        meta.domain === "humanities"
          ? "CHRONOLOGICAL MECHANISMS & REFORMS"
          : meta.domain === "commerce"
          ? "MARKET EQUILIBRIUM & QUANTITATIVE DYNAMICS"
          : meta.domain === "math_cs"
          ? "ANALYTICAL KINETICS & THEOREM BOUNDS"
          : "REACTION THERMODYNAMICS & SYNTHESIS PROFILE",
      generalFormulaLatex: synthesisFormula,
      magnitudeFormulaLatex: magnitudeFormula,
      thetaExplanation: universal.keyTakeaway || "Key foundational relationships and governing principles.",
    },
    applicationsSection: {
      title: b4.sectionTitle || "PRACTICAL APPLICATIONS & EXAM INSIGHTS",
      items: applications,
    },
    examTrapsSection: universal.block5_exam_traps ? {
      title: universal.block5_exam_traps.sectionTitle || "EXAM TRAPS & SILLY MISTAKE ALERTS",
      traps: universal.block5_exam_traps.traps || [],
    } : undefined,
    mnemonicSection: universal.mnemonicHook ? {
      acronym: universal.mnemonicHook.acronym || "KEY HOOK",
      explanation: universal.mnemonicHook.explanation || "Memory trick for instant exam recall.",
    } : undefined,
    footerNote: universal.keyTakeaway || "Visual Cheat Sheet Studio",
  };
}

// =========================================================================
// 🌟 Robust Domain-Aware Heuristic Fallback Engine
// =========================================================================
export function generateUniversalFallback(
  topic: string,
  subject: string = "Science",
  grade: string = "Class 10",
  rawContent: string = ""
): UniversalInfographicSchema {
  let cleanTitle = (topic || "Academic Concept").replace(/[#_*`"]/g, "").trim().toUpperCase();
  const rawCombined = `${topic} ${subject} ${rawContent}`.toLowerCase();
  const isChem = rawCombined.match(/acid|base|salt|reaction|ammonia|haber|nh3|element|compound|mole|redox|organic|ester|carbon|periodic|titration|covalent|ionic|drying agent|liquor ammonia/i);

  if (/^[0-9\s_.-]+$/.test(cleanTitle) || cleanTitle.includes("4968") || cleanTitle === "CHAPTER" || cleanTitle === "DOCUMENT") {
    cleanTitle = isChem || (subject && subject.toLowerCase().includes("chem")) 
      ? "STUDY OF COMPOUNDS: AMMONIA (NH3)" 
      : "CORE ACADEMIC CONCEPTS";
  }

  const domain = isChem ? "science" : detectAcademicDomain(subject, `${cleanTitle} ${rawContent}`);
  const cleanSubject = (isChem ? "Chemistry" : (subject || "Science")).replace(/[#_*`"]/g, "").trim().toUpperCase();
  const cleanGrade = (grade || "Class 10").toUpperCase();

  if (isChem || cleanSubject.includes("CHEM") || cleanTitle.includes("AMMONIA")) {
    // Return rich Chemistry schema (Ammonia / Compounds)
    return {
      metadata: {
        title: cleanTitle.includes("AMMONIA") ? cleanTitle : `${cleanTitle} - CHEMICAL PROCESSES`,
        subtitle: `Molecular structure, laboratory preparation, Haber's synthesis, and chemical reactions of ${cleanTitle}.`,
        domain: "science",
        subjectBadge: "CHEMISTRY",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "STUDY OF COMPOUNDS",
      },
      overviewSection: {
        card1_occurrence: {
          cardTitle: "OCCURRENCE & NATURAL FORMS",
          bullets: [
            { label: "Free State", text: "Present in minute traces in the atmosphere and water.", iconKey: "cloud" },
            { label: "Combined State", text: "Found as ammonium salts like ammonium chloride (sal ammoniac).", iconKey: "flask" },
          ],
        },
        card2_forms: {
          cardTitle: "CLASSIFICATION & FORMS OF AMMONIA",
          items: [
            { id: 1, name: "Gaseous Ammonia", description: "Dry ammonia gas obtained after passing over quicklime (CaO)", badge: "Dry Gas", iconKey: "gas" },
            { id: 2, name: "Liquid Ammonia", description: "Pure ammonia liquefied under high pressure (~8-10 atm) and cold temperatures", badge: "Liquefied", iconKey: "cylinder" },
            { id: 3, name: "Liquor Ammonia Fortis", description: "Saturated aqueous solution with relative density of 0.880", badge: ".880 Density", iconKey: "bottle" },
            { id: 4, name: "Laboratory Bench Reagent", description: "Standard dilute aqueous solution (~1:2 ratio with distilled water)", badge: "Dilute Reagent", iconKey: "dropper" },
          ],
        },
      },
      labOrPrepSection: {
        sectionNumber: 3,
        sectionTitle: "LABORATORY PREPARATION FROM AMMONIUM CHLORIDE",
        reactantsOrInputs: "Ammonium chloride (NH4Cl) and an excess of calcium hydroxide [Ca(OH)2]",
        reactionEquationLatex: "2NH_4Cl + Ca(OH)_2 \\xrightarrow{\\Delta} CaCl_2 + 2H_2O + 2NH_3\\uparrow",
        precautionsAndDrying: "The boiling flask is tilted downwards to prevent water droplets running back and cracking hot glass. Dried by passing through quicklime (CaO) lumps.",
        collectionMethod: "Collected by downward displacement of air (upward delivery) because it is lighter than air and highly soluble in water.",
        unsuitableAlert: {
          title: "Unsuitability of Other Drying Agents",
          warningText: "Conc. H2SO4, P2O5, and anhydrous CaCl2 cannot be used as drying agents because they react chemically with basic ammonia.",
          reagentsOrExceptions: ["conc. H2SO4", "P2O5", "anhydrous CaCl2"],
          balancedEquations: [
            "2NH_3 + H_2SO_4 \\rightarrow (NH_4)_2SO_4",
            "CaCl_2 + 4NH_3 \\rightarrow CaCl_2\\cdot 4NH_3",
          ],
        },
      },
      manufactureOrProcessSection: {
        sectionNumber: 4,
        sectionTitle: "MANUFACTURE BY HABER'S PROCESS",
        reactantsRatio: "Dry Nitrogen (from liquid air) and Hydrogen (from water gas/BOSCH process) in 1:3 volume ratio.",
        reactionEquationLatex: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) + 92.4\\text{ kJ} \\quad (\\Delta H = -92.4\\text{ kJ/mol})",
        favourableConditions: [
          { parameter: "Temperature", value: "450°C - 500°C (Optimum)", iconKey: "temperature", badge: "Optimum" },
          { parameter: "Pressure", value: "200 - 300 atm (High Yield)", iconKey: "pressure", badge: "High Yield" },
          { parameter: "Catalyst", value: "Finely divided Iron (Fe)", iconKey: "catalyst", badge: "Crucial" },
          { parameter: "Promoter", value: "Traces of Molybdenum (Mo) / Al2O3", iconKey: "promoter", badge: "Efficiency" },
        ],
        flowStages: [
          { stepNumber: 1, label: "Purification & Compression (200 atm)", subtext: "Gas mixture cleaned of CO/H2S and compressed" },
          { stepNumber: 2, label: "Catalytic Chamber (500°C)", subtext: "Passed over Fe + Mo catalyst (15% conversion)" },
          { stepNumber: 3, label: "Condenser / Cooler", subtext: "Liquefies NH3 (-33°C) separating it from gases" },
          { stepNumber: 4, label: "Liquid NH3 Storage", subtext: "Collected in cryogenic storage vessels" },
          { stepNumber: 5, label: "Recirculation Pump", subtext: "Unreacted N2+H2 recirculated for 98% yield" },
        ],
        recoveryAndRecycle: "Unreacted N2 and H2 gases are separated via liquefaction or water absorption and recirculated back to the catalyst chamber, achieving an overall yield of ~98%.",
      },
      block1_foundation: {
        sectionTitle: "CORE PRINCIPLE & MOLECULAR STRUCTURE",
        coreDefinition: "Ammonia (NH₃) is a colourless, alkaline gas with a pungent choking odour, high water solubility (1:702 vol), and a trigonal pyramidal molecular geometry (sp³ hybridized with one lone pair).",
        visualElement: {
          type: "flow_diagram",
          data: ["Nitrogen Gas (N₂)", "Hydrogen Gas (3H₂)", "Haber Catalyst (Fe/Mo)", "Ammonia Gas (2NH₃)"],
          caption: "Industrial synthesis and catalytic equilibrium of Ammonia gas (N₂ + 3H₂ ⇌ 2NH₃).",
        },
      },
      block2_structure: {
        sectionTitle: "STRUCTURAL ATTRIBUTES & FORMULATION",
        attributes: [
          {
            name: "Molecular Formula & Mass",
            value: "NH_3 \\quad [\\text{Molar Mass } = 17\\text{ g/mol}]",
            supportsLaTeX: true,
          },
          {
            name: "Vapour Density & Relative Density",
            value: "\\text{V.D.} = \\frac{\\text{Molecular Mass}}{2} = 8.5 \\implies \\text{Lighter than air (0.589)}",
            supportsLaTeX: true,
          },
          {
            name: "Haber Synthesis Dynamic Equilibrium",
            value: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) \\quad (\\Delta H = -92.4\\text{ kJ/mol})",
            supportsLaTeX: true,
          },
          {
            name: "Aqueous Basicity & Ionization",
            value: "NH_3 + H_2O \\rightleftharpoons NH_4^+ + OH^- \\quad (K_b = 1.8 \\times 10^{-5})",
            supportsLaTeX: true,
          },
        ],
      },
      block3_mechanics: {
        sectionTitle: "OPERATIONAL MECHANISMS & KEY CASES",
        scenarios: [
          {
            title: "CASE 1: INDUSTRIAL SYNTHESIS (HABER PROCESS)",
            mechanismDescription: "Direct combination of dry nitrogen and hydrogen in a 1:3 volume ratio over finely divided iron catalyst with molybdenum promoter at 450-500°C and 200 atm.",
            equationOrEvidence: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) \\quad (\\Delta H < 0)",
            takeawayOrTip: "Finely divided Fe acts as catalyst; Mo acts as promoter.",
          },
          {
            title: "CASE 2: LE CHATELIER EQUILIBRIUM SHIFT",
            mechanismDescription: "High pressure (200-300 atm) shifts equilibrium to the right because 4 volumes of reactants produce 2 volumes of ammonia gas (Δn = -2).",
            equationOrEvidence: "\\Delta n_g = 2 - 4 = -2 \\implies P \\uparrow \\to \\text{Yield } \\uparrow",
            takeawayOrTip: "Optimum temperature 450°C balances rate and exothermic yield.",
          },
          {
            title: "CASE 3: EXTREME WATER SOLUBILITY (FOUNTAIN TEST)",
            mechanismDescription: "Extreme solubility creates a partial vacuum in the inverted flask, drawing water up through the jet tube to create a high-pressure fountain turning red litmus blue.",
            equationOrEvidence: "1\\text{ vol } H_2O \\text{ dissolves } 702\\text{ vol } NH_3 \\text{ at } 20^\\circ\\text{C}",
            takeawayOrTip: "Demonstrates high solubility and alkaline nature.",
          },
          {
            title: "CASE 4: CATALYTIC OXIDATION (OSTWALD PROCESS)",
            mechanismDescription: "Ammonia reacts with oxygen in the presence of heated platinum gauze at 800°C to produce nitric oxide, the first step in nitric acid manufacture.",
            equationOrEvidence: "4NH_3 + 5O_2 \\xrightarrow{\\text{Pt, } 800^\\circ\\text{C}} 4NO + 6H_2O + \\Delta",
            takeawayOrTip: "Pt gauze continues to glow reddish-yellow exothermically.",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "PRACTICAL APPLICATIONS & EXAM INSIGHTS",
        points: [
          {
            category: "Nitrogenous Fertilizers",
            description: "Essential precursor for manufacturing urea [CO(NH₂)₂], ammonium sulfate, and ammonium nitrate for high-yield agriculture.",
            iconKey: "atom",
          },
          {
            category: "Exam Drying Agent Trap",
            description: "Never dry NH₃ with Conc. H₂SO₄, CaCl₂, or P₂O₅ because it chemically reacts with them; dry ONLY over Quicklime (CaO).",
            iconKey: "target",
          },
          {
            category: "Refrigerant & Cleansing Agent",
            description: "Used in commercial ice plants due to high latent heat of vaporization (1370 J/g) and in household cleaning as an emulsifier.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: "Key Takeaway: Ammonia is a lighter-than-air, highly soluble basic gas industrially synthesized via the reversible, exothermic Haber process.",
    };
  }

  if (domain === "humanities") {
    return {
      metadata: {
        title: cleanTitle,
        subtitle: `Comprehensive historical analysis, key actors, and socioeconomic impacts of ${cleanTitle}.`,
        domain: "humanities",
        subjectBadge: cleanSubject || "HISTORY",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "HISTORICAL MILESTONE",
      },
      block1_foundation: {
        sectionTitle: "ORIGIN, BACKGROUND & CATALYSTS",
        coreDefinition: `${cleanTitle} marks a pivotal turning point driven by socioeconomic changes, structural reforms, and ideological transformation across contemporary society.`,
        visualElement: {
          type: "timeline_points",
          data: ["Pre-Crisis Setup", "Outbreak & Mobilization", "Institutional Reform", "Long-term Legacy"],
          caption: `Sequential evolution and escalation stages of ${cleanTitle}.`,
        },
      },
      block2_structure: {
        sectionTitle: "KEY ACTORS, IDEOLOGIES & INSTITUTIONS",
        attributes: [
          { name: "Primary Catalyst", value: "Socioeconomic inequality & structural institutional crisis", supportsLaTeX: false },
          { name: "Core Ideology", value: "Popular sovereignty, civil liberty, and legal equality", supportsLaTeX: false },
          { name: "Key Legislation", value: "Declaration of rights and constitutional governance", supportsLaTeX: false },
          { name: "Strategic Outcome", value: "Abolition of feudal privileges and birth of modern state", supportsLaTeX: false },
        ],
      },
      block3_mechanics: {
        sectionTitle: "CHRONOLOGICAL PHASES & CRITICAL EVENTS",
        scenarios: [
          {
            title: "PHASE 1: THE INITIAL SPARK & MOBILIZATION",
            mechanismDescription: "Rising popular discontent culminated in organized collective defiance against autocratic authority.",
            equationOrEvidence: "First General Mobilization",
          },
          {
            title: "PHASE 2: CONSTITUTIONAL TRANSITION",
            mechanismDescription: "Drafting of foundational constitutional charters establishing civic parity and judicial protections.",
            equationOrEvidence: "Constitutional Assembly Act",
          },
          {
            title: "PHASE 3: RADICAL TRANSFORMATION & CONFLICT",
            mechanismDescription: "Intensified confrontation between reformist factions and traditional hierarchies seeking restoration.",
            equationOrEvidence: "Major Revolutionary Decrees",
          },
          {
            title: "PHASE 4: CONSOLIDATION & SYSTEMIC REORGANIZATION",
            mechanismDescription: "Establishment of new administrative, legal, and educational codifications influencing global jurisprudence.",
            equationOrEvidence: "Civil Code & Legal Reform",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "GLOBAL SIGNIFICANCE & EXAM CRITICAL POINTS",
        points: [
          {
            category: "Democratic Heritage",
            description: "Laid the blueprint for modern secular democratic republics and universal human rights conventions worldwide.",
            iconKey: "book",
          },
          {
            category: "Exam & Historiography Trap",
            description: "Differentiate immediate material triggers (food shortages, taxation) from deep philosophical roots (Enlightenment ideas).",
            iconKey: "target",
          },
          {
            category: "Modern Relevance",
            description: "Continues to define contemporary citizen-state relations, civic protests, and constitutional rights discussions.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: `Key Takeaway: ${cleanTitle} transformed feudal governance into modern constitutional sovereignty and legal equality.`,
    };
  }

  if (domain === "commerce") {
    return {
      metadata: {
        title: cleanTitle,
        subtitle: `Macroeconomic principles, equilibrium conditions, and policy levers governing ${cleanTitle}.`,
        domain: "commerce",
        subjectBadge: cleanSubject || "ECONOMICS",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "ECONOMIC EQUILIBRIUM",
      },
      block1_foundation: {
        sectionTitle: "THEORETICAL FRAMEWORK & CORE THESIS",
        coreDefinition: `${cleanTitle} analyzes resource allocation, market interactions, and behavioral responses under varying price, revenue, and regulatory constraints.`,
        visualElement: {
          type: "flow_diagram",
          data: ["Initial Market State", "Exogenous Shift / Shock", "Price Adjustment", "New Equilibrium"],
          caption: "Market clearing adjustment process toward stable equilibrium.",
        },
      },
      block2_structure: {
        sectionTitle: "MATHEMATICAL FORMULATION & GOVERNING IDENTITIES",
        attributes: [
          { name: "Equilibrium Condition", value: "\\text{Marginal Revenue (MR)} = \\text{Marginal Cost (MC)}", supportsLaTeX: true },
          { name: "Elasticity Formula", value: "E_d = \\left| \\frac{\\% \\Delta Q}{\\% \\Delta P} \\right| = -\\frac{dQ}{dP} \\cdot \\frac{P}{Q}", supportsLaTeX: true },
          { name: "Revenue Identity", value: "\\text{Total Revenue (TR)} = P \\times Q \\implies \\text{Profit } \\pi = \\text{TR} - \\text{TC}", supportsLaTeX: true },
          { name: "Fiscal Multiplier", value: "k = \\frac{1}{1 - \\text{MPC}} = \\frac{1}{\\text{MPS}}", supportsLaTeX: true },
        ],
      },
      block3_mechanics: {
        sectionTitle: "MARKET SCENARIOS & BEHAVIORAL REGIMES",
        scenarios: [
          {
            title: "REGIME 1: ELASTIC DEMAND REGIME (|Ed| > 1)",
            mechanismDescription: "Quantity response outpaces price changes; price reductions increase total revenue for the producer.",
            equationOrEvidence: "|E_d| > 1 \\implies \\Delta TR > 0",
          },
          {
            title: "REGIME 2: INELASTIC NECESSITY GOODS (|Ed| < 1)",
            mechanismDescription: "Consumers exhibit low price sensitivity; tax incidence falls predominantly on the buyers.",
            equationOrEvidence: "|E_d| < 1 \\implies \\Delta P \\uparrow \\implies TR \\uparrow",
          },
          {
            title: "REGIME 3: SUPPLY SHOCK & DEADWEIGHT LOSS",
            mechanismDescription: "Exogenous input cost escalations shift supply inward, generating welfare deadweight loss.",
            equationOrEvidence: "\\text{DWL} = \\frac{1}{2} (P_c - P_p)(Q_0 - Q_1)",
          },
          {
            title: "REGIME 4: LONG-RUN COMPETITIVE ZERO-PROFIT",
            mechanismDescription: "Free entry and exit drive economic profits to zero where price matches minimum average total cost.",
            equationOrEvidence: "P = \\text{MR} = \\min(\\text{ATC})",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "BUSINESS APPLICATIONS & MONETARY POLICY",
        points: [
          {
            category: "Strategic Pricing",
            description: "Directly utilized by firms for price discrimination, dynamic surge pricing, and product bundle optimizations.",
            iconKey: "activity",
          },
          {
            category: "Central Bank & Fiscal Policy",
            description: "Guides interest rate adjustments, repo rate operations, and government budget deficit management.",
            iconKey: "target",
          },
          {
            category: "Exam Problem Strategy",
            description: "Always identify whether elasticity is measured along a point curve or via midpoint arc calculation before substituting.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: `Key Takeaway: Profit maximization and resource efficiency occur where marginal revenue equals marginal cost under market equilibrium.`,
    };
  }

  if (domain === "math_cs") {
    return {
      metadata: {
        title: cleanTitle,
        subtitle: `Formal axioms, analytical derivations, and computational complexity of ${cleanTitle}.`,
        domain: "math_cs",
        subjectBadge: cleanSubject || "MATHEMATICS",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "THEORETICAL FOUNDATION",
      },
      block1_foundation: {
        sectionTitle: "AXIOMATIC DEFINITION & THEOREM STATEMENT",
        coreDefinition: `${cleanTitle} establishes the formal mathematical criteria, invariant properties, and algorithmic structures governing continuous functions and discrete systems.`,
        visualElement: {
          type: "formula_capsule",
          data: ["f(x) \\in \\mathcal{C}[a,b]", "f'(c) = \\frac{f(b)-f(a)}{b-a}", "\\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}", "\\mathcal{O}(n \\log n)"],
          caption: "Core functional mappings, derivative relations, and asymptotic constraints.",
        },
      },
      block2_structure: {
        sectionTitle: "ANALYTICAL ATTRIBUTES & GENERAL THEOREM",
        attributes: [
          { name: "Primary Governing Identity", value: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n", supportsLaTeX: true },
          { name: "Boundary & Domain Rule", value: "\\text{Dom}(f) = \\{ x \\in \\mathbb{R} : g(x) \\neq 0, h(x) \\ge 0 \\}", supportsLaTeX: true },
          { name: "Integral Relation", value: "\\int_{a}^{b} f(x) dx = F(b) - F(a) \\quad \\text{where } F'(x) = f(x)", supportsLaTeX: true },
          { name: "Asymptotic Complexity", value: "T(n) = 2T(n/2) + \\mathcal{O}(n) \\implies \\mathcal{O}(n \\log n)", supportsLaTeX: true },
        ],
      },
      block3_mechanics: {
        sectionTitle: "BOUNDARY BEHAVIORS & SPECIAL CASES",
        scenarios: [
          {
            title: "CASE 1: STRICT POSITIVITY & DISTINCT ROOTS",
            mechanismDescription: "Discriminant evaluates positive, guaranteeing two distinct real solutions intersecting the principal axis.",
            equationOrEvidence: "D = b^2 - 4ac > 0 \\implies x_1 \\neq x_2 \\in \\mathbb{R}",
          },
          {
            title: "CASE 2: CRITICAL TANGENCY & DOUBLE ROOTS",
            mechanismDescription: "First-order derivative vanishes at the boundary, demonstrating exact point tangency.",
            equationOrEvidence: "D = 0 \\implies f'(x_0) = 0 \\implies x_0 = -\\frac{b}{2a}",
          },
          {
            title: "CASE 3: COMPLEX CONJUGATE PAIR REGIME",
            mechanismDescription: "Non-real solutions residing purely in the complex plane with conjugate symmetry.",
            equationOrEvidence: "D < 0 \\implies x = \\alpha \\pm i\\beta \\in \\mathbb{C}",
          },
          {
            title: "CASE 4: ASYMPTOTIC CONVERGENCE & LIMITS",
            mechanismDescription: "Function approaches stable horizontal or oblique asymptotes as domain variables approach infinity.",
            equationOrEvidence: "\\lim_{x \\to \\pm \\infty} f(x) = L \\implies y = L",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "COMPUTATIONAL & REAL-WORLD APPLICATIONS",
        points: [
          {
            category: "Algorithm Optimization",
            description: "Powers divide-and-conquer paradigms, numerical root-finding algorithms, and graphics rendering engines.",
            iconKey: "atom",
          },
          {
            category: "Exam & Proof Technique",
            description: "Always verify continuity on closed interval $[a,b]$ and differentiability on open interval $(a,b)$ before applying theorems.",
            iconKey: "target",
          },
          {
            category: "Modern Engineering",
            description: "Applied extensively in signal processing, Fourier transforms, cryptography, and machine learning gradients.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: `Key Takeaway: Continuous transformations preserve invariants across defined domain boundaries and asymptotic limits.`,
    };
  }

  // Default Science (Physics / Chemistry / Biology / Electricity / Optics / Gravitation)
  const fullTextLower = `${cleanTitle} ${cleanSubject} ${rawContent}`.toLowerCase();
  const isElectricity = fullTextLower.match(/electric|circuit|ohm|resistan|current|voltage|potential|kirchhoff|capacitor|magnet/);
  const isOptics = fullTextLower.match(/light|optics|lens|mirror|reflect|refract|focal|prism|snell|dispersion|magnification/);
  const isGravitation = fullTextLower.match(/gravit|planet|orbit|kepler|satellite|escape velocity|mass|weight/);
  const isBio = fullTextLower.match(/cell|life|dna|genetic|plant|photosynthe|heart|neuron|respiration|enzyme|ecology|reproduction/);

  if (isElectricity) {
    return {
      metadata: {
        title: cleanTitle,
        subtitle: `Ohmic relations, charge dynamics, and power dissipation governing ${cleanTitle}.`,
        domain: "science",
        subjectBadge: "PHYSICS (ELECTRICITY)",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "CIRCUIT ANALYSIS",
      },
      block1_foundation: {
        sectionTitle: "ELECTRODYNAMIC PRINCIPLES & GOVERNING LAW",
        coreDefinition: `${cleanTitle} governs the flow of electric charge, potential difference across conductive elements, and equivalent network impedance.`,
        visualElement: {
          type: "svg_vector",
          data: ["EMF Source (V)", "Series Resistor R₁", "Parallel Network R₂||R₃", "Current Loop I"],
          caption: "Schematic representation of voltage division and current distribution.",
        },
      },
      block2_structure: {
        sectionTitle: "CIRCUIT FORMULATION & QUANTITATIVE LAWS",
        attributes: [
          { name: "Ohm's Governing Law", value: "V = I \\cdot R \\implies I = \\frac{V}{R}", supportsLaTeX: true },
          { name: "Series Equivalent Resistance", value: "R_{\\text{series}} = R_1 + R_2 + \\dots + R_n", supportsLaTeX: true },
          { name: "Parallel Equivalent Resistance", value: "\\frac{1}{R_{\\text{parallel}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots + \\frac{1}{R_n}", supportsLaTeX: true },
          { name: "Joule's Heating & Power", value: "P = V I = I^2 R = \\frac{V^2}{R} \\quad [\\text{Watts}]", supportsLaTeX: true },
        ],
      },
      block3_mechanics: {
        sectionTitle: "CIRCUIT CONFIGURATIONS & NETWORK REGIMES",
        scenarios: [
          {
            title: "CASE 1: PURE SERIES NETWORK",
            mechanismDescription: "Current remains strictly identical through all components; voltage drops divide proportionally to resistance.",
            equationOrEvidence: "I = \\text{Constant}, \\quad V_{\\text{total}} = V_1 + V_2",
          },
          {
            title: "CASE 2: PURE PARALLEL NETWORK",
            mechanismDescription: "Full supply voltage is maintained across each branch; total equivalent resistance drops below the lowest branch resistor.",
            equationOrEvidence: "V = \\text{Constant}, \\quad I_{\\text{total}} = I_1 + I_2",
          },
          {
            title: "CASE 3: SHORT-CIRCUIT & ZERO RESISTANCE",
            mechanismDescription: "Impedance collapses to near-zero, inducing massive instantaneous surge currents governed by internal battery resistance.",
            equationOrEvidence: "R \\to 0 \\implies I \\to \\frac{V}{r_{\\text{int}}} = I_{\\max}",
          },
          {
            title: "CASE 4: OPEN-CIRCUIT / INFINITE RESISTANCE",
            mechanismDescription: "Terminal voltage equals electromotive force (EMF) with zero current flowing through the external circuit.",
            equationOrEvidence: "R \\to \\infty \\implies I = 0, \\quad V_{\\text{term}} = \\mathcal{E}",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "ENGINEERING APPLICATIONS & EXAM STRATEGY",
        points: [
          {
            category: "Household Wiring Protocol",
            description: "Appliances are universally wired in parallel so that failure in one circuit branch leaves other devices operational.",
            iconKey: "atom",
          },
          {
            category: "Exam & Calculation Trap",
            description: "Do not forget to convert minutes to seconds when calculating electrical energy in Joules ($E = P \\times t$).",
            iconKey: "target",
          },
          {
            category: "Modern Technology Relevance",
            description: "Powers semiconductor microprocessor grids, lithium battery management systems, and smart grid meters.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: `Key Takeaway: Potential difference drives current through conductive pathways in strict accordance with Kirchhoff's and Ohm's conservation laws.`,
    };
  }

  if (isOptics) {
    return {
      metadata: {
        title: cleanTitle,
        subtitle: `Refractive geometries, ray matrices, and image formation criteria in ${cleanTitle}.`,
        domain: "science",
        subjectBadge: "PHYSICS (OPTICS)",
        gradeBadge: cleanGrade,
        chapterBadge: cleanTitle,
        tagBadge: "RAY OPTICS",
      },
      block1_foundation: {
        sectionTitle: "LIGHT WAVE / RAY TRAJECTORY & REFRACTIVE LAW",
        coreDefinition: `${cleanTitle} describes the propagation, boundary refraction, and optical focal convergence of light rays traversing homogeneous media.`,
        visualElement: {
          type: "svg_vector",
          data: ["Incident Optical Ray", "Refractive Interface", "Focal Point (F)", "Real/Virtual Image"],
          caption: "Ray divergence and focal convergence schematic for optical elements.",
        },
      },
      block2_structure: {
        sectionTitle: "OPTICAL EQUATIONS & SIGN CONVENTIONS",
        attributes: [
          { name: "Thin Lens / Mirror Formula", value: "\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u} \\quad (\\text{Lens}) \\quad ; \\quad \\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u} \\quad (\\text{Mirror})", supportsLaTeX: true },
          { name: "Snell's Law of Refraction", value: "n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2 \\implies n = \\frac{c}{v}", supportsLaTeX: true },
          { name: "Linear Magnification", value: "m = \\frac{h_i}{h_o} = \\frac{v}{u} \\quad (\\text{Lens}) \\quad ; \\quad m = -\\frac{v}{u} \\quad (\\text{Mirror})", supportsLaTeX: true },
          { name: "Optical Lens Power", value: "P = \\frac{1}{f \\text{ (in meters)}} \\quad [\\text{Diopters, D}]", supportsLaTeX: true },
        ],
      },
      block3_mechanics: {
        sectionTitle: "OBJECT POSITIONS & IMAGE FORMATION REGIMES",
        scenarios: [
          {
            title: "CASE 1: OBJECT BEYOND 2F (CONVEX LENS)",
            mechanismDescription: "Rays converge between F and 2F on the opposite side, creating a real, inverted, and diminished image.",
            equationOrEvidence: "u > 2f \\implies f < v < 2f, \\quad |m| < 1",
          },
          {
            title: "CASE 2: OBJECT EXACTLY AT 2F",
            mechanismDescription: "Image forms precisely at 2F with identical dimensions to the object in an inverted real orientation.",
            equationOrEvidence: "u = 2f \\implies v = 2f, \\quad |m| = 1",
          },
          {
            title: "CASE 3: OBJECT BETWEEN F AND OPTICAL CENTER (MAGNIFIER)",
            mechanismDescription: "Refracted rays diverge and project backward to produce an erect, enlarged, and virtual image on the same side.",
            equationOrEvidence: "u < f \\implies v < 0, \\quad m > +1 \\text{ (Virtual)}",
          },
          {
            title: "CASE 4: TOTAL INTERNAL REFLECTION (CRITICAL ANGLE)",
            mechanismDescription: "Incident angle in denser medium exceeds critical angle, resulting in complete internal energy reflection.",
            equationOrEvidence: "\\theta_i > \\theta_c = \\arcsin(1/n) \\implies \\text{100% Reflection}",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "OPTICAL INSTRUMENTS & EXAM TIPS",
        points: [
          {
            category: "Fiber-Optic Telecommunications",
            description: "Total internal reflection inside glass fiber cores enables global high-bandwidth internet transmission with minimal loss.",
            iconKey: "atom",
          },
          {
            category: "Cartesian Sign Convention Trap",
            description: "Always assign negative sign to real object distance ($u = -x$) and convex lens focal length as positive ($f > 0$).",
            iconKey: "target",
          },
          {
            category: "Biomedical Endoscopy & Telescopes",
            description: "Compound lens architectures correct chromatic aberrations for surgical endoscopy and astronomical observatories.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: `Key Takeaway: Refraction alters wave speed at dielectric boundaries while curved surfaces focus wave fronts into real or virtual focal points.`,
    };
  }

  const isAmmoniaOrCompound = fullTextLower.match(/ammonia|haber|nh3|study of compounds|compound.*ammonia/);
  if (isAmmoniaOrCompound) {
    return {
      metadata: {
        title: "STUDY OF COMPOUNDS - AMMONIA",
        subtitle: "Industrial synthesis (Haber process), laboratory preparation from NH₄Cl, alkaline properties, and fountain experiment.",
        domain: "science",
        subjectBadge: "CHEMISTRY",
        gradeBadge: cleanGrade || "CLASS 10",
        chapterBadge: "STUDY OF COMPOUNDS - AMMONIA",
        tagBadge: "INORGANIC CHEMISTRY",
        weightageBadge: "High-Yield • 8-10 Marks",
        moleculeFormulaLatex: "NH_3",
        relativeMassOrWeight: "17 g/mol",
        geometricStructure: "Pyramidal Molecule",
      },
      overviewSection: {
        card1_occurrence: {
          cardTitle: "OCCURRENCE",
          bullets: [
            { label: "Free State", text: "Present in minute traces in the atmosphere and in traces in natural water.", iconKey: "cloud" },
            { label: "Combined State", text: "Occurs naturally as ammonium salts (e.g. NH4Cl, (NH4)2SO4), urea, and decomposed organic matter.", iconKey: "flask" },
            { label: "Origin / Decay", text: "Formed by bacterial decay and putrefaction of nitrogenous animal and vegetable organic matter.", iconKey: "bio" },
          ],
        },
        card2_forms: {
          cardTitle: "FORMS OF AMMONIA",
          items: [
            { id: 1, name: "Gaseous Ammonia", description: "Dry ammonia gas obtained after passing over quicklime (CaO)", badge: "Dry Gas", iconKey: "gas" },
            { id: 2, name: "Liquid Ammonia", description: "Pure ammonia liquefied under high pressure (~8-10 atm) and cold temperatures", badge: "Liquefied", iconKey: "cylinder" },
            { id: 3, name: "Liquor Ammonia Fortis", description: "Saturated aqueous solution with relative density of 0.880", badge: ".880 Density", iconKey: "bottle" },
            { id: 4, name: "Laboratory Bench Reagent", description: "Standard dilute aqueous solution (~1:2 ratio with distilled water)", badge: "Dilute Reagent", iconKey: "dropper" },
          ],
        },
      },
      labOrPrepSection: {
        sectionNumber: 3,
        sectionTitle: "LABORATORY PREPARATION FROM AMMONIUM CHLORIDE",
        reactantsOrInputs: "Ammonium chloride (NH4Cl) and an excess of calcium hydroxide [Ca(OH)2]",
        reactionEquationLatex: "2NH_4Cl + Ca(OH)_2 \\xrightarrow{\\Delta} CaCl_2 + 2H_2O + 2NH_3\\uparrow",
        precautionsAndDrying: "The boiling flask is tilted downwards to prevent water droplets running back and cracking hot glass. Dried by passing through quicklime (CaO) lumps.",
        collectionMethod: "Collected by downward displacement of air (upward delivery) because it is lighter than air and highly soluble in water.",
        unsuitableAlert: {
          title: "Unsuitability of Other Drying Agents",
          warningText: "Conc. H2SO4, P2O5, and anhydrous CaCl2 cannot be used as drying agents because they react chemically with basic ammonia.",
          reagentsOrExceptions: ["conc. H2SO4", "P2O5", "anhydrous CaCl2"],
          balancedEquations: [
            "2NH_3 + H_2SO_4 \\rightarrow (NH_4)_2SO_4",
            "CaCl_2 + 4NH_3 \\rightarrow CaCl_2\\cdot 4NH_3",
          ],
        },
      },
      manufactureOrProcessSection: {
        sectionNumber: 4,
        sectionTitle: "MANUFACTURE BY HABER'S PROCESS",
        reactantsRatio: "Dry Nitrogen (from liquid air) and Hydrogen (from water gas/BOSCH process) in 1:3 volume ratio.",
        reactionEquationLatex: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) + 92.4\\text{ kJ} \\quad (\\Delta H = -92.4\\text{ kJ/mol})",
        favourableConditions: [
          { parameter: "Temperature", value: "450°C - 500°C (Optimum)", iconKey: "temperature", badge: "Optimum" },
          { parameter: "Pressure", value: "200 - 300 atm (High Yield)", iconKey: "pressure", badge: "High Yield" },
          { parameter: "Catalyst", value: "Finely divided Iron (Fe)", iconKey: "catalyst", badge: "Crucial" },
          { parameter: "Promoter", value: "Traces of Molybdenum (Mo) / Al2O3", iconKey: "promoter", badge: "Efficiency" },
        ],
        flowStages: [
          { stepNumber: 1, label: "Purification & Compression (200 atm)", subtext: "Gas mixture cleaned of CO/H2S and compressed" },
          { stepNumber: 2, label: "Catalytic Chamber (500°C)", subtext: "Passed over Fe + Mo catalyst (15% conversion)" },
          { stepNumber: 3, label: "Condenser / Cooler", subtext: "Liquefies NH3 (-33°C) separating it from gases" },
          { stepNumber: 4, label: "Liquid NH3 Storage", subtext: "Collected in cryogenic storage vessels" },
          { stepNumber: 5, label: "Recirculation Pump", subtext: "Unreacted N2+H2 recirculated for 98% yield" },
        ],
        recoveryAndRecycle: "Unreacted N2 and H2 gases are separated via liquefaction or water absorption and recirculated back to the catalyst chamber, achieving an overall yield of ~98%.",
      },
      block1_foundation: {
        sectionTitle: "CORE PRINCIPLE & MOLECULAR STRUCTURE",
        coreDefinition: "Ammonia (NH₃) is a colourless, alkaline gas with a pungent choking odour, high water solubility (1:702 vol), and a trigonal pyramidal molecular geometry (sp³ hybridized with one lone pair).",
        visualElement: {
          type: "flow_diagram",
          data: ["Nitrogen Gas (N₂)", "Hydrogen Gas (3H₂)", "Haber Catalyst (Fe/Mo)", "Ammonia Gas (2NH₃)"],
          caption: "Industrial synthesis and catalytic equilibrium of Ammonia gas (N₂ + 3H₂ ⇌ 2NH₃).",
        },
      },
      block2_structure: {
        sectionTitle: "STRUCTURAL ATTRIBUTES & FORMULATION",
        attributes: [
          {
            name: "Molecular Formula & Mass",
            value: "NH_3 \\quad [\\text{Molar Mass } = 17\\text{ g/mol}]",
            supportsLaTeX: true,
          },
          {
            name: "Vapour Density & Relative Density",
            value: "\\text{V.D.} = \\frac{\\text{Molecular Mass}}{2} = 8.5 \\implies \\text{Lighter than air (0.589)}",
            supportsLaTeX: true,
          },
          {
            name: "Haber Synthesis Dynamic Equilibrium",
            value: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) \\quad (\\Delta H = -92.4\\text{ kJ/mol})",
            supportsLaTeX: true,
          },
          {
            name: "Aqueous Basicity & Ionization",
            value: "NH_3 + H_2O \\rightleftharpoons NH_4^+ + OH^- \\quad (K_b = 1.8 \\times 10^{-5})",
            supportsLaTeX: true,
          },
        ],
      },
      block3_mechanics: {
        sectionTitle: "OPERATIONAL MECHANISMS & KEY CASES",
        scenarios: [
          {
            title: "CASE 1: INDUSTRIAL SYNTHESIS (HABER PROCESS)",
            mechanismDescription: "Direct combination of dry nitrogen and hydrogen in a 1:3 volume ratio over finely divided iron catalyst with molybdenum promoter at 450-500°C and 200 atm.",
            equationOrEvidence: "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) \\quad (\\Delta H < 0)",
            takeawayOrTip: "Finely divided Fe acts as catalyst; Mo acts as promoter.",
          },
          {
            title: "CASE 2: LE CHATELIER EQUILIBRIUM SHIFT",
            mechanismDescription: "High pressure (200-300 atm) shifts equilibrium to the right because 4 volumes of reactants produce 2 volumes of ammonia gas (Δn = -2).",
            equationOrEvidence: "\\Delta n_g = 2 - 4 = -2 \\implies P \\uparrow \\to \\text{Yield } \\uparrow",
            takeawayOrTip: "Optimum temperature 450°C balances rate and exothermic yield.",
          },
          {
            title: "CASE 3: EXTREME WATER SOLUBILITY (FOUNTAIN TEST)",
            mechanismDescription: "Extreme solubility creates a partial vacuum in the inverted flask, drawing water up through the jet tube to create a high-pressure fountain turning red litmus blue.",
            equationOrEvidence: "1\\text{ vol } H_2O \\text{ dissolves } 702\\text{ vol } NH_3 \\text{ at } 20^\\circ\\text{C}",
            takeawayOrTip: "Demonstrates high solubility and alkaline nature.",
          },
          {
            title: "CASE 4: CATALYTIC OXIDATION (OSTWALD PROCESS)",
            mechanismDescription: "Ammonia reacts with oxygen in the presence of heated platinum gauze at 800°C to produce nitric oxide, the first step in nitric acid manufacture.",
            equationOrEvidence: "4NH_3 + 5O_2 \\xrightarrow{\\text{Pt, } 800^\\circ\\text{C}} 4NO + 6H_2O + \\Delta",
            takeawayOrTip: "Pt gauze continues to glow reddish-yellow exothermically.",
          },
        ],
      },
      block4_impact_uses: {
        sectionTitle: "PRACTICAL APPLICATIONS & EXAM INSIGHTS",
        points: [
          {
            category: "Nitrogenous Fertilizers",
            description: "Essential precursor for manufacturing urea [CO(NH₂)₂], ammonium sulfate, and ammonium nitrate for high-yield agriculture.",
            iconKey: "atom",
          },
          {
            category: "Exam Drying Agent Trap",
            description: "Never dry NH₃ with Conc. H₂SO₄, CaCl₂, or P₂O₅ because it chemically reacts with them; dry ONLY over Quicklime (CaO).",
            iconKey: "target",
          },
          {
            category: "Refrigerant & Cleansing Agent",
            description: "Used in commercial ice plants due to high latent heat of vaporization (1370 J/g) and in household cleaning as an emulsifier.",
            iconKey: "sparkles",
          },
        ],
      },
      keyTakeaway: "Key Takeaway: Ammonia is a lighter-than-air, highly soluble basic gas industrially synthesized via the reversible, exothermic Haber process.",
    };
  }

  return {
    metadata: {
      title: cleanTitle,
      subtitle: `Fundamental physical laws, quantitative relations, and experimental insights into ${cleanTitle}.`,
      domain: "science",
      subjectBadge: isChem ? "CHEMISTRY" : isBio ? "BIOLOGY" : isGravitation ? "PHYSICS (GRAVITATION)" : cleanSubject || "PHYSICS",
      gradeBadge: cleanGrade,
      chapterBadge: cleanTitle,
      tagBadge: "EXPERIMENTAL LAW",
    },
    block1_foundation: {
      sectionTitle: "CORE PHENOMENON & GOVERNING LAW",
      coreDefinition: isChem
        ? `${cleanTitle} defines the fundamental chemical transformation, bond rearrangements, and thermodynamic equilibria between reacting species.`
        : isBio
        ? `${cleanTitle} describes the essential biological mechanism, metabolic pathways, and cellular regulation sustaining living systems.`
        : `${cleanTitle} specifies the foundational physical principles, vector dynamics, and conservation laws governing matter and energy.`,
      visualElement: {
        type: isChem ? "flow_diagram" : "svg_vector",
        data: isChem
          ? ["Reactants State", "Activated Complex (Ea)", "Equilibrium State", "Product Yield"]
          : ["Vector Component A", "Vector Component B", "Resultant Net Magnitude", "Direction Theta"],
        caption: `Visual schematic of interactions and state transitions for ${cleanTitle}.`,
      },
    },
    block2_structure: {
      sectionTitle: "QUANTITATIVE FORMULATION & PARAMETERS",
      attributes: [
        {
          name: "Primary Governing Law",
          value: isChem
            ? "\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = -RT\\ln K_{\\text{eq}}"
            : isBio
            ? "\\text{Enzyme } [E] + \\text{Substrate } [S] \\rightleftharpoons [ES] \\rightarrow [E] + [P]"
            : "\\vec{v}_{\\text{rel}} = \\vec{v}_A - \\vec{v}_B \\quad ; \\quad \\vec{F}_{\\text{net}} = m\\vec{a}",
          supportsLaTeX: true,
        },
        {
          name: "Kinetic / Rate Equation",
          value: isChem ? "r = k [A]^m [B]^n \\quad ; \\quad k = A e^{-E_a/RT}" : "\\Delta v = a \\cdot \\Delta t",
          supportsLaTeX: true,
        },
        {
          name: "Equilibrium & Conservation",
          value: isChem ? "K_c = \\frac{[C]^c [D]^d}{[A]^a [B]^b}" : "E_{\\text{total}} = \\text{KE} + \\text{PE} = \\text{Constant}",
          supportsLaTeX: true,
        },
        {
          name: "Standard Reference State",
          value: "T = 298.15\\text{ K}, \\quad P = 1\\text{ atm}, \\quad 1\\text{ M Concentration}",
          supportsLaTeX: true,
        },
      ],
    },
    block3_mechanics: {
      sectionTitle: "EXPERIMENTAL CASES & BOUNDARY PHENOMENA",
      scenarios: [
        {
          title: "CASE 1: SAME DIRECTION / EQUILIBRIUM FORWARD",
          mechanismDescription: isChem
            ? "Increasing reactant concentration drives reaction forward according to Le Chatelier's principle."
            : "Bodies moving in the same direction observe subtracted relative velocity, reducing apparent collision speed.",
          equationOrEvidence: isChem ? "Q < K_{\\text{eq}} \\implies \\text{Forward Shift}" : "v_{\\text{rel}} = |v_A - v_B|",
        },
        {
          title: "CASE 2: OPPOSING / HIGH ENERGY COLLISIONS",
          mechanismDescription: isChem
            ? "Exothermic reactions experience shifted equilibrium towards reactants when external temperature is elevated."
            : "Objects moving toward each other experience additive relative velocity, maximizing kinetic impact energy.",
          equationOrEvidence: isChem ? "\\Delta H < 0 \\implies T \\uparrow \\to \\text{Reverse}" : "v_{\\text{rel}} = v_A + v_B",
        },
        {
          title: "CASE 3: CATALYTIC / REST FRAME CONSERVATION",
          mechanismDescription: isChem
            ? "Catalysts lower activation energy barrier equally for forward and reverse directions without shifting equilibrium position."
            : "When reference body is at rest, observed relative motion simplifies to absolute ground frame kinematics.",
          equationOrEvidence: isChem ? "E_{a,\\text{cat}} < E_{a,\\text{uncat}}" : "\\vec{v}_A = 0 \\implies \\vec{v}_{\\text{rel}} = -\\vec{v}_B",
        },
        {
          title: "CASE 4: MULTIDIMENSIONAL / LIMITING CONSTRAINTS",
          mechanismDescription: isChem
            ? "Pressure increases favor the side containing fewer moles of gas in heterogeneous systems."
            : "Motion at arbitrary angle theta resolves through cosine law and direction vector parallelogram.",
          equationOrEvidence: isChem ? "\\Delta n_g < 0 \\implies P \\uparrow \\to \\text{Right}" : "v_{\\text{rel}} = \\sqrt{v_A^2 + v_B^2 - 2v_A v_B \\cos\\theta}",
        },
      ],
    },
    block4_impact_uses: {
      sectionTitle: "PRACTICAL APPLICATIONS & EXAM STRATEGY",
      points: [
        {
          category: "Industrial Engineering",
          description: `Applied in large-scale synthesis reactors, aerospace aerodynamic modeling, and precision instrumentation.`,
          iconKey: "atom",
        },
        {
          category: "Exam Calculation Trap",
          description: "Always adhere to sign conventions and verify temperature is converted to Kelvin ($K$) prior to substituting in rate equations.",
          iconKey: "target",
        },
        {
          category: "Modern Technological Relevance",
          description: "Forms the foundational physics/chemistry underpinning semiconductor fabrication, battery chemistry, and telemetry.",
          iconKey: "sparkles",
        },
      ],
    },
    block5_exam_traps: {
      sectionTitle: "EXAM TRAPS & SILLY MISTAKE ALERTS (HIGH-YIELD)",
      traps: [
        {
          trapTitle: isChem ? "Catalyst vs Equilibrium Position Trap" : "Sign Convention & Unit Trap",
          wrongConcept: isChem ? "Assuming catalyst increases product yield %" : "Assuming vectors in opposite directions subtract",
          correctConcept: isChem ? "Catalyst only increases reaction RATE, does NOT change equilibrium yield" : "Opposite vectors add relative magnitude ($v_A + v_B$)",
          examTip: "Look for 'at equilibrium' vs 'rate of approach' in multiple-choice questions.",
        },
        {
          trapTitle: "Temperature Unit Conversion Mistake",
          wrongConcept: "Substituting temperature in Celsius (°C) directly into equations",
          correctConcept: "Always convert Celsius to absolute Kelvin ($T(K) = T(^\\circ C) + 273.15$)",
          examTip: "Underline the temperature unit in numerical questions first.",
        },
      ],
    },
    mnemonicHook: {
      acronym: isChem ? "LEO-GER / OIL-RIG" : "V-A-D-E",
      explanation: isChem ? "Loss of Electrons is Oxidation, Gain of Electrons is Reduction" : "Vector Magnitude, Acceleration, Direction, and Equilibrium",
    },
    keyTakeaway: `Key Takeaway: Physical transformations obey conservation laws while reaction trajectories equilibrate according to thermodynamic potentials.`,
  };
}
