import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, CheckCircle, XCircle, RefreshCw, Volume2, HelpCircle, 
  ArrowRight, Zap, Trophy, Brain, TrendingUp, BarChart2, BookOpen, 
  Sparkles, Clock, Target, AlertCircle, Shield, Check, Flame,
  Crown, Medal, Star, UserCheck, Users, RotateCw, ChevronDown, ChevronUp,
  CheckSquare, Square, ListChecks, Layers, FileText, CheckCheck, Sliders, Filter,
  GraduationCap, Swords, Flag, AlertTriangle
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { cleanTopicHeader } from "../utils/boardFilter";
import { BattleArenaLanding, ScheduledBattleRoom } from "./BattleArenaLanding";
import { BattleRoomLobbyModal } from "./BattleRoomLobbyModal";
import { 
  BattleRoomData, 
  BattleParticipant, 
  subscribeToBattleParticipants, 
  updateParticipantBattleProgress 
} from "../services/battleRoomService";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  conceptTested?: string;
  theoryTested?: string;
  calculationFormula?: string;
  cognitiveCategory?: string;
  difficulty?: string;
}

// Default topic pools per subject when blackboard/syllabus has not loaded custom topics or when switching subjects
const SUBJECT_DEFAULT_TOPICS: Record<string, string[]> = {
  Mathematics: [
    "Linear & Quadratic Equations",
    "Trigonometry, Identities & Heights/Distances",
    "Differential & Integral Calculus",
    "Coordinate Geometry & Conic Sections",
    "Probability, Statistics & Combinatorics",
    "Matrices, Determinants & Vectors",
    "Arithmetic & Geometric Progressions (AP/GP)"
  ],
  Physics: [
    "Kinematics & Laws of Motion (Newton's Laws)",
    "Work, Energy, Power & Collisions",
    "Gravitation & Planetary Motion",
    "Current Electricity, Ohm's Law & Circuits",
    "Magnetic Effects of Current & EMI",
    "Ray Optics & Wave Optics",
    "Thermodynamics & Kinetic Theory of Gases"
  ],
  Chemistry: [
    "Chemical Bonding, Molecular Structure & Hybridization",
    "Periodic Classification & Periodic Trends",
    "Thermodynamics, Energetics & Chemical Equilibrium",
    "Organic Chemistry: Reaction Mechanisms & Hydrocarbons",
    "Solutions, Colligative Properties & Electrochemistry",
    "Atomic Structure & Quantum Numbers",
    "Coordination Compounds & Transition Metals"
  ],
  Biology: [
    "Cell: Structure, Cell Cycle & Biomolecules",
    "Genetics, Mendelian Inheritance & DNA/RNA",
    "Human Physiology (Circulation, Respiration, Excretion)",
    "Plant Physiology (Photosynthesis & Transpiration)",
    "Reproduction in Organisms & Human Health",
    "Biotechnology Principles & Environmental Ecology"
  ],
  Science: [
    "Force, Laws of Motion & Gravitation",
    "Chemical Reactions, Acids, Bases & Salts",
    "Life Processes: Nutrition, Respiration & Control",
    "Electricity, Circuits & Magnetic Effects",
    "Light: Reflection, Refraction & Optical Instruments",
    "Metals, Non-Metals & Carbon Compounds"
  ],
  General: [
    "Fundamental Quantitative Aptitude & Logic",
    "General Physics & Mechanics",
    "Everyday Chemistry & Molecular Interactions",
    "General Biology & Environmental Science",
    "Scientific Reasoning & Problem Solving"
  ]
};

// Sample robust question pool for various subjects
const QUIZ_POOL: Record<string, QuizQuestion[]> = {
  Mathematics: [
    {
      id: "m1",
      question: "If a triangle has sides 6cm, 8cm, and 10cm, what is its area?",
      options: ["48 cm²", "24 cm²", "14 cm²", "30 cm²"],
      correctAnswer: 1,
      explanation: "This is a right-angled triangle (6² + 8² = 10²). The area is ½ × base × height = ½ × 6 × 8 = 24 cm².",
      conceptTested: "Right-angled triangle area",
      cognitiveCategory: "Calculations & Solving",
      difficulty: "Medium"
    },
    {
      id: "m2",
      question: "Solve for x: log₂ (x + 3) = 4",
      options: ["x = 13", "x = 5", "x = 1", "x = 11"],
      correctAnswer: 0,
      explanation: "Converting to exponential form: x + 3 = 2⁴ => x + 3 = 16 => x = 13.",
      conceptTested: "Logarithmic calculations",
      cognitiveCategory: "Conceptual Application",
      difficulty: "Hard"
    },
    {
      id: "m3",
      question: "What is the slope of the line perpendicular to y = -3x + 5?",
      options: ["3", "-3", "1/3", "-1/3"],
      correctAnswer: 2,
      explanation: "The slope of a perpendicular line is the negative reciprocal of the original slope. Perpendicular slope = -1 / (-3) = 1/3.",
      conceptTested: "Perpendicular line slopes",
      cognitiveCategory: "Theoretical Core",
      difficulty: "Medium"
    }
  ],
  Science: [
    {
      id: "s1",
      question: "Which cell organelle is known as the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
      correctAnswer: 2,
      explanation: "Mitochondria are called powerhouses because they produce ATP, the energy currency of the cell, through cellular respiration.",
      conceptTested: "Cellular organelles",
      cognitiveCategory: "Theoretical Core",
      difficulty: "Easy"
    },
    {
      id: "s2",
      question: "What is the acceleration due to gravity on Earth's surface (approximate)?",
      options: ["9.8 m/s²", "1.6 m/s²", "24.7 m/s²", "11.2 m/s²"],
      correctAnswer: 0,
      explanation: "The acceleration due to gravity on Earth is approximately 9.8 m/s², representing the gravitational pull on objects.",
      conceptTested: "Gravitational constant",
      cognitiveCategory: "Formula Retention",
      difficulty: "Easy"
    },
    {
      id: "s3",
      question: "If an electric circuit has a voltage of 12V and resistance of 4 Ohms, what is the current?",
      options: ["48 Amps", "3 Amps", "8 Amps", "16 Amps"],
      correctAnswer: 1,
      explanation: "According to Ohm's Law (V = IR), Current (I) = V / R = 12V / 4Ω = 3 Amps.",
      conceptTested: "Ohm's Law application",
      cognitiveCategory: "Calculations & Solving",
      difficulty: "Medium"
    }
  ],
  General: [
    {
      id: "g1",
      question: "Which planet in our solar system is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      explanation: "Mars is called the Red Planet because of the iron oxide (rust) on its surface, giving it a reddish appearance.",
      conceptTested: "Solar system astronomy",
      cognitiveCategory: "Theoretical Core",
      difficulty: "Easy"
    },
    {
      id: "g2",
      question: "Who is known as the father of modern theoretical physics?",
      options: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Nikola Tesla"],
      correctAnswer: 1,
      explanation: "Albert Einstein is widely regarded as the father of modern physics, especially for his theory of relativity.",
      conceptTested: "Modern physics history",
      cognitiveCategory: "Theoretical Core",
      difficulty: "Easy"
    },
    {
      id: "g3",
      question: "What is the primary gas that makes up Earth's atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
      correctAnswer: 1,
      explanation: "Nitrogen is the most abundant gas in our atmosphere, making up about 78% of it, followed by Oxygen at 21%.",
      conceptTested: "Earth's atmosphere",
      cognitiveCategory: "Theoretical Core",
      difficulty: "Easy"
    }
  ]
};

interface QuickQuizViewProps {
  subject?: string;
  grade?: string;
  state: string; // disconnected, idle, listening, speaking, etc.
  onInjectPrompt: (text: string) => void;
  onToast: (text: string, type: "success" | "info" | "error") => void;
  topics?: string[];
  activeTopicIndex?: number;
  customBoardContent?: string;
  topicBoardsContent?: Record<number, string>;
  sessionId?: string | null;
}

export function QuickQuizView({
  subject = "Mathematics",
  grade = "Class 10",
  state,
  onInjectPrompt,
  onToast,
  topics = [],
  activeTopicIndex = 0,
  customBoardContent = "",
  topicBoardsContent = {},
  sessionId = null
}: QuickQuizViewProps) {
  // Pre-Quiz configuration parameters
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>(subject || "Mathematics");
  const [examLevel, setExamLevel] = useState<"Board" | "Competition">("Board");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30); // 0 for untimed, else in seconds
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");

  // Synchronize initial subject with incoming prop
  useEffect(() => {
    if (subject && subject !== selectedSubject) {
      setSelectedSubject(subject);
    }
  }, [subject]);

  // Extract all available syllabus & blackboard discussed topics for the chosen subject
  const extractedTopics = useMemo(() => {
    // Check if the selected subject matches the active classroom's subject
    const isClassroomSubject = Boolean(
      subject &&
      selectedSubject &&
      (subject.trim().toLowerCase() === selectedSubject.trim().toLowerCase() ||
       (subject.trim().toLowerCase().includes("math") && selectedSubject.toLowerCase().includes("math")) ||
       (subject.trim().toLowerCase().includes("phys") && selectedSubject.toLowerCase().includes("phys")) ||
       (subject.trim().toLowerCase().includes("chem") && selectedSubject.toLowerCase().includes("chem")) ||
       (subject.trim().toLowerCase().includes("bio") && selectedSubject.toLowerCase().includes("bio")) ||
       (subject.trim().toLowerCase().includes("sci") && selectedSubject.toLowerCase().includes("sci")))
    );

    if (isClassroomSubject && topics && topics.length > 0) {
      return topics.map((t, idx) => {
        const clean = cleanTopicHeader(t, undefined, idx);
        const boardNotes = (idx === activeTopicIndex ? customBoardContent : topicBoardsContent[idx]) || topicBoardsContent[idx] || "";
        const hasNotes = Boolean(boardNotes && boardNotes.trim().length > 0);
        
        // Extract mathematical formula snippets for preview
        const formulaMatches = boardNotes.match(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$]+\$|[a-zA-Z]\s*=\s*[^,\n;]+)/g) || [];
        const uniqueFormulas = Array.from(new Set(formulaMatches.map(f => f.replace(/\$/g, "").trim()))).slice(0, 3);

        return {
          index: idx,
          rawTitle: t,
          title: clean || `Part ${idx + 1}: Topic`,
          hasBoardNotes: hasNotes,
          boardSnippet: boardNotes.trim(),
          formulas: uniqueFormulas,
          isCurrent: idx === activeTopicIndex
        };
      });
    }

    // Dynamic pool for the chosen subject if different from classroom or if no classroom topics loaded
    const normalizedKey = Object.keys(SUBJECT_DEFAULT_TOPICS).find(
      k => k.toLowerCase() === selectedSubject.toLowerCase()
    ) || "General";
    const fallbackList = SUBJECT_DEFAULT_TOPICS[normalizedKey] || SUBJECT_DEFAULT_TOPICS.General || [];
    return fallbackList.map((t, idx) => ({
      index: idx,
      rawTitle: t,
      title: t,
      hasBoardNotes: false,
      boardSnippet: "",
      formulas: [],
      isCurrent: false
    }));
  }, [topics, activeTopicIndex, customBoardContent, topicBoardsContent, selectedSubject, subject]);

  // Multi-selected topic indices (Defaults to all available topics)
  const [selectedTopicIndices, setSelectedTopicIndices] = useState<number[]>(() => {
    return extractedTopics.map(t => t.index);
  });

  // Re-sync selection whenever selectedSubject or extractedTopics change
  useEffect(() => {
    setSelectedTopicIndices(extractedTopics.map(t => t.index));
  }, [selectedSubject, extractedTopics.length]);

  // Topic selection helper handlers
  const handleToggleTopic = (idx: number) => {
    if (selectedTopicIndices.includes(idx) && selectedTopicIndices.length === 1) {
      onToast("At least 1 topic must remain selected for Quiz generation! 🎯", "info");
      return;
    }
    setSelectedTopicIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllTopics = () => {
    setSelectedTopicIndices(extractedTopics.map(t => t.index));
    onToast("Selected all syllabus & blackboard topics! 📚", "info");
  };

  const handleSelectActiveTopicOnly = () => {
    const activeIdx = activeTopicIndex >= 0 && activeTopicIndex < extractedTopics.length ? activeTopicIndex : 0;
    setSelectedTopicIndices([activeIdx]);
    onToast(`Selected active topic: ${extractedTopics[activeIdx]?.title || "Current Topic"} 🎯`, "info");
  };

  const handleSelectDiscussedOnly = () => {
    const discussed = extractedTopics.filter(t => t.hasBoardNotes).map(t => t.index);
    if (discussed.length > 0) {
      setSelectedTopicIndices(discussed);
      onToast(`Selected ${discussed.length} topic(s) with live blackboard chalkboard notes! 📝`, "success");
    } else {
      onToast("No topics with handwritten chalkboard notes yet. Keeping current selection.", "info");
    }
  };

  // Calculate selected topic titles and formulas for context payload
  const selectedTopicTitles = useMemo(() => {
    return extractedTopics
      .filter(t => selectedTopicIndices.includes(t.index))
      .map(t => t.title);
  }, [extractedTopics, selectedTopicIndices]);

  const compiledDiscussedNotes = useMemo(() => {
    const notesMap: Record<string, string> = {};
    const formulasList: string[] = [];

    extractedTopics
      .filter(t => selectedTopicIndices.includes(t.index))
      .forEach(t => {
        if (t.boardSnippet) {
          notesMap[t.title] = t.boardSnippet;
        }
        t.formulas.forEach(f => formulasList.push(f));
      });

    return {
      notesMap,
      formulas: Array.from(new Set(formulasList)),
      totalDiscussedTopics: Object.keys(notesMap).length
    };
  }, [extractedTopics, selectedTopicIndices]);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizSource, setQuizSource] = useState<"present_topic" | "document" | "fallback" | "static">("static");
  const [docName, setDocName] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete detailed history of student answers
  const [answersHistory, setAnswersHistory] = useState<Array<{ 
    questionIndex: number; 
    selectedOption: number; // -1 if timed out/skipped
    isCorrect: boolean;
    conceptTested: string;
    theoryTested: string;
    calculationFormula: string;
    cognitiveCategory: string;
    difficulty: string;
  }>>([]);

  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<"idle" | "saved" | "failed">("idle");

  // Primary Hub Mode: "solo" (Practice Quiz + Leaderboard) vs "battle" (Multiplayer Battle Arena)
  const [quizHubMode, setQuizHubMode] = useState<"solo" | "battle">("solo");
  const [selectedLobbyRoom, setSelectedLobbyRoom] = useState<ScheduledBattleRoom | null>(null);

  // Battle Arena Session State (Live Match, Race Track & Standings)
  const [activeBattleRoom, setActiveBattleRoom] = useState<BattleRoomData | null>(null);
  const [battleParticipants, setBattleParticipants] = useState<BattleParticipant[]>([]);
  const [battleScore, setBattleScore] = useState<number>(0);
  const [speedBonusTotal, setSpeedBonusTotal] = useState<number>(0);
  const [scorePopup, setScorePopup] = useState<{
    points: number;
    speedBonus: number;
    streakBonus: number;
    streak: number;
  } | null>(null);

  // Real-time synchronization for active battle room participants
  useEffect(() => {
    if (!activeBattleRoom?.roomId) return;

    const myUid = auth.currentUser?.uid || "my_uid";
    const myName = auth.currentUser?.displayName || "You";

    // Initial peer setup
    const seedParticipants: BattleParticipant[] = [
      {
        uid: myUid,
        name: myName,
        isHost: activeBattleRoom.hostUid === myUid,
        isReady: true,
        score: 0,
        correctCount: 0,
        currentQuestionIndex: 0,
        avatar: "🧑"
      },
      {
        uid: "peer_ananya",
        name: "Ananya Sharma",
        isHost: false,
        isReady: true,
        score: 0,
        correctCount: 0,
        currentQuestionIndex: 0,
        avatar: "👧"
      },
      {
        uid: "peer_rohan",
        name: "Rohan Verma",
        isHost: false,
        isReady: true,
        score: 0,
        correctCount: 0,
        currentQuestionIndex: 0,
        avatar: "👦"
      },
      {
        uid: "peer_priya",
        name: "Priya Patel",
        isHost: false,
        isReady: true,
        score: 0,
        correctCount: 0,
        currentQuestionIndex: 0,
        avatar: "👩"
      }
    ];
    setBattleParticipants(seedParticipants);

    const unsub = subscribeToBattleParticipants(activeBattleRoom.roomId, (liveList) => {
      if (liveList && liveList.length > 0) {
        setBattleParticipants(liveList);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [activeBattleRoom?.roomId]);

  // Sync realistic friend race progress on question change
  useEffect(() => {
    if (!activeBattleRoom || isQuizCompleted || questions.length === 0) return;

    setBattleParticipants(prev => {
      const myUid = auth.currentUser?.uid || "my_uid";
      return prev.map(p => {
        if (p.uid === myUid || p.name === "You") {
          return {
            ...p,
            currentQuestionIndex: currentQuestionIndex,
            score: battleScore,
            correctCount: answersHistory.filter(h => h.isCorrect).length
          };
        }
        // Simulated progress for other participants
        const targetQ = Math.min(
          questions.length,
          Math.max(0, currentQuestionIndex + (Math.random() > 0.6 ? 1 : 0))
        );
        const simCorrect = Math.max(0, Math.round(targetQ * 0.8));
        const simSpeed = simCorrect * 35;
        const simScore = (simCorrect * 100) + simSpeed;
        return {
          ...p,
          currentQuestionIndex: targetQ,
          score: simScore,
          correctCount: simCorrect
        };
      });
    });
  }, [currentQuestionIndex, battleScore, isQuizCompleted, activeBattleRoom, questions.length]);

  // Tab navigation & Leaderboard refresh key
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard">("quiz");
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState<number>(0);

  // Calculate formatted total time for summary display
  const totalDurationFormatted = useMemo(() => {
    if (timePerQuestion === 0) {
      return "Untimed (No Time Pressure) 🧘";
    }
    const totalSecs = numQuestions * timePerQuestion;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    
    if (mins === 0) return `${secs} seconds`;
    if (secs === 0) return `${mins} minute${mins > 1 ? "s" : ""}`;
    return `${mins}m ${secs}s`;
  }, [numQuestions, timePerQuestion]);

  // Load the questions from the server or fallback
  const loadQuiz = async (chosenCount: number) => {
    setLoading(true);
    setAnswersHistory([]);
    setDbStatus("idle");
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: selectedSubject, 
          grade: grade || "Class 10",
          examLevel: examLevel,
          activeTopicIndex,
          topics,
          selectedTopics: selectedTopicTitles,
          selectedTopicIndices,
          discussedContent: {
            formulas: compiledDiscussedNotes.formulas,
            notesMap: compiledDiscussedNotes.notesMap,
            customBoardContent
          },
          customBoardContent,
          topicBoardsContent,
          count: chosenCount,
          timePerQuestion,
          difficulty: difficulty,
          sessionId: sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate custom quiz");
      }
      
      const data = await response.json();
      if (data && data.success && data.questions && data.questions.length > 0) {
        const enrichedQuestions = data.questions.map((q: any) => ({
          ...q,
          conceptTested: q.conceptTested || q.concept || "Chalkboard Concept",
          theoryTested: q.theoryTested || "Theoretical core understanding",
          calculationFormula: q.calculationFormula || "Conceptual application - no custom calculation steps needed",
          cognitiveCategory: q.cognitiveCategory || "Conceptual Application",
          difficulty: q.difficulty || difficulty || "Medium"
        }));

        setQuestions(enrichedQuestions);
        setQuizSource(data.source);
        setDocName(data.documentName || "");
        onToast(
          data.source === "present_topic"
            ? `Generated Live Quiz (${chosenCount} Qs) from selected chalkboard topics! ⚡📝`
            : data.source === "document"
            ? `Generated custom quiz from selected topics: ${selectedTopicTitles.slice(0, 2).join(", ")}! 📝🎓`
            : `Generated practice quiz for ${selectedSubject} (${grade || "Class 10"})! 📝`,
          "success"
        );
      } else {
        throw new Error("Invalid questions returned");
      }
    } catch (err) {
      console.warn("Dynamic quiz generation failed, falling back to offline pool:", err);
      const normalizedSubject = Object.keys(QUIZ_POOL).find(
        (key) => key.toLowerCase() === selectedSubject.toLowerCase()
      ) || "General";
      
      // Slice fallback questions based on selection count
      const fullFallback = QUIZ_POOL[normalizedSubject] || QUIZ_POOL.General;
      const fallbackQuestions = Array.from({ length: chosenCount }, (_, idx) => {
        const template = fullFallback[idx % fullFallback.length];
        return {
          ...template,
          id: `${template.id}_fallback_${idx}`
        };
      });

      setQuestions(fallbackQuestions);
      setQuizSource("static");
      onToast(`Loaded ${selectedSubject} practice questions! 📚`, "info");
    } finally {
      setLoading(false);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsQuizCompleted(false);
      // Initialize countdown timer (or 0 if untimed)
      setTimeLeft(timePerQuestion > 0 ? timePerQuestion : 0);
    }
  };

  // Start the quiz
  const handleStartQuiz = () => {
    setIsConfiguring(false);
    loadQuiz(numQuestions);
  };

  // Active Timer Interval
  useEffect(() => {
    if (isConfiguring || loading || isQuizCompleted || questions.length === 0 || timePerQuestion === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Set up ticking interval for timed modes
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConfiguring, loading, isQuizCompleted, questions, timePerQuestion]);

  // Handle timeout as a clean side effect when timeLeft reaches 0 (only in timed mode)
  useEffect(() => {
    if (
      !isConfiguring && 
      !loading && 
      !isQuizCompleted && 
      questions.length > 0 && 
      timePerQuestion > 0 && 
      timeLeft === 0
    ) {
      handleTimeOut();
    }
  }, [timeLeft, isConfiguring, loading, isQuizCompleted, questions, timePerQuestion]);

  // Process Question Answer (Computes Speed Bonus, Streak Multipliers & Firestore Sync)
  const processAnswerAndAdvance = (chosenIdx: number) => {
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = chosenIdx === currentQ.correctAnswer;

    let pointsEarned = 0;
    let speedBonus = 0;
    let streakBonus = 0;
    let nextStreak = streak;

    if (isCorrect) {
      nextStreak = streak + 1;
      setStreak(nextStreak);
      // Speed bonus: up to 50 pts based on remaining time
      speedBonus = timePerQuestion > 0 ? Math.max(0, Math.round((timeLeft / (timePerQuestion || 1)) * 50)) : 0;
      // Streak bonus: 2x streak = +10, 3x+ streak = +25
      streakBonus = nextStreak >= 3 ? 25 : nextStreak >= 2 ? 10 : 0;
      pointsEarned = 100 + speedBonus + streakBonus;

      setBattleScore(prev => prev + pointsEarned);
      setSpeedBonusTotal(prev => prev + speedBonus);

      setScorePopup({
        points: pointsEarned,
        speedBonus,
        streakBonus,
        streak: nextStreak
      });
      setTimeout(() => setScorePopup(null), 2500);
    } else {
      nextStreak = 0;
      setStreak(0);
      setScorePopup(null);
    }

    const updatedHistory = [
      ...answersHistory,
      {
        questionIndex: currentQuestionIndex,
        selectedOption: chosenIdx,
        isCorrect,
        conceptTested: currentQ.conceptTested || "Topic Mastery",
        theoryTested: currentQ.theoryTested || "Theoretical Core",
        calculationFormula: currentQ.calculationFormula || "None",
        cognitiveCategory: currentQ.cognitiveCategory || "Theoretical Core",
        difficulty: currentQ.difficulty || "Medium"
      }
    ];
    setAnswersHistory(updatedHistory);

    const nextIndex = currentQuestionIndex + 1;
    const isFinished = nextIndex >= questions.length;

    // Sync Firestore participant state if active battle
    if (activeBattleRoom) {
      const myUid = auth.currentUser?.uid || "my_uid";
      const totalPts = battleScore + pointsEarned;
      const correctCnt = updatedHistory.filter(h => h.isCorrect).length;
      const acc = Math.round((correctCnt / (updatedHistory.length || 1)) * 100);
      updateParticipantBattleProgress(activeBattleRoom.roomId, myUid, {
        score: totalPts,
        correctCount: correctCnt,
        currentQuestionIndex: isFinished ? questions.length : nextIndex,
        accuracy: acc,
        speedBonusTotal: speedBonusTotal + speedBonus
      });
    }

    if (!isFinished) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setTimeLeft(timePerQuestion);
    } else {
      setIsQuizCompleted(true);
      const finalScore = updatedHistory.filter(h => h.isCorrect).length;
      saveQuizAttempt(finalScore, updatedHistory);
    }
  };

  // Handle auto-advance when timer ticks to zero
  const handleTimeOut = () => {
    onToast("Samay Samapt! Auto-advancing to next question... ⏰", "info");
    const chosenIdx = selectedOption !== null ? selectedOption : -1;
    processAnswerAndAdvance(chosenIdx);
  };

  // Select an option (during live quiz, no correctness feedback or explanations are shown)
  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
  };

  // Student locks option and manually clicks "Next Question"
  const handleManualNext = () => {
    const chosenIdx = selectedOption !== null ? selectedOption : -1;
    processAnswerAndAdvance(chosenIdx);
  };

  // Group Blindspots Calculation (identifies questions where mistakes occurred or tricky concepts)
  const groupBlindspots = useMemo(() => {
    if (answersHistory.length === 0) return [];
    
    // Check questions that user missed or were generally tricky
    const missedQuestions = answersHistory.filter(h => !h.isCorrect);
    
    if (missedQuestions.length > 0) {
      return missedQuestions.map(m => {
        const qObj = questions[m.questionIndex] || questions[0];
        return {
          questionIndex: m.questionIndex,
          question: qObj.question,
          conceptTested: qObj.conceptTested || "Key Concept",
          calculationFormula: qObj.calculationFormula || "Core Rule",
          explanation: qObj.explanation,
          missRate: "75% of friends struggled here",
          correctAnswer: qObj.options[qObj.correctAnswer]
        };
      });
    }

    // If user got 100%, provide highest complexity questions as mastery reinforcement
    return questions.slice(0, 2).map((q, idx) => ({
      questionIndex: idx,
      question: q.question,
      conceptTested: q.conceptTested || "Advanced Concept",
      calculationFormula: q.calculationFormula || "Core Formula",
      explanation: q.explanation,
      missRate: "35% tricky challenge point",
      correctAnswer: q.options[q.correctAnswer]
    }));
  }, [answersHistory, questions]);

  // Ranked Battle Participants for Podium (1st, 2nd, 3rd)
  const rankedBattleParticipants = useMemo(() => {
    const myUid = auth.currentUser?.uid || "my_uid";
    const myName = auth.currentUser?.displayName || "You";
    const myCorrect = answersHistory.filter(h => h.isCorrect).length;
    const myAcc = questions.length > 0 ? Math.round((myCorrect / questions.length) * 100) : 0;

    let list = battleParticipants.map(p => {
      if (p.uid === myUid || p.name === "You") {
        return {
          ...p,
          score: battleScore,
          correctCount: myCorrect,
          accuracy: myAcc,
          avatar: "🧑",
          isUser: true
        };
      }
      return {
        ...p,
        accuracy: p.accuracy || Math.round(((p.correctCount || 0) / (questions.length || 1)) * 100),
        isUser: false
      };
    });

    // Ensure user is in the list
    if (!list.some(p => p.isUser)) {
      list.push({
        uid: myUid,
        name: myName,
        isHost: activeBattleRoom ? activeBattleRoom.hostUid === myUid : true,
        isReady: true,
        score: battleScore,
        correctCount: myCorrect,
        accuracy: myAcc,
        avatar: "🧑",
        isUser: true
      });
    }

    // Sort descending by score
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [battleParticipants, battleScore, answersHistory, questions.length, activeBattleRoom]);

  // Handler for One-Click Review Mistakes with Cherry Ma'am on Blackboard
  const handleReviewWithCherryMaam = () => {
    if (groupBlindspots.length === 0) {
      onToast("Great job! No group blindspots found to review.", "info");
      return;
    }

    const blindspotDetails = groupBlindspots.map((b, i) => 
      `Blindspot ${i + 1} (${b.conceptTested}): "${b.question}" -> Key Formula/Rule: ${b.calculationFormula}`
    ).join("\n");

    const promptText = `Cherry Ma'am, our study battle group just completed the quiz on "${docName || selectedSubject}"! We struggled with these specific group blindspots:\n\n${blindspotDetails}\n\nPlease explain these step-by-step on the blackboard with chalk notes and diagrams, derive the formulas, and show us how to avoid these common traps! 🧑‍🏫📝`;

    if (onInjectPrompt) {
      onInjectPrompt(promptText);
    }
    onToast("🧑‍🏫 Cherry Ma'am is writing the step-by-step group blindspot review on the blackboard!", "success");
  };

  // Save score analysis to Firestore with localStorage guest fallback
  const saveQuizAttempt = async (finalScore: number, finalHistory: typeof answersHistory) => {
    setIsSavingToDb(true);
    const uid = auth.currentUser?.uid;
    const isGuest = !uid || uid === "local_guest_student" || uid.startsWith("local_");

    const payload = {
      timestamp: new Date().toISOString(),
      score: finalScore,
      total: questions.length,
      accuracy: Math.round((finalScore / questions.length) * 100),
      source: quizSource,
      docName: docName || selectedTopicTitles.join(", ") || "Classroom Blackboard Topics",
      subject: selectedSubject,
      grade: grade || "Class 10",
      selectedTopics: selectedTopicTitles,
      history: finalHistory
    };

    if (isGuest) {
      try {
        const guestAttempts = JSON.parse(localStorage.getItem(`guest_quiz_attempts_${selectedSubject}`) || "[]");
        guestAttempts.push(payload);
        localStorage.setItem(`guest_quiz_attempts_${selectedSubject}`, JSON.stringify(guestAttempts));
        setDbStatus("saved");
        setLeaderboardRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error("Local storage saving failed:", err);
        setDbStatus("failed");
      } finally {
        setIsSavingToDb(false);
      }
    } else {
      try {
        const attemptId = `quiz_attempt_${Date.now()}`;
        const userDocRef = doc(db, "studentProfiles", uid, "quizAttempts", attemptId);
        await setDoc(userDocRef, {
          ...payload,
          attemptId,
          timestamp: serverTimestamp()
        });
        setDbStatus("saved");
        setLeaderboardRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error("Firestore quiz save failed:", err);
        setDbStatus("failed");
      } finally {
        setIsSavingToDb(false);
      }
    }
  };

  // Return to configuration page to configure/start another quiz
  const handleReturnToSetup = () => {
    setIsConfiguring(true);
    setQuestions([]);
    setIsQuizCompleted(false);
    setAnswersHistory([]);
    setSelectedOption(null);
    setCurrentQuestionIndex(0);
    setDbStatus("idle");
  };

  // Request Cherry Ma'am to voice-quiz about the active question
  const handleVoiceQuizRequest = () => {
    if (state === "disconnected") {
      onToast("Wake up Cherry Ma'am first to trigger a live voice quiz! 🎙️", "info");
      return;
    }
    const currentQ = questions[currentQuestionIndex]?.question || "a challenging concept";
    onInjectPrompt(
      `Ma'am, please ask me a live voice question about this topic: "${currentQ}". Wait for my reply and evaluate my answer on the chalkboard!`
    );
    onToast("Cherry Ma'am is setting up a custom voice quiz! Listen carefully... 🎙️📖", "success");
  };

  // Calculate final score for results display
  const finalCalculatedScore = useMemo(() => {
    return answersHistory.filter(h => h.isCorrect).length;
  }, [answersHistory, isQuizCompleted]);

  // --- MACRO & MICRO DATA CALCULATIONS FOR GRAPHING ---
  const microCategoryData = useMemo(() => {
    const categories = [
      "Conceptual Application",
      "Formula Retention",
      "Calculations & Solving",
      "Theoretical Core"
    ];

    return categories.map(cat => {
      const qInCat = questions.filter(q => q.cognitiveCategory === cat);
      const totalCount = qInCat.length;
      
      let correctCount = 0;
      qInCat.forEach(q => {
        const qIdx = questions.indexOf(q);
        const answeredState = answersHistory.find(h => h.questionIndex === qIdx);
        if (answeredState && answeredState.isCorrect) {
          correctCount++;
        }
      });

      return {
        category: cat,
        total: totalCount,
        correct: correctCount,
        percentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      };
    }).filter(d => d.total > 0);
  }, [questions, answersHistory, isQuizCompleted]);

  // Concept Strength lists
  const conceptualStrengths = useMemo(() => {
    return answersHistory
      .filter(h => h.isCorrect)
      .map(h => ({
        concept: h.conceptTested,
        category: h.cognitiveCategory
      }));
  }, [answersHistory]);

  const conceptualGrowthAreas = useMemo(() => {
    return answersHistory
      .filter(h => !h.isCorrect)
      .map(h => ({
        concept: h.conceptTested,
        category: h.cognitiveCategory,
        explanation: questions[h.questionIndex]?.explanation
      }));
  }, [answersHistory, questions]);


  // Top Mode Switcher & Tab Switcher
  const renderTabHeader = () => (
    <div className="space-y-2 mb-3">
      {/* 1. TOP PRIMARY MODE SWITCHER: Solo Practice vs Multiplayer Battle Room */}
      <div className="flex items-center justify-between bg-slate-200/90 p-1 rounded-2xl border border-slate-300/80 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setQuizHubMode("solo");
            onToast("Switched to Solo Practice Quiz mode! 🎯", "info");
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            quizHubMode === "solo"
              ? "bg-[#0a3641] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 font-bold"
          }`}
        >
          <UserCheck className={`w-3.5 h-3.5 ${quizHubMode === "solo" ? "text-[#c4f500]" : "text-slate-500"}`} />
          <span>👤 Solo Practice Quiz</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setQuizHubMode("battle");
            onToast("Welcome to Study Arena & Battle Room! ⚔️", "info");
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            quizHubMode === "battle"
              ? "bg-gradient-to-r from-[#0a3641] via-teal-900 to-slate-950 text-[#c4f500] shadow-xs border border-[#c4f500]/30 font-bold"
              : "text-slate-600 hover:text-slate-900 font-bold"
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-[#c4f500]" />
          <span>👥 Study Arena / Battle Room 🔥</span>
        </button>
      </div>

      {/* 2. SECONDARY SUBTABS (When in Solo Practice Mode) */}
      {quizHubMode === "solo" && (
        <div className="flex items-center justify-between bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "quiz"
                ? "bg-[#0a3641] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Practice Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-[#0a3641] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#c4f500]" />
            <span>Quiz Leaderboard & Rank</span>
          </button>
        </div>
      )}
    </div>
  );

  // 0A. Battle Arena Screen (Multiplayer Battle Room)
  if (quizHubMode === "battle") {
    return (
      <div className="space-y-2">
        {renderTabHeader()}
        <BattleArenaLanding
          currentSubject={selectedSubject || subject}
          currentGrade={grade}
          studentName={auth.currentUser?.displayName || "Scholar"}
          onToast={onToast}
          onEnterLobby={(room) => setSelectedLobbyRoom(room)}
        />
        {selectedLobbyRoom && (
          <BattleRoomLobbyModal
            isOpen={Boolean(selectedLobbyRoom)}
            room={selectedLobbyRoom}
            currentStudentName={auth.currentUser?.displayName || "You"}
            onClose={() => setSelectedLobbyRoom(null)}
            onStartQuiz={(room) => {
              setSelectedLobbyRoom(null);
              setActiveBattleRoom(room);
              setQuizHubMode("solo");
              setActiveTab("quiz");
              setSelectedSubject(room.subject || "Mathematics");
              setNumQuestions(room.numQuestions || 10);
              setTimePerQuestion(room.timePerQuestion || 30);
              setDocName(room.chapterOrFileName || room.title);
              setBattleScore(0);
              setSpeedBonusTotal(0);
              setStreak(0);
              setScorePopup(null);
              
              if (room.questions && room.questions.length > 0) {
                setQuestions(room.questions);
                setQuizSource("document");
                setCurrentQuestionIndex(0);
                setAnswersHistory([]);
                setSelectedOption(null);
                setTimeLeft(room.timePerQuestion || 30);
                setIsConfiguring(false);
                setIsQuizCompleted(false);
                setLoading(false);
              } else {
                setIsConfiguring(false);
                loadQuiz(room.numQuestions || 10);
              }
              onToast(`🚀 Battle Arena Live for "${room.title}"!`, "success");
            }}
            onToast={onToast}
          />
        )}
      </div>
    );
  }

  // 0B. Leaderboard Tab Screen (When in Solo Mode)
  if (activeTab === "leaderboard") {
    return (
      <div className="space-y-2">
        {renderTabHeader()}
        <QuizLeaderboard
          subject={subject}
          grade={grade}
          onStartQuiz={() => {
            setActiveTab("quiz");
            handleReturnToSetup();
          }}
          onToast={onToast}
          refreshTrigger={leaderboardRefreshKey}
        />
      </div>
    );
  }

  // 1. Loading UI Screen
  if (loading) {
    return (
      <div className="space-y-2">
        {renderTabHeader()}
        <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#c4f500]/15 rounded-full blur-lg animate-pulse" />
            <Brain className="w-10 h-10 text-[#0a3641] animate-bounce" />
          </div>
          <div className="space-y-1 max-w-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#0a3641]">
              Curating Quiz Context...
            </p>
            <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
              Cherry Ma'am is reading your live chalkboard notes, equations, and active topic timeline to compile dynamic concept-check questions.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[8.5px] font-mono bg-[#0a3641]/5 text-[#0a3641] px-3 py-1 rounded-full font-bold">
            <RefreshCw className="w-3 h-3 animate-spin text-[#0a3641]" />
            <span>Generating Dynamic Quiz...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pre-Quiz Configuration Screen
  if (isConfiguring) {
    return (
      <div className="space-y-4 py-2 animate-fade-in text-[#0a3641]">
        {renderTabHeader()}
        
        {/* Banner */}
        <div className="bg-[#0a3641]/5 p-3.5 rounded-2xl border border-[#0a3641]/10 flex gap-3 items-center">
          <Brain className="w-8 h-8 text-[#0a3641] fill-[#0a3641]/10 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider">
              Smart Quiz Desk • Topic & Classroom Sync
            </h4>
            <p className="text-[9.5px] text-slate-500 leading-relaxed font-medium">
              Choose your subject, previously discussed chalkboard topics, question count, and timer settings to generate a customized live quiz.
            </p>
          </div>
        </div>

        {/* 1. Subject Selection Bar */}
        <div className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0a3641]" />
              <span>Target Subject:</span>
            </span>
            <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-emerald-600" />
              <span>{grade || "Class 10"} • {selectedSubject}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Mathematics", "Physics", "Chemistry", "Biology", "Science", "General"].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`py-1.5 px-3 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedSubject.toLowerCase() === subj.toLowerCase()
                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* 2. PREVIOUSLY DISCUSSED TOPICS & BLACKBOARD CONTENT SELECTOR */}
        <div className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-xs space-y-3 text-left">
          
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#0a3641]" />
                <h5 className="text-[10px] font-black uppercase tracking-wider text-[#0a3641]">
                  Previously Discussed Topics
                </h5>
              </div>
              <p className="text-[8px] text-slate-500 font-medium">
                Choose the exact chalkboard topics/derivations to include in this quiz:
              </p>
            </div>

            {/* Quick Action Filters */}
            <div className="flex items-center gap-1 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllTopics}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Select All ({extractedTopics.length})
              </button>
              {extractedTopics.some(t => t.hasBoardNotes) && (
                <button
                  type="button"
                  onClick={handleSelectDiscussedOnly}
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[8px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-2.5 h-2.5" />
                  <span>Board Notes Only</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSelectActiveTopicOnly}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[8px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Active Only
              </button>
            </div>
          </div>

          {/* Interactive Topic Cards List */}
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
            {extractedTopics.map((topic) => {
              const isSelected = selectedTopicIndices.includes(topic.index);
              return (
                <div
                  key={topic.index}
                  onClick={() => handleToggleTopic(topic.index)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-1.5 ${
                    isSelected
                      ? "border-[#0a3641] bg-[#0a3641]/5 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0a3641] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-[9.5px] font-extrabold truncate ${isSelected ? "text-[#0a3641]" : "text-slate-700"}`}>
                        Part {topic.index + 1}: {topic.title}
                      </span>
                    </div>

                    {/* Topic Badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {topic.isCurrent && (
                        <span className="text-[7.5px] font-mono font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>Active on Board</span>
                        </span>
                      )}
                      {topic.hasBoardNotes ? (
                        <span className="text-[7.5px] font-mono font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Chalkboard Notes</span>
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                          Syllabus Topic
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formula Preview if present */}
                  {topic.formulas.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pl-6">
                      <span className="text-[7.5px] font-bold uppercase text-slate-400">Formulas:</span>
                      {topic.formulas.map((form, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[7.5px] font-mono bg-slate-900 text-[#c4f500] px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[180px]"
                        >
                          {form}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selection Scope Summary */}
          <div className="flex items-center justify-between text-[8.5px] font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-bold flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedTopicIndices.length} of {extractedTopics.length} Topic(s) Selected</span>
            </span>
            {compiledDiscussedNotes.formulas.length > 0 && (
              <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">
                {compiledDiscussedNotes.formulas.length} Chalkboard Formulas in Scope
              </span>
            )}
          </div>
        </div>

        {/* 3. Configuration Parameters */}
        <div className="space-y-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs text-left">
          
          {/* Question Count Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Number of Questions:</span>
              <span className="text-[#0a3641] font-black font-mono">{numQuestions} Questions</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumQuestions(num)}
                  className={`py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                    numQuestions === num
                      ? "border-[#0a3641] bg-[#0a3641] text-white font-extrabold"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600"
                  }`}
                >
                  {num} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Time Limit Per Question:</span>
              <span className="text-[#0a3641] font-black font-mono">
                {timePerQuestion === 0 ? "Untimed (Relaxed Mode)" : `${timePerQuestion}s / question`}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[15, 30, 45, 60, 0].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimePerQuestion(sec)}
                  className={`py-2 text-[9px] font-bold rounded-xl border transition-all cursor-pointer ${
                    timePerQuestion === sec
                      ? "border-[#0a3641] bg-[#0a3641] text-white font-extrabold"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600"
                  }`}
                >
                  {sec === 0 ? "Untimed 🧘" : `${sec}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Target & Standard Level Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Exam Standard & Target:</span>
              <span className={`font-black font-mono text-[9px] uppercase ${
                examLevel === "Competition" ? "text-amber-700" : "text-[#0a3641]"
              }`}>
                {examLevel === "Competition" ? "Competition (JEE/NEET/Olympiad) 🏆" : "School / Board Exam 🏫"}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExamLevel("Board")}
                className={`py-2 px-2.5 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  examLevel === "Board"
                    ? "border-[#0a3641] bg-[#0a3641] text-white font-extrabold shadow-2xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>School / Board Exam</span>
              </button>
              <button
                type="button"
                onClick={() => setExamLevel("Competition")}
                className={`py-2 px-2.5 text-[9.5px] font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  examLevel === "Competition"
                    ? "border-amber-600 bg-amber-600 text-white font-extrabold shadow-2xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>JEE / NEET / Olympiad</span>
              </button>
            </div>
          </div>

          {/* Difficulty Level Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Difficulty Level:</span>
              <span className={`font-black font-mono text-[9px] uppercase ${
                difficulty === "Easy" ? "text-emerald-600" : difficulty === "Hard" ? "text-rose-600" : "text-amber-600"
              }`}>{difficulty} Level</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Easy", "Medium", "Hard"] as const).map((level) => {
                const isSelected = difficulty === level;
                let activeStyle = "";
                if (isSelected) {
                  if (level === "Easy") activeStyle = "border-emerald-500 bg-emerald-500 text-white font-extrabold";
                  else if (level === "Hard") activeStyle = "border-rose-500 bg-rose-500 text-white font-extrabold";
                  else activeStyle = "border-amber-500 bg-amber-500 text-white font-extrabold";
                } else {
                  activeStyle = "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600";
                }
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${activeStyle}`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary stats */}
          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-mono text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Estimated Duration:</span>
            </div>
            <span className="font-extrabold text-[#0a3641] bg-slate-100 px-2 py-0.5 rounded-sm">
              {totalDurationFormatted}
            </span>
          </div>

        </div>

        {/* Guidelines / Anti-Cheat warning */}
        <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start gap-2 text-[8.5px] leading-relaxed text-slate-600 font-medium text-left">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-800 block uppercase tracking-wider text-[7.5px]">Important Classroom Guidelines:</span>
            <p>1. Questions are generated strictly matching your selected topics and chalkboard formulas.</p>
            <p>2. Going back or backtracking is disabled. Lock your choices carefully!</p>
            <p>3. {timePerQuestion === 0 ? "Untimed mode active: Take your time to solve each question carefully." : "If timer ticks to zero, the question automatically advances."}</p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartQuiz}
          disabled={selectedTopicIndices.length === 0}
          className={`w-full py-2.5 text-[10px] font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm ${
            selectedTopicIndices.length === 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-[#c4f500] hover:bg-[#b5e200] text-[#0a3641]"
          }`}
        >
          <PlayIcon className="w-4 h-4" />
          <span>START TARGETED CLASS QUIZ ({selectedTopicIndices.length} TOPIC{selectedTopicIndices.length > 1 ? "S" : ""}) ⚡</span>
        </button>

      </div>
    );
  }

  // Active Question item
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-3.5 animate-fade-in text-left py-1 text-[#0a3641]">
      {renderTabHeader()}
      
      {/* 3. ACTIVE QUIZ TAKE SCREEN */}
      <AnimatePresence mode="wait">
        {!isQuizCompleted && currentQuestion ? (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* TOP AVATAR RACETRACK PROGRESS BAR (Live Synchronized Multiplayer Race) */}
            <div className="bg-gradient-to-r from-[#0a3641] via-[#0d4554] to-slate-900 p-3 rounded-2xl border border-teal-800/40 shadow-sm space-y-2 text-white overflow-hidden relative">
              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-teal-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <Swords className="w-3.5 h-3.5 text-[#c4f500]" />
                  <span>{activeBattleRoom ? activeBattleRoom.title : "LIVE QUESTION RACE TRACK"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4f500] font-black text-[10px]">
                    {battleScore} PTS
                  </span>
                  {streak >= 2 && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse text-[8px]">
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {streak}x Streak
                    </span>
                  )}
                </div>
              </div>

              {/* Race Lane with Moving Avatars */}
              <div className="relative h-10 bg-slate-950/80 rounded-xl border border-teal-500/20 px-3 flex items-center overflow-visible">
                {/* Finish Line Flag */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] font-black text-amber-400 z-0">
                  <Flag className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>

                {/* Track Line */}
                <div className="w-full h-1 bg-teal-950/80 rounded-full" />

                {/* Moving Participant Avatars */}
                {rankedBattleParticipants.map((p, idx) => {
                  const rawProgress = ((p.currentQuestionIndex || 0) / (questions.length || 1)) * 88;
                  const progressPct = Math.min(88, Math.max(3, rawProgress));
                  const isMe = p.isUser || p.uid === (auth.currentUser?.uid || "my_uid");

                  return (
                    <motion.div
                      key={p.uid || idx}
                      initial={false}
                      animate={{ left: `${progressPct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10"
                    >
                      <div className={`relative flex items-center justify-center w-7 h-7 rounded-full text-xs shadow-md border-2 transition-transform hover:scale-125 ${
                        isMe 
                          ? "border-[#c4f500] bg-[#0a3641] ring-2 ring-[#c4f500]/60 scale-110" 
                          : "border-teal-300 bg-slate-800"
                      }`}>
                        <span>{p.avatar || (isMe ? "🧑" : "🎓")}</span>
                        {idx === 0 && (
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400 absolute -top-2.5 -right-1 animate-bounce" />
                        )}
                      </div>
                      
                      {/* Name & Points floating badge */}
                      <div className="bg-slate-950/90 text-teal-200 border border-teal-500/30 text-[7px] font-mono font-bold px-1.5 py-0.5 rounded absolute -bottom-4 whitespace-nowrap shadow-sm">
                        {isMe ? "You" : p.name.split(" ")[0]} • {p.score || 0}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* SPEED BONUS POPUP FEEDBACK */}
            <AnimatePresence>
              {scorePopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white px-3 py-1.5 rounded-xl shadow-md flex items-center justify-between text-[9.5px] font-mono font-black"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#c4f500] fill-[#c4f500] animate-bounce" />
                    <span>+{scorePopup.points} PTS! (100 Base {scorePopup.speedBonus > 0 ? `+ ⚡${scorePopup.speedBonus} Speed Bonus` : ""})</span>
                  </div>
                  {scorePopup.streakBonus > 0 && (
                    <span className="text-amber-300 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full text-[8.5px]">
                      <Flame className="w-3 h-3 fill-amber-300" />
                      +{scorePopup.streakBonus} Streak Bonus
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header info banner with active TIMER */}
            <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-xs flex items-center justify-between">
              
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[7.5px] font-mono font-black uppercase tracking-wider text-slate-400">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <h6 className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                  {currentQuestion.cognitiveCategory || "CONCEPT TEST"}
                </h6>
              </div>

              {/* Countdown Ticking Timer */}
              <div className="flex items-center gap-2 bg-[#0a3641]/5 px-3 py-1.5 rounded-xl border border-[#0a3641]/10">
                <Clock className={`w-3.5 h-3.5 text-[#0a3641] ${timePerQuestion > 0 && timeLeft <= 5 ? "animate-spin text-rose-500" : ""}`} />
                <span className={`text-[11px] font-black font-mono tracking-tight ${
                  timePerQuestion === 0 
                    ? "text-emerald-700" 
                    : timeLeft <= 5 
                    ? "text-rose-600 animate-pulse" 
                    : "text-[#0a3641]"
                }`}>
                  {timePerQuestion === 0 ? "Untimed 🧘" : `${timeLeft}s`}
                </span>
              </div>
            </div>

            {/* Timer visual progress bar (only rendered if timed) */}
            {timePerQuestion > 0 && (
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: `${Math.min(100, Math.max(0, (timeLeft / (timePerQuestion || 1)) * 100))}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  className={`h-full rounded-full ${timeLeft <= 5 ? "bg-rose-500" : "bg-[#0a3641]"}`}
                />
              </div>
            )}

            {/* Question Details */}
            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs space-y-2">
              <h5 className="text-[11px] font-extrabold text-slate-800 leading-snug">
                {currentQuestion.question}
              </h5>
              
              <div className="flex items-center gap-2">
                <span className="text-[7.5px] font-mono font-bold uppercase tracking-wide bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                  Concept: {currentQuestion.conceptTested}
                </span>
                <span className={`text-[7.5px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${
                  currentQuestion.difficulty === "Easy" 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : currentQuestion.difficulty === "Hard"
                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  Diff: {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            {/* Options List - Gray high contract highlight on selected, with NO immediate correctness check */}
            <div className="grid grid-cols-1 gap-1.5">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                
                let optionStyle = "border-slate-200 bg-white text-slate-650 hover:bg-slate-50";
                if (isSelected) {
                  // High contrast high-quality selected state, but neutral (no green/red checkmarks)
                  optionStyle = "border-[#0a3641] bg-[#0a3641]/5 text-[#0a3641] font-extrabold shadow-[0_0_8px_rgba(10,54,65,0.08)]";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`p-2.5 border text-[9.5px] rounded-xl text-left transition-all duration-200 cursor-pointer active:scale-98 flex items-center justify-between ${optionStyle}`}
                  >
                    <span className="leading-tight">{opt}</span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#0a3641] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Navigation (Only show 'Next Question' if an option has been selected) */}
            <div className="pt-2">
              <button
                onClick={handleManualNext}
                disabled={selectedOption === null}
                className={`w-full py-2 px-3 text-white text-[9.5px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  selectedOption !== null 
                    ? "bg-[#0a3641] hover:bg-[#0e4b5a]" 
                    : "bg-slate-300 cursor-not-allowed text-slate-500 opacity-60"
                }`}
              >
                <span>{currentQuestionIndex === questions.length - 1 ? "FINISH & GENERATE EXPLANATIONS" : "NEXT QUESTION"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Help / Voice hints */}
            <button
              onClick={handleVoiceQuizRequest}
              className="w-full py-1.5 bg-[#c4f500]/10 hover:bg-[#c4f500]/20 border border-[#c4f500]/30 text-[8.5px] font-black text-[#0a3641] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#0a3641]" />
              <span>Ask Cherry Ma'am to voice-quiz about this topic! 🎙️</span>
            </button>
          </motion.div>
        ) : (
          
          /* 4. COMPREHENSIVE PERFORMANCE RESULTS & REVIEW PANEL */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4 py-2"
          >
            {/* WINNER PODIUM CARDS (1st, 2nd, 3rd Podium for Battle Room / Group Match) */}
            <div className="bg-gradient-to-b from-[#0a3641] via-[#0d4452] to-slate-950 p-4 rounded-3xl border border-teal-800/40 shadow-lg text-center relative overflow-hidden space-y-4 text-white">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <Trophy className="w-24 h-24 text-[#c4f500]" />
              </div>

              {/* Title & Badge */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[8px] font-mono font-black uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
                  <span>{activeBattleRoom ? "Battle Arena Grand Finale" : "Quiz Champion Podium"}</span>
                </div>
                <h4 className="text-sm font-black tracking-tight text-white">
                  {activeBattleRoom ? activeBattleRoom.title : `${selectedSubject} Knowledge Sprint`}
                </h4>
                <p className="text-[9px] text-teal-200/80 font-mono">
                  Final Synchronized Match Results & Speed Standings
                </p>
              </div>

              {/* 3-Column Podium Display (1st Center, 2nd Left, 3rd Right) */}
              <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 pb-2 px-1">
                {/* 2nd Place (Silver) */}
                {rankedBattleParticipants.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 max-w-[95px] sm:max-w-[110px] flex flex-col items-center"
                  >
                    <div className="relative mb-1.5 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-lg shadow-md">
                        {rankedBattleParticipants[1].avatar || "👧"}
                      </div>
                      <span className="text-[8.5px] font-extrabold text-slate-200 mt-1 truncate max-w-[80px]">
                        {rankedBattleParticipants[1].isUser ? "You" : rankedBattleParticipants[1].name.split(" ")[0]}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">
                        {rankedBattleParticipants[1].score || 0} pts
                      </span>
                    </div>
                    {/* Silver Pedestal */}
                    <div className="w-full h-18 bg-gradient-to-b from-slate-400/40 via-slate-600/30 to-slate-800/80 rounded-t-xl border-t-2 border-x-2 border-slate-300/60 flex flex-col items-center justify-center p-1.5 shadow-inner">
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-[10px] flex items-center justify-center shadow">
                        🥈 2
                      </div>
                      <span className="text-[7px] font-mono font-bold text-slate-300 uppercase mt-0.5">
                        {rankedBattleParticipants[1].accuracy || 75}% ACC
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place (Gold Champion) */}
                {rankedBattleParticipants.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 max-w-[110px] sm:max-w-[130px] flex flex-col items-center -mt-4 z-10"
                  >
                    <div className="relative mb-2 flex flex-col items-center">
                      <Crown className="w-5 h-5 text-amber-300 fill-amber-300 absolute -top-4 animate-bounce" />
                      <div className="w-13 h-13 rounded-full bg-[#0a3641] border-3 border-amber-300 ring-4 ring-amber-400/40 flex items-center justify-center text-2xl shadow-xl">
                        {rankedBattleParticipants[0].avatar || "🧑"}
                      </div>
                      <span className="text-[9.5px] font-black text-amber-200 mt-1 truncate max-w-[95px] flex items-center gap-1">
                        {rankedBattleParticipants[0].isUser ? "You 👑" : rankedBattleParticipants[0].name.split(" ")[0]}
                      </span>
                      <span className="text-[9px] font-mono font-black text-[#c4f500]">
                        {rankedBattleParticipants[0].score || 0} pts
                      </span>
                    </div>
                    {/* Gold Pedestal */}
                    <div className="w-full h-26 bg-gradient-to-b from-amber-500/40 via-amber-600/30 to-amber-950/80 rounded-t-2xl border-t-3 border-x-2 border-amber-400/80 flex flex-col items-center justify-center p-2 shadow-2xl">
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-md">
                        🥇 1
                      </div>
                      <span className="text-[7.5px] font-mono font-black text-amber-200 uppercase mt-1">
                        CHAMPION
                      </span>
                      <span className="text-[7px] font-mono text-amber-300 font-bold">
                        {rankedBattleParticipants[0].accuracy || 90}% ACC
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place (Bronze) */}
                {rankedBattleParticipants.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 max-w-[95px] sm:max-w-[110px] flex flex-col items-center"
                  >
                    <div className="relative mb-1.5 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-lg shadow-md">
                        {rankedBattleParticipants[2].avatar || "👦"}
                      </div>
                      <span className="text-[8.5px] font-extrabold text-slate-200 mt-1 truncate max-w-[80px]">
                        {rankedBattleParticipants[2].isUser ? "You" : rankedBattleParticipants[2].name.split(" ")[0]}
                      </span>
                      <span className="text-[8px] font-mono text-amber-400/80">
                        {rankedBattleParticipants[2].score || 0} pts
                      </span>
                    </div>
                    {/* Bronze Pedestal */}
                    <div className="w-full h-14 bg-gradient-to-b from-amber-800/40 via-amber-900/30 to-slate-900/80 rounded-t-xl border-t-2 border-x-2 border-amber-700/60 flex flex-col items-center justify-center p-1.5 shadow-inner">
                      <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-[10px] flex items-center justify-center shadow">
                        🥉 3
                      </div>
                      <span className="text-[7px] font-mono font-bold text-amber-300 uppercase mt-0.5">
                        {rankedBattleParticipants[2].accuracy || 60}% ACC
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Complete Group Standings Table */}
              <div className="bg-slate-950/70 rounded-2xl border border-teal-500/20 p-2.5 space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[7.5px] font-mono uppercase text-teal-300 font-bold px-1 border-b border-teal-800/40 pb-1">
                  <span>Player & Rank</span>
                  <span>Accuracy • Score</span>
                </div>
                {rankedBattleParticipants.map((p, idx) => {
                  const isMe = p.isUser || p.uid === (auth.currentUser?.uid || "my_uid");
                  return (
                    <div
                      key={p.uid || idx}
                      className={`flex items-center justify-between p-1.5 rounded-xl text-[8.5px] font-bold ${
                        isMe 
                          ? "bg-teal-900/60 border border-[#c4f500]/50 text-white" 
                          : "text-slate-300 hover:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[7.5px] font-mono font-black text-teal-300">
                          #{idx + 1}
                        </span>
                        <span>{p.avatar || "🧑"}</span>
                        <span>{isMe ? "You (Scholar)" : p.name}</span>
                        {p.isHost && (
                          <span className="text-[6.5px] font-mono bg-teal-500/20 text-teal-300 px-1 py-0.2 rounded">HOST</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[8px]">
                        <span className="text-slate-400">{p.accuracy || 0}% Acc</span>
                        <span className="text-[#c4f500] font-black">{p.score || 0} PTS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GROUP BLINDSPOT SUMMARY (Questions Majority Struggled With) */}
            <div className="bg-white border-2 border-amber-200/80 p-4 rounded-3xl shadow-sm space-y-3 text-left relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-xl text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                      Group Blindspot Summary ⚠️
                    </h6>
                    <p className="text-[8px] text-slate-500 font-mono">
                      Concepts and questions that were missed or tricky for the group
                    </p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {groupBlindspots.length} Blindspot{groupBlindspots.length > 1 ? "s" : ""} Flagged
                </span>
              </div>

              {/* Blindspot Cards */}
              <div className="space-y-2.5">
                {groupBlindspots.map((spot, bIdx) => (
                  <div 
                    key={bIdx}
                    className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] font-mono font-black uppercase text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                          Blindspot #{bIdx + 1}: {spot.conceptTested}
                        </span>
                        <h6 className="text-[9.5px] font-extrabold text-slate-800 mt-1">
                          {spot.question}
                        </h6>
                      </div>
                      <span className="text-[7px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {spot.missRate}
                      </span>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-amber-100 text-[8px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 text-[#0a3641] font-bold">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Key Formula / Rule: <code className="bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-mono font-bold">{spot.calculationFormula}</code></span>
                      </div>
                      <p className="text-slate-500 italic text-[7.5px]">
                        💡 {spot.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ONE-CLICK REVIEW WITH CHERRY MA'AM ON BLACKBOARD */}
              <button
                type="button"
                onClick={handleReviewWithCherryMaam}
                className="w-full py-3 bg-gradient-to-r from-[#0a3641] via-[#0e4857] to-[#0a3641] hover:from-[#0c404e] hover:to-[#0c404e] text-white text-[10px] font-black rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 border border-teal-500/30"
              >
                <GraduationCap className="w-4 h-4 text-[#c4f500]" />
                <span>🧑‍🏫 REVIEW MISTAKES WITH CHERRY MA'AM ON BLACKBOARD 📝</span>
              </button>
            </div>

            {/* Visual Score Card Header */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden space-y-3">
              <div className="absolute top-0 right-0 p-3 text-slate-100 select-none pointer-events-none">
                <Award className="w-20 h-20 -mr-4 -mt-4 opacity-5" />
              </div>
              
              <div className="relative inline-flex items-center justify-center mb-1">
                <div className="absolute inset-0 bg-[#c4f500]/20 rounded-full blur-xl animate-pulse" />
                <div className="bg-[#0a3641] p-3 rounded-full border-2 border-white relative">
                  <Trophy className="w-6 h-6 text-[#c4f500]" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[8px] font-mono text-emerald-600 tracking-widest font-extrabold uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  Classroom Analytics Generated
                </span>
                <h5 className="text-xs font-black uppercase tracking-wider text-[#0a3641] mt-1">
                  Topic Quiz Analysis
                </h5>
                <p className="text-[20px] font-black text-[#0a3641] tracking-tight">
                  {finalCalculatedScore} / {questions.length} Correct
                </p>
                <span className="text-[9.5px] font-sans font-bold text-slate-500 max-w-xs block mx-auto leading-tight">
                  {finalCalculatedScore === questions.length
                    ? "✨ Perfection! Absolute master of currently discussed chalkboard topics."
                    : finalCalculatedScore >= questions.length * 0.75
                    ? "🌟 Outstanding grasp of formulas & calculations. Great thinking!"
                    : finalCalculatedScore >= questions.length / 2
                    ? "👍 Good concept retention! A quick chalkboard recap will seal perfection."
                    : "📖 Learning is a progress timeline! Revise concepts on the board."}
                </span>
              </div>

              {/* Circular Gauge */}
              <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-50">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      className="stroke-slate-100"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      className="stroke-[#0a3641]"
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray="163.3"
                      strokeDashoffset={163.3 - (163.3 * Math.round((finalCalculatedScore / questions.length) * 100)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[11px] font-black text-[#0a3641]">
                      {questions.length > 0 ? Math.round((finalCalculatedScore / questions.length) * 100) : 0}%
                    </span>
                    <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wide">Accuracy</span>
                  </div>
                </div>

                {/* score values */}
                <div className="text-left space-y-1.5 font-sans">
                  <div className="flex items-center gap-1.5 text-[8.5px] text-slate-600 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    <span>{finalCalculatedScore} Right Answers</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] text-slate-600 font-bold">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{questions.length - finalCalculatedScore} Wrong / Timed Out</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] text-slate-600 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#0a3641]" />
                    <span className="bg-slate-100 px-1 py-0.2 rounded-sm text-[7.5px] font-mono text-[#0a3641] uppercase">Classroom Test Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COGNITIVE CATEGORY BREAKDOWN GRAPH */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <BarChart2 className="w-4 h-4 text-[#0a3641]" />
                <h6 className="text-[9px] font-sans font-black uppercase tracking-wider text-[#0a3641]">
                  Micro Cognitive Mastery Analysis
                </h6>
              </div>

              <div className="space-y-3">
                {microCategoryData.map((data, index) => {
                  const barColorClass = 
                    data.percentage >= 80 
                      ? "bg-emerald-500" 
                      : data.percentage >= 50 
                      ? "bg-amber-400" 
                      : "bg-rose-400";
                  
                  // Maps internal cognitiveCategory strings to beautiful custom titles
                  const labelMap: Record<string, string> = {
                    "Conceptual Application": "🎯 Concept Clarity (Concept)",
                    "Theoretical Core": "📖 Theoretical Understanding (Theory)",
                    "Calculations & Solving": "🧮 Calculation Precision (Calculations)",
                    "Formula Retention": "⚡ Formula Retention & Recall (Formulas)"
                  };
                  const displayLabel = labelMap[data.category] || data.category;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-[8.5px] font-bold">
                        <span className="text-[#0a3641]">{displayLabel}</span>
                        <span className="text-slate-500 font-mono">
                          {data.correct}/{data.total} ({data.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-full ${barColorClass} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CLASSROOM SYLLABUS & BLACKBOARD COVERAGE REPORT */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs space-y-3 text-left">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Target className="w-4 h-4 text-[#0a3641]" />
                <h6 className="text-[9px] font-sans font-black uppercase tracking-wider text-[#0a3641]">
                  Blackboard Topic Coverage Report
                </h6>
              </div>
              <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                Cherry Ma'am verified the following core components of the selected topic(s) <strong className="text-slate-700">"{selectedTopicTitles.length > 0 ? selectedTopicTitles.join(", ") : (docName || "Active Whiteboard Topic")}"</strong>:
              </p>
              
              <div className="grid grid-cols-1 gap-2.5">
                {/* Concepts list */}
                <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">🎯</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-[#0a3641]">Core Concepts Tested</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(questions.map(q => q.conceptTested).filter(Boolean))).map((item, i) => (
                      <span key={i} className="text-[8px] font-bold font-mono text-slate-600 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Theories list */}
                <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">📖</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-[#0a3641]">Theories & Principles Checked</span>
                  </div>
                  <div className="space-y-1">
                    {Array.from(new Set(questions.map(q => q.theoryTested).filter(Boolean))).map((item, i) => (
                      <div key={i} className="text-[8px] font-medium text-slate-600 leading-tight flex items-start gap-1">
                        <span className="text-[#0a3641] font-black font-mono">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculations & Formulas list */}
                <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">🧮</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-[#0a3641]">Formulas & Calculations Solved</span>
                  </div>
                  <div className="space-y-1">
                    {Array.from(new Set(questions.map(q => q.calculationFormula).filter(f => f && !f.toLowerCase().includes("theoretical check") && !f.toLowerCase().includes("no calculation")))).map((item, i) => (
                      <div key={i} className="text-[8px] font-medium text-slate-600 leading-tight flex items-start gap-1">
                        <span className="text-[#0a3641] font-black font-mono">•</span>
                        <code className="bg-slate-50 border border-slate-100 rounded-sm px-1 text-[7.5px] font-mono text-emerald-700">{item}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STRENGTHS AND GROWTH AREAS LISTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="bg-white border border-emerald-100 p-3 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 border-b border-emerald-50 pb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Concepts Cleared (Strengths)</span>
                </div>
                {conceptualStrengths.length > 0 ? (
                  <ul className="space-y-1">
                    {conceptualStrengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[8.5px] font-medium text-slate-600 leading-tight">
                        <span className="text-emerald-500 text-[10px] mt-0.5">•</span>
                        <div>
                          <strong className="text-slate-700">{item.concept}</strong>
                          <span className="text-[7.5px] font-mono text-slate-400 block">({item.category})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[8px] text-slate-400 font-medium italic">No correct answers logged. Let's do a fast revision with Cherry Ma'am!</p>
                )}
              </div>

              <div className="bg-white border border-amber-150 p-3 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-800 border-b border-amber-50 pb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Syllabus Review Required</span>
                </div>
                {conceptualGrowthAreas.length > 0 ? (
                  <ul className="space-y-1.5">
                    {conceptualGrowthAreas.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[8.5px] font-medium text-slate-600 leading-tight">
                        <span className="text-amber-500 text-[10px] mt-0.5">•</span>
                        <div>
                          <strong className="text-slate-700">{item.concept}</strong>
                          <span className="text-[7.5px] font-mono text-slate-400 block">Category: {item.category}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-emerald-600 text-center space-y-1">
                    <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase">No growth areas! Full Marks Mastery!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Persistence Status Bar Indicator */}
            <div className="flex items-center justify-center gap-1.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === "saved" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-[7.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                {isSavingToDb 
                  ? "Writing Analysis to cloud db..." 
                  : dbStatus === "saved" 
                  ? (auth.currentUser ? "✓ Automatically Synced with Firestore Classroom Profile" : "✓ Saved to Local guest history successfully")
                  : dbStatus === "failed"
                  ? "⚠ Sync failed, saved to offline guest cache"
                  : "Syncing analysis stats..."}
              </span>
            </div>

            {/* DETAILED SOLUTIONS AND EXPLANATIONS REVIEW SECTION */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <BookOpen className="w-4 h-4 text-[#0a3641]" />
                <h6 className="text-[10px] font-sans font-black uppercase tracking-wider text-[#0a3641]">
                  Detailed Solutions & Review
                </h6>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                {questions.map((q, idx) => {
                  const record = answersHistory.find(h => h.questionIndex === idx);
                  const isCorrect = record ? record.isCorrect : false;
                  const selectedOpt = record ? record.selectedOption : -1;

                  return (
                    <div key={q.id || idx} className={`pt-3 first:pt-0 space-y-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono font-black text-slate-400 uppercase">
                            QUESTION {idx + 1}
                          </span>
                          <h5 className="text-[10px] font-extrabold text-slate-800 leading-snug">
                            {q.question}
                          </h5>
                        </div>
                        {selectedOpt === -1 ? (
                          <span className="text-[7.5px] font-bold uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-sm shrink-0 border border-amber-100">
                            Timed Out
                          </span>
                        ) : isCorrect ? (
                          <span className="text-[7.5px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm shrink-0 border border-emerald-100">
                            Correct
                          </span>
                        ) : (
                          <span className="text-[7.5px] font-bold uppercase bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm shrink-0 border border-rose-100">
                            Incorrect
                          </span>
                        )}
                      </div>

                      {/* Displaying options with feedback colors */}
                      <div className="grid grid-cols-1 gap-1 pl-1">
                        {q.options.map((opt, oIdx) => {
                          const wasSelected = selectedOpt === oIdx;
                          const isTheCorrectOpt = q.correctAnswer === oIdx;

                          let badgeClass = "border-slate-100 text-slate-500 bg-slate-50/40";
                          if (isTheCorrectOpt) {
                            badgeClass = "border-emerald-200 bg-emerald-50 text-emerald-900 font-extrabold";
                          } else if (wasSelected && !isCorrect) {
                            badgeClass = "border-rose-200 bg-rose-50 text-rose-900 font-bold";
                          }

                          return (
                            <div key={oIdx} className={`p-2 border rounded-xl text-[9px] flex items-center justify-between ${badgeClass}`}>
                              <span>{opt}</span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {isTheCorrectOpt && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                {wasSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                {wasSelected && (
                                  <span className="text-[6.5px] font-mono font-black uppercase px-1 rounded-sm bg-[#0a3641]/10 text-[#0a3641]">
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dimensions Tested metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                        <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2 rounded-xl text-[8px] leading-tight space-y-0.5">
                          <span className="font-bold text-[#0a3641] uppercase tracking-wide block text-[7px]">🎯 Concept</span>
                          <span className="text-slate-600 font-medium">{q.conceptTested}</span>
                        </div>
                        <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2 rounded-xl text-[8px] leading-tight space-y-0.5">
                          <span className="font-bold text-[#0a3641] uppercase tracking-wide block text-[7px]">📖 Theory</span>
                          <span className="text-slate-600 font-medium">{q.theoryTested}</span>
                        </div>
                        <div className="bg-[#0a3641]/2 border border-[#0a3641]/5 p-2 rounded-xl text-[8px] leading-tight space-y-0.5">
                          <span className="font-bold text-[#0a3641] uppercase tracking-wide block text-[7px]">🧮 Formula/Calc</span>
                          <code className="text-emerald-700 font-mono font-medium block overflow-x-auto whitespace-pre-wrap leading-none">{q.calculationFormula}</code>
                        </div>
                      </div>

                      {/* Cherry Ma'am's Solution explanation */}
                      <div className="bg-teal-50/30 border border-teal-500/10 p-2.5 rounded-xl text-[8.5px] leading-relaxed">
                        <span className="font-sans font-black uppercase text-teal-800 text-[7px] tracking-wider block mb-0.5">
                          Cherry Ma'am's Explanation:
                        </span>
                        <p className="text-slate-600 font-medium italic">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions to Reset and re-take */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab("leaderboard")}
                className="w-full py-2.5 bg-[#0a3641] hover:bg-[#0e4b5a] text-white text-[9.5px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Trophy className="w-3.5 h-3.5 text-[#c4f500]" />
                <span>VIEW YOUR LEADERBOARD RANK & STANDINGS 🏆</span>
              </button>

              <button
                type="button"
                onClick={handleReturnToSetup}
                className="w-full py-2.5 bg-[#c4f500] hover:bg-[#b5e200] text-[#0a3641] text-[9.5px] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Configure & Take New Practice Quiz ⚡</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface QuizLeaderboardProps {
  subject: string;
  grade: string;
  onStartQuiz: () => void;
  onToast: (text: string, type: "success" | "info" | "error") => void;
  refreshTrigger?: number;
}

export function QuizLeaderboard({
  subject,
  grade,
  onStartQuiz,
  onToast,
  refreshTrigger = 0
}: QuizLeaderboardProps) {
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Fetch performance data from Firestore (or local guest fallback)
  const fetchLeaderboard = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    const isGuest = !uid || uid === "local_guest_student" || uid.startsWith("local_");

    if (isGuest) {
      try {
        const guestSubject = JSON.parse(localStorage.getItem(`guest_quiz_attempts_${subject}`) || "[]");
        const guestGeneral = JSON.parse(localStorage.getItem(`guest_quiz_attempts_General`) || "[]");
        const guestMath = JSON.parse(localStorage.getItem(`guest_quiz_attempts_Mathematics`) || "[]");
        const guestSci = JSON.parse(localStorage.getItem(`guest_quiz_attempts_Science`) || "[]");
        
        const combinedMap = new Map();
        [...guestSubject, ...guestGeneral, ...guestMath, ...guestSci].forEach(item => {
          const key = (item.timestamp || "") + "_" + (item.score || "0");
          if (!combinedMap.has(key)) {
            combinedMap.set(key, item);
          }
        });

        const list = Array.from(combinedMap.values()).sort((a: any, b: any) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setPastAttempts(list);
      } catch (err) {
        console.error("Error fetching guest leaderboard:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const attemptsRef = collection(db, "studentProfiles", uid, "quizAttempts");
      const q = query(attemptsRef, orderBy("timestamp", "desc"), limit(30));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedDate = "Recently";
        if (data.timestamp?.toDate) {
          formattedDate = data.timestamp.toDate().toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        } else if (data.timestamp && typeof data.timestamp === "string") {
          formattedDate = new Date(data.timestamp).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }

        fetched.push({
          id: docSnap.id,
          ...data,
          formattedDate
        });
      });

      setPastAttempts(fetched);
    } catch (err) {
      console.warn("Firestore quiz leaderboard fetch error (using local guest data):", err);
      try {
        const guestSubject = JSON.parse(localStorage.getItem(`guest_quiz_attempts_${subject}`) || "[]");
        setPastAttempts(guestSubject);
      } catch (e) {
        console.error("Guest storage fallback error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [subject, refreshTrigger]);

  // Derived metrics
  const filteredAttempts = useMemo(() => {
    if (filterSubject === "all") return pastAttempts;
    return pastAttempts.filter((a) => (a.subject || "").toLowerCase() === filterSubject.toLowerCase());
  }, [pastAttempts, filterSubject]);

  const metrics = useMemo(() => {
    const totalQuizzes = pastAttempts.length;
    if (totalQuizzes === 0) {
      return {
        totalQuizzes: 0,
        avgAccuracy: 0,
        bestAccuracy: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        streak: 0,
        rankTier: "Class Candidate 🌟",
        rankPercentile: "Unranked",
        rankBadge: "🌟"
      };
    }

    const totalQuestions = pastAttempts.reduce((acc, a) => acc + (a.total || 0), 0);
    const totalCorrect = pastAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const avgAcc = Math.round((totalCorrect / (totalQuestions || 1)) * 100);
    const bestAcc = Math.max(...pastAttempts.map((a) => a.accuracy !== undefined ? a.accuracy : Math.round(((a.score || 0) / (a.total || 1)) * 100)));

    // Streak calculation (consecutive >= 60% accuracy)
    let streakCount = 0;
    for (const attempt of pastAttempts) {
      const acc = attempt.accuracy !== undefined ? attempt.accuracy : Math.round(((attempt.score || 0) / (attempt.total || 1)) * 100);
      if (acc >= 60) {
        streakCount++;
      } else {
        break;
      }
    }

    let tier = "Rising Star 🥉";
    let percentile = "Top 30%";
    let badge = "🥉";

    if (avgAcc >= 90 && totalQuizzes >= 3) {
      tier = "Grandmaster Scholar 🏆";
      percentile = "Top 1%";
      badge = "🏆";
    } else if (avgAcc >= 80 && totalQuizzes >= 2) {
      tier = "Diamond Achiever 💎";
      percentile = "Top 5%";
      badge = "💎";
    } else if (avgAcc >= 65) {
      tier = "Gold Explorer 🥇";
      percentile = "Top 15%";
      badge = "🥇";
    } else if (avgAcc >= 50) {
      tier = "Silver Challenger 🥈";
      percentile = "Top 25%";
      badge = "🥈";
    }

    return {
      totalQuizzes,
      avgAccuracy: avgAcc,
      bestAccuracy: bestAcc,
      totalQuestions,
      totalCorrect,
      streak: streakCount,
      rankTier: tier,
      rankPercentile: percentile,
      rankBadge: badge
    };
  }, [pastAttempts]);

  // Peer Classroom Benchmark Leaderboard
  const peerLeaderboard = useMemo(() => {
    const studentName = auth.currentUser?.displayName || "You (Student)";
    
    // Classroom benchmark entries
    const benchmarkPeers = [
      { id: "p1", name: "Aarav Sharma", scoreAcc: 96, quizzes: 18, grade: "Class 10", subject: "Mathematics", badge: "🏆 Grandmaster" },
      { id: "p2", name: "Ananya Patel", scoreAcc: 92, quizzes: 15, grade: "Class 10", subject: "Science", badge: "💎 Diamond" },
      { id: "p4", name: "Rohan Verma", scoreAcc: 78, quizzes: 12, grade: "Class 10", subject: "Physics", badge: "🥇 Gold" },
      { id: "p5", name: "Priya Nair", scoreAcc: 70, quizzes: 9, grade: "Class 10", subject: "General", badge: "🥈 Silver" }
    ];

    const currentStudentEntry = {
      id: "current_user",
      name: studentName,
      scoreAcc: metrics.avgAccuracy,
      quizzes: metrics.totalQuizzes,
      grade: grade,
      subject: subject,
      badge: metrics.rankTier,
      isCurrentUser: true
    };

    const combined = [...benchmarkPeers, currentStudentEntry].sort((a, b) => {
      if (b.scoreAcc !== a.scoreAcc) return b.scoreAcc - a.scoreAcc;
      return b.quizzes - a.quizzes;
    });

    return combined.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }, [metrics, grade, subject]);

  return (
    <div className="space-y-3.5 text-left animate-fade-in text-[#0a3641] py-1">
      
      {/* Banner */}
      <div className="bg-[#0a3641] text-white p-3.5 rounded-2xl shadow-sm relative overflow-hidden flex items-center justify-between gap-3">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <Trophy className="w-24 h-24 -mr-4 -mt-4 text-[#c4f500]" />
        </div>
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5px] font-mono font-black uppercase tracking-widest bg-[#c4f500] text-[#0a3641] px-2 py-0.5 rounded-full">
              Classroom Competitive Rank
            </span>
            {auth.currentUser ? (
              <span className="text-[7.5px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Synced
              </span>
            ) : (
              <span className="text-[7.5px] font-mono text-amber-300 font-bold">Guest Mode</span>
            )}
          </div>
          
          <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white">
            <span>Quiz Leaderboard & Stats</span>
          </h4>
          
          <p className="text-[9px] text-slate-200 font-medium leading-tight max-w-xs">
            Compare past practice quiz accuracy, test streaks, and syllabus concept mastery with classroom peers.
          </p>
        </div>

        <button
          onClick={() => {
            fetchLeaderboard();
            onToast("Leaderboard updated from Firestore! 🔄", "info");
          }}
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl transition-all cursor-pointer shrink-0 relative z-10 border border-white/20"
          title="Refresh Leaderboard Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#c4f500]" : ""}`} />
        </button>
      </div>

      {/* Student Rank Overview Card */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-[#0a3641] text-[#c4f500] p-1.5 rounded-xl font-black text-xs">
              {metrics.rankBadge}
            </div>
            <div>
              <span className="text-[7px] font-mono uppercase font-bold text-slate-400 block tracking-wider">Your Mastery Rank</span>
              <h5 className="text-[11px] font-black text-[#0a3641] uppercase tracking-wide">
                {metrics.rankTier}
              </h5>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[7px] font-mono uppercase font-bold text-slate-400 block tracking-wider">Percentile Tier</span>
            <span className="text-[9.5px] font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block">
              {metrics.rankPercentile}
            </span>
          </div>
        </div>

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">Accuracy</span>
              <Target className="w-3.5 h-3.5 text-[#0a3641]" />
            </div>
            <p className="text-xs font-black text-[#0a3641] font-mono">{metrics.avgAccuracy}%</p>
            <span className="text-[6.5px] text-slate-400 font-medium">Overall Score %</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">Quizzes</span>
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-xs font-black text-[#0a3641] font-mono">{metrics.totalQuizzes}</p>
            <span className="text-[6.5px] text-slate-400 font-medium">Total Taken</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">Best Score</span>
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-xs font-black text-[#0a3641] font-mono">{metrics.bestAccuracy}%</p>
            <span className="text-[6.5px] text-slate-400 font-medium">Peak Performance</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">Streak</span>
              <Flame className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-xs font-black text-[#0a3641] font-mono">{metrics.streak}🔥</p>
            <span className="text-[6.5px] text-slate-400 font-medium">Consecutive ≥60%</span>
          </div>
        </div>
      </div>

      {/* CLASSROOM PEER BENCHMARK LEADERBOARD TABLE */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            <h6 className="text-[9.5px] font-black uppercase tracking-wider text-[#0a3641]">
              Classroom Peer Standings
            </h6>
          </div>
          <span className="text-[7.5px] font-mono text-slate-400 font-bold">
            {grade} • {subject}
          </span>
        </div>

        <div className="space-y-1.5">
          {peerLeaderboard.map((peer) => {
            const isMe = peer.isCurrentUser;
            let rankBadgeClass = "bg-slate-100 text-slate-600";
            if (peer.rank === 1) rankBadgeClass = "bg-amber-400 text-amber-950 font-black";
            else if (peer.rank === 2) rankBadgeClass = "bg-slate-300 text-slate-900 font-black";
            else if (peer.rank === 3 && !isMe) rankBadgeClass = "bg-amber-600 text-white font-black";

            return (
              <div
                key={peer.id}
                className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                  isMe
                    ? "bg-[#0a3641]/5 border-[#0a3641] shadow-[0_0_12px_rgba(10,54,65,0.08)] font-extrabold"
                    : "bg-white border-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5.5 h-5.5 rounded-lg text-[8.5px] font-mono flex items-center justify-center shrink-0 ${rankBadgeClass}`}>
                    #{peer.rank}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[9.5px] font-bold text-[#0a3641]">
                        {peer.name}
                      </span>
                      {isMe && (
                        <span className="bg-[#0a3641] text-[#c4f500] text-[6.5px] font-mono font-black uppercase px-1.5 py-0.2 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] text-slate-400 block font-medium">
                      {peer.badge} • {peer.quizzes} Quizzes
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-black text-[#0a3641] block">
                    {peer.scoreAcc}%
                  </span>
                  <span className="text-[6.5px] text-slate-400 uppercase font-mono">Avg Accuracy</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAST ATTEMPTS HISTORY LOG FROM FIRESTORE */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0a3641]" />
            <h6 className="text-[9.5px] font-black uppercase tracking-wider text-[#0a3641]">
              Past Quiz History ({filteredAttempts.length})
            </h6>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1">
            {["all", subject, "General"].map((subKey) => (
              <button
                key={subKey}
                onClick={() => setFilterSubject(subKey)}
                className={`px-2 py-0.5 text-[7px] font-mono font-bold rounded-sm uppercase transition-all cursor-pointer ${
                  filterSubject.toLowerCase() === subKey.toLowerCase()
                    ? "bg-[#0a3641] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {subKey}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center space-y-2">
            <RefreshCw className="w-4 h-4 text-[#0a3641] animate-spin mx-auto" />
            <p className="text-[8.5px] font-mono text-slate-400 font-bold uppercase">Fetching Firestore Quiz Records...</p>
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="py-6 text-center space-y-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <Brain className="w-7 h-7 text-slate-300 mx-auto" />
            <div className="space-y-0.5">
              <p className="text-[9.5px] font-bold text-slate-600">No Past Quiz Attempts Logged Yet</p>
              <p className="text-[8px] text-slate-400">Take your first aligned classroom quiz to appear on the Firestore leaderboard!</p>
            </div>
            <button
              onClick={onStartQuiz}
              className="mt-1 px-3 py-1 bg-[#c4f500] hover:bg-[#b5e200] text-[#0a3641] text-[8.5px] font-black rounded-xl inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <span>Take Your First Quiz Now ⚡</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
            {filteredAttempts.map((attempt, idx) => {
              const attemptAcc = attempt.accuracy !== undefined 
                ? attempt.accuracy 
                : Math.round(((attempt.score || 0) / (attempt.total || 1)) * 100);
              const isExpanded = expandedAttemptId === (attempt.id || `${idx}`);

              return (
                <div
                  key={attempt.id || idx}
                  className="bg-slate-50/70 border border-slate-150 p-2.5 rounded-xl space-y-1.5 hover:bg-slate-100/60 transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-mono font-bold text-slate-400 uppercase">
                          {attempt.formattedDate || "Recently"}
                        </span>
                        <span className="text-[6.5px] font-mono font-extrabold uppercase bg-slate-200 text-slate-600 px-1 py-0.2 rounded-xs">
                          {attempt.subject || subject}
                        </span>
                      </div>
                      <h6 className="text-[9px] font-extrabold text-slate-800 leading-tight">
                        {attempt.docName || "Classroom Live Quiz"}
                      </h6>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full inline-block ${
                        attemptAcc >= 80 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : attemptAcc >= 60 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}>
                        {attempt.score}/{attempt.total} ({attemptAcc}%)
                      </span>
                    </div>
                  </div>

                  {attempt.history && attempt.history.length > 0 && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => setExpandedAttemptId(isExpanded ? null : (attempt.id || `${idx}`))}
                        className="text-[7px] font-mono font-bold text-slate-500 hover:text-[#0a3641] flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Concept Breakdown ▲" : "View Concept Breakdown ▼"}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 space-y-1 animate-fade-in">
                          <span className="text-[6.5px] font-mono uppercase font-bold text-slate-400 block">Tested Concepts:</span>
                          <div className="flex flex-wrap gap-1">
                            {attempt.history.map((h: any, hIdx: number) => (
                              <span
                                key={hIdx}
                                className={`text-[7px] font-mono px-1 py-0.2 rounded-xs border ${
                                  h.isCorrect 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" 
                                    : "bg-rose-50 border-rose-200 text-rose-800"
                                }`}
                              >
                                {h.conceptTested || `Q${hIdx + 1}`} {h.isCorrect ? "✓" : "✗"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action to start a new quiz */}
      <button
        onClick={onStartQuiz}
        className="w-full py-2.5 bg-[#c4f500] hover:bg-[#b5e200] text-[#0a3641] text-[9.5px] font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
      >
        <Zap className="w-3.5 h-3.5 fill-[#0a3641]" />
        <span>START NEW QUIZ TO IMPROVE RANK ⚡</span>
      </button>

    </div>
  );
}

// Simple internal play icon component
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      width="1em"
      height="1em"
    >
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
    </svg>
  );
}
