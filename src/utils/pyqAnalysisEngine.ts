import { PYQ8020AnalysisReport, PYQRepeatTopic, PYQWeightageHeatmapReport, AIPredictedPaperReport, PredictedQuestionItem } from "../types";

export function buildPYQ8020AnalysisPrompt(params: {
  subject: string;
  grade: string;
  board: string;
  pyqDocumentText?: string;
  chapters?: string[];
}): string {
  const { subject, grade, board, pyqDocumentText, chapters } = params;

  return `You are a Senior Board Examination Chief Evaluator, CBSE/State Board Question Paper Setter, and 10-Year PYQ Statistical Modeler for ${grade} ${subject} (${board || "CBSE"}).

Your objective is to perform a rigorous 80/20 Rule (Pareto Principle) analysis across 10 years of past board examination papers (2016 – 2026).
The 80/20 principle dictates that ~20% of high-yield core recurring concepts account for ~80% of the entire exam paper's marks.

${pyqDocumentText ? `STUDENT'S UPLOADED PYQ PAPERS / SYLLABUS CONTEXT:\n${pyqDocumentText.slice(0, 10000)}\n` : ""}
${chapters && chapters.length > 0 ? `KEY CHAPTERS FOCUS:\n${chapters.join(", ")}\n` : ""}

Generate a comprehensive, scientifically accurate JSON object matching this EXACT JSON schema:

{
  "reportId": "PYQ-8020-${Date.now()}",
  "generatedAt": "${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}",
  "subject": "${subject}",
  "grade": "${grade}",
  "board": "${board || "CBSE"}",
  "totalPYQAnalyzedYears": 10,
  "yearsSpan": "2016 – 2026",
  "topTopicsCount": 6,
  "estimatedScoreCoveragePercentage": 84,
  "summaryExecutiveNote": "Detailed executive summary explaining how mastering these top recurring topics secures 80%+ marks in minimum revision hours.",
  "guaranteedTopics": [
    {
      "id": "topic-1",
      "topicName": "Proof of Irrationality of √p (e.g. √3, √5, 2+3√5)",
      "chapterName": "Real Numbers",
      "recurrenceFrequency": "9 / 10 Years (90%)",
      "recurrencePercentage": 90,
      "priorityTier": "guaranteed",
      "marksWeightage": "3 Marks (Short Answer)",
      "yearsAppeared": [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025],
      "questionEvolutionSummary": "How the board frames this across the decade (e.g. earlier asked simple √5, now asking combination forms like 3 + 2√5 or assuming √2 is irrational).",
      "masterFormulaOrTheoremLatex": "\\text{Assume } \\sqrt{p} = \\frac{a}{b} \\text{ where } \\gcd(a,b)=1",
      "dangerTraps": [
        "Forgetting to write that 'a and b are co-prime integers with b ≠ 0'",
        "Not writing the concluding contradiction statement regarding the fundamental theorem of arithmetic"
      ],
      "stepByStepApproach": [
        "Step 1: State the contradiction assumption clearly with co-prime condition",
        "Step 2: Square both sides to express p * b² = a² and deduce p divides a",
        "Step 3: Substitute a = p*c and show p also divides b",
        "Step 4: Conclude that gcd(a,b) ≥ p contradicts co-primality, hence irrational"
      ],
      "samplePYQSnippet": "Prove that 3 + 2√5 is an irrational number, given that √5 is irrational. [CBSE 2024, 3 Marks]"
    }
  ],
  "highYieldTopics": [
    // 2-3 High Yield Topics (7-8 / 10 years frequency)
  ],
  "moderateYieldTopics": [
    // 1-2 Moderate Topics (5-6 / 10 years frequency)
  ],
  "topTrapsToAvoid": [
    {
      "trap": "Missing SI Units or ± signs in square roots",
      "fix": "Always put a final answer box with units like cm² or m/s and double-check signs in quadratic roots.",
      "topic": "Quadratic Equations & Mensuration"
    }
  ]
}

STRICT REQUIREMENTS:
1. Ensure 'guaranteedTopics' contains at least 3-4 guaranteed topics with 8-10 years frequency.
2. Ensure 'highYieldTopics' contains 2-3 high-yield topics with 7-8 years frequency.
3. Ensure 'moderateYieldTopics' contains 2 topics with 5-6 years frequency.
4. All mathematical formulas/theorems must be valid LaTeX (enclosed in clean notation for KaTeX).
5. Output ONLY valid JSON. No markdown codeblock wrapper or conversational preamble.`;
}

// Built-in curated high-yield 80/20 data banks for resilient instant fallback
export function getCurated8020Report(subject: string, grade: string, board: string = "CBSE"): PYQ8020AnalysisReport {
  const normSubj = (subject || "").toLowerCase();
  const dateStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const reportId = `PYQ-8020-${Math.floor(100000 + Math.random() * 900000)}`;

  if (normSubj.includes("math") || normSubj.includes("ganit")) {
    return {
      reportId,
      generatedAt: dateStr,
      subject: "Mathematics",
      grade: grade || "Class 10th",
      board: board || "CBSE",
      totalPYQAnalyzedYears: 10,
      yearsSpan: "2016 – 2026",
      topTopicsCount: 7,
      estimatedScoreCoveragePercentage: 83,
      summaryExecutiveNote: "Analysis of 10 years of Board Question Papers reveals that just 7 core topics consistently contribute 66 out of 80 marks (~82.5%). Mastering these 7 topics guarantees 80%+ score with zero guesswork.",
      guaranteedTopics: [
        {
          id: "math-gt-1",
          topicName: "Proof of Irrationality (√3, √5, 2+3√5)",
          chapterName: "Real Numbers",
          recurrenceFrequency: "10 / 10 Years (100%)",
          recurrencePercentage: 100,
          priorityTier: "guaranteed",
          marksWeightage: "3 Marks (Short Answer)",
          yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
          questionEvolutionSummary: "Started with direct single-root proofs (√5), evolved into binomial surds (3+2√5), and recently given with conditional premise ('Given √3 is irrational, prove 5 - 2√3 is irrational').",
          masterFormulaOrTheoremLatex: "\\text{Let } \\sqrt{p} = \\frac{a}{b} \\implies p b^2 = a^2 \\implies p \\mid a",
          dangerTraps: [
            "Skipping the explicit declaration that 'a and b are co-prime integers with b ≠ 0' (-0.5 Mark)",
            "Omitting the final contradiction statement referencing Fundamental Theorem of Arithmetic"
          ],
          stepByStepApproach: [
            "Step 1: State assumption: 'Assume on contrary that number is rational: a/b (co-prime, b≠0)'",
            "Step 2: Rearrange to isolate the radical surd on LHS",
            "Step 3: Prove LHS is irrational while RHS is rational of integers",
            "Step 4: State: 'Rational cannot equal Irrational. Contradiction arises due to incorrect assumption.'"
          ],
          samplePYQSnippet: "Prove that 2 + 5√3 is an irrational number, given that √3 is irrational. [CBSE 2024, 3 Marks]",
          mastered: false
        },
        {
          id: "math-gt-2",
          topicName: "Speed, Distance & Upstream/Downstream Boat Numerical",
          chapterName: "Quadratic Equations",
          recurrenceFrequency: "9 / 10 Years (90%)",
          recurrencePercentage: 90,
          priorityTier: "guaranteed",
          marksWeightage: "5 Marks (Long Answer)",
          yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025],
          questionEvolutionSummary: "Rotates among three templates: Boat in Stream (speed x-y vs x+y), Train Speed vs Delay, and Aeroplane Weather Delay. The core mathematical structure remains strictly identical.",
          masterFormulaOrTheoremLatex: "T_1 - T_2 = \\Delta t \\iff \\frac{D}{x - y} - \\frac{D}{x + y} = \\Delta t",
          dangerTraps: [
            "Taking downstream speed as (y - x) instead of (x + y)",
            "Not discarding the negative value of speed with a stated reason: 'Speed cannot be negative'"
          ],
          stepByStepApproach: [
            "Step 1: Define variable clearly: 'Let speed of boat in still water = x km/h'",
            "Step 2: Write Upstream speed = (x - y) km/h, Downstream speed = (x + y) km/h",
            "Step 3: Formulate Time Equation: T_up - T_down = Δt and simplify into ax² + bx + c = 0",
            "Step 4: Solve via Quadratic Formula / Factorization and reject negative root with reason"
          ],
          samplePYQSnippet: "A motor boat whose speed is 18 km/h in still water takes 1 hour more to go 24 km upstream than to return downstream to the same spot. Find the speed of the stream. [CBSE 2023, 5 Marks]",
          mastered: false
        },
        {
          id: "math-gt-3",
          topicName: "Basic Proportionality Theorem (BPT / Thales) & Proof",
          chapterName: "Triangles",
          recurrenceFrequency: "9 / 10 Years (90%)",
          recurrencePercentage: 90,
          priorityTier: "guaranteed",
          marksWeightage: "5 Marks (Theorem Proof + Sub-Question)",
          yearsAppeared: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025],
          questionEvolutionSummary: "Asked either as direct theorem statement & proof (4 Marks) + 1-Mark numerical application, or as a riders proof based on parallel line intercept ratios.",
          masterFormulaOrTheoremLatex: "DE \\parallel BC \\implies \\frac{AD}{DB} = \\frac{AE}{EC}",
          dangerTraps: [
            "Drawing diagram without construction lines (dashed lines for perpendiculars and joins)",
            "Not mentioning common vertex height property when calculating ratio of triangle areas"
          ],
          stepByStepApproach: [
            "Step 1: Write Given: 'In ΔABC, line DE ∥ BC intersecting AB at D and AC at E'",
            "Step 2: Write To Prove: AD/DB = AE/EC and Construction: Join BE, CD and draw DM ⊥ AC, EN ⊥ AB",
            "Step 3: Calculate Area(ΔADE)/Area(ΔBDE) = AD/DB and Area(ΔADE)/Area(ΔCDE) = AE/EC",
            "Step 4: Prove Area(ΔBDE) = Area(ΔCDE) (same base DE between parallel lines DE ∥ BC) and equate"
          ],
          samplePYQSnippet: "State and prove Basic Proportionality Theorem (Thales Theorem). Using this, prove that the line drawn from the mid-point of one side of a triangle parallel to another side bisects the third side. [CBSE 2024, 5 Marks]",
          mastered: false
        },
        {
          id: "math-gt-4",
          topicName: "Lengths of Tangents from External Point to a Circle are Equal",
          chapterName: "Circles",
          recurrenceFrequency: "8 / 10 Years (80%)",
          recurrencePercentage: 80,
          priorityTier: "guaranteed",
          marksWeightage: "3 or 5 Marks (Theorem / Quadrilateral Circumscription)",
          yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2025],
          questionEvolutionSummary: "Frequently combined with quadrilateral circumscribing circle (AB + CD = AD + BC) or tangents at endpoints of a diameter being parallel.",
          masterFormulaOrTheoremLatex: "PA = PB \\quad (\\text{where } P \\text{ is external point to circle with center } O)",
          dangerTraps: [
            "Forgetting to write RHS congruence criterion in the triangle proof (ΔOPA ≅ ΔOPB)",
            "Assuming radius is perpendicular to tangent without citing Theorem 10.1"
          ],
          stepByStepApproach: [
            "Step 1: Given: Circle C(O, r), external point P with tangents PA, PB at points of contact A, B",
            "Step 2: Construction: Join OA, OB, and OP",
            "Step 3: In right ΔOAP and ΔOBP: OA = OB (radii), OP = OP (common), ∠OAP = ∠OBP = 90°",
            "Step 4: By RHS Congruence, ΔOAP ≅ ΔOBP ⟹ PA = PB (CPCT)"
          ],
          samplePYQSnippet: "Prove that the lengths of tangents drawn from an external point to a circle are equal. Hence prove that a quadrilateral ABCD circumscribing a circle satisfies AB + CD = AD + BC. [CBSE 2023, 5 Marks]",
          mastered: false
        }
      ],
      highYieldTopics: [
        {
          id: "math-hyt-1",
          topicName: "Trigonometric Identity Proofs with Fractions & Radicals",
          chapterName: "Introduction to Trigonometry",
          recurrenceFrequency: "8 / 10 Years (80%)",
          recurrencePercentage: 80,
          priorityTier: "high",
          marksWeightage: "4 or 5 Marks",
          yearsAppeared: [2016, 2017, 2018, 2019, 2021, 2022, 2024, 2025],
          questionEvolutionSummary: "Standard patterns: (sin θ - cos θ + 1)/(sin θ + cos θ - 1) = sec θ + tan θ, or √(1+sin A)/(1-sin A) = sec A + tan A.",
          masterFormulaOrTheoremLatex: "\\sin^2\\theta + \\cos^2\\theta = 1, \\quad 1 + \\tan^2\\theta = \\sec^2\\theta",
          dangerTraps: [
            "Not converting tan/cot into sin/cos in ambiguous steps",
            "Mixing algebraic signs when applying difference of squares (1 - sin² A)"
          ],
          stepByStepApproach: [
            "Step 1: Choose LHS and express complex trigonometric ratios in terms of sin θ and cos θ",
            "Step 2: Take common LCM and apply algebraic identities (a³±b³ or (a+b)²)",
            "Step 3: Substitute Pythagorean identity 1 = sin²θ + cos²θ or sec²θ - tan²θ",
            "Step 4: Cancel common factors to obtain exact RHS formulation"
          ],
          samplePYQSnippet: "Prove that: \\frac{\\cos A - \\sin A + 1}{\\cos A + \\sin A - 1} = \\csc A + \\cot A using identity \\csc^2 A = 1 + \\cot^2 A. [CBSE 2024, 4 Marks]",
          mastered: false
        },
        {
          id: "math-hyt-2",
          topicName: "Heights & Distances (Double Angle of Elevation / Depression)",
          chapterName: "Some Applications of Trigonometry",
          recurrenceFrequency: "8 / 10 Years (80%)",
          recurrencePercentage: 80,
          priorityTier: "high",
          marksWeightage: "4 Marks (Case Study) or 5 Marks",
          yearsAppeared: [2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025],
          questionEvolutionSummary: "Shifted from standard two-tower problems to real-life Case Studies (Light house spotting two ships, Drone altitude, Statue on pedestal).",
          masterFormulaOrTheoremLatex: "\\tan\\theta_1 = \\frac{h}{x}, \\quad \\tan\\theta_2 = \\frac{h}{x + d}",
          dangerTraps: [
            "Confusing Angle of Depression with Angle of Elevation (forgetting alternate interior angle rule)",
            "Substituting √3 = 1.732 when question specifically asks to leave answer in surd form (or vice versa)"
          ],
          stepByStepApproach: [
            "Step 1: Draw clean labeled geometric sketch showing horizontal ground, line of sight, and right triangles",
            "Step 2: Apply tan θ in primary right triangle to express height in terms of ground distance",
            "Step 3: Apply tan θ in secondary extended right triangle and equate common variable",
            "Step 4: Rationalize denominator and append unit 'meters' in final box"
          ],
          samplePYQSnippet: "From a point on the ground, the angles of elevation of the bottom and top of a transmission tower fixed at the top of a 20 m high building are 45° and 60° respectively. Find the height of the tower. [CBSE 2023, 4 Marks]",
          mastered: false
        },
        {
          id: "math-hyt-3",
          topicName: "Median & Mean of Grouped Frequency Distribution (Missing Frequencies f1, f2)",
          chapterName: "Statistics",
          recurrenceFrequency: "7 / 10 Years (70%)",
          recurrencePercentage: 70,
          priorityTier: "high",
          marksWeightage: "5 Marks",
          yearsAppeared: [2016, 2018, 2019, 2021, 2022, 2023, 2024],
          questionEvolutionSummary: "Direct median calculation is rare; 90% of appearances ask to find missing frequencies x and y when Median = 28.5 or 525 is given.",
          masterFormulaOrTheoremLatex: "\\text{Median} = L + \\left(\\frac{\\frac{N}{2} - cf}{f}\\right) \\times h",
          dangerTraps: [
            "Taking 'cf' of the median class instead of the class PRECEDING the median class",
            "Not forming the second linear equation from Total Frequency Σf = N"
          ],
          stepByStepApproach: [
            "Step 1: Construct cumulative frequency table and form Equation 1 from Σf = N",
            "Step 2: Identify median class based on the given median value",
            "Step 3: Note parameters: L (lower limit), cf (preceding cumulative freq), f (class freq), h (class width)",
            "Step 4: Substitute into Median formula to find f1, then find f2 using Equation 1"
          ],
          samplePYQSnippet: "The median of the following frequency distribution is 28.5. Find the values of x and y if the total frequency is 60. [CBSE 2022, 5 Marks]",
          mastered: false
        }
      ],
      moderateYieldTopics: [
        {
          id: "math-myt-1",
          topicName: "Volume & Surface Area of Combined Solids (Cylinder + Cones / Hemispheres)",
          chapterName: "Surface Areas and Volumes",
          recurrenceFrequency: "6 / 10 Years (60%)",
          recurrencePercentage: 60,
          priorityTier: "moderate",
          marksWeightage: "4 or 5 Marks",
          yearsAppeared: [2016, 2017, 2019, 2022, 2023, 2025],
          questionEvolutionSummary: "Gulab jamun sugar syrup calculation, toy conical top on hemispherical base, or hollow cylinder mounted on hemisphere.",
          masterFormulaOrTheoremLatex: "\\text{TSA}_{\\text{toy}} = \\text{CSA}_{\\text{cone}} + \\text{CSA}_{\\text{hemisphere}} = \\pi r l + 2\\pi r^2",
          dangerTraps: [
            "Adding base areas when two solid faces are joined together (e.g. adding πr² twice)",
            "Using vertical height h instead of slant height l = √(r² + h²) in conical CSA"
          ],
          stepByStepApproach: [
            "Step 1: Break down composite solid into individual geometric components",
            "Step 2: Identify exposed surface area components (only boundary curved surfaces)",
            "Step 3: Factor out common terms (like πr) before substituting numerical values",
            "Step 4: Complete arithmetic and write unit cm² or cm³"
          ],
          samplePYQSnippet: "A solid toy is in the form of a hemisphere surmounted by a right circular cone. The height of the cone is 2 cm and the diameter of the base is 4 cm. Determine the volume and total surface area of the toy. [CBSE 2023, 5 Marks]",
          mastered: false
        },
        {
          id: "math-myt-2",
          topicName: "Sum of First n Terms ($S_n$) Applied Word Problems",
          chapterName: "Arithmetic Progressions",
          recurrenceFrequency: "6 / 10 Years (60%)",
          recurrencePercentage: 60,
          priorityTier: "moderate",
          marksWeightage: "4 Marks (Case Study)",
          yearsAppeared: [2017, 2018, 2020, 2022, 2024, 2025],
          questionEvolutionSummary: "Case Study based on stadium seat rows, installment payment increments, or tree planting competitions.",
          masterFormulaOrTheoremLatex: "S_n = \\frac{n}{2}[2a + (n-1)d], \\quad a_n = S_n - S_{n-1}",
          dangerTraps: [
            "Confusing the n-th term value a_n with the sum of n terms S_n",
            "Handling double roots for n when d is negative (interpreting why two answers occur)"
          ],
          stepByStepApproach: [
            "Step 1: Identify first term a, common difference d = a2 - a1, and target n",
            "Step 2: Apply Sn formula to formulate quadratic equation in terms of n",
            "Step 3: Factorize quadratic and verify if n is a natural positive integer",
            "Step 4: Provide physical interpretation if two valid positive values of n occur"
          ],
          samplePYQSnippet: "In a potato race, 20 potatoes are placed in a line 3 meters apart. A runner starts from the bucket, picks one potato and runs back. Calculate total distance run. [CBSE 2024, 4 Marks]",
          mastered: false
        }
      ],
      topTrapsToAvoid: [
        {
          trap: "Missing ± sign when solving x² = k",
          fix: "Always write x = ±√k in algebra, then reject negative root with physical justification (e.g. speed/age/dimensions cannot be negative).",
          topic: "Quadratic Equations"
        },
        {
          trap: "Missing reasons (axioms/theorems) in Geometry proofs",
          fix: "Write theorem names in parentheses on the right margin for EVERY geometric step (e.g. '[By BPT]', '[Tangents from external point]', '[RHS Congruence]').",
          topic: "Triangles & Circles"
        },
        {
          trap: "Unit Inconsistency in Surface Area & Volume",
          fix: "Verify all dimensions are converted to the same unit (meters or centimeters) BEFORE multiplying.",
          topic: "Surface Areas and Volumes"
        }
      ]
    };
  }

  // Science Default Curated 80/20 Bank
  return {
    reportId,
    generatedAt: dateStr,
    subject: subject || "Science",
    grade: grade || "Class 10th",
    board: board || "CBSE",
    totalPYQAnalyzedYears: 10,
    yearsSpan: "2016 – 2026",
    topTopicsCount: 7,
    estimatedScoreCoveragePercentage: 81,
    summaryExecutiveNote: "10-Year Science PYQ Blueprint analysis shows that 81% of Board marks are generated from 7 foundational mechanisms: Ray Diagrams & Lens Formula, Ohm's Law & Solenoids, Redox & Chemical Balancing, Carbon Homologous Series, Human Excretory/Circulatory System, and Mendel's Genetics.",
    guaranteedTopics: [
      {
        id: "sci-gt-1",
        topicName: "Ray Optics: Concave/Convex Mirror & Lens Formula with Sign Convention",
        chapterName: "Light: Reflection and Refraction",
        recurrenceFrequency: "10 / 10 Years (100%)",
        recurrencePercentage: 100,
        priorityTier: "guaranteed",
        marksWeightage: "5 Marks (Numerical + Ray Diagram)",
        yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
        questionEvolutionSummary: "Consistently asks to find position, nature, and size of image, accompanied by an exact ray diagram with arrows indicating light propagation direction.",
        masterFormulaOrTheoremLatex: "\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad m = \\frac{v}{u} = \\frac{h_i}{h_o} \\quad (\\text{Lens})",
        dangerTraps: [
          "Forgetting negative sign for object distance u (u is ALWAYS negative in Cartesian sign convention)",
          "Drawing ray diagrams without light propagation arrows (0 marks given for ray without arrow)"
        ],
        stepByStepApproach: [
          "Step 1: Write Given values with Cartesian signs: u = -x cm, f = ±y cm, h_o = +z cm",
          "Step 2: State standard formula 1/f = 1/v - 1/u (Lens) or 1/f = 1/v + 1/u (Mirror)",
          "Step 3: Solve algebraically for v and calculate magnification m",
          "Step 4: Draw neat ray diagram using ruler, label F, 2F, O, and mark directional arrows on rays"
        ],
        samplePYQSnippet: "A concave lens of focal length 15 cm forms an image 10 cm from the lens. How far is the object placed from the lens? Draw the ray diagram. [CBSE 2024, 3 Marks]",
        mastered: false
      },
      {
        id: "sci-gt-2",
        topicName: "Electric Circuit Equivalent Resistance & Joule's Heating ($H = I^2Rt$)",
        chapterName: "Electricity",
        recurrenceFrequency: "9 / 10 Years (90%)",
        recurrencePercentage: 90,
        priorityTier: "guaranteed",
        marksWeightage: "5 Marks (Combined Circuit Analysis)",
        yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025],
        questionEvolutionSummary: "Combination of series and parallel resistors with an ammeter and voltmeter, asking for total current, potential difference across specific resistor, and electric power/energy consumed in commercial units (kWh).",
        masterFormulaOrTheoremLatex: "V = IR, \\quad R_p = \\frac{R_1 R_2}{R_1 + R_2}, \\quad P = VI = I^2 R = \\frac{V^2}{R}",
        dangerTraps: [
          "Inverting the fraction when calculating parallel resistance (forgetting that 1/Rp = 1/R1 + 1/R2)",
          "Calculating commercial electrical energy without converting power to Kilowatts (kW) and time to hours"
        ],
        stepByStepApproach: [
          "Step 1: Simplify parallel clusters first to find equivalent parallel resistance Rp",
          "Step 2: Add series resistances to obtain total circuit resistance R_total",
          "Step 3: Apply Ohm's law I_total = V_battery / R_total to find main ammeter reading",
          "Step 4: Calculate branch voltage drops and power dissipation P = I²R with units (Watts/Joules)"
        ],
        samplePYQSnippet: "Three resistors of 6Ω, 3Ω and 2Ω are connected in parallel across a 12V battery. Calculate the total resistance, total current, and current through each resistor. [CBSE 2023, 5 Marks]",
        mastered: false
      },
      {
        id: "sci-gt-3",
        topicName: "Saponification & Esterification Reactions of Carbon Compounds",
        chapterName: "Carbon and its Compounds",
        recurrenceFrequency: "9 / 10 Years (90%)",
        recurrencePercentage: 90,
        priorityTier: "guaranteed",
        marksWeightage: "5 Marks (Chemical Equations & Properties)",
        yearsAppeared: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025],
        questionEvolutionSummary: "Organic reaction roadmap: Compound A (Ethanol) reacts with Compound B (Ethanoic acid) in presence of conc. H2SO4 to form sweet-smelling ester C. C on reaction with NaOH gives back A and sodium ethanoate.",
        masterFormulaOrTheoremLatex: "\\text{CH}_3\\text{COOH} + \\text{C}_2\\text{H}_5\\text{OH} \\xrightarrow{\\text{Conc. H}_2\\text{SO}_4} \\text{CH}_3\\text{COOC}_2\\text{H}_5 + \\text{H}_2\\text{O}",
        dangerTraps: [
          "Omitting catalyst 'Conc. H2SO4' over the esterification arrow",
          "Confusing Ethanol (C2H5OH) with Ethanoic Acid (CH3COOH) in functional group identification"
        ],
        stepByStepApproach: [
          "Step 1: Identify organic functional groups (Alcohol -OH, Carboxylic acid -COOH, Ester -COO-)",
          "Step 2: Write complete balanced chemical equations with conditions (temperature/catalyst)",
          "Step 3: State physical observations (e.g. sweet fruity smell of ester, brisk effervescence with NaHCO3)",
          "Step 4: Explain saponification as alkaline hydrolysis of ester to form soap and alcohol"
        ],
        samplePYQSnippet: "An organic compound A of molecular formula C2H6O on oxidation with alkaline KMnO4 gives compound B. A and B react in presence of conc. H2SO4 to give sweet smelling C. Identify A, B and C and write all chemical equations. [CBSE 2024, 5 Marks]",
        mastered: false
      },
      {
        id: "sci-gt-4",
        topicName: "Structure & Functioning of Human Excretory Unit (Nephron) / Heart",
        chapterName: "Life Processes",
        recurrenceFrequency: "8 / 10 Years (80%)",
        recurrencePercentage: 80,
        priorityTier: "guaranteed",
        marksWeightage: "5 Marks (Diagram + Process Explanation)",
        yearsAppeared: [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2025],
        questionEvolutionSummary: "Focuses on three urine formation phases (Glomerular filtration, Selective reabsorption in tubular part, and Tubular secretion) or Double Circulation in human heart.",
        masterFormulaOrTheoremLatex: "\\text{Glomerular Ultrafiltration} \\to \\text{Selective Reabsorption (Glucose, Amino Acids, Salts)} \\to \\text{Urine Collection}",
        dangerTraps: [
          "Drawing unlabelled diagrams (label at least Bowman's capsule, Glomerulus, Henle's loop, and Collecting duct)",
          "Forgetting to mention that selective reabsorption depends on the amount of excess water in the body"
        ],
        stepByStepApproach: [
          "Step 1: Draw clean schematic diagram of Nephron with labeled arrows",
          "Step 2: Explain Glomerular Ultrafiltration under high hydrostatic pressure in Bowman's capsule",
          "Step 3: Describe Selective Reabsorption of essential nutrients (glucose, amino acids, salts, major water)",
          "Step 4: Conclude with transport into collecting duct and urinary bladder"
        ],
        samplePYQSnippet: "Draw a neat diagram of the human excretory system and label: Kidney, Ureter, Urinary Bladder, Urethra. Explain the mechanism of urine formation in a nephron. [CBSE 2023, 5 Marks]",
        mastered: false
      }
    ],
    highYieldTopics: [
      {
        id: "sci-hyt-1",
        topicName: "Magnetic Field around Solenoid & Fleming's Left-Hand Rule",
        chapterName: "Magnetic Effects of Electric Current",
        recurrenceFrequency: "8 / 10 Years (80%)",
        recurrencePercentage: 80,
        priorityTier: "high",
        marksWeightage: "3 or 4 Marks",
        yearsAppeared: [2016, 2017, 2018, 2019, 2021, 2022, 2024, 2025],
        questionEvolutionSummary: "Comparing magnetic field lines of a current-carrying solenoid with a bar magnet, and applying Fleming's Left Hand Rule to find force on electron/proton beam.",
        masterFormulaOrTheoremLatex: "\\vec{F} = I(\\vec{L} \\times \\vec{B}) \\quad (\\text{Thumb: Force, Forefinger: Field, Center finger: Current})",
        dangerTraps: [
          "Confusing direction of conventional current with direction of electron motion (current is OPPOSITE to electron movement)",
          "Drawing magnetic field lines crossing each other (magnetic field lines NEVER intersect)"
        ],
        stepByStepApproach: [
          "Step 1: Define solenoid as a coil of many circular turns of insulated copper wire wrapped closely",
          "Step 2: Draw uniform parallel field lines inside solenoid (showing uniform magnetic field)",
          "Step 3: State Fleming's Left Hand Rule with perpendicular alignment of Thumb, Forefinger, Center finger",
          "Step 4: Determine exact deflection direction (Into the page / Out of the page / Up / Down)"
        ],
        samplePYQSnippet: "What is a solenoid? Draw the pattern of magnetic field lines around a current-carrying solenoid. State how an electromagnet is formed using a soft iron core. [CBSE 2024, 3 Marks]",
        mastered: false
      },
      {
        id: "sci-hyt-2",
        topicName: "Mendel's Monohybrid & Dihybrid Cross (Genotype & Phenotype Ratios)",
        chapterName: "Heredity and Evolution",
        recurrenceFrequency: "7 / 10 Years (70%)",
        recurrencePercentage: 70,
        priorityTier: "high",
        marksWeightage: "4 Marks (Case Study) or 5 Marks",
        yearsAppeared: [2017, 2018, 2019, 2021, 2022, 2023, 2025],
        questionEvolutionSummary: "Punnett square analysis for pea plants (Tall vs Short, Round Green vs Wrinkled Yellow) or Sex Determination in Human Beings (XX vs XY chromosomes).",
        masterFormulaOrTheoremLatex: "\\text{Monohybrid Phenotypic Ratio: } 3:1, \\quad \\text{Dihybrid Ratio: } 9:3:3:1",
        dangerTraps: [
          "Mixing up Genotypic ratio (1:2:1 for TT : Tt : tt) with Phenotypic ratio (3:1 for Tall : Dwarf)",
          "Not drawing the complete Punnett square table for F2 generation"
        ],
        stepByStepApproach: [
          "Step 1: Write parental genotypes (e.g. TT × tt) and form gametes (T and t)",
          "Step 2: Show F1 generation: all heterozygous (Tt) showing dominant phenotype",
          "Step 3: Show selfing of F1 (Tt × Tt) with 2×2 Punnett square for F2 generation",
          "Step 4: State clear phenotypic ratio (3:1) and genotypic ratio (1:2:1)"
        ],
        samplePYQSnippet: "A tall pea plant (TT) is crossed with a short pea plant (tt). What will be the phenotype of F1 generation? Show the cross up to F2 generation using a Punnett square and state phenotypic and genotypic ratios. [CBSE 2023, 4 Marks]",
        mastered: false
      }
    ],
    moderateYieldTopics: [
      {
        id: "sci-myt-1",
        topicName: "Chlor-Alkali Process & Industrial Salts ($NaOH, Cl_2, H_2, CaOCl_2, NaHCO_3$)",
        chapterName: "Acids, Bases and Salts",
        recurrenceFrequency: "6 / 10 Years (60%)",
        recurrencePercentage: 60,
        priorityTier: "moderate",
        marksWeightage: "3 or 5 Marks",
        yearsAppeared: [2016, 2018, 2019, 2022, 2024, 2025],
        questionEvolutionSummary: "Electrolysis of brine solution to produce Sodium Hydroxide at cathode, Chlorine gas at anode, and Hydrogen gas at cathode.",
        masterFormulaOrTheoremLatex: "2\\text{NaCl}(aq) + 2\\text{H}_2\\text{O}(l) \\xrightarrow{\\text{Electricity}} 2\\text{NaOH}(aq) + \\text{Cl}_2(g) + \\text{H}_2(g)",
        dangerTraps: [
          "Mixing up electrode products (Chlorine is at ANODE, Hydrogen is at CATHODE)",
          "Forgetting the formula of Plaster of Paris: CaSO4 · ½H2O (not 2H2O which is Gypsum)"
        ],
        stepByStepApproach: [
          "Step 1: Define Chlor-Alkali process as electrolysis of aqueous sodium chloride (brine)",
          "Step 2: Write balanced chemical equation with state symbols",
          "Step 3: Specify products at electrodes: Anode = Cl2, Cathode = H2, Near Cathode = NaOH",
          "Step 4: List two major commercial applications for each product"
        ],
        samplePYQSnippet: "Explain the Chlor-Alkali process with a balanced chemical equation. Name the gases liberated at the anode and cathode, and write one use of each. [CBSE 2022, 3 Marks]",
        mastered: false
      }
    ],
    topTrapsToAvoid: [
      {
        trap: "Inverting Cartesian sign for focal length",
        fix: "Remember: Concave (Mirror & Lens) has negative focal length (f < 0). Convex (Mirror & Lens) has positive focal length (f > 0).",
        topic: "Light: Reflection & Refraction"
      },
      {
        trap: "Writing biological processes without key biochemical keywords",
        fix: "In Life Processes questions, underline standard terms like 'Peristalsis', 'Emulsification', 'Ultrafiltration', 'Translocation' to get full marking key scores.",
        topic: "Life Processes"
      }
    ]
  };
}

// =========================================================================
// 🗺️ Phase 2: Marking Weightage Heatmap AI Prompt & Curated Data Bank
// =========================================================================

export function buildPYQWeightageHeatmapPrompt(params: {
  subject: string;
  grade: string;
  board: string;
  pyqDocumentText?: string;
  chapters?: string[];
}): string {
  const { subject, grade, board, pyqDocumentText, chapters } = params;

  return `You are a Senior CBSE / State Board Examination Controller, Blueprint Architect, and 10-Year PYQ Statistical Modeler for ${grade} ${subject} (${board || "CBSE"}).

Your objective is to generate an in-depth "Marking Weightage Heatmap & Section-Wise Distribution" report based on 10 years of past board exam papers (2016 – 2026).
Analyze how marks are distributed across chapters, sections (1-Mark MCQs, 2-Mark VSA, 3-Mark SA, 5-Mark LA, 4-Mark Case Studies), and 10-year historical trends.

${pyqDocumentText ? `STUDENT'S UPLOADED PYQ PAPERS / SYLLABUS CONTEXT:\n${pyqDocumentText.slice(0, 10000)}\n` : ""}
${chapters && chapters.length > 0 ? `KEY CHAPTERS FOCUS:\n${chapters.join(", ")}\n` : ""}

Generate a comprehensive, accurate JSON object matching this EXACT JSON schema:

{
  "reportId": "HEATMAP-${Date.now()}",
  "generatedAt": "${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}",
  "subject": "${subject}",
  "grade": "${grade}",
  "board": "${board || "CBSE"}",
  "totalExamMarks": 80,
  "analyzedYearsSpan": "2016 – 2026",
  "executiveHeatmapSummary": "2-3 sentences explaining the highest weightage clusters and where students should prioritize their exam preparation time.",
  "unitSummaries": [
    {
      "unitName": "Algebra",
      "totalMarks": 20,
      "percentageOfExam": 25,
      "chaptersCount": 4
    }
  ],
  "chapterBreakdowns": [
    {
      "id": "chap-1",
      "chapterName": "Real Numbers",
      "unitName": "Number Systems",
      "totalAvgMarks": 6,
      "marksPercentage": 7.5,
      "weightageTier": "tier2_important", // tier1_critical (10+ marks), tier2_important (6-9 marks), tier3_foundational (2-5 marks)
      "sectionsBreakdown": {
        "sectionA_MCQ": 2,
        "sectionB_VSA": 1,
        "sectionC_SA": 1,
        "sectionD_LA": 0,
        "sectionE_CaseStudy": 0
      },
      "tenYearTrend": {
        "trendDirection": "stable",
        "avgHistoricalMarks": 6,
        "highestEverMarksInSingleYear": 8,
        "trendCommentary": "Consistently 1 MCQ + 1 Proof of irrationality (3 Marks) + 1 HCF/LCM application."
      },
      "topScoringSubTopics": [
        "Fundamental Theorem of Arithmetic (HCF × LCM = a × b)",
        "Proof of Irrationality of √3, √5, 3+2√5"
      ],
      "timeAllocationRecommendedMins": 90
    }
  ],
  "sectionWiseDistribution": {
    "sectionA_1Mark": {
      "totalMarks": 20,
      "questionCount": 20,
      "targetTimeMinutes": 25,
      "description": "20 Multiple Choice Questions (including 2 Assertion-Reasoning). High speed, zero negative marking."
    },
    "sectionB_2Mark": {
      "totalMarks": 10,
      "questionCount": 5,
      "targetTimeMinutes": 20,
      "description": "5 Very Short Answer questions. Requires 2-3 precise steps."
    },
    "sectionC_3Mark": {
      "totalMarks": 18,
      "questionCount": 6,
      "targetTimeMinutes": 35,
      "description": "6 Short Answer questions. Step marking critical with standard theorems."
    },
    "sectionD_5Mark": {
      "totalMarks": 20,
      "questionCount": 4,
      "targetTimeMinutes": 55,
      "description": "4 Long Answer questions. High-yield proofs and comprehensive word problems."
    },
    "sectionE_4Mark_CaseStudy": {
      "totalMarks": 12,
      "questionCount": 3,
      "targetTimeMinutes": 30,
      "description": "3 Integrated Case Study / Competency based scenario questions with sub-parts."
    }
  },
  "smartExamDayTimeStrategy": {
    "readingTime15MinsPlan": [
      "Scan Section E (Case Studies) to identify familiar real-world models",
      "Mark internal choice options in Section C & D",
      "Mentally verify 1-mark MCQs in Section A"
    ],
    "sectionOrderSuggestion": [
      "Phase 1 (0-30 mins): Section A (MCQs) for quick momentum",
      "Phase 2 (30-85 mins): Section D (5-Markers) while brain is at peak freshness",
      "Phase 3 (85-115 mins): Section E (Case Studies)",
      "Phase 4 (115-165 mins): Section B & C (2 & 3 Markers)",
      "Phase 5 (165-180 mins): 15-Minute Buffer for checking calculation signs and units"
    ],
    "bufferReserveMins": 15
  }
}

STRICT REQUIREMENTS:
1. Include all major chapters of ${subject} (${grade}).
2. Sum of section totalMarks must equal 80 (or 70 if applicable).
3. Ensure chapter breakdowns classify into tier1_critical, tier2_important, and tier3_foundational.
4. Output ONLY valid JSON with no markdown wrapper or commentary.`;
}

export function getCuratedWeightageHeatmapReport(subject: string, grade: string, board: string = "CBSE"): PYQWeightageHeatmapReport {
  const normSubj = (subject || "").toLowerCase();
  const dateStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const reportId = `HEATMAP-${Math.floor(100000 + Math.random() * 900000)}`;

  if (normSubj.includes("math") || normSubj.includes("ganit")) {
    return {
      reportId,
      generatedAt: dateStr,
      subject: "Mathematics",
      grade: grade || "Class 10th",
      board: board || "CBSE",
      totalExamMarks: 80,
      analyzedYearsSpan: "2016 – 2026",
      executiveHeatmapSummary: "Over 10 years of Board exams, Algebra (20 Marks) and Geometry (15 Marks) alone account for nearly 44% of the paper. Surface Areas and Trigonometry heavily dominate Section D (5-Markers) and Section E (Case Studies).",
      unitSummaries: [
        { unitName: "Algebra", totalMarks: 20, percentageOfExam: 25, chaptersCount: 4 },
        { unitName: "Geometry", totalMarks: 15, percentageOfExam: 18.75, chaptersCount: 2 },
        { unitName: "Trigonometry", totalMarks: 12, percentageOfExam: 15, chaptersCount: 2 },
        { unitName: "Statistics & Probability", totalMarks: 11, percentageOfExam: 13.75, chaptersCount: 2 },
        { unitName: "Mensuration", totalMarks: 10, percentageOfExam: 12.5, chaptersCount: 2 },
        { unitName: "Coordinate Geometry", totalMarks: 6, percentageOfExam: 7.5, chaptersCount: 1 },
        { unitName: "Number Systems", totalMarks: 6, percentageOfExam: 7.5, chaptersCount: 1 }
      ],
      chapterBreakdowns: [
        {
          id: "m-ch-1",
          chapterName: "Triangles",
          unitName: "Geometry",
          totalAvgMarks: 9,
          marksPercentage: 11.25,
          weightageTier: "tier1_critical",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 1, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 9,
            highestEverMarksInSingleYear: 10,
            trendCommentary: "BPT Theorem proof + 1-Mark application is guaranteed in Section D (5 Marks) in 9 out of 10 years."
          },
          topScoringSubTopics: [
            "Basic Proportionality Theorem (Thales) Statement & Proof",
            "Criteria for Similarity (AAA, SSS, SAS) Numerical Riders"
          ],
          timeAllocationRecommendedMins: 180
        },
        {
          id: "m-ch-2",
          chapterName: "Quadratic Equations",
          unitName: "Algebra",
          totalAvgMarks: 7,
          marksPercentage: 8.75,
          weightageTier: "tier1_critical",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 1, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "rising",
            avgHistoricalMarks: 7,
            highestEverMarksInSingleYear: 9,
            trendCommentary: "Nature of roots discriminant (D ≥ 0) MCQs + 5-Mark Word problem (Speed/Boat/Time) is a perpetual fixture."
          },
          topScoringSubTopics: [
            "Discriminant (b² - 4ac) & Real/Equal Roots conditions",
            "Speed-Distance & Upstream/Downstream Word Problems"
          ],
          timeAllocationRecommendedMins: 150
        },
        {
          id: "m-ch-3",
          chapterName: "Surface Areas and Volumes",
          unitName: "Mensuration",
          totalAvgMarks: 7,
          marksPercentage: 8.75,
          weightageTier: "tier1_critical",
          sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 1, sectionE_CaseStudy: 1 },
          tenYearTrend: {
            trendDirection: "rising",
            avgHistoricalMarks: 7.5,
            highestEverMarksInSingleYear: 9,
            trendCommentary: "Primary source for Section E Case Study or Section D 5-Marker on composite shapes."
          },
          topScoringSubTopics: [
            "Total Surface Area of joined solids (Cylinder + Cone/Hemisphere)",
            "Volume conservation on melting/reshaping"
          ],
          timeAllocationRecommendedMins: 160
        },
        {
          id: "m-ch-4",
          chapterName: "Introduction to Trigonometry",
          unitName: "Trigonometry",
          totalAvgMarks: 7,
          marksPercentage: 8.75,
          weightageTier: "tier1_critical",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 7,
            highestEverMarksInSingleYear: 8,
            trendCommentary: "Always 2 MCQs on trigonometric values (30°, 45°, 60°) + 1 high-yield identity proof."
          },
          topScoringSubTopics: [
            "Trigonometric Identities (sin²θ + cos²θ = 1, sec²θ - tan²θ = 1)",
            "Trigonometric Ratios of Specific Angles"
          ],
          timeAllocationRecommendedMins: 140
        },
        {
          id: "m-ch-5",
          chapterName: "Some Applications of Trigonometry (Heights & Distances)",
          unitName: "Trigonometry",
          totalAvgMarks: 5,
          marksPercentage: 6.25,
          weightageTier: "tier2_important",
          sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 1 },
          tenYearTrend: {
            trendDirection: "rising",
            avgHistoricalMarks: 5,
            highestEverMarksInSingleYear: 6,
            trendCommentary: "Adopted heavily into 4-Mark Case Studies with real-world elevations (lighthouses, balloons, drones)."
          },
          topScoringSubTopics: [
            "Double angle of elevation (30° and 60°) with single height",
            "Angle of Depression to boats/cars with horizontal distance"
          ],
          timeAllocationRecommendedMins: 120
        },
        {
          id: "m-ch-6",
          chapterName: "Statistics",
          unitName: "Statistics & Probability",
          totalAvgMarks: 7,
          marksPercentage: 8.75,
          weightageTier: "tier1_critical",
          sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 1, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 7,
            highestEverMarksInSingleYear: 8,
            trendCommentary: "5-Mark Section D question on finding missing frequencies (f1, f2) when Median or Mean is given."
          },
          topScoringSubTopics: [
            "Median of grouped frequency with missing frequencies",
            "Mean via Step Deviation method"
          ],
          timeAllocationRecommendedMins: 130
        },
        {
          id: "m-ch-7",
          chapterName: "Circles",
          unitName: "Geometry",
          totalAvgMarks: 6,
          marksPercentage: 7.5,
          weightageTier: "tier2_important",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 6,
            highestEverMarksInSingleYear: 7,
            trendCommentary: "Lengths of tangents from external point theorem proof (3 Marks) + 2 MCQs on angle subtended at center."
          },
          topScoringSubTopics: [
            "Lengths of tangents drawn from external point are equal",
            "Quadrilateral circumscribing a circle (AB + CD = AD + BC)"
          ],
          timeAllocationRecommendedMins: 110
        },
        {
          id: "m-ch-8",
          chapterName: "Arithmetic Progressions",
          unitName: "Algebra",
          totalAvgMarks: 5,
          marksPercentage: 6.25,
          weightageTier: "tier2_important",
          sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 1 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 5,
            highestEverMarksInSingleYear: 6,
            trendCommentary: "Often appears as 1 MCQ + 1 3-Mark problem on finding common difference or sum of n terms."
          },
          topScoringSubTopics: [
            "n-th term from end: a_n = l - (n-1)d",
            "Sum of first n terms word problems"
          ],
          timeAllocationRecommendedMins: 100
        },
        {
          id: "m-ch-9",
          chapterName: "Coordinate Geometry",
          unitName: "Coordinate Geometry",
          totalAvgMarks: 6,
          marksPercentage: 7.5,
          weightageTier: "tier2_important",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 6,
            highestEverMarksInSingleYear: 7,
            trendCommentary: "Section formula ratio k:1 + Distance formula collinearity conditions."
          },
          topScoringSubTopics: [
            "Section Formula (internal division and ratio finding)",
            "Distance Formula & Equidistant Points"
          ],
          timeAllocationRecommendedMins: 90
        },
        {
          id: "m-ch-10",
          chapterName: "Real Numbers",
          unitName: "Number Systems",
          totalAvgMarks: 6,
          marksPercentage: 7.5,
          weightageTier: "tier2_important",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 6,
            highestEverMarksInSingleYear: 7,
            trendCommentary: "100% predictable: 1 MCQ on HCF/LCM + 1 3-Marker Proof of irrationality."
          },
          topScoringSubTopics: [
            "Proof of Irrationality of √p and (a + b√p)",
            "HCF × LCM = Product of two numbers"
          ],
          timeAllocationRecommendedMins: 80
        },
        {
          id: "m-ch-11",
          chapterName: "Probability",
          unitName: "Statistics & Probability",
          totalAvgMarks: 4,
          marksPercentage: 5.0,
          weightageTier: "tier3_foundational",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 4,
            highestEverMarksInSingleYear: 5,
            trendCommentary: "Standard cards, dice (sum = 7 or 8), and colored balls in bag."
          },
          topScoringSubTopics: [
            "Deck of 52 Playing cards (Face cards & Aces)",
            "Two dice thrown simultaneously"
          ],
          timeAllocationRecommendedMins: 60
        },
        {
          id: "m-ch-12",
          chapterName: "Polynomials",
          unitName: "Algebra",
          totalAvgMarks: 4,
          marksPercentage: 5.0,
          weightageTier: "tier3_foundational",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "stable",
            avgHistoricalMarks: 4,
            highestEverMarksInSingleYear: 5,
            trendCommentary: "Relationship between zeroes and coefficients (α + β = -b/a, αβ = c/a)."
          },
          topScoringSubTopics: [
            "Zeroes and coefficients of quadratic polynomial",
            "Geometrical meaning of zeroes (graph intersections with x-axis)"
          ],
          timeAllocationRecommendedMins: 60
        },
        {
          id: "m-ch-13",
          chapterName: "Pair of Linear Equations in Two Variables",
          unitName: "Algebra",
          totalAvgMarks: 4,
          marksPercentage: 5.0,
          weightageTier: "tier3_foundational",
          sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 0 },
          tenYearTrend: {
            trendDirection: "declining",
            avgHistoricalMarks: 4,
            highestEverMarksInSingleYear: 6,
            trendCommentary: "Focus has shifted to consistency conditions (a1/a2 ≠ b1/b2) rather than tedious cross-multiplication."
          },
          topScoringSubTopics: [
            "Consistency conditions for intersecting, parallel, coincident lines",
            "Substitution & Elimination Methods"
          ],
          timeAllocationRecommendedMins: 70
        }
      ],
      sectionWiseDistribution: {
        sectionA_1Mark: {
          totalMarks: 20,
          questionCount: 20,
          targetTimeMinutes: 25,
          description: "20 Multiple Choice Questions (18 MCQs + 2 Assertion-Reasoning). Goal: Solve in 25 mins with rough margin work."
        },
        sectionB_2Mark: {
          totalMarks: 10,
          questionCount: 5,
          targetTimeMinutes: 20,
          description: "5 Very Short Answer questions (2 marks each). Needs 2-3 precise lines and clear formula."
        },
        sectionC_3Mark: {
          totalMarks: 18,
          questionCount: 6,
          targetTimeMinutes: 35,
          description: "6 Short Answer questions (3 marks each). Proof of irrationality, circles theorem, coordinate geometry."
        },
        sectionD_5Mark: {
          totalMarks: 20,
          questionCount: 4,
          targetTimeMinutes: 55,
          description: "4 Long Answer questions (5 marks each). BPT Theorem proof, Upstream-Downstream boat problem, Statistics missing frequency, Surface area composite shape."
        },
        sectionE_4Mark_CaseStudy: {
          totalMarks: 12,
          questionCount: 3,
          targetTimeMinutes: 30,
          description: "3 Integrated Case Study Questions (4 marks each). Realistic scenarios from Heights & Distances, AP, and Coordinate Geometry."
        }
      },
      smartExamDayTimeStrategy: {
        readingTime15MinsPlan: [
          "Scan Section E (3 Case Studies) to understand the story context beforehand",
          "Read internal choice options in Section C & D and tick your strongest preference",
          "Mentally solve the first 5 easy MCQs in Section A"
        ],
        sectionOrderSuggestion: [
          "Phase 1 (00:00 - 00:25): Section A (MCQs 1 to 20) - Build fast early momentum",
          "Phase 2 (00:25 - 01:20): Section D (5-Markers) - Tackle while energy and hand stability are highest",
          "Phase 3 (01:20 - 01:50): Section E (Case Studies) - Settle real-life context questions",
          "Phase 4 (01:50 - 02:45): Section B & C (2 & 3 Markers) - Smooth sailing through standard theorems",
          "Phase 5 (02:45 - 03:00): 15-Minute Final Check - Verify SI units, calculation signs, and formula boxes"
        ],
        bufferReserveMins: 15
      }
    };
  }

  // Science Default Heatmap
  return {
    reportId,
    generatedAt: dateStr,
    subject: subject || "Science",
    grade: grade || "Class 10th",
    board: board || "CBSE",
    totalExamMarks: 80,
    analyzedYearsSpan: "2016 – 2026",
    executiveHeatmapSummary: "Science blueprint demonstrates balanced weightage across Physics (25M), Chemistry (25M), Biology (30M). Light (Ray Optics), Electricity, Carbon Compounds, and Life Processes contribute over 52% of total marks.",
    unitSummaries: [
      { unitName: "World of Living (Biology)", totalMarks: 30, percentageOfExam: 37.5, chaptersCount: 4 },
      { unitName: "Chemical Substances - Nature & Behaviour (Chemistry)", totalMarks: 25, percentageOfExam: 31.25, chaptersCount: 4 },
      { unitName: "Effects of Current & Natural Phenomena (Physics)", totalMarks: 25, percentageOfExam: 31.25, chaptersCount: 3 }
    ],
    chapterBreakdowns: [
      {
        id: "s-ch-1",
        chapterName: "Light: Reflection and Refraction",
        unitName: "Physics",
        totalAvgMarks: 10,
        marksPercentage: 12.5,
        weightageTier: "tier1_critical",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 1, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "rising",
          avgHistoricalMarks: 10,
          highestEverMarksInSingleYear: 12,
          trendCommentary: "Lens/Mirror numerical with ray diagram is a 100% compulsory 5-Marker or Case Study."
        },
        topScoringSubTopics: [
          "Concave & Convex Lens / Mirror Formula with Cartesian Sign Convention",
          "Refraction through rectangular glass slab & Snell's Law"
        ],
        timeAllocationRecommendedMins: 180
      },
      {
        id: "s-ch-2",
        chapterName: "Life Processes",
        unitName: "Biology",
        totalAvgMarks: 9,
        marksPercentage: 11.25,
        weightageTier: "tier1_critical",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 1, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 9,
          highestEverMarksInSingleYear: 11,
          trendCommentary: "Nephron urine formation, Human Heart double circulation, or Stomatal opening/closing mechanism."
        },
        topScoringSubTopics: [
          "Human Excretory System & Nephron ultrafiltration mechanism",
          "Double Circulation & Human Heart Structure"
        ],
        timeAllocationRecommendedMins: 160
      },
      {
        id: "s-ch-3",
        chapterName: "Electricity",
        unitName: "Physics",
        totalAvgMarks: 8,
        marksPercentage: 10.0,
        weightageTier: "tier1_critical",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 0, sectionC_SA: 1, sectionD_LA: 1, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 8,
          highestEverMarksInSingleYear: 10,
          trendCommentary: "Combination circuit resistor numerical + Commercial energy consumption in kWh."
        },
        topScoringSubTopics: [
          "Equivalent Resistance in Series-Parallel Circuits",
          "Joule's Law of Heating & Electric Power (P = V²/R)"
        ],
        timeAllocationRecommendedMins: 150
      },
      {
        id: "s-ch-4",
        chapterName: "Carbon and its Compounds",
        unitName: "Chemistry",
        totalAvgMarks: 8,
        marksPercentage: 10.0,
        weightageTier: "tier1_critical",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 0, sectionC_SA: 1, sectionD_LA: 1, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "rising",
          avgHistoricalMarks: 8,
          highestEverMarksInSingleYear: 9,
          trendCommentary: "Esterification and saponification reaction roadmap + Covalent bonding electron dot structures."
        },
        topScoringSubTopics: [
          "Esterification & Saponification Reactions",
          "Homologous Series & Isomerism in Butane/Pentane"
        ],
        timeAllocationRecommendedMins: 150
      },
      {
        id: "s-ch-5",
        chapterName: "Magnetic Effects of Electric Current",
        unitName: "Physics",
        totalAvgMarks: 7,
        marksPercentage: 8.75,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 7,
          highestEverMarksInSingleYear: 8,
          trendCommentary: "Solenoid magnetic field lines + Fleming's Left Hand Rule on charged particle deflections."
        },
        topScoringSubTopics: [
          "Pattern of Magnetic Field Lines around Solenoid",
          "Fleming's Left Hand Rule & Force on Current-Carrying Conductor"
        ],
        timeAllocationRecommendedMins: 120
      },
      {
        id: "s-ch-6",
        chapterName: "Control and Coordination",
        unitName: "Biology",
        totalAvgMarks: 6,
        marksPercentage: 7.5,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "rising",
          avgHistoricalMarks: 6,
          highestEverMarksInSingleYear: 7,
          trendCommentary: "Reflex Arc diagram & Plant hormones (Auxin phototropism, Abscisic acid)."
        },
        topScoringSubTopics: [
          "Structure of Neuron and Reflex Arc Pathway",
          "Plant Hormones (Auxin, Gibberellin, Cytokinin, ABA)"
        ],
        timeAllocationRecommendedMins: 110
      },
      {
        id: "s-ch-7",
        chapterName: "Chemical Reactions and Equations",
        unitName: "Chemistry",
        totalAvgMarks: 6,
        marksPercentage: 7.5,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 6,
          highestEverMarksInSingleYear: 7,
          trendCommentary: "Balancing chemical equations, Redox identifying oxidizing/reducing agents, Thermal decomposition of FeSO4/Pb(NO3)2."
        },
        topScoringSubTopics: [
          "Identification of Oxidizing & Reducing Agents in Redox",
          "Thermal Decomposition of Ferrous Sulphate & Lead Nitrate"
        ],
        timeAllocationRecommendedMins: 100
      },
      {
        id: "s-ch-8",
        chapterName: "Acids, Bases and Salts",
        unitName: "Chemistry",
        totalAvgMarks: 6,
        marksPercentage: 7.5,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 6,
          highestEverMarksInSingleYear: 7,
          trendCommentary: "Chlor-Alkali process + Preparation and uses of Bleaching Powder, Baking Soda, Plaster of Paris."
        },
        topScoringSubTopics: [
          "Chlor-Alkali Process products & reactions",
          "Water of Crystallization & Plaster of Paris"
        ],
        timeAllocationRecommendedMins: 100
      },
      {
        id: "s-ch-9",
        chapterName: "How do Organisms Reproduce?",
        unitName: "Biology",
        totalAvgMarks: 6,
        marksPercentage: 7.5,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 1 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 6,
          highestEverMarksInSingleYear: 7,
          trendCommentary: "Female Reproductive System diagram, Fertilization in flowering plants, Contraceptive methods."
        },
        topScoringSubTopics: [
          "Longitudinal Section of Flower & Double Fertilization",
          "Human Reproductive Health & Contraception"
        ],
        timeAllocationRecommendedMins: 100
      },
      {
        id: "s-ch-10",
        chapterName: "Heredity and Evolution",
        unitName: "Biology",
        totalAvgMarks: 5,
        marksPercentage: 6.25,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 1 },
        tenYearTrend: {
          trendDirection: "rising",
          avgHistoricalMarks: 5,
          highestEverMarksInSingleYear: 6,
          trendCommentary: "Mendel's Monohybrid/Dihybrid cross Punnett square + Sex determination in human beings."
        },
        topScoringSubTopics: [
          "Mendel's Dihybrid Cross (9:3:3:1 ratio)",
          "Sex Determination in Humans (XX vs XY)"
        ],
        timeAllocationRecommendedMins: 90
      },
      {
        id: "s-ch-11",
        chapterName: "Metals and Non-Metals",
        unitName: "Chemistry",
        totalAvgMarks: 5,
        marksPercentage: 6.25,
        weightageTier: "tier2_important",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 5,
          highestEverMarksInSingleYear: 6,
          trendCommentary: "Reactivity Series, Amphoteric oxides (Al2O3, ZnO), Formation of Ionic compounds via electron transfer."
        },
        topScoringSubTopics: [
          "Formation and properties of Ionic Compounds (NaCl, MgCl2)",
          "Amphoteric Oxides & Reactivity Series with acids/water"
        ],
        timeAllocationRecommendedMins: 90
      },
      {
        id: "s-ch-12",
        chapterName: "The Human Eye and the Colourful World",
        unitName: "Physics",
        totalAvgMarks: 4,
        marksPercentage: 5.0,
        weightageTier: "tier3_foundational",
        sectionsBreakdown: { sectionA_MCQ: 1, sectionB_VSA: 0, sectionC_SA: 1, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 4,
          highestEverMarksInSingleYear: 5,
          trendCommentary: "Atmospheric refraction (twinkling of stars, advance sunrise) + Dispersion of white light through glass prism."
        },
        topScoringSubTopics: [
          "Atmospheric Refraction & Early Sunrise/Delayed Sunset",
          "Dispersion of white light through prism & Rainbow formation"
        ],
        timeAllocationRecommendedMins: 70
      },
      {
        id: "s-ch-13",
        chapterName: "Our Environment",
        unitName: "Biology",
        totalAvgMarks: 4,
        marksPercentage: 5.0,
        weightageTier: "tier3_foundational",
        sectionsBreakdown: { sectionA_MCQ: 2, sectionB_VSA: 1, sectionC_SA: 0, sectionD_LA: 0, sectionE_CaseStudy: 0 },
        tenYearTrend: {
          trendDirection: "stable",
          avgHistoricalMarks: 4,
          highestEverMarksInSingleYear: 5,
          trendCommentary: "10% Energy flow law in food chain + Biological Magnification + Ozone layer depletion by CFCs."
        },
        topScoringSubTopics: [
          "10% Law of Energy Transfer in Ecosystems",
          "Biological Magnification & Ozone Layer Depletion"
        ],
        timeAllocationRecommendedMins: 60
      }
    ],
    sectionWiseDistribution: {
      sectionA_1Mark: {
        totalMarks: 20,
        questionCount: 20,
        targetTimeMinutes: 25,
        description: "20 Objective MCQs (including Assertion-Reasoning). High precision, test fundamental definitions and reactions."
      },
      sectionB_2Mark: {
        totalMarks: 12,
        questionCount: 6,
        targetTimeMinutes: 25,
        description: "6 Very Short Answer questions (2 marks each). Balanced chemical equations and definitions."
      },
      sectionC_3Mark: {
        totalMarks: 21,
        questionCount: 7,
        targetTimeMinutes: 40,
        description: "7 Short Answer questions (3 marks each). Reasoning, ray diagram parts, and mechanism descriptions."
      },
      sectionD_5Mark: {
        totalMarks: 15,
        questionCount: 3,
        targetTimeMinutes: 45,
        description: "3 Long Answer questions (5 marks each - 1 Physics, 1 Chem, 1 Bio). Comprehensive multi-part questions."
      },
      sectionE_4Mark_CaseStudy: {
        totalMarks: 12,
        questionCount: 3,
        targetTimeMinutes: 30,
        description: "3 Competency Case-based questions (4 marks each) with experimental setup diagrams."
      }
    },
    smartExamDayTimeStrategy: {
      readingTime15MinsPlan: [
        "Inspect the 3 Section D 5-Markers to verify chemical reactions and ray diagrams",
        "Choose internal choices in Section C and Section D",
        "Read Section E experimental case diagrams carefully"
      ],
      sectionOrderSuggestion: [
        "Phase 1 (00:00 - 00:25): Section A (MCQs) - Fast start",
        "Phase 2 (00:25 - 01:10): Section D (5-Markers) - Physics numericals and Bio diagrams with high focus",
        "Phase 3 (01:10 - 01:40): Section E (Case Studies)",
        "Phase 4 (01:40 - 02:45): Section B & C (2 & 3 Markers)",
        "Phase 5 (02:45 - 03:00): 15-Minute Final Check - Balance all chemical formulas and add units to Physics numericals"
      ],
      bufferReserveMins: 15
    }
  };
}

// =========================================================================
// 🎲 PHASE 3: AI PREDICTED EXAM PAPER 2026 PROMPT & CURATED FALLBACK
// =========================================================================

export function buildAIPredictedPaperPrompt(params: {
  subject: string;
  grade: string;
  board: string;
  pyqDocumentText?: string;
  chapters?: string[];
}): string {
  const { subject, grade, board, pyqDocumentText, chapters } = params;

  return `You are a Senior Question Paper Setter & Chief Evaluator for the ${board || "CBSE"} Board Examination (Academic Year 2025-2026).
Your task is to synthesize a full-length, highly accurate, authentic "AI Predicted Board Examination Question Paper 2026" for ${grade} ${subject}.

The predicted question paper must follow the official ${board || "CBSE"} 2025-2026 latest sample paper blueprint structure and 10-year historical repeat trends (2016-2026):
- Section A: 20 Questions (1 Mark each) - 18 MCQs + 2 Assertion-Reason
- Section B: 5 Questions (2 Marks each) - Very Short Answer (VSA)
- Section C: 6 Questions (3 Marks each) - Short Answer (SA)
- Section D: 4 Questions (5 Marks each) - Long Answer (LA) with standard internal choices
- Section E: 3 Questions (4 Marks each) - Real-life competency Case Studies / Data-based integrated questions with sub-parts

${pyqDocumentText ? `STUDENT SYLLABUS / PYQ REFERENCE CONTEXT:\n${pyqDocumentText.slice(0, 8000)}\n` : ""}
${chapters && chapters.length > 0 ? `STUDENT SYLLABUS CHAPTERS:\n${chapters.join(", ")}\n` : ""}

Generate a JSON object matching this EXACT schema:
{
  "paperId": "PRED-2026-${Date.now()}",
  "generatedAt": "${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}",
  "subject": "${subject}",
  "grade": "${grade}",
  "board": "${board || "CBSE"}",
  "academicYear": "2025-2026",
  "totalMarks": 80,
  "totalTimeMinutes": 180,
  "paperCode": "MAESTRY-PREDICTED-2026-SET-1",
  "generalInstructions": [
    "This question paper consists of 38 questions in 5 sections.",
    "All Questions are compulsory. However, internal choices have been provided in some questions.",
    "Section A consists of 20 Multiple Choice Questions carrying 1 mark each (Q1 to Q18 are MCQs, Q19 & Q20 are Assertion-Reason).",
    "Section B consists of 5 Very Short Answer type questions carrying 2 marks each (Q21 to Q25).",
    "Section C consists of 6 Short Answer type questions carrying 3 marks each (Q26 to Q31).",
    "Section D consists of 4 Long Answer type questions carrying 5 marks each (Q32 to Q35).",
    "Section E consists of 3 Case Based integrated units of assessment (4 marks each) with sub-parts (Q36 to Q38).",
    "Use of calculators is not permitted."
  ],
  "sectionsSummary": {
    "sectionA": { "name": "Section A", "questionCount": 20, "marksEach": 1, "totalMarks": 20 },
    "sectionB": { "name": "Section B", "questionCount": 5, "marksEach": 2, "totalMarks": 10 },
    "sectionC": { "name": "Section C", "questionCount": 6, "marksEach": 3, "totalMarks": 18 },
    "sectionD": { "name": "Section D", "questionCount": 4, "marksEach": 5, "totalMarks": 20 },
    "sectionE": { "name": "Section E", "questionCount": 3, "marksEach": 4, "totalMarks": 12 }
  },
  "questions": [
    {
      "id": "q1",
      "questionNumber": 1,
      "section": "A",
      "marks": 1,
      "chapter": "Real Numbers",
      "topic": "Fundamental Theorem of Arithmetic / HCF & LCM",
      "questionType": "MCQ",
      "questionText": "If two positive integers a and b are written as a = x^3 y^2 and b = x y^3, where x, y are prime numbers, then HCF(a, b) is:",
      "options": ["A) xy", "B) xy^2", "C) x^3 y^3", "D) x^2 y^2"],
      "predictionConfidence": 98,
      "pyqReferenceYears": [2017, 2019, 2023, 2025],
      "officialMarkingScheme": {
        "stepWiseMarks": [
          { "step": "Identify minimum exponent of common prime factors: powers of x is 1, powers of y is 2", "marksAwarded": 0.5 },
          { "step": "HCF = x^1 * y^2 = xy^2 (Option B)", "marksAwarded": 0.5 }
        ],
        "finalAnswer": "B) xy^2",
        "commonMistakesWarning": "Do not confuse HCF (lowest power) with LCM (highest power).",
        "keyConceptOrFormula": "HCF(a,b) = Product of smallest powers of each common prime factor involved."
      }
    }
  ],
  "highProbabilityScoreTips": [
    "Always state the theorem name (e.g. 'By Basic Proportionality Theorem') before writing ratio steps.",
    "Section D 5-markers always require labeled step-by-step working and final units enclosed in boxes.",
    "Attempt Section E Case Studies with calm focus: usually sub-part (iii) contains the internal choice."
  ]
}

Ensure to generate at least 15-20 representative high-predicted questions across all sections (Sec A, B, C, D, E) with accurate LaTeX mathematical formulas, verified step-wise marking schemes, and 10-year repeat references. Return purely raw valid JSON.`;
}

export function getCuratedPredictedPaperReport(
  subject: string,
  grade: string,
  board: string
): AIPredictedPaperReport {
  const normSub = subject.toLowerCase();
  const isScience = normSub.includes("science") || normSub.includes("physics") || normSub.includes("chemistry") || normSub.includes("bio");

  if (isScience) {
    return {
      paperId: "PRED-2026-SCI-101",
      generatedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      subject: subject || "Science",
      grade: grade || "Class 10th",
      board: board || "CBSE",
      academicYear: "2025-2026",
      totalMarks: 80,
      totalTimeMinutes: 180,
      paperCode: "MAESTRY-PREDICTED-2026-SCI-SET-A",
      generalInstructions: [
        "This question paper consists of 39 questions in 5 sections.",
        "All questions are compulsory. Internal choice is provided in some questions.",
        "Section A consists of 20 objective questions (16 MCQs + 4 Assertion-Reason) carrying 1 mark each.",
        "Section B consists of 6 Very Short Answer (VSA) questions carrying 2 marks each (30 to 50 words).",
        "Section C consists of 7 Short Answer (SA) questions carrying 3 marks each (50 to 80 words).",
        "Section D consists of 3 Long Answer (LA) questions carrying 5 marks each (80 to 120 words).",
        "Section E consists of 3 Source-based/Case-based assessments (4 marks each) with sub-parts."
      ],
      sectionsSummary: {
        sectionA: { name: "Section A", questionCount: 20, marksEach: 1, totalMarks: 20 },
        sectionB: { name: "Section B", questionCount: 6, marksEach: 2, totalMarks: 12 },
        sectionC: { name: "Section C", questionCount: 7, marksEach: 3, totalMarks: 21 },
        sectionD: { name: "Section D", questionCount: 3, marksEach: 5, totalMarks: 15 },
        sectionE: { name: "Section E", questionCount: 3, marksEach: 4, totalMarks: 12 }
      },
      highProbabilityScoreTips: [
        "In Chemistry questions, write strictly balanced chemical equations with physical states (s, l, g, aq) to score 100% marks.",
        "In Physics (Light & Electricity), draw ray diagrams with direction arrows; missing arrows cost 0.5 marks per diagram.",
        "In Biology, label diagrams on the right side using a sharp pencil and straight guideline lines."
      ],
      questions: [
        {
          id: "sci-q1",
          questionNumber: 1,
          section: "A",
          marks: 1,
          chapter: "Chemical Reactions and Equations",
          topic: "Thermal Decomposition & Gas Identification",
          questionType: "MCQ",
          questionText: "When ferrous sulphate crystals are heated in a dry boiling tube, the color of the crystals changes and a characteristic smell of burning sulphur is observed. The brown solid formed is:",
          options: [
            "A) FeO",
            "B) Fe2O3",
            "C) Fe3O4",
            "D) FeSO4"
          ],
          predictionConfidence: 96,
          pyqReferenceYears: [2016, 2018, 2020, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "2FeSO4(s) --(Heat)--> Fe2O3(s) + SO2(g) + SO3(g)", marksAwarded: 0.5 },
              { step: "The brown residue is Ferric Oxide (Fe2O3) -> Option B", marksAwarded: 0.5 }
            ],
            finalAnswer: "B) Fe2O3 (Ferric Oxide)",
            commonMistakesWarning: "Students often confuse Fe2O3 with Fe3O4. Fe3O4 is formed when iron reacts with steam.",
            keyConceptOrFormula: "2FeSO4(s) -> Fe2O3(s) [brown] + SO2(g) + SO3(g)"
          }
        },
        {
          id: "sci-q2",
          questionNumber: 2,
          section: "A",
          marks: 1,
          chapter: "Acids, Bases and Salts",
          topic: "pH Scale & Universal Indicator",
          questionType: "MCQ",
          questionText: "An aqueous solution turns red litmus solution blue. Excess addition of which of the following solution would reverse the change?",
          options: [
            "A) Baking powder",
            "B) Lime",
            "C) Ammonium hydroxide solution",
            "D) Hydrochloric acid"
          ],
          predictionConfidence: 95,
          pyqReferenceYears: [2017, 2019, 2022, 2024],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "Turning red litmus blue indicates basic solution.", marksAwarded: 0.5 },
              { step: "To reverse the change (blue to red), an acid must be added in excess -> Option D", marksAwarded: 0.5 }
            ],
            finalAnswer: "D) Hydrochloric acid",
            commonMistakesWarning: "Do not choose baking powder or lime as both are basic substances.",
            keyConceptOrFormula: "Acid turns blue litmus red; Base turns red litmus blue."
          }
        },
        {
          id: "sci-q3",
          questionNumber: 3,
          section: "A",
          marks: 1,
          chapter: "Electricity",
          topic: "Ohm's Law & Resistance Factors",
          questionType: "MCQ",
          questionText: "A cylindrical conductor of length 'l' and uniform area of cross-section 'A' has resistance 'R'. Another conductor of length '2.5l' and resistance '0.5R' of the same material has area of cross-section:",
          options: [
            "A) 5A",
            "B) 2.5A",
            "C) 0.5A",
            "D) A/5"
          ],
          predictionConfidence: 94,
          pyqReferenceYears: [2018, 2021, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "R = rho * (l / A) => rho = R * A / l", marksAwarded: 0.5 },
              { step: "R' = rho * (l' / A') => 0.5R = (R*A/l) * (2.5l / A') => A' = (2.5 / 0.5) * A = 5A", marksAwarded: 0.5 }
            ],
            finalAnswer: "A) 5A",
            commonMistakesWarning: "Directly multiplying length and resistance without setting resistivity constant is a common arithmetic trap.",
            keyConceptOrFormula: "R = \\rho \\frac{l}{A}"
          }
        },
        {
          id: "sci-q4",
          questionNumber: 19,
          section: "A",
          marks: 1,
          chapter: "Life Processes",
          topic: "Respiration in Human Beings",
          questionType: "Assertion_Reason",
          questionText: "Assertion (A): The inner lining of the small intestine has numerous finger-like projections called villi.\nReason (R): Villi increase the surface area for rapid absorption of digested food.",
          options: [
            "A) Both A and R are true and R is the correct explanation of A.",
            "B) Both A and R are true but R is not the correct explanation of A.",
            "C) A is true but R is false.",
            "D) A is false but R is true."
          ],
          predictionConfidence: 97,
          pyqReferenceYears: [2020, 2022, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "Villi are finger-like projections (A is true). They provide enormous surface area for diffusion (R is true and explains A).", marksAwarded: 1.0 }
            ],
            finalAnswer: "A) Both A and R are true and R is the correct explanation of A.",
            commonMistakesWarning: "Check whether Reason directly answers 'Why' villi are shaped this way.",
            keyConceptOrFormula: "Villi increase surface area and are richly supplied with blood vessels."
          }
        },
        {
          id: "sci-q5",
          questionNumber: 21,
          section: "B",
          marks: 2,
          chapter: "Metals and Non-metals",
          topic: "Reactivity Series & Displacement",
          questionType: "VSA",
          questionText: "A zinc plate was kept immersed in copper sulphate solution for a few hours. What changes would you observe on the zinc plate and in the solution? Write the balanced chemical equation.",
          predictionConfidence: 96,
          pyqReferenceYears: [2016, 2019, 2022, 2024],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "Observation 1: The blue color of CuSO4 solution fades and turns colorless. Reddish-brown copper gets deposited on zinc plate.", marksAwarded: 1.0 },
              { step: "Balanced Equation: Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)", marksAwarded: 1.0 }
            ],
            finalAnswer: "Blue color fades to colorless; reddish-brown Cu deposited. Zn + CuSO4 -> ZnSO4 + Cu",
            commonMistakesWarning: "Students forget to mention the change in color of the solution (blue to colorless).",
            keyConceptOrFormula: "Displacement reaction: More reactive metal (Zn) displaces less reactive metal (Cu)."
          }
        },
        {
          id: "sci-q6",
          questionNumber: 26,
          section: "C",
          marks: 3,
          chapter: "Light - Reflection and Refraction",
          topic: "Concave Mirror Numerical & Ray Diagram",
          questionType: "SA",
          questionText: "An object 4 cm in height is placed at a distance of 15 cm in front of a concave mirror of focal length 10 cm. At what distance from the mirror should a screen be placed to obtain a sharp image? Find the height and nature of the image.",
          hasInternalChoice: true,
          orAlternativeQuestionText: "State Snell's law of refraction. A ray of light enters from air to glass plate having refractive index 1.50. What is the speed of light in glass? (Speed of light in vacuum = 3 x 10^8 m/s)",
          predictionConfidence: 98,
          pyqReferenceYears: [2017, 2019, 2021, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "Given: u = -15 cm, f = -10 cm, h = +4 cm. Mirror Formula: 1/f = 1/v + 1/u => 1/v = 1/(-10) - 1/(-15) = -1/10 + 1/15 = -1/30", marksAwarded: 1.0 },
              { step: "v = -30 cm (Screen should be placed 30 cm in front of mirror).", marksAwarded: 0.5 },
              { step: "Magnification m = -v/u = h'/h => -(-30)/(-15) = -2 => h' = -2 * 4 = -8 cm.", marksAwarded: 1.0 },
              { step: "Nature: Real, Inverted and Magnified (enlarged).", marksAwarded: 0.5 }
            ],
            finalAnswer: "v = -30 cm, h' = -8 cm, Real and Inverted",
            commonMistakesWarning: "Sign convention errors: focal length of concave mirror is always negative (f = -10 cm).",
            keyConceptOrFormula: "\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}, \\quad m = -\\frac{v}{u} = \\frac{h'}{h}"
          }
        },
        {
          id: "sci-q7",
          questionNumber: 32,
          section: "D",
          marks: 5,
          chapter: "Carbon and its Compounds",
          topic: "Esterification, Saponification & Cleansing Action of Soap",
          questionType: "LA",
          questionText: "(a) What is esterification reaction? Write a balanced chemical equation for the reaction between ethanol and ethanoic acid in the presence of conc. H2SO4.\n(b) What happens when an ester is treated with sodium hydroxide? Name this reaction and state its main commercial use.\n(c) Explain the cleansing action of soaps with the help of a neat micelle diagram.",
          predictionConfidence: 99,
          pyqReferenceYears: [2016, 2018, 2020, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "(a) Esterification: Carboxylic acid + alcohol -> Sweet smelling ester + water. CH3COOH + C2H5OH --(conc H2SO4)--> CH3COOC2H5 + H2O", marksAwarded: 1.5 },
              { step: "(b) Saponification: CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH. Commercial use: Preparation of soap.", marksAwarded: 1.5 },
              { step: "(c) Micelle Formation: Hydrophobic tail dissolves in oil/dirt, hydrophilic ionic head interacts with water. Forms emulsion, rinsed away with water + neat diagram.", marksAwarded: 2.0 }
            ],
            finalAnswer: "CH3COOH + C2H5OH -> CH3COOC2H5 + H2O; Saponification yields soap; Micelle structure clears grease.",
            commonMistakesWarning: "Missing acid catalyst (conc. H2SO4) over the arrow in esterification loses 0.5 marks.",
            keyConceptOrFormula: "Esterification (sweet fruit fragrance) vs Saponification (alkaline hydrolysis to soap)."
          }
        },
        {
          id: "sci-q8",
          questionNumber: 36,
          section: "E",
          marks: 4,
          chapter: "Magnetic Effects of Electric Current",
          topic: "Solenoid & Electromagnetic Induction",
          questionType: "Case_Study",
          questionText: "CASE STUDY: A long coil containing many circular turns of insulated copper wire wrapped closely in the shape of a cylinder is called a solenoid. The magnetic field lines inside a solenoid are in the form of parallel straight lines.\n\nAnswer the following:\n(i) What does the parallel magnetic field lines inside a current-carrying solenoid indicate? (1 Mark)\n(ii) State two methods to increase the strength of the magnetic field produced by a solenoid. (1 Mark)\n(iii) What happens to the magnetic field if the direction of current in the solenoid is reversed? Draw the magnetic field lines around a current-carrying solenoid. (2 Marks)",
          predictionConfidence: 97,
          pyqReferenceYears: [2018, 2020, 2023, 2025],
          officialMarkingScheme: {
            stepWiseMarks: [
              { step: "(i) It indicates that the magnetic field is uniform at all points inside the solenoid.", marksAwarded: 1.0 },
              { step: "(ii) 1. Increasing number of turns per unit length; 2. Increasing current; 3. Inserting soft iron core.", marksAwarded: 1.0 },
              { step: "(iii) The polarity (North and South poles) gets reversed + neat diagram showing field lines similar to a bar magnet.", marksAwarded: 2.0 }
            ],
            finalAnswer: "Uniform field; Increase turns / current / iron core; Field reverses polarity.",
            commonMistakesWarning: "Draw arrows on field lines emerging from North and entering into South outside the solenoid.",
            keyConceptOrFormula: "B \\propto n \\cdot I (Magnetic field of solenoid resembles a bar magnet)."
          }
        }
      ]
    };
  }

  // Default: Mathematics
  return {
    paperId: "PRED-2026-MATH-101",
    generatedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    subject: subject || "Mathematics",
    grade: grade || "Class 10th",
    board: board || "CBSE",
    academicYear: "2025-2026",
    totalMarks: 80,
    totalTimeMinutes: 180,
    paperCode: "MAESTRY-PREDICTED-2026-MATH-STANDARD-SET-1",
    generalInstructions: [
      "This question paper contains 38 questions divided into 5 Sections: A, B, C, D, and E.",
      "Section A comprises 20 Multiple Choice Questions (Q1 to Q20) of 1 mark each.",
      "Section B comprises 5 Very Short Answer Questions (Q21 to Q25) of 2 marks each.",
      "Section C comprises 6 Short Answer Questions (Q26 to Q31) of 3 marks each.",
      "Section D comprises 4 Long Answer Questions (Q32 to Q35) of 5 marks each with internal choices.",
      "Section E comprises 3 Case-Based Integrated Assessment units (Q36 to Q38) of 4 marks each with sub-parts.",
      "All questions are compulsory. In Section B (2 questions), Section C (2 questions), Section D (2 questions), and Section E (sub-part in each case), internal choice is provided.",
      "Use of calculators is not permitted. Take pi = 22/7 wherever required."
    ],
    sectionsSummary: {
      sectionA: { name: "Section A", questionCount: 20, marksEach: 1, totalMarks: 20 },
      sectionB: { name: "Section B", questionCount: 5, marksEach: 2, totalMarks: 10 },
      sectionC: { name: "Section C", questionCount: 6, marksEach: 3, totalMarks: 18 },
      sectionD: { name: "Section D", questionCount: 4, marksEach: 5, totalMarks: 20 },
      sectionE: { name: "Section E", questionCount: 3, marksEach: 4, totalMarks: 12 }
    },
    highProbabilityScoreTips: [
      "For Trigonometry identities in Section C/D, always write LHS and explicitly show applied formulas in brackets (e.g. [Using sin^2 A + cos^2 A = 1]).",
      "In Triangles & Circles proofs, writing Given, To Prove, and Construction carries 1.5 marks even before the proof steps.",
      "In Quadratic Equations word problems, always discard negative roots with a valid physical explanation (e.g., 'Speed/Time cannot be negative')."
    ],
    questions: [
      {
        id: "m-q1",
        questionNumber: 1,
        section: "A",
        marks: 1,
        chapter: "Real Numbers",
        topic: "HCF & LCM Prime Factorization",
        questionType: "MCQ",
        questionText: "If two positive integers p and q can be expressed as p = a b^2 and q = a^3 b, where a and b are prime numbers, then LCM(p, q) is:",
        options: [
          "A) ab",
          "B) a^2 b^2",
          "C) a^3 b^2",
          "D) a^3 b^3"
        ],
        predictionConfidence: 98,
        pyqReferenceYears: [2016, 2018, 2020, 2022, 2024],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "LCM is the product of highest power of each prime factor involved: max power of a is 3, max power of b is 2", marksAwarded: 0.5 },
            { step: "LCM(p, q) = a^3 * b^2 => Option C", marksAwarded: 0.5 }
          ],
          finalAnswer: "C) a^3 b^2",
          commonMistakesWarning: "Students sometimes calculate HCF (a b) instead of LCM.",
          keyConceptOrFormula: "\\text{LCM}(p, q) = a^{\\max(1,3)} b^{\\max(2,1)} = a^3 b^2"
        }
      },
      {
        id: "m-q2",
        questionNumber: 2,
        section: "A",
        marks: 1,
        chapter: "Polynomials",
        topic: "Relationship between zeroes and coefficients",
        questionType: "MCQ",
        questionText: "If one zero of the quadratic polynomial x^2 + 3x + k is 2, then the value of k is:",
        options: [
          "A) 10",
          "B) -10",
          "C) -7",
          "D) -2"
        ],
        predictionConfidence: 97,
        pyqReferenceYears: [2017, 2019, 2021, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "Since 2 is a zero, P(2) = 0 => (2)^2 + 3(2) + k = 0", marksAwarded: 0.5 },
            { step: "4 + 6 + k = 0 => 10 + k = 0 => k = -10 (Option B)", marksAwarded: 0.5 }
          ],
          finalAnswer: "B) -10",
          commonMistakesWarning: "Sign error while transposing +10 to the right-hand side.",
          keyConceptOrFormula: "P(\\alpha) = 0 \\text{ if } \\alpha \\text{ is a zero of polynomial } P(x)."
        }
      },
      {
        id: "m-q3",
        questionNumber: 3,
        section: "A",
        marks: 1,
        chapter: "Coordinate Geometry",
        topic: "Distance Formula & Origin Distance",
        questionType: "MCQ",
        questionText: "The distance of the point P(-6, 8) from the origin (0, 0) is:",
        options: [
          "A) 8",
          "B) 2\\sqrt{7}",
          "C) 10",
          "D) 6"
        ],
        predictionConfidence: 99,
        pyqReferenceYears: [2016, 2019, 2022, 2024],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "Distance from origin d = \\sqrt{x^2 + y^2} = \\sqrt{(-6)^2 + (8)^2}", marksAwarded: 0.5 },
            { step: "d = \\sqrt{36 + 64} = \\sqrt{100} = 10 units (Option C)", marksAwarded: 0.5 }
          ],
          finalAnswer: "C) 10 units",
          commonMistakesWarning: "Squaring -6 results in +36, not -36.",
          keyConceptOrFormula: "d = \\sqrt{x^2 + y^2}"
        }
      },
      {
        id: "m-q4",
        questionNumber: 19,
        section: "A",
        marks: 1,
        chapter: "Arithmetic Progressions",
        topic: "Common Difference & nth Term",
        questionType: "Assertion_Reason",
        questionText: "Assertion (A): The common difference of an AP in which a_18 - a_14 = 32 is 8.\nReason (R): The nth term of an AP is given by a_n = a + (n - 1)d.",
        options: [
          "A) Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A).",
          "B) Both Assertion (A) and Reason (R) are true but Reason (R) is not the correct explanation of Assertion (A).",
          "C) Assertion (A) is true but Reason (R) is false.",
          "D) Assertion (A) is false but Reason (R) is true."
        ],
        predictionConfidence: 96,
        pyqReferenceYears: [2021, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "a_18 - a_14 = (a + 17d) - (a + 13d) = 4d. Given 4d = 32 => d = 8 (Assertion is True). Reason is standard nth term formula and correctly explains (A).", marksAwarded: 1.0 }
          ],
          finalAnswer: "A) Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation.",
          commonMistakesWarning: "Check index difference: (18 - 14) * d = 4d.",
          keyConceptOrFormula: "a_p - a_q = (p - q)d"
        }
      },
      {
        id: "m-q5",
        questionNumber: 21,
        section: "B",
        marks: 2,
        chapter: "Real Numbers",
        topic: "Irrationality Proof",
        questionType: "VSA",
        questionText: "Prove that \\sqrt{5} is an irrational number.",
        predictionConfidence: 99,
        pyqReferenceYears: [2016, 2018, 2020, 2022, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "Let \\sqrt{5} = a/b (where a, b are coprime integers, b != 0). Squaring: 5b^2 = a^2 => 5 divides a^2 => 5 divides a.", marksAwarded: 1.0 },
            { step: "Let a = 5c => 5b^2 = 25c^2 => b^2 = 5c^2 => 5 divides b. Hence 5 is common factor of a and b, contradicting that a and b are coprime. Hence \\sqrt{5} is irrational.", marksAwarded: 1.0 }
          ],
          finalAnswer: "\\sqrt{5} is irrational (Proven by contradiction)",
          commonMistakesWarning: "Must explicitly state that 'a and b are coprime integers'. Missing this loses 0.5 marks.",
          keyConceptOrFormula: "\\text{Proof by Contradiction using Fundamental Theorem of Arithmetic.}"
        }
      },
      {
        id: "m-q6",
        questionNumber: 26,
        section: "C",
        marks: 3,
        chapter: "Introduction to Trigonometry",
        topic: "Trigonometric Identity Proof",
        questionType: "SA",
        questionText: "Prove that: \\frac{\\sin \\theta - 2\\sin^3 \\theta}{2\\cos^3 \\theta - \\cos \\theta} = \\tan \\theta",
        hasInternalChoice: true,
        orAlternativeQuestionText: "If \\sin \\theta + \\cos \\theta = \\sqrt{3}, then find the value of \\tan \\theta + \\cot \\theta.",
        predictionConfidence: 98,
        pyqReferenceYears: [2017, 2019, 2020, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "LHS = \\frac{\\sin \\theta (1 - 2\\sin^2 \\theta)}{\\cos \\theta (2\\cos^2 \\theta - 1)}", marksAwarded: 1.0 },
            { step: "= \\tan \\theta \\cdot \\frac{1 - 2(1 - \\cos^2 \\theta)}{2\\cos^2 \\theta - 1} = \\tan \\theta \\cdot \\frac{1 - 2 + 2\\cos^2 \\theta}{2\\cos^2 \\theta - 1}", marksAwarded: 1.0 },
            { step: "= \\tan \\theta \\cdot \\frac{2\\cos^2 \\theta - 1}{2\\cos^2 \\theta - 1} = \\tan \\theta = \\text{RHS} \\quad \\text{[Hence Proved]}", marksAwarded: 1.0 }
          ],
          finalAnswer: "\\tan \\theta (LHS = RHS)",
          commonMistakesWarning: "Do not cancel terms before factoring out sin theta and cos theta.",
          keyConceptOrFormula: "\\sin^2 \\theta + \\cos^2 \\theta = 1 \\implies \\sin^2 \\theta = 1 - \\cos^2 \\theta"
        }
      },
      {
        id: "m-q7",
        questionNumber: 32,
        section: "D",
        marks: 5,
        chapter: "Triangles",
        topic: "Basic Proportionality Theorem (Thales Theorem)",
        questionType: "LA",
        questionText: "State and prove Basic Proportionality Theorem (BPT / Thales Theorem).\n\nIn \\Delta ABC, if DE \\parallel BC intersecting AB at D and AC at E, with AD = x, DB = x - 2, AE = x + 2, and EC = x - 1, find the value of x.",
        hasInternalChoice: true,
        orAlternativeQuestionText: "Prove that the lengths of tangents drawn from an external point to a circle are equal. Using this, prove that a parallelogram circumscribing a circle is a rhombus.",
        predictionConfidence: 99,
        pyqReferenceYears: [2016, 2018, 2019, 2022, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "Statement + Given, To Prove & Construction with neat diagram: In \\Delta ABC, DE \\parallel BC. Join BE, CD and draw DM \\perp AC, EN \\perp AB.", marksAwarded: 1.5 },
            { step: "Proof: \\frac{\\text{Area}(\\Delta ADE)}{\\text{Area}(\\Delta BDE)} = \\frac{AD}{DB}; \\quad \\frac{\\text{Area}(\\Delta ADE)}{\\text{Area}(\\Delta CDE)} = \\frac{AE}{EC}. Since triangles on same base and between same parallels have equal area => AD/DB = AE/EC.", marksAwarded: 2.0 },
            { step: "Numerical Part: \\frac{x}{x - 2} = \\frac{x + 2}{x - 1} => x(x - 1) = (x + 2)(x - 2) => x^2 - x = x^2 - 4 => -x = -4 => x = 4.", marksAwarded: 1.5 }
          ],
          finalAnswer: "x = 4 (Theorem Proven + Numerical Solved)",
          commonMistakesWarning: "Never skip writing the formal Statement of the theorem; it carries 1 full mark.",
          keyConceptOrFormula: "\\frac{AD}{DB} = \\frac{AE}{EC} \\quad \\text{when } DE \\parallel BC."
        }
      },
      {
        id: "m-q8",
        questionNumber: 33,
        section: "D",
        marks: 5,
        chapter: "Some Applications of Trigonometry",
        topic: "Heights and Distances (Double Angle)",
        questionType: "LA",
        questionText: "From a point on a bridge across a river, the angles of depression of the banks on opposite sides of the river are 30° and 45° respectively. If the bridge is at a height of 3 m from the banks, find the width of the river. (Use \\sqrt{3} = 1.732)",
        predictionConfidence: 97,
        pyqReferenceYears: [2017, 2019, 2021, 2024],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "Neat diagram showing point P at height 3 m and banks A and B on opposite sides. Let D be foot of perpendicular on river bed.", marksAwarded: 1.0 },
            { step: "In right \\Delta PAD, \\tan 30^\\circ = \\frac{PD}{AD} => \\frac{1}{\\sqrt{3}} = \\frac{3}{AD} => AD = 3\\sqrt{3} \\text{ m}.", marksAwarded: 1.5 },
            { step: "In right \\Delta PBD, \\tan 45^\\circ = \\frac{PD}{BD} => 1 = \\frac{3}{BD} => BD = 3 \\text{ m}.", marksAwarded: 1.5 },
            { step: "Width of river AB = AD + BD = 3\\sqrt{3} + 3 = 3(\\sqrt{3} + 1) = 3(1.732 + 1) = 3(2.732) = 8.196 \\text{ m}.", marksAwarded: 1.0 }
          ],
          finalAnswer: "Width of river = 3(\\sqrt{3} + 1) \\approx 8.196 m",
          commonMistakesWarning: "Angles of depression must be shown at the top horizontal sightline before alternating interior angles to the river bank.",
          keyConceptOrFormula: "\\tan \\theta = \\frac{\\text{Opposite}}{\\text{Adjacent}}, \\quad \\text{Width} = AD + DB"
        }
      },
      {
        id: "m-q9",
        questionNumber: 36,
        section: "E",
        marks: 4,
        chapter: "Quadratic Equations & Arithmetic Progressions",
        topic: "Case Study - Real Life Production & Cost Modeling",
        questionType: "Case_Study",
        questionText: "CASE STUDY: A manufacturer of electronic sports watches produces 600 sets in the third year and 700 sets in the seventh year. Assuming that the production increases uniformly by a constant number every year:\n\n(i) Find the production in the 1st year (a). (1 Mark)\n(ii) Find the production in the 10th year (a_10). (1 Mark)\n(iii) Find the total production in the first 7 years (S_7). (2 Marks)\n[OR]\n(iii) In which year will the total production reach 1000 sets? (2 Marks)",
        predictionConfidence: 98,
        pyqReferenceYears: [2018, 2020, 2023, 2025],
        officialMarkingScheme: {
          stepWiseMarks: [
            { step: "(i) a_3 = a + 2d = 600; a_7 = a + 6d = 700. Subtracting: 4d = 100 => d = 25. Then a = 600 - 50 = 550 sets.", marksAwarded: 1.0 },
            { step: "(ii) a_10 = a + 9d = 550 + 9(25) = 550 + 225 = 775 sets.", marksAwarded: 1.0 },
            { step: "(iii) S_7 = \\frac{7}{2} [2a + (7 - 1)d] = \\frac{7}{2} [2(550) + 6(25)] = \\frac{7}{2} [1100 + 150] = \\frac{7}{2} [1250] = 7 * 625 = 4375 sets.", marksAwarded: 2.0 },
            { step: "[OR Part iii] a_n = a + (n - 1)d => 1000 = 550 + (n - 1)25 => 450 = (n - 1)25 => n - 1 = 18 => n = 19th year.", marksAwarded: 2.0 }
          ],
          finalAnswer: "(i) 550 sets; (ii) 775 sets; (iii) 4375 sets (or 19th year for 1000 sets)",
          commonMistakesWarning: "In AP word problems, clearly mention 'Let first year production be a and annual uniform increase be d'.",
          keyConceptOrFormula: "a_n = a + (n - 1)d, \\quad S_n = \\frac{n}{2}[2a + (n - 1)d]"
        }
      }
    ]
  };
}

