import React, { useState, useEffect, useRef } from "react";
import { MathRenderer } from "./MathRenderer";
import { motion } from "motion/react";
import { sanitizeRawBoardData } from "../utils/boardFilter";

interface ChalkTypewriterProps {
  text: string;
  state?: string;       // e.g. "speaking", "listening", "idle", etc.
  cherryVolume?: number; // 0.0 to 1.0 (real-time voice volume)
  latestSpeech?: string;
  isAcademicNotes?: boolean;
  isFallback?: boolean;
  isPaused?: boolean;
  teachingPhase?: string; // e.g. "intro", "concept", "example", "doubt", "transition", "graduation"
}

/**
 * Bilingual Hinglish/Hindi to English keyword mapping for voice-to-chalkboard synchronization.
 */
const HINGLISH_SYNONYMS: Record<string, string[]> = {
  motion: ["gati", "chal", "move", "movement", "travel", "motion"],
  force: ["bal", "push", "pull", "force", "lagaya"],
  inertia: ["jadtwa", "inertia", "ruka", "rest", "direction"],
  velocity: ["veg", "speed", "velocity", "chal"],
  acceleration: ["twaran", "acceleration", "accelerate", "badhna"],
  mass: ["dravyaman", "mass", "vajan", "weight", "bhari"],
  formula: ["sutra", "formula", "equation", "samikaran", "relation"],
  question: ["prashna", "sawaal", "sawal", "question", "poll", "prediction", "pucho"],
  option: ["vikalp", "option", "choice", "a", "b", "c", "d"],
  energy: ["urja", "energy", "work", "karya", "joule"],
  current: ["vidyut", "dhara", "current", "ampere", "flow"],
  voltage: ["vibhvanter", "voltage", "potential", "volt"],
  resistance: ["pratirodh", "resistance", "ohm", "rok"],
  example: ["udaharan", "numerical", "example", "step", "calculation"],
  decode: ["decode", "analogy", "samjho", "matlab", "rasoi", "daily life"],
  pitfall: ["galti", "mistake", "pitfall", "trap", "dhyan", "savdhan", "alert"],
};

/**
 * Adaptive Latency Buffer & Audio Stream Alignment Helper
 * Computes the character index in currentTarget that matches the last completed word or phrase
 * processed in the audio stream (latestSpeech) within a safe forward search window near currentIndex.
 */
function findSpeechAlignmentIndex(currentTarget: string, currentIndex: number, latestSpeech?: string): number | null {
  if (!latestSpeech || !latestSpeech.trim() || !currentTarget || !currentTarget.trim()) {
    return null;
  }

  // Clean and normalize speech text
  const cleanSpeech = latestSpeech
    .replace(/[#*`_~$\-\[\]():,?!]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const speechWords = cleanSpeech.split(" ").filter((w) => w.length > 2);
  if (speechWords.length === 0) return null;

  const cleanTarget = currentTarget.toLowerCase();
  const searchStart = Math.max(0, currentIndex - 40);
  const maxSearchRange = currentIndex + 140; // Safe forward window

  // 1. Try matching a phrase of the last 2 to 4 words from speech
  for (let windowSize = Math.min(4, speechWords.length); windowSize >= 2; windowSize--) {
    const phrase = speechWords.slice(-windowSize).join(" ");
    if (phrase.length < 5) continue;
    const matchIdx = cleanTarget.indexOf(phrase, searchStart);
    if (matchIdx !== -1 && matchIdx <= maxSearchRange) {
      return matchIdx + phrase.length;
    }
  }

  // 2. Check individual key vocabulary or synonyms
  for (let i = speechWords.length - 1; i >= Math.max(0, speechWords.length - 3); i--) {
    const word = speechWords[i];
    if (word.length >= 4) {
      const matchIdx = cleanTarget.indexOf(word, searchStart);
      if (matchIdx !== -1 && matchIdx <= maxSearchRange) {
        return matchIdx + word.length;
      }

      // Check bilingual synonym matches
      for (const [engTerm, synList] of Object.entries(HINGLISH_SYNONYMS)) {
        if (synList.includes(word)) {
          const engMatchIdx = cleanTarget.indexOf(engTerm, searchStart);
          if (engMatchIdx !== -1 && engMatchIdx <= maxSearchRange) {
            return engMatchIdx + engTerm.length;
          }
        }
      }
    }
  }

  return null;
}

interface SectionBoundary {
  index: number;
  headerText: string;
  requiredPhaseRank: number; // 1: intro, 2: concept, 3: example, 4: doubt, 5: all
  keywords: string[];
}

function getPhaseRank(phase?: string): number {
  if (!phase) return 5;
  const p = phase.toLowerCase();
  if (p === "intro") return 1;
  if (p === "concept") return 2;
  if (p === "example") return 3;
  if (p === "doubt") return 4;
  if (p === "transition" || p === "graduation" || p === "completed" || p === "idle") return 5;
  return 5;
}

function getSectionRequiredPhaseRank(headerText: string): number {
  const lower = headerText.toLowerCase();
  if (lower.includes("poll") || lower.includes("prediction") || lower.includes("❓") || lower.includes("sawaal") || lower.includes("question") || lower.includes("option")) {
    return 1; // Unlocks in intro
  }
  if (lower.includes("decode") || lower.includes("💡") || lower.includes("analogy") || lower.includes("formula") || lower.includes("📐") || lower.includes("equation") || lower.includes("definition") || lower.includes("source") || lower.includes("📖")) {
    return 2; // Unlocks in concept
  }
  if (lower.includes("worked example") || lower.includes("deep dive") || lower.includes("🔬") || lower.includes("numerical") || lower.includes("calculation") || lower.includes("step 1")) {
    return 3; // Unlocks in example
  }
  if (lower.includes("pitfall") || lower.includes("trap") || lower.includes("⚠️") || lower.includes("mistake") || lower.includes("mnemonic") || lower.includes("jugad") || lower.includes("jugaad") || lower.includes("🧠") || lower.includes("topper") || lower.includes("🎯")) {
    return 4; // Unlocks in doubt / transition
  }
  return 1;
}

function getSectionHeaderKeywords(headerText: string): string[] {
  const lower = headerText.toLowerCase();

  if (lower.includes("poll") || lower.includes("prediction") || lower.includes("❓") || lower.includes("question") || lower.includes("sawaal") || lower.includes("option")) {
    return ["poll", "prediction", "sawaal", "sawal", "prashna", "question", "option", "chuno", "kya lagta", "socho", "a)", "b)", "dhoondho", "jawab", "batao", "inertia", "option a", "option b", "what do you think", "brake", "bus", "aage", "kyu", "kaise", "suno", "pucho"];
  }
  if (lower.includes("source") || lower.includes("📖") || lower.includes("definition") || lower.includes("content")) {
    return ["source", "content", "definition", "paribhasha", "equation", "formula", "text", "padhte", "dekho", "shuru", "arth"];
  }
  if (lower.includes("decode") || lower.includes("💡") || lower.includes("cherry") || lower.includes("analogy")) {
    return ["decode", "simple decode", "cherry's decode", "analogy", "asani", "samjho", "moti baat", "meaning", "daily life", "rasoi", "kitchen", "socho"];
  }
  if (lower.includes("pitfall") || lower.includes("trap") || lower.includes("⚠️") || lower.includes("mistake")) {
    return ["pitfall", "trap", "exam pitfall", "mistake", "examiner", "galti", "dhyan", "warning", "savdhan", "alert", "number katenge"];
  }
  if (lower.includes("formula") || lower.includes("📐") || lower.includes("equation")) {
    return ["formula", "core formula", "sutra", "equation", "katex", "si unit", "samikaran", "f = ma", "v = u", "equals"];
  }
  if (lower.includes("mnemonic") || lower.includes("jugad") || lower.includes("jugaad") || lower.includes("🧠")) {
    return ["mnemonic", "jugad", "jugaad", "memory trick", "trick yaad", "short cut"];
  }
  if (lower.includes("worked example") || lower.includes("deep dive") || lower.includes("🔬")) {
    return ["worked example", "numerical", "deep dive", "calculation", "step 1", "soln", "solve", "karke dekhte"];
  }
  if (lower.includes("topper") || lower.includes("keyword") || lower.includes("🎯")) {
    return ["topper", "exam keyword", "marking scheme", "full marks", "board tip"];
  }
  if (lower.includes("diagram") || lower.includes("figure") || lower.includes("vector")) {
    return ["diagram", "chitra", "figure", "visual", "look at the board", "drawing"];
  }

  return headerText
    .replace(/[#*`_~$\-\[\]():]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function parseSectionBoundaries(text: string): SectionBoundary[] {
  if (!text) return [];
  const boundaries: SectionBoundary[] = [];
  const regex = /(?:^|\n)(#{1,3}\s+[^\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const headerLine = match[1].trim();
    const matchIndex = match.index + (fullMatch.startsWith("\n") ? 1 : 0);

    boundaries.push({
      index: matchIndex,
      headerText: headerLine,
      requiredPhaseRank: getSectionRequiredPhaseRank(headerLine),
      keywords: getSectionHeaderKeywords(headerLine),
    });
  }

  return boundaries;
}

const ChalkTypewriterComponent: React.FC<ChalkTypewriterProps> = ({
  text,
  state = "disconnected",
  cherryVolume = 0,
  latestSpeech,
  isAcademicNotes = false,
  isFallback = false,
  isPaused = false,
  teachingPhase = "intro",
}) => {
  const sanitizedInputText = sanitizeRawBoardData(text || "");

  // We animate character-by-character for live active text. Fallback/academic mode shows text directly.
  const shouldStartEmpty = !isFallback && !isAcademicNotes && sanitizedInputText && sanitizedInputText.length > 0;
  const [displayedText, setDisplayedText] = useState(shouldStartEmpty ? "" : sanitizedInputText);
  const indexRef = useRef(shouldStartEmpty ? 0 : sanitizedInputText.length);
  const textRef = useRef(sanitizedInputText);
  const isTypingActiveRef = useRef(false);
  const timerIdRef = useRef<any>(null);

  // Sync state reference to avoid stale closures in timeouts
  const stateRef = useRef(state);
  const volumeRef = useRef(cherryVolume);
  const isAcademicNotesRef = useRef(isAcademicNotes);
  const wasFallbackRef = useRef(isFallback);
  const latestSpeechRef = useRef(latestSpeech);
  const isPausedRef = useRef(isPaused);
  const teachingPhaseRef = useRef(teachingPhase);

  useEffect(() => {
    teachingPhaseRef.current = teachingPhase;
  }, [teachingPhase]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused && indexRef.current < (textRef.current || "").length && !isTypingActiveRef.current) {
      startTypingLoop(20);
    }
  }, [isPaused]);

  // Section-Gating refs for phase-wise blackboard unrolling
  const unlockedSectionIndexRef = useRef(0);
  const boundaryWaitStartTimeRef = useRef(Date.now());
  const sectionBoundariesRef = useRef<SectionBoundary[]>([]);

  useEffect(() => {
    latestSpeechRef.current = latestSpeech;
  }, [latestSpeech]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    volumeRef.current = cherryVolume;
  }, [cherryVolume]);

  useEffect(() => {
    isAcademicNotesRef.current = isAcademicNotes;
  }, [isAcademicNotes]);

  // Synchronize when incoming text changes with smart noise filtering
  useEffect(() => {
    const wasFallback = wasFallbackRef.current;
    wasFallbackRef.current = isFallback;
    const cleanCurrentText = sanitizeRawBoardData(text || "");

    // Is it fallback mode or historical academic notes? Ensure instant rendering!
    if (isFallback || isAcademicNotes) {
      textRef.current = cleanCurrentText;
      indexRef.current = cleanCurrentText.length;
      setDisplayedText(cleanCurrentText);
      isTypingActiveRef.current = false;
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      return;
    }

    // Did we just exit fallback mode?
    if (wasFallback && !isFallback) {
      textRef.current = cleanCurrentText;
      indexRef.current = cleanCurrentText.length;
      setDisplayedText(cleanCurrentText);
      isTypingActiveRef.current = false;
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      return;
    }

    const prevText = textRef.current;
    const prevClean = prevText ? prevText.replace(/[\\/\s\n]+$/g, "").trim() : "";
    const textClean = cleanCurrentText ? cleanCurrentText.replace(/[\\/\s\n]+$/g, "").trim() : "";

    const isWiped = !textClean;
    const isMuchShorter = prevClean && textClean && textClean.length < prevClean.length - 15;
    const isPrefixChanged = prevClean && textClean && !textClean.toLowerCase().startsWith(prevClean.toLowerCase().substring(0, Math.min(10, prevClean.length)));

    const needsReset = isWiped || isMuchShorter || isPrefixChanged;
    if (!needsReset) {
      // Update target text we are typing towards
      textRef.current = cleanCurrentText;
      sectionBoundariesRef.current = parseSectionBoundaries(cleanCurrentText);

      if (indexRef.current > cleanCurrentText.length) {
        indexRef.current = cleanCurrentText.length;
        setDisplayedText(cleanCurrentText);
      }

      if (!isTypingActiveRef.current && indexRef.current < cleanCurrentText.length) {
        startTypingLoop(20);
      }
    } else {
      // Complete reset for brand new content (e.g., topic switches or manual board clearance)
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      setDisplayedText("");
      indexRef.current = 0;
      textRef.current = cleanCurrentText;
      sectionBoundariesRef.current = parseSectionBoundaries(cleanCurrentText);
      unlockedSectionIndexRef.current = 0;
      boundaryWaitStartTimeRef.current = Date.now();
      if (cleanCurrentText) {
        startTypingLoop(50);
      } else {
        isTypingActiveRef.current = false;
      }
    }
  }, [text, isAcademicNotes, isFallback]);

  // Initial trigger if component mounted with text to type
  useEffect(() => {
    const cleanInitText = sanitizeRawBoardData(text || "");
    if (cleanInitText && indexRef.current < cleanInitText.length && !isTypingActiveRef.current && !isFallback && !isAcademicNotes) {
      startTypingLoop(50);
    }
  }, []);

  const startTypingLoop = (initialDelay = 30) => {
    isTypingActiveRef.current = true;
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
    }

    const runTypewriter = () => {
      if (isPausedRef.current) {
        isTypingActiveRef.current = false;
        return;
      }

      const currentTarget = textRef.current;
      const currentIndex = indexRef.current;

      if (!currentTarget) {
        setDisplayedText("");
        indexRef.current = 0;
        isTypingActiveRef.current = false;
        return;
      }

      // 0. Section-Gated Real-Time Audio Unroll Engine
      const boundaries = sectionBoundariesRef.current;
      const speech = (latestSpeechRef.current || "").toLowerCase();
      const currentPhase = teachingPhaseRef.current || "intro";
      const currentPhaseRank = getPhaseRank(currentPhase);
      const isCherrySpeaking = stateRef.current === "speaking" || volumeRef.current > 0.005 || speech.length > 0;

      // If academic notes or fully transitioned, unlock all sections
      if (isAcademicNotesRef.current || currentPhaseRank >= 5) {
        unlockedSectionIndexRef.current = boundaries.length;
      } else {
        // Unlock sections matching current phase rank or spoken keywords
        for (let i = 0; i < boundaries.length; i++) {
          const b = boundaries[i];
          if (b.requiredPhaseRank <= currentPhaseRank) {
            unlockedSectionIndexRef.current = Math.max(unlockedSectionIndexRef.current, i + 1);
          } else if (speech && b.keywords.some((kw) => speech.includes(kw))) {
            unlockedSectionIndexRef.current = Math.max(unlockedSectionIndexRef.current, i + 1);
            boundaryWaitStartTimeRef.current = Date.now();
          }
        }
      }

      // Check section gate at boundary
      if (boundaries.length > 0 && currentIndex < currentTarget.length && !isAcademicNotesRef.current) {
        for (let i = 0; i < boundaries.length; i++) {
          if (i >= unlockedSectionIndexRef.current && currentIndex >= boundaries[i].index) {
            // Check if spoken words unlocked this section in the meantime
            const b = boundaries[i];
            const keywordMatched = speech && b.keywords.some((kw) => speech.includes(kw));
            if (keywordMatched || b.requiredPhaseRank <= currentPhaseRank) {
              unlockedSectionIndexRef.current = Math.max(unlockedSectionIndexRef.current, i + 1);
              boundaryWaitStartTimeRef.current = Date.now();
            } else {
              // Pause typewriter cleanly at the section boundary start without breaking KaTeX
              indexRef.current = boundaries[i].index;
              setDisplayedText(currentTarget.slice(0, boundaries[i].index));
              timerIdRef.current = setTimeout(runTypewriter, 80);
              return;
            }
          }
        }
      }

      // 1. SVG Tag Atomic Protection (Layer 1 Instant Vector Graphics)
      const prefix = currentTarget.slice(0, currentIndex);
      const lastOpenSvg = prefix.toLowerCase().lastIndexOf("<svg");
      const lastCloseSvg = prefix.toLowerCase().lastIndexOf("</svg>");
      const isInsideSvgRange = lastOpenSvg !== -1 && lastOpenSvg > lastCloseSvg;

      if (isInsideSvgRange) {
        const fullRemaining = currentTarget.slice(lastOpenSvg);
        const closeTagIndex = fullRemaining.toLowerCase().indexOf("</svg>");
        if (closeTagIndex !== -1) {
          const nextIndex = lastOpenSvg + closeTagIndex + 6;
          indexRef.current = nextIndex;
          setDisplayedText(currentTarget.slice(0, nextIndex));
          timerIdRef.current = setTimeout(runTypewriter, 30);
          return;
        } else {
          const headerMatch = fullRemaining.match(/\n#{1,3}\s+/);
          if (headerMatch && headerMatch.index !== undefined && headerMatch.index > 0) {
            const nextIndex = lastOpenSvg + headerMatch.index;
            indexRef.current = nextIndex;
            setDisplayedText(currentTarget.slice(0, nextIndex));
            timerIdRef.current = setTimeout(runTypewriter, 30);
            return;
          } else {
            indexRef.current = currentTarget.length;
            setDisplayedText(currentTarget);
            timerIdRef.current = setTimeout(runTypewriter, 60);
            return;
          }
        }
      }

      if (currentIndex < currentTarget.length) {
        const sliceFromCurrent = currentTarget.slice(currentIndex);
        const lowerSlice = sliceFromCurrent.toLowerCase();

        // 1a. SVG Block start detection
        if (lowerSlice.startsWith("<svg") || lowerSlice.startsWith("```xml\n<svg") || lowerSlice.startsWith("```svg\n<svg")) {
          const svgStartOffset = lowerSlice.indexOf("<svg");
          const absoluteOpenSvg = currentIndex + svgStartOffset;
          const fullRemaining = currentTarget.slice(absoluteOpenSvg);
          const closeTagIndex = fullRemaining.toLowerCase().indexOf("</svg>");

          if (closeTagIndex !== -1) {
            const nextIndex = absoluteOpenSvg + closeTagIndex + 6;
            indexRef.current = nextIndex;
            setDisplayedText(currentTarget.slice(0, nextIndex));
            timerIdRef.current = setTimeout(runTypewriter, 30);
            return;
          } else {
            const headerMatch = fullRemaining.match(/\n#{1,3}\s+/);
            if (headerMatch && headerMatch.index !== undefined && headerMatch.index > 0) {
              const nextIndex = absoluteOpenSvg + headerMatch.index;
              indexRef.current = nextIndex;
              setDisplayedText(currentTarget.slice(0, nextIndex));
              timerIdRef.current = setTimeout(runTypewriter, 30);
              return;
            } else {
              indexRef.current = currentTarget.length;
              setDisplayedText(currentTarget);
              timerIdRef.current = setTimeout(runTypewriter, 60);
              return;
            }
          }
        }

        // 1b. Parametric Diagram & Primitive Tag Atomic Protection
        if (lowerSlice.startsWith("<diagram") || lowerSlice.startsWith("<primitive") || lowerSlice.startsWith("```xml\n<diagram")) {
          const tagStartOffset = Math.max(0, lowerSlice.indexOf("<"));
          const absoluteOpenTag = currentIndex + tagStartOffset;
          const fullRemaining = currentTarget.slice(absoluteOpenTag);
          const closeBracketIdx = fullRemaining.indexOf(">");

          if (closeBracketIdx !== -1) {
            const nextIndex = absoluteOpenTag + closeBracketIdx + 1;
            indexRef.current = nextIndex;
            setDisplayedText(currentTarget.slice(0, nextIndex));
            timerIdRef.current = setTimeout(runTypewriter, 30);
            return;
          } else {
            indexRef.current = currentTarget.length;
            setDisplayedText(currentTarget);
            timerIdRef.current = setTimeout(runTypewriter, 60);
            return;
          }
        }

        // 2. Atomic LaTeX Math Block Jump for Crisp Instant Formula Rendering
        if (lowerSlice.startsWith("$$") || lowerSlice.startsWith("\\[") || lowerSlice.startsWith("\\begin{")) {
          let mathEnd = -1;
          if (lowerSlice.startsWith("$$")) {
            const endIdx = sliceFromCurrent.slice(2).indexOf("$$");
            if (endIdx !== -1) mathEnd = endIdx + 4;
          } else if (lowerSlice.startsWith("\\[")) {
            const endIdx = sliceFromCurrent.slice(2).indexOf("\\]");
            if (endIdx !== -1) mathEnd = endIdx + 4;
          } else if (lowerSlice.startsWith("\\begin{")) {
            const envNameMatch = sliceFromCurrent.match(/^\\begin\{([^}]+)\}/);
            if (envNameMatch) {
              const envName = envNameMatch[1];
              const closeTag = `\\end{${envName}}`;
              const endIdx = sliceFromCurrent.indexOf(closeTag);
              if (endIdx !== -1) mathEnd = endIdx + closeTag.length;
            }
          }
          if (mathEnd > 0) {
            const nextIndex = currentIndex + mathEnd;
            indexRef.current = nextIndex;
            setDisplayedText(currentTarget.slice(0, nextIndex));
            timerIdRef.current = setTimeout(runTypewriter, 18);
            return;
          }
        }

        // 2b. Markdown Header Instant Reveal for Crisp Board Section Anchors
        if (lowerSlice.startsWith("#")) {
          const isPollHeader = lowerSlice.includes("poll") || lowerSlice.includes("prediction") || lowerSlice.includes("❓");
          if (!isPollHeader) {
            const endOfHeaderLine = sliceFromCurrent.indexOf("\n");
            const headerLen = endOfHeaderLine !== -1 ? endOfHeaderLine + 1 : sliceFromCurrent.length;
            const nextIndex = currentIndex + headerLen;
            indexRef.current = nextIndex;
            setDisplayedText(currentTarget.slice(0, nextIndex));
            timerIdRef.current = setTimeout(runTypewriter, 12);
            return;
          }
        }

        // 3. Adaptive Latency Buffer & Audio Stream Word Synchronization Engine
        const speechIdx = findSpeechAlignmentIndex(currentTarget, currentIndex, latestSpeechRef.current);
        const lagLength = currentTarget.length - currentIndex;

        // Adaptive Latency Buffer Catch-up: If audio leaped ahead, align visible text directly to the last completed word
        if (isCherrySpeaking && speechIdx !== null) {
          if (speechIdx > currentIndex + 10) {
            const snappedIndex = Math.min(speechIdx, currentTarget.length);
            indexRef.current = snappedIndex;
            setDisplayedText(currentTarget.slice(0, snappedIndex));
            timerIdRef.current = setTimeout(runTypewriter, 15);
            return;
          }
        }

        let charsPerStep = 2;
        let baseDelay = 22;

        const isInsidePollContent =
          sliceFromCurrent.toLowerCase().includes("poll") ||
          currentTarget.slice(0, currentIndex).toLowerCase().includes("prediction poll") ||
          currentTarget.slice(0, currentIndex).includes("❓");

        if (isCherrySpeaking) {
          // Dynamic handwriting speed scaled with Cherry's live speaking cadence
          const vol = volumeRef.current;
          if (isInsidePollContent) {
            charsPerStep = 2;
            baseDelay = 24;
          } else if (lagLength > 120 || vol > 0.2) {
            charsPerStep = 3;
            baseDelay = 18;
          } else if (lagLength > 50 || vol > 0.08) {
            charsPerStep = 2;
            baseDelay = 20;
          } else {
            charsPerStep = 1;
            baseDelay = 25;
          }
        } else {
          // When Cherry is listening or in a natural speaking pause, write at steady handwriting speed
          if (lagLength > 80) {
            charsPerStep = 2;
            baseDelay = 22;
          } else {
            charsPerStep = 1;
            baseDelay = 28;
          }
        }

        const nextIndex = Math.min(currentIndex + charsPerStep, currentTarget.length);

        // Natural speech & line-break pauses matching human enunciation
        const currentChar = currentTarget[currentIndex];
        if (currentChar === "." || currentChar === "?" || currentChar === "!") {
          baseDelay += isCherrySpeaking ? 50 : 20;
        } else if (currentChar === "," || currentChar === ";") {
          baseDelay += isCherrySpeaking ? 25 : 10;
        } else if (currentChar === "\n") {
          baseDelay += isCherrySpeaking ? 40 : 15;
        } else if (currentChar === ":" && currentTarget[currentIndex - 1] !== "\\") {
          baseDelay += isCherrySpeaking ? 30 : 15;
        }

        indexRef.current = nextIndex;
        setDisplayedText(currentTarget.slice(0, nextIndex));

        timerIdRef.current = setTimeout(runTypewriter, baseDelay);
      } else {
        // Reached target end
        isTypingActiveRef.current = false;
      }
    };

    timerIdRef.current = setTimeout(runTypewriter, 10);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  return (
    <span className="relative inline-wrap w-full select-text">
      <MathRenderer text={displayedText} latestSpeech={latestSpeech} />
      {displayedText.length < text.length && (
        <span className="relative inline-block" style={{ verticalAlign: "middle" }}>
          <motion.span
            initial={{ rotate: -15, scale: 0.9 }}
            animate={{
              rotate: [-15, -5, -25, -15],
              y: [0, -1.5, 1.5, -0.5, 0],
              x: [0, 0.5, -0.5, 0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.18,
              ease: "linear",
            }}
            className="inline-block w-1.5 h-4 ml-1 rounded-sm bg-zinc-100/90 border border-zinc-200/50 shadow-sm origin-bottom-left"
            style={{
              boxShadow: "0 0 6px rgba(228, 228, 231, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
            }}
          />
        </span>
      )}
    </span>
  );
};

export const ChalkTypewriter = React.memo(ChalkTypewriterComponent, (prevProps, nextProps) => {
  if (prevProps.text !== nextProps.text) return false;
  if (prevProps.isAcademicNotes !== nextProps.isAcademicNotes) return false;
  if (prevProps.isFallback !== nextProps.isFallback) return false;
  if (prevProps.isPaused !== nextProps.isPaused) return false;
  if (prevProps.state !== nextProps.state) return false;
  if (prevProps.teachingPhase !== nextProps.teachingPhase) return false;
  if (prevProps.latestSpeech !== nextProps.latestSpeech) return false;
  return true;
});
