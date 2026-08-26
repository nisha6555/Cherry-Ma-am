/**
 * Dynamic filtering and extraction utility for the Whiteboard Display System.
 * Separates textbook-quality lecture notes from conversational Hinglish chatter/filler words,
 * and strips any raw model internals, tool signatures, escaped tags, or system data.
 */

/**
 * Strips raw system prompts, tool call payloads, LLM internal thoughts,
 * unparsed tags, and escaped anomalies so the Blackboard displays ONLY clean academic chalk notes.
 */
export function sanitizeRawBoardData(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove System Triggers, Instructions, and Context Metadata
  cleaned = cleaned.replace(/\[SYSTEM\s+TRIGGER[\s\S]*?\]/gi, "");
  cleaned = cleaned.replace(/\[SYSTEM\s+INSTRUCTION[\s\S]*?\]/gi, "");
  cleaned = cleaned.replace(/\[ACTIVE\s+BLACKBOARD\s+CONTENT[\s\S]*?\]/gi, "");
  cleaned = cleaned.replace(/\[CONVERSATION\s+TRANSCRIPT[\s\S]*?\]/gi, "");
  cleaned = cleaned.replace(/\[STUDENT\s+PROFILE[\s\S]*?\]/gi, "");
  cleaned = cleaned.replace(/\[SESSION\s+STATE[\s\S]*?\]/gi, "");

  // 2. Strip LLM Internal Thought / Reasoning / Guidance tags
  cleaned = cleaned.replace(/<(think|thought|reflection|scratchpad|guidance|system|prompt|transcript|action|tool_calls?)[\s\S]*?<\/\1>/gi, "");
  // Also strip open unclosed tags at stream ends
  cleaned = cleaned.replace(/<(think|thought|reflection|scratchpad|guidance|system|prompt)>[\s\S]*$/gi, "");

  // 3. Strip Raw JSON Function Call / Tool Call Dumps
  // e.g. ```json { "name": "updateWhiteboard", "arguments": ... } ```
  cleaned = cleaned.replace(/```(?:json|javascript|ts|typescript)?\s*\{[\s\S]*?"(?:name|tool_calls|arguments|function|phase|content)"[\s\S]*?\}\s*```/gi, "");
  // Standalone raw JSON objects representing tool arguments or state triggers
  cleaned = cleaned.replace(/\{"(?:name|tool_calls|arguments|function|phase)":[\s\S]*?\}/gi, "");

  // 4. Strip Raw Internal Headers and Metadata Titles
  cleaned = cleaned.replace(/^###?\s*📖?\s*SOURCE\s+CONTENT:?\s*/gim, "");
  cleaned = cleaned.replace(/^###?\s*(?:📖\s*)?RAW\s+(?:TEXT|SOURCE|DOCUMENT|DATA):?\s*/gim, "");
  cleaned = cleaned.replace(/^###?\s*(?:Real-World\s+Curiosity\s+Hook|REAL-WORLD\s+MYSTERY|CURIOSITY\s+HOOK):?\s*/gim, "");
  cleaned = cleaned.replace(/^###?\s*(?:ROADMAP|🗺️\s*LEARNING\s+ROADMAP|SYLLABUS\s+SYNC):?\s*/gim, "");

  // 5. Strip Container and Board Wrapper Tags
  cleaned = cleaned.replace(/<\/?board>/gi, "");
  cleaned = cleaned.replace(/<spotlight[^>]*\/?>/gi, "");
  cleaned = cleaned.replace(/<\/spotlight>/gi, "");
  cleaned = cleaned.replace(/<chalk[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/chalk>/gi, "");
  cleaned = cleaned.replace(/<note[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/note>/gi, "");
  cleaned = cleaned.replace(/<summary[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/summary>/gi, "");

  // 6. Clean escaped literal newline / artifact characters (e.g. \\n, \/n, /n when not part of LaTeX command)
  // Strip trailing or leading slash artifacts
  cleaned = cleaned.replace(/^([\\/nN\s]+)/gi, "");
  cleaned = cleaned.replace(/[\\/]+n$/gi, "");
  // Replace literal '\n' or '/n' or '\/n' that was printed as string with actual newline
  cleaned = cleaned.replace(/[\\/]+n(?![a-zA-Z])/gi, "\n");

  // 7. Strip unneeded markdown code fences around standard text (preserve xml/svg diagrams)
  cleaned = cleaned.replace(/^```(?:markdown|text|latex|math|chalk)?\s*\n/gim, "");
  cleaned = cleaned.replace(/\n```\s*$/gm, "");

  return cleaned.trim();
}

export function extractBoardContent(text: string): string {
  if (!text) return "";

  // 1. Try to extract content wrapped inside <board>...</board> tags
  // This is streaming-safe: if the closing tag hasn't arrived yet, we take everything till the end
  if (text.toLowerCase().includes("<board>")) {
    const blocks: string[] = [];
    let currentIndex = 0;
    const lowerText = text.toLowerCase();
    
    while (true) {
      const openIdx = lowerText.indexOf("<board>", currentIndex);
      if (openIdx === -1) break;
      
      const startContent = openIdx + 7; // Length of "<board>"
      const closeIdx = lowerText.indexOf("</board>", startContent);
      
      if (closeIdx !== -1) {
        const rawContent = text.slice(startContent, closeIdx);
        const sanitized = sanitizeRawBoardData(rawContent);
        if (sanitized) {
          blocks.push(sanitized);
        }
        currentIndex = closeIdx + 8; // Length of "</board>"
      } else {
        // Stream is ongoing, take everything till the end
        const rawContent = text.slice(startContent);
        const sanitized = sanitizeRawBoardData(rawContent);
        if (sanitized) {
          blocks.push(sanitized);
        }
        break;
      }
    }
    
    return blocks.filter(Boolean).join("\n\n");
  }

  // Strictly return empty string if no <board> tags are found to prevent spoken conversation from typing onto the main chalkboard.
  return "";
}

/**
 * Smart Whiteboard Section Merger & Deduplicator.
 * Prevents duplicate section headers (e.g. "### 📌 DEFINITION:") from appearing twice on the blackboard.
 */
export function smartMergeWhiteboardNotes(prev: string, incoming: string, append?: boolean): string {
  const sanitizedIncoming = sanitizeRawBoardData(incoming || "");
  const trimmedNew = sanitizedIncoming.trim();
  if (!trimmedNew) return prev || ""; // Never wipe board with empty content

  const sanitizedPrev = sanitizeRawBoardData(prev || "");
  const prevTrimmed = sanitizedPrev.trim();
  if (!prevTrimmed) return trimmedNew;

  const normalizeSpace = (s: string) => s.replace(/[\r\n\s]+/g, " ").trim();

  // 1. Exact or space-normalized match -> return prev to avoid re-renders / duplication
  if (normalizeSpace(prevTrimmed) === normalizeSpace(trimmedNew)) {
    return prevTrimmed;
  }

  // 2. Substring containment check
  if (normalizeSpace(prevTrimmed).includes(normalizeSpace(trimmedNew))) {
    return prevTrimmed;
  }

  // 3. New Topic Title check: If incoming has a new # Main Title different from previous # Main Title, start fresh
  const getMainTitle = (text: string) => {
    const match = text.match(/^#\s+([^\n]+)/m);
    return match ? match[1].trim().toUpperCase() : null;
  };

  const prevTitle = getMainTitle(prevTrimmed);
  const incomingTitle = getMainTitle(trimmedNew);
  if (incomingTitle && prevTitle && incomingTitle !== prevTitle) {
    return trimmedNew;
  }

  // Helper to normalize section header keys e.g. "### 📌 DEFINITION :" -> "DEFINITION"
  const getHeaderKey = (headerLine: string): string => {
    return headerLine
      .replace(/^#+\s*/, "")
      .replace(/[^a-zA-Z0-9\u0900-\u097F]+/g, " ")
      .trim()
      .toUpperCase();
  };

  // Split markdown into structured section blocks based on header lines
  const parseSections = (text: string) => {
    const lines = text.split("\n");
    const sections: { key: string; rawHeader: string; body: string[] }[] = [];
    let currentKey = "__INTRO__";
    let currentRaw = "";
    let currentBody: string[] = [];

    const isHeaderLine = (line: string) => {
      const t = line.trim();
      return (
        t.startsWith("#") ||
        /^(📌|💡|🎯|📐|🧠|⚠️|🔬|🎒|🔍|❓|🚀|🎓|📖)/.test(t) ||
        /^###?\s*(DEFINITION|CHERRY|TOPPER|CORE FORMULA|MNEMONIC|JUGAD|EXAM PITFALL|CONCEPT DIAGRAM|SOURCE CONTENT|SOURCE)/i.test(t)
      );
    };

    for (const line of lines) {
      if (isHeaderLine(line)) {
        if (currentBody.length > 0 || currentRaw !== "") {
          sections.push({
            key: getHeaderKey(currentRaw || currentKey),
            rawHeader: currentRaw,
            body: currentBody,
          });
        }
        currentRaw = line;
        currentKey = getHeaderKey(line);
        currentBody = [line];
      } else {
        currentBody.push(line);
      }
    }

    if (currentBody.length > 0 || currentRaw !== "") {
      sections.push({
        key: getHeaderKey(currentRaw || currentKey),
        rawHeader: currentRaw,
        body: currentBody,
      });
    }

    return sections;
  };

  const prevSections = parseSections(prevTrimmed);
  const incomingSections = parseSections(trimmedNew);

  // If incoming notes have valid section headers
  const validIncomingSections = incomingSections.filter((s) => s.key && s.key !== "__INTRO__");

  if (validIncomingSections.length > 0) {
    const mergedMap = new Map<string, { rawHeader: string; body: string[] }>();
    const sectionOrder: string[] = [];

    // First populate with existing sections from prev
    for (const sec of prevSections) {
      if (sec.key) {
        mergedMap.set(sec.key, { rawHeader: sec.rawHeader, body: sec.body });
        sectionOrder.push(sec.key);
      }
    }

    // Merge or update with incoming sections
    for (const sec of validIncomingSections) {
      if (mergedMap.has(sec.key)) {
        // REPLACE existing section with newer version (prevents duplicates like two DEFINITION blocks)
        mergedMap.set(sec.key, { rawHeader: sec.rawHeader, body: sec.body });
      } else {
        // APPEND new unique section
        mergedMap.set(sec.key, { rawHeader: sec.rawHeader, body: sec.body });
        sectionOrder.push(sec.key);
      }
    }

    // Reconstruct merged markdown string
    const mergedText = sectionOrder
      .map((k) => mergedMap.get(k)?.body.join("\n"))
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (mergedText.length > 0) {
      return mergedText;
    }
  }

  // Fallback if no structured headers were detected:
  if (append) {
    return (prevTrimmed + "\n\n" + trimmedNew).trim();
  }

  // Anti-wipe protection: If previous content is rich (>80 chars) and new content is short snippet without headers
  const isPrevRich = prevTrimmed.length > 80 || prevTrimmed.includes("#") || prevTrimmed.includes("*");
  const isNewShortSnippet = trimmedNew.length < 90 && !trimmedNew.includes("#") && !trimmedNew.startsWith("```");

  if (isPrevRich && isNewShortSnippet) {
    return (prevTrimmed + "\n\n" + trimmedNew).trim();
  }

  return trimmedNew;
}

const SUB_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"
};

const SUPER_MAP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻"
};

/**
 * Converts inline formulas, chemical notation, and LaTeX artifacts into clean readable unicode typography.
 * e.g. "SULPHURIC ACID ($H2SO4$)" -> "SULPHURIC ACID (H₂SO₄)"
 * e.g. "$H_2SO_4$" -> "H₂SO₄"
 * e.g. "$CO2$" -> "CO₂"
 */
export function formatCleanFormulaTitle(text: string): string {
  if (!text) return "";

  let res = text;

  // 1. Remove LaTeX macros like \text{...}, \mathbf{...}, \ce{...}, \mathrm{...}
  res = res.replace(/\\(?:text|textbf|mathbf|mathrm|ce|mathit|underline|bold)\{([^}]+)\}/gi, "$1");

  // 2. Convert explicit LaTeX sub/superscripts e.g. H_2 -> H₂, x^2 -> x²
  res = res.replace(/_\{?([0-9]+)\}?/g, (_, digits) =>
    digits.split("").map((d: string) => SUB_MAP[d] || d).join("")
  );
  res = res.replace(/\^\{?([0-9+\-]+)\}?/g, (_, chars) =>
    chars.split("").map((c: string) => SUPER_MAP[c] || c).join("")
  );

  // 3. Convert chemical formula numbers (e.g. H2SO4, CO2, H2O, Ca(OH)2, Fe2O3, SO4)
  res = res.replace(/\b([A-Z][a-z]?[0-9]+[A-Za-z0-9()]*)\b/g, (match) => {
    return match.replace(/([0-9]+)/g, (num) =>
      num.split("").map((d) => SUB_MAP[d] || d).join("")
    );
  });

  // Handle ($H2SO4$) and ($H_2SO_4$) pattern explicitly
  res = res.replace(/\(?\$([A-Za-z0-9()_]+)\$\)?/g, (fullMatch, inner) => {
    const converted = inner.replace(/([0-9]+)/g, (num: string) =>
      num.split("").map((d) => SUB_MAP[d] || d).join("")
    );
    return fullMatch.startsWith("(") && fullMatch.endsWith(")") ? `(${converted})` : converted;
  });

  // 4. Strip remaining dollar signs and backslashes
  res = res.replace(/\$/g, "");
  res = res.replace(/\\/g, "");

  // 5. Clean extra spaces
  res = res.replace(/\s+/g, " ").trim();

  return res;
}

/**
 * Universal Sanitizer and Formatter for Academic Topic Titles and Headers.
 * Ensures no raw data, file IDs, markdown code, or raw $...$ LaTeX syntax leaks into UI headers.
 */
export function cleanTopicHeader(rawText: string, fallbackSubject?: string, fallbackIndex?: number): string {
  if (!rawText || !rawText.trim()) {
    return fallbackIndex !== undefined ? `Topic Part ${fallbackIndex + 1}` : (fallbackSubject || "Topic");
  }
  const sanitized = sanitizeRawBoardData(rawText);
  const firstLine = (sanitized || rawText).split("\n")[0] || "";
  let clean = firstLine
    .replace(/[#*_~`]/g, "")
    .replace(/\.(md|markdown|txt|pdf|docx|jpg|jpeg|png|webp|gif)$/i, "")
    .replace(/\.(md|markdown|txt|pdf|docx|jpg|jpeg|png|webp|gif)\b/gi, "")
    .replace(/^["']|["']$/g, "")
    .replace(/[\_]/g, " ")
    .trim();

  // Convert chemical/math formulas and clean LaTeX artifacts
  clean = formatCleanFormulaTitle(clean);

  // Check if it is a raw numeric timestamp or uuid/hash file id
  const isRawFileId = /^\d{8,}$/.test(clean) || (clean.length > 20 && /^[0-9a-fA-F\-]+$/.test(clean));
  if (isRawFileId) {
    if (fallbackSubject) {
      return fallbackIndex !== undefined ? `${fallbackSubject} (Part ${fallbackIndex + 1})` : fallbackSubject;
    }
    return fallbackIndex !== undefined ? `Topic Part ${fallbackIndex + 1}` : "Classroom Topic";
  }

  return clean || (fallbackIndex !== undefined ? `Topic Part ${fallbackIndex + 1}` : "Topic");
}

