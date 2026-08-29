import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, BookOpen, Sparkles, Download, Copy, Check, ChevronLeft, ChevronRight, 
  Search, Printer, Share2, MessageSquare, Sun, Moon, Type, Layers, CheckCircle2,
  FileText, ArrowLeft, ArrowRight, Lightbulb, Bookmark, Star, Volume2, VolumeX,
  Play, Pause, RotateCcw, Maximize2, Minimize2, AlignLeft, Columns, Sigma,
  Headphones, SlidersHorizontal, BookMarked
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";

export interface InAppBookReaderModalProps {
  isOpen: boolean;
  book: any | null;
  onClose: () => void;
  onOpenRevisionDeck?: (book: any) => void;
  onDiscussWithCherry?: (topicDetails: {
    topic: string;
    question?: string;
    answer?: string;
    hint?: string;
    conceptTested?: string;
    subject?: string;
  }) => void;
}

interface ChapterItem {
  id: string;
  index: number;
  title: string;
  content: string;
  formulaCount: number;
  wordCount: number;
  estReadingMins: number;
  extractedFormulas: string[];
}

export const InAppBookReaderModal: React.FC<InAppBookReaderModalProps> = ({
  isOpen,
  book,
  onClose,
  onOpenRevisionDeck,
  onDiscussWithCherry,
}) => {
  // Theme & Appearance
  const [theme, setTheme] = useState<"chalkboard" | "paper" | "obsidian">("chalkboard");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [readingLayout, setReadingLayout] = useState<"focused" | "wide">("focused");
  const [activeTab, setActiveTab] = useState<"reader" | "formulas" | "takeaways">("reader");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Chapter Navigation & State
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedFormulaIdx, setCopiedFormulaIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [completedChapters, setCompletedChapters] = useState<Record<number, boolean>>({});
  const [bookmarkedChapters, setBookmarkedChapters] = useState<Record<number, boolean>>({});

  // Audio Speech Synthesis (Read Aloud)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bookId = book?.sessionId || book?.id || (book?.index !== undefined ? `book_${book.index}` : "current_book");

  // Load saved progress & bookmarks
  useEffect(() => {
    if (!isOpen || !book) return;

    try {
      const savedCompleted = localStorage.getItem(`book_progress_${bookId}`);
      if (savedCompleted) {
        setCompletedChapters(JSON.parse(savedCompleted));
      }
      const savedBookmarks = localStorage.getItem(`book_bookmarks_${bookId}`);
      if (savedBookmarks) {
        setBookmarkedChapters(JSON.parse(savedBookmarks));
      }
    } catch (_) {}

    setActiveChapterIndex(0);
    setSearchQuery("");
    setCopied(false);
    setActiveTab("reader");
    stopSpeech();
  }, [isOpen, bookId]);

  // Stop speech when modal closes
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setActiveChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setActiveChapterIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "t" || e.key === "T") {
        setTheme((prev) => (prev === "chalkboard" ? "paper" : prev === "paper" ? "obsidian" : "chalkboard"));
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Parse structured chapters from book
  const chapters: ChapterItem[] = useMemo(() => {
    if (!book) return [];

    const list: ChapterItem[] = [];
    const topics: string[] = Array.isArray(book.topics) ? book.topics : [];
    const topicBoards: Record<string | number, string> = book.topicBoardsContent || {};
    const fullMarkdown: string = book.documentMarkdown || book.activeDocumentMarkdown || book.customBoardContent || "";

    if (topics.length > 0) {
      topics.forEach((top, idx) => {
        const cleanTitle = top.replace(/^[\d\.\-\s]+/, "").trim() || `Topic ${idx + 1}`;
        
        let content = topicBoards[idx] || topicBoards[top] || topicBoards[cleanTitle] || "";
        
        if (!content && fullMarkdown) {
          const headerPattern = new RegExp(`#{1,4}\\s*.*${escapeRegex(cleanTitle)}[\\s\\S]*?(?=#{1,4}\\s|$)`, "i");
          const match = fullMarkdown.match(headerPattern);
          if (match) {
            content = match[0];
          }
        }

        if (!content && idx === 0 && fullMarkdown) {
          content = fullMarkdown;
        }

        if (!content) {
          content = `### 📋 ${cleanTitle}\n\n*Comprehensive derivations, concepts, and teacher chalkboard notes for this module are archived in the session log.*\n\n$$\\text{Subject: } \\mathbf{${book.inferredSubject || book.subject || "Academic Course"}} \\quad | \\quad \\text{Lesson } \\#${book.index || 1}$$`;
        }

        const formulaMatches = content.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || [];
        const words = content.replace(/[#*`_$\\]/g, " ").trim().split(/\s+/).filter(Boolean).length;
        const estMins = Math.max(1, Math.ceil(words / 140));

        list.push({
          id: `topic_${idx}`,
          index: idx,
          title: cleanTitle,
          content,
          formulaCount: formulaMatches.length,
          wordCount: words,
          estReadingMins: estMins,
          extractedFormulas: formulaMatches.map(f => f.replace(/^\${1,2}|\${1,2}$/g, "").trim()).filter(Boolean),
        });
      });
    } else if (fullMarkdown.trim()) {
      const sections = fullMarkdown.split(/(?=^##\s+)/m).filter(s => s.trim().length > 0);
      if (sections.length > 1) {
        sections.forEach((sec, idx) => {
          const firstLine = sec.trim().split("\n")[0] || `Section ${idx + 1}`;
          const cleanTitle = firstLine.replace(/^#+\s*/, "").replace(/[\*\_]/g, "").trim();
          const formulaMatches = sec.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || [];
          const words = sec.replace(/[#*`_$\\]/g, " ").trim().split(/\s+/).filter(Boolean).length;

          list.push({
            id: `sec_${idx}`,
            index: idx,
            title: cleanTitle || `Chapter Section ${idx + 1}`,
            content: sec,
            formulaCount: formulaMatches.length,
            wordCount: words,
            estReadingMins: Math.max(1, Math.ceil(words / 140)),
            extractedFormulas: formulaMatches.map(f => f.replace(/^\${1,2}|\${1,2}$/g, "").trim()).filter(Boolean),
          });
        });
      } else {
        const formulaMatches = fullMarkdown.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || [];
        const words = fullMarkdown.replace(/[#*`_$\\]/g, " ").trim().split(/\s+/).filter(Boolean).length;
        list.push({
          id: "main_content",
          index: 0,
          title: book.processedTitle || "Comprehensive Blackboard Derivations",
          content: fullMarkdown,
          formulaCount: formulaMatches.length,
          wordCount: words,
          estReadingMins: Math.max(1, Math.ceil(words / 140)),
          extractedFormulas: formulaMatches.map(f => f.replace(/^\${1,2}|\${1,2}$/g, "").trim()).filter(Boolean),
        });
      }
    } else {
      list.push({
        id: "empty_content",
        index: 0,
        title: "Session Overview",
        content: `### 📖 ${book.processedTitle || "Classroom Lecture"}\n\n*No blackboard derivations recorded for this session yet.*`,
        formulaCount: 0,
        wordCount: 15,
        estReadingMins: 1,
        extractedFormulas: [],
      });
    }

    return list;
  }, [book]);

  const currentChapter = chapters[activeChapterIndex] || chapters[0] || {
    id: "fallback",
    index: 0,
    title: "Chapter Notes",
    content: "",
    formulaCount: 0,
    wordCount: 0,
    estReadingMins: 1,
    extractedFormulas: [],
  };

  // Filter chapters for table of contents
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.content.toLowerCase().includes(q)
    );
  }, [chapters, searchQuery]);

  // All extracted formulas across the entire book
  const allBookFormulas = useMemo(() => {
    const list: { formula: string; chapterTitle: string; chapterIndex: number }[] = [];
    chapters.forEach(c => {
      c.extractedFormulas.forEach(f => {
        if (f.trim() && !list.some(existing => existing.formula === f.trim())) {
          list.push({
            formula: f.trim(),
            chapterTitle: c.title,
            chapterIndex: c.index,
          });
        }
      });
    });
    return list;
  }, [chapters]);

  if (!isOpen || !book) return null;

  const subject = book.inferredSubject || book.subject || "Mathematics";
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
  const totalFormulas = chapters.reduce((acc, c) => acc + c.formulaCount, 0);
  const totalEstMins = chapters.reduce((acc, c) => acc + c.estReadingMins, 0);
  const completedCount = Object.keys(completedChapters).filter(k => completedChapters[Number(k)]).length;
  const progressPercent = Math.round((completedCount / Math.max(1, chapters.length)) * 100);

  const handleCopyChapter = () => {
    if (!currentChapter) return;
    const formatted = `# ${book.processedTitle}\n## Chapter ${activeChapterIndex + 1}: ${currentChapter.title}\n\n${currentChapter.content}\n\n---\n*Archived via Cherry AI Classroom Handbook*`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyFormula = (formulaStr: string, idx: number) => {
    navigator.clipboard.writeText(formulaStr).then(() => {
      setCopiedFormulaIdx(idx);
      setTimeout(() => setCopiedFormulaIdx(null), 2000);
    });
  };

  const handleExportFullHandbookMarkdown = () => {
    let fullText = `# ${book.processedTitle}\n`;
    fullText += `*Subject: ${subject} | Lesson #${book.index || 1} | Date: ${book.formattedDateTime || "Live Session"}*\n\n`;
    fullText += `---\n\n`;

    chapters.forEach((c, idx) => {
      fullText += `## Chapter ${idx + 1}: ${c.title}\n\n`;
      fullText += `${c.content}\n\n`;
      fullText += `---\n\n`;
    });

    const blob = new Blob([fullText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(book.processedTitle || "Lecture_Book").replace(/[^a-zA-Z0-9_-]/g, "_")}_Handbook.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleChapterCompleted = (idx: number) => {
    setCompletedChapters(prev => {
      const updated = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`book_progress_${bookId}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const toggleChapterBookmark = (idx: number) => {
    setBookmarkedChapters(prev => {
      const updated = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`book_bookmarks_${bookId}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Text-To-Speech Audio Narration Engine
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Prepare speech text by cleaning LaTeX and markdown
    stopSpeech();

    const cleanText = cleanMarkdownForSpeech(
      `Chapter ${activeChapterIndex + 1}: ${currentChapter.title}. \n\n ${currentChapter.content}`
    );

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick an English female voice if available (fits Cherry Ma'am tone)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("karen")) && 
      v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleCycleSpeechRate = () => {
    const nextRate = speechRate === 1.0 ? 1.25 : speechRate === 1.25 ? 1.5 : 1.0;
    setSpeechRate(nextRate);
    if (isSpeaking) {
      stopSpeech();
      setTimeout(handleToggleSpeech, 100);
    }
  };

  // Dynamic Theme Styling Classes
  const themeClasses = {
    chalkboard: {
      modalBg: "bg-[#041411] text-emerald-50",
      headerBg: "bg-[#061f19] border-teal-900/60 text-teal-100",
      sidebarBg: "bg-[#031310] border-teal-900/50 text-teal-200",
      contentBg: "bg-gradient-to-br from-[#061e18] via-[#07241d] to-[#041712] text-teal-50",
      sidebarItemActive: "bg-teal-800/60 border-teal-400/60 text-[#c4f500] font-black shadow-inner",
      sidebarItemInactive: "hover:bg-teal-950/60 text-teal-300/80 hover:text-white border-transparent",
      accentBadge: "bg-teal-900/80 text-[#c4f500] border-teal-600/40",
      cardBorder: "border-teal-800/40",
      mathText: "text-white",
      highlightCallout: "bg-teal-950/80 border-teal-700/60 text-teal-200",
      formulaCard: "bg-[#061f19]/90 border-teal-800/50 text-teal-100",
      scrollbarColor: "scrollbar-thumb-teal-800",
      pageRuler: "border-teal-900/40",
      secondaryBtn: "bg-teal-900/40 hover:bg-teal-800/60 border-teal-700/40 text-teal-200",
      primaryBtn: "bg-[#0a3641] hover:bg-teal-800 text-white",
    },
    paper: {
      modalBg: "bg-[#f5f2eb] text-slate-900",
      headerBg: "bg-[#faf8f5] border-amber-200/80 text-[#0a3641]",
      sidebarBg: "bg-[#f3eee5] border-amber-200/70 text-slate-700",
      contentBg: "bg-[#fcfbf9] text-slate-900",
      sidebarItemActive: "bg-amber-100/90 border-teal-600 text-teal-950 font-black shadow-xs",
      sidebarItemInactive: "hover:bg-amber-50 text-slate-600 hover:text-slate-900 border-transparent",
      accentBadge: "bg-teal-100 text-teal-900 border-teal-300",
      cardBorder: "border-amber-200/80",
      mathText: "text-slate-950 font-semibold",
      highlightCallout: "bg-amber-50 border-amber-300/80 text-amber-950",
      formulaCard: "bg-white border-amber-200 text-slate-900 shadow-2xs",
      scrollbarColor: "scrollbar-thumb-amber-300",
      pageRuler: "border-amber-200/60",
      secondaryBtn: "bg-white hover:bg-amber-50 border-amber-200 text-slate-700",
      primaryBtn: "bg-[#0a3641] hover:bg-teal-900 text-white",
    },
    obsidian: {
      modalBg: "bg-[#070b12] text-slate-100",
      headerBg: "bg-[#0b101c] border-slate-800 text-slate-200",
      sidebarBg: "bg-[#060910] border-slate-800 text-slate-300",
      contentBg: "bg-gradient-to-b from-[#090e18] to-[#060910] text-slate-100",
      sidebarItemActive: "bg-indigo-950/70 border-cyan-400 text-cyan-300 font-black shadow-inner",
      sidebarItemInactive: "hover:bg-slate-900/80 text-slate-400 hover:text-white border-transparent",
      accentBadge: "bg-cyan-950/80 text-cyan-300 border-cyan-700/50",
      cardBorder: "border-slate-800",
      mathText: "text-white",
      highlightCallout: "bg-slate-900/80 border-slate-700 text-slate-200",
      formulaCard: "bg-slate-900/90 border-slate-800 text-slate-100",
      scrollbarColor: "scrollbar-thumb-slate-700",
      pageRuler: "border-slate-800",
      secondaryBtn: "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200",
      primaryBtn: "bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold",
    },
  }[theme];

  const fontClasses = {
    sm: "text-xs sm:text-sm leading-relaxed",
    base: "text-sm sm:text-base leading-relaxed",
    lg: "text-base sm:text-lg leading-relaxed",
    xl: "text-lg sm:text-xl leading-relaxed",
  }[fontSize];

  const fontFamilyClasses = {
    sans: "font-sans",
    serif: "font-serif tracking-normal leading-loose",
    mono: "font-mono tracking-tight text-[13.5px]",
  }[fontFamily];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-3 md:p-5 animate-fade-in select-none">
      <div 
        className={`w-full ${
          isFullscreen ? "max-w-none h-full rounded-none" : "max-w-7xl h-full sm:h-[95vh] rounded-none sm:rounded-3xl"
        } border ${themeClasses.cardBorder} ${themeClasses.modalBg} flex flex-col overflow-hidden shadow-2xl transition-all duration-200 relative`}
      >
        {/* Top Reading Navigation Bar */}
        <header className={`px-4 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2.5 shrink-0 ${themeClasses.headerBg}`}>
          {/* Left Title & Badge */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 rounded-xl border border-current/20 hover:bg-current/10 transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? "Collapse Chapter Sidebar" : "Expand Chapter Sidebar"}
            >
              <Layers className="w-4 h-4" />
            </button>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] sm:text-[9.5px] font-mono font-black uppercase px-2.5 py-0.5 rounded-lg border ${themeClasses.accentBadge}`}>
                  📖 {subject} • Lesson #{book.index || 1}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                  {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"} • ~{totalEstMins} min read
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/20 text-emerald-400 font-bold hidden md:inline">
                  {progressPercent}% Complete
                </span>
              </div>
              <h3 className="text-xs sm:text-sm md:text-base font-black truncate max-w-sm sm:max-w-md md:max-w-xl">
                {book.processedTitle}
              </h3>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Mode Tabs: Reader vs Formula Crib Sheet */}
            <div className="hidden lg:flex items-center border rounded-xl p-0.5 bg-black/20 border-current/20 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab("reader")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "reader" ? "bg-current/20 text-current shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("formulas")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "formulas" ? "bg-current/20 text-current shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                title="View All Extracted Formulas & Equations"
              >
                <Sigma className="w-3.5 h-3.5 text-amber-400" />
                <span>Formulas ({allBookFormulas.length})</span>
              </button>
            </div>

            {/* Audio Speech Synthesis (Listen Aloud) */}
            <div className="flex items-center gap-1 border rounded-xl p-0.5 bg-black/20 border-current/20 text-xs font-mono">
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSpeaking
                    ? "bg-amber-400 text-slate-950 animate-pulse font-black shadow-xs"
                    : "hover:bg-current/10 opacity-75 hover:opacity-100"
                }`}
                title={isSpeaking ? (isPaused ? "Resume Audio" : "Pause Audio") : "Listen to Chapter Aloud"}
              >
                {isSpeaking ? (
                  isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />
                ) : (
                  <Headphones className="w-3.5 h-3.5 text-teal-300" />
                )}
                <span className="hidden xl:inline">
                  {isSpeaking ? (isPaused ? "Paused" : "Listening...") : "Read Aloud"}
                </span>
              </button>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={handleCycleSpeechRate}
                  className="px-1.5 py-1 rounded text-[10px] font-mono font-black bg-black/30 hover:bg-black/50 text-amber-300"
                  title="Cycle Audio Playback Speed"
                >
                  {speechRate}x
                </button>
              )}

              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="p-1 rounded text-[10px] hover:bg-rose-500/20 text-rose-400"
                  title="Stop Audio Narration"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Theme Selector Toggle */}
            <div className="flex items-center border rounded-xl p-0.5 bg-black/20 border-current/20 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTheme("chalkboard")}
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  theme === "chalkboard" ? "bg-teal-700 text-white shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                title="Chalkboard Green Slate Theme"
              >
                <span>🟢</span>
                <span className="hidden md:inline">Chalk</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("paper")}
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  theme === "paper" ? "bg-amber-200 text-amber-950 shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                title="Parchment Notebook Theme"
              >
                <span>📜</span>
                <span className="hidden md:inline">Paper</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("obsidian")}
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  theme === "obsidian" ? "bg-slate-800 text-cyan-300 shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                title="Obsidian Dark Modern Theme"
              >
                <span>🌑</span>
                <span className="hidden md:inline">Dark</span>
              </button>
            </div>

            {/* Font Typography Options (Sans/Serif/Mono & Size) */}
            <div className="hidden sm:flex items-center border rounded-xl p-0.5 bg-black/20 border-current/20 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFontFamily((prev) => (prev === "sans" ? "serif" : prev === "serif" ? "mono" : "sans"))}
                className="px-2 py-1 rounded-lg text-[10px] font-bold opacity-70 hover:opacity-100 uppercase"
                title="Switch Font Family: Sans / Serif / Monospace"
              >
                {fontFamily}
              </button>
              <button
                type="button"
                onClick={() => setFontSize((prev) => (prev === "sm" ? "base" : prev === "base" ? "lg" : prev === "lg" ? "xl" : "sm"))}
                className="px-2 py-1 rounded-lg text-[10px] font-bold opacity-70 hover:opacity-100"
                title="Cycle Font Scaling (A- to A++)"
              >
                {fontSize === "sm" ? "A-" : fontSize === "base" ? "A" : fontSize === "lg" ? "A+" : "A++"}
              </button>
            </div>

            {/* Layout Mode (Focused vs Wide) */}
            <button
              type="button"
              onClick={() => setReadingLayout((prev) => (prev === "focused" ? "wide" : "focused"))}
              className="p-2 rounded-xl border border-current/20 hover:bg-current/10 transition-all cursor-pointer hidden md:flex items-center"
              title={readingLayout === "focused" ? "Switch to Wide Mode" : "Switch to Focused Reading Column"}
            >
              {readingLayout === "focused" ? <Columns className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl border border-current/20 hover:bg-current/10 transition-all cursor-pointer hidden sm:flex items-center"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Copy Chapter */}
            <button
              type="button"
              onClick={handleCopyChapter}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-current/20 hover:bg-current/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy active chapter notes to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{copied ? "Copied" : "Copy Notes"}</span>
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={handleExportFullHandbookMarkdown}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-current/20 hover:bg-current/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer hidden sm:flex"
              title="Download Full Markdown Handbook (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Export .md</span>
            </button>

            {/* AI Revision Deck Launcher */}
            {onOpenRevisionDeck && (
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onClose();
                  onOpenRevisionDeck(book);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Launch AI Flashcards & Mind Map for this book"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span className="hidden sm:inline">AI Revision</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              className="p-2 rounded-xl border border-current/20 hover:bg-rose-500/20 hover:border-rose-500 text-current transition-colors cursor-pointer"
              title="Close Reader (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Body: Collapsible Chapter Sidebar + Reader Document Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chapter Table of Contents Sidebar */}
          {isSidebarOpen && (
            <aside 
              className={`w-72 sm:w-80 border-r flex flex-col shrink-0 overflow-hidden ${themeClasses.sidebarBg} transition-all duration-300`}
            >
              {/* Sidebar Search / Filter Bar */}
              <div className="p-3 border-b border-current/15 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics & formulas..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/20 border border-current/20 focus:outline-none focus:border-current text-current placeholder:opacity-40"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Progress Summary Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono opacity-75 px-1">
                  <span>Progress: {completedCount}/{chapters.length} Chapters</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden border border-current/10">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Chapter Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 select-none scrollbar-thin">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <span>{filteredChapters.length} Items</span>
                </div>

                {filteredChapters.map((chap) => {
                  const isActive = chap.index === activeChapterIndex;
                  const isDone = !!completedChapters[chap.index];
                  const isStarred = !!bookmarkedChapters[chap.index];

                  return (
                    <div
                      key={chap.id}
                      onClick={() => {
                        setActiveChapterIndex(chap.index);
                        setActiveTab("reader");
                        if (isSpeaking) {
                          stopSpeech();
                        }
                      }}
                      className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 text-left ${
                        isActive ? themeClasses.sidebarItemActive : themeClasses.sidebarItemInactive
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterCompleted(chap.index);
                        }}
                        className="mt-0.5 shrink-0 transition-transform active:scale-90"
                        title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isDone ? "text-emerald-400 fill-emerald-400/20" : "opacity-30 hover:opacity-80"}`} />
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[9.5px] font-mono">
                          <span className="font-bold opacity-75">Chapter #{chap.index + 1}</span>
                          <div className="flex items-center gap-1.5">
                            {chap.formulaCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-black/20 text-[8.5px] font-mono">
                                ∑ {chap.formulaCount} math
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChapterBookmark(chap.index);
                              }}
                              className="text-amber-400 opacity-60 hover:opacity-100 transition-opacity"
                              title={isStarred ? "Remove Bookmark" : "Bookmark Chapter"}
                            >
                              <Star className={`w-3 h-3 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold leading-snug line-clamp-2">
                          {chap.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[9px] font-mono opacity-60">
                          <span>~{chap.estReadingMins} min</span>
                          <span>•</span>
                          <span>{chap.wordCount} words</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer Stats */}
              <div className="p-3 border-t border-current/15 text-[10px] font-mono opacity-70 flex items-center justify-between">
                <span>Total Formulas: <strong>{totalFormulas}</strong></span>
                <span>Completed: <strong>{completedCount}/{chapters.length}</strong></span>
              </div>
            </aside>
          )}

          {/* Main Reading Stage */}
          <main className={`flex-1 flex flex-col overflow-hidden ${themeClasses.contentBg}`}>
            {/* View Tab Switch: Reader View vs Formula Crib Sheet */}
            {activeTab === "formulas" ? (
              /* Consolidated Formula Crib Sheet View */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`px-6 sm:px-10 py-4 border-b ${themeClasses.pageRuler} flex items-center justify-between gap-3 shrink-0`}>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono opacity-75">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">∑ FORMULA VAULT</span>
                      <span>•</span>
                      <span>{allBookFormulas.length} Master Derivations</span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black tracking-tight leading-snug mt-1">
                      Consolidated Mathematical & Scientific Formulas
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reader")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${themeClasses.secondaryBtn}`}
                  >
                    ← Back to Notes
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-4 scrollbar-thin">
                  {allBookFormulas.length === 0 ? (
                    <div className="text-center py-16 opacity-60 font-mono text-xs space-y-2">
                      <p>No LaTeX formula blocks detected in this book yet.</p>
                      <p className="text-[11px] opacity-75">Formulas written with $ or $$ will automatically compile here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
                      {allBookFormulas.map((item, fIdx) => (
                        <div
                          key={fIdx}
                          className={`p-4 rounded-2xl border ${themeClasses.formulaCard} space-y-3 flex flex-col justify-between`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono opacity-75">
                            <span className="font-bold">From: {item.chapterTitle}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChapterIndex(item.chapterIndex);
                                setActiveTab("reader");
                              }}
                              className="text-teal-400 hover:underline text-[9.5px]"
                            >
                              Jump to Ch #{item.chapterIndex + 1} →
                            </button>
                          </div>

                          <div className="py-2 overflow-x-auto text-center">
                            <MathRenderer content={`$$${item.formula}$$`} />
                          </div>

                          <div className="pt-2 border-t border-current/10 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyFormula(item.formula, fIdx)}
                              className="text-[10px] font-mono font-bold flex items-center gap-1.5 opacity-70 hover:opacity-100 cursor-pointer"
                              title="Copy raw LaTeX equation code"
                            >
                              {copiedFormulaIdx === fIdx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied LaTeX!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy LaTeX</span>
                                </>
                              )}
                            </button>

                            {onDiscussWithCherry && (
                              <button
                                type="button"
                                onClick={() => {
                                  stopSpeech();
                                  onClose();
                                  onDiscussWithCherry({
                                    topic: item.chapterTitle,
                                    conceptTested: item.chapterTitle,
                                    question: `Can you explain the derivation and physical meaning of the formula: $$${item.formula}$$?`,
                                    subject: subject,
                                  });
                                }}
                                className="text-[10px] font-mono font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Ask Cherry</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Active Chapter Reader Viewport */
              <>
                {/* Active Chapter Header Banner */}
                <div className={`px-6 sm:px-10 py-3.5 border-b ${themeClasses.pageRuler} flex items-center justify-between gap-3 shrink-0`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-mono opacity-75 flex-wrap">
                      <span className="font-bold text-amber-400">Chapter {activeChapterIndex + 1} of {chapters.length}</span>
                      <span>•</span>
                      <span>~{currentChapter.estReadingMins} min read</span>
                      {currentChapter.formulaCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-400">∑ {currentChapter.formulaCount} Derivations</span>
                        </>
                      )}
                      {bookmarkedChapters[activeChapterIndex] && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                          ⭐ Bookmarked
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                      {currentChapter.title}
                    </h2>
                  </div>

                  {/* Actions: Bookmark & Checkmark Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleChapterBookmark(activeChapterIndex)}
                      className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        bookmarkedChapters[activeChapterIndex]
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/50"
                          : "border-current/20 hover:bg-current/10 opacity-75 hover:opacity-100"
                      }`}
                      title={bookmarkedChapters[activeChapterIndex] ? "Bookmarked Chapter" : "Bookmark Chapter"}
                    >
                      <Star className={`w-3.5 h-3.5 ${bookmarkedChapters[activeChapterIndex] ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleChapterCompleted(activeChapterIndex)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        completedChapters[activeChapterIndex]
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                          : "border-current/20 hover:bg-current/10 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {completedChapters[activeChapterIndex] ? "Reviewed ✓" : "Mark Reviewed"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Reading Document Viewport */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-16 py-8 space-y-6 scrollbar-thin select-text">
                  <div className={`${readingLayout === "focused" ? "max-w-4xl" : "max-w-6xl"} mx-auto space-y-6 ${fontFamilyClasses} ${fontClasses}`}>
                    
                    {/* Chapter Audio Speaking Live Banner */}
                    {isSpeaking && (
                      <div className="p-3.5 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3 bg-amber-400 animate-bounce rounded-full" />
                            <span className="w-1 h-5 bg-amber-400 animate-bounce delay-75 rounded-full" />
                            <span className="w-1 h-2.5 bg-amber-400 animate-bounce delay-150 rounded-full" />
                          </div>
                          <span>Cherry AI is narrating Chapter {activeChapterIndex + 1} ({speechRate}x speed)...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleToggleSpeech}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px] cursor-pointer"
                          >
                            {isPaused ? "Resume" : "Pause"}
                          </button>
                          <button
                            type="button"
                            onClick={stopSpeech}
                            className="px-2 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-[10.5px] cursor-pointer"
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MathRenderer with LaTeX derivations */}
                    <div className={`prose max-w-none ${theme === "paper" ? "prose-slate" : "prose-invert"} leading-relaxed`}>
                      <MathRenderer content={currentChapter.content} />
                    </div>

                    {/* Socratic Discussion Prompt with Cherry */}
                    {onDiscussWithCherry && (
                      <div className={`mt-8 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${themeClasses.highlightCallout}`}>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-black uppercase text-amber-400">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span>Have a doubt about this derivation?</span>
                          </div>
                          <p className="text-xs opacity-80 leading-relaxed">
                            Take this chapter's formulas directly into live voice & chalkboard discussion with Cherry Ma'am.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            stopSpeech();
                            onClose();
                            onDiscussWithCherry({
                              topic: currentChapter.title,
                              conceptTested: currentChapter.title,
                              question: `Can you explain the key concepts and derivations from ${currentChapter.title}?`,
                              subject: subject,
                            });
                          }}
                          className={`px-4 py-2 ${themeClasses.primaryBtn} rounded-xl text-xs font-bold font-mono tracking-wide uppercase transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-300" />
                          <span>Discuss with Cherry</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Reading Footer Navigation */}
                <footer className={`px-4 sm:px-8 py-3 border-t ${themeClasses.pageRuler} flex items-center justify-between gap-3 shrink-0 ${themeClasses.headerBg}`}>
                  {/* Previous Chapter Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stopSpeech();
                      setActiveChapterIndex(prev => Math.max(0, prev - 1));
                    }}
                    disabled={activeChapterIndex === 0}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeChapterIndex === 0
                        ? "opacity-30 cursor-not-allowed border border-current/10"
                        : "border border-current/25 hover:bg-current/10 active:scale-95"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous Chapter</span>
                  </button>

                  {/* Middle Page Progress Indicator */}
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-center">
                      Chapter {activeChapterIndex + 1} of {chapters.length}
                    </span>
                    <div className="w-32 sm:w-48 h-1.5 bg-black/20 rounded-full overflow-hidden border border-current/15">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.round(((activeChapterIndex + 1) / chapters.length) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Chapter Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stopSpeech();
                      setActiveChapterIndex(prev => Math.min(chapters.length - 1, prev + 1));
                    }}
                    disabled={activeChapterIndex === chapters.length - 1}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeChapterIndex === chapters.length - 1
                        ? "opacity-30 cursor-not-allowed border border-current/10"
                        : `${themeClasses.primaryBtn} active:scale-95 shadow-xs`
                    }`}
                  >
                    <span className="hidden sm:inline">Next Chapter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return text
    // Replace LaTeX fraction
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    // Replace LaTeX sqrt
    .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
    // Replace LaTeX symbols
    .replace(/\\alpha/g, "alpha")
    .replace(/\\beta/g, "beta")
    .replace(/\\theta/g, "theta")
    .replace(/\\pi/g, "pi")
    .replace(/\\Delta/g, "delta")
    .replace(/\\sum/g, "sum")
    .replace(/\\int/g, "integral")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    // Remove markdown symbols
    .replace(/[\$\#\*\`\_\~]/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\\quad/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
