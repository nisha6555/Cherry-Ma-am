import React, { useState, useEffect, useMemo } from "react";
import { 
  User, Award, Calendar, Clock, BookOpen, Download, Trash2, 
  Sparkles, X, LayoutGrid, FileText, Share2, Shield, Bookmark, HardDriveDownload,
  Search, ChevronRight, ChevronDown, Folder, FolderOpen, Youtube,
  Brain, ChevronLeft, HelpCircle, RefreshCw, Maximize2, Minimize2,
  Play, Pause, Heart, Volume2, VolumeX, MessageSquare, Copy, Check,
  Zap, Film, Smartphone, Send, Flame, ThumbsUp, Video as VideoIcon,
  Camera, Image as ImageIcon, Eye, ZoomIn, Layers, Shuffle, Lightbulb,
  Printer, CheckCircle2
} from "lucide-react";
import katex from "katex";
import { db, auth } from "../lib/firebase"; // Import database configuration
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  onSnapshot,
  limit
} from "firebase/firestore";
import { sanitizeSvg } from "../utils/sanitizeSvg";
import { parseAndRenderDiagramTag } from "../utils/parametricPrimitives";
import { KiaraCounselor } from "./KiaraCounselor";
import { KiaraLiveVoiceModal } from "./KiaraLiveVoiceModal";
import { safeSetItem } from "../utils/safeStorage";
import { 
  getUnifiedRevisionPayload, 
  getActiveLearningContext, 
  saveActiveLearningContext 
} from "../utils/activeLearningStore";
import { ConceptInfographicPoster } from "./ConceptInfographicPoster";
import { ConceptInfographicData } from "../types";

const DIMENSION_DETAILS = [
  {
    name: "🎯 Concept Clarity",
    icon: "🎯",
    description: "Evaluates your capability to synthesize formulas and apply them to novel, non-routine application questions. True mastery means recognizing which formula to use under variable conditions.",
    recommendation: "Your concept clarity is currently at {score}%. Great work! Ensure you are practicing cross-concept whiteboard problem sets to build deductive flexibility.",
    benefit: "Equips you to tackle higher-order thinking (HOTS) board-exam questions and easily crack advanced competitive exams."
  },
  {
    name: "📖 Theoretical Understanding",
    icon: "📖",
    description: "Measures recall of exact textbook definitions, scientific/mathematical constants, core classroom theorems, and textbook-grade proofs.",
    recommendation: "Your core theoretical core score is {score}%. Re-read slide summaries and use the direct hand-handbook PDFs to memorize formal definitions precisely.",
    benefit: "Allows you to write highly structured, formal answers that score 100% marks from strict board examiners."
  },
  {
    name: "🧮 Calculation Precision",
    icon: "🧮",
    description: "Tracks algebraic accuracy, arithmetic transposition precision, algebraic sign changes, and step-by-step mathematical reasoning.",
    recommendation: "Your calculation precision is at {score}%. Silly errors are usually due to transposing terms too quickly. Write out every single algebraic step on your scratchpad.",
    benefit: "Completely eliminates exam-day calculation slip-ups and builds high confidence during high-pressure timed exams."
  },
  {
    name: "⚡ Formula Recall & Recall",
    icon: "⚡",
    description: "Gauges rapid recall of standard formulas, units of measurement, coefficients of equations, and historical/scientific facts discussed on chalkboard.",
    recommendation: "Your formula recall is at {score}%. Boost this immediately by opening the Smart Revision tab and playing the AI flashcards for 5 minutes daily.",
    benefit: "Saves critical minutes during timed tests, leaving you with surplus time to review and polish your calculations."
  },
  {
    name: "🔥 Socratic Stamina & Consistency",
    icon: "🔥",
    description: "Monitors overall active learning consistency. Derived directly from lecture classes attended, custom handbooks generated, and slide snapshots saved.",
    recommendation: "Your Socratic engagement is {score}%. Attend live sessions with Cherry Ma'am consistently, ask interactive questions, and save chalkboard snapshot formulations to keep this at 100%.",
    benefit: "Transforms studying from exhausting late-night cram sessions to steady, permanent cognitive absorption."
  }
];

interface BoardSnapshot {
  id: string;
  snapshotId: string;
  userId: string;
  topicTitle: string;
  description: string;
  imgData: string; // Base64 Compressed Image
  timestamp: any;
  subject?: string;
  grade?: string;
  topicIndex?: number;
}

interface StudentAccountHubProps {
  onClose: () => void;
  studentName: string;
  grade: string;
  subject: string;
  board?: string;
  mediumOfLearning?: string;
  totalSessionsCount?: number;
  onRefreshProfile?: () => void;
  customBoardContent?: string;
  pastSessions?: any[];
  sessionSnapshots?: any[];
  topics?: string[];
  activeTopicIndex?: number;
  topicBoardsContent?: Record<number, string>;
  sessionId?: string | null;
  activeDocument?: any;
  onEnterClassroom?: () => void;
  onDiscussWithCherry?: (topicDetails: {
    topic: string;
    question?: string;
    answer?: string;
    hint?: string;
    conceptTested?: string;
    subject?: string;
  }) => void;
}

const escapeHTML = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sanitizeTitleForPDF = (title: string, fallbackSubject?: string, topicList?: string[]): string => {
  let firstTopicHeader = "";
  if (topicList && topicList.length > 0) {
    firstTopicHeader = (topicList[0].split("\n")[0] || "")
      .replace(/[#*_]/g, "")
      .replace(/\.(md|markdown|txt|pdf|docx|jpg|jpeg|png|webp|gif)\b/gi, "")
      .trim();
  }

  if (!title) {
    if (firstTopicHeader) {
      return fallbackSubject ? `${fallbackSubject} • ${firstTopicHeader}` : firstTopicHeader;
    }
    return fallbackSubject ? `${fallbackSubject} Classroom Notes` : "Classroom Lecture Notes";
  }

  let clean = (title || "").trim()
    .replace(/\.(md|markdown|txt|pdf|docx|jpg|jpeg|png|webp|gif)$/i, "")
    .replace(/\.(md|markdown|txt|pdf|docx|jpg|jpeg|png|webp|gif)\b/gi, "")
    .replace(/^["']|["']$/g, "")
    .replace(/[\_]/g, " ")
    .trim();

  const isRawFileId = /^\d{8,}$/.test(clean) || (clean.length > 20 && /^[0-9a-fA-F\-]+$/.test(clean));

  if (isRawFileId) {
    if (firstTopicHeader) {
      return fallbackSubject ? `${fallbackSubject} • ${firstTopicHeader}` : firstTopicHeader;
    }
    return fallbackSubject ? `${fallbackSubject} Lecture Handout` : "Classroom Study Handout";
  }

  return clean;
};

const compileWhiteboardToHTML = (markdown: string): string => {
  if (!markdown || !markdown.trim()) {
    return `<div style="text-align: center; color: #94a3b8; font-family: sans-serif; padding: 20px; font-size: 12px; font-style: italic; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.12);">No blackboard notes written on this topic yet.</div>`;
  }

  // 1. Strip <board> and </board> tags & markdown code block fences wrapping SVG/diagrams
  let cleaned = markdown
    .replace(/<\/?board>/gi, "")
    .replace(/```(?:xml|html|svg|markdown|text|latex|math)?/gi, "")
    .replace(/```/g, "")
    .trim();

  // Convert geometric LaTeX macros to high-fidelity Unicode symbols
  cleaned = cleaned
    .replace(/\\{1,4}hexagon\b/g, "⬡")
    .replace(/\\{1,4}pentagon\b/g, "⬠")
    .replace(/\\{1,4}octagon\b/g, "⯃")
    .replace(/\\{1,4}heptagon\b/g, "⬡")
    .replace(/\\{1,4}triangle\b/g, "△")
    .replace(/\\{1,4}square\b/g, "☐")
    .replace(/\\{1,4}circle\b/g, "◯")
    .replace(/\\{1,4}bigcirc\b/g, "◯")
    .replace(/\\{1,4}rectangle\b/g, "▭")
    .replace(/\\{1,4}parallelogram\b/g, "▱")
    .replace(/\\{1,4}trapezoid\b/g, "⏢")
    .replace(/\\{1,4}kite\b/g, "⬨")
    .replace(/\\{1,4}rhombus\b/g, "◊");

  // Pre-normalize LaTeX markdown delimiters to standard $ and $$ for easier matching
  let normalized = cleaned
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  // Helper to format an SVG or parametric diagram cleanly into a printable PDF container
  const formatSvgForPDF = (rawSvgOrDiagram: string): string => {
    try {
      let processed = rawSvgOrDiagram.trim();
      if (!processed) return "";

      // 1. Resolve parametric <diagram> or <primitive> tags instantly
      if (processed.toLowerCase().includes("<diagram") || processed.toLowerCase().includes("<primitive")) {
        const primitiveSvg = parseAndRenderDiagramTag(processed);
        if (primitiveSvg) {
          processed = primitiveSvg;
        }
      }

      // 2. Auto-close unclosed <svg> tag if cut off
      if (processed.toLowerCase().includes("<svg") && !processed.toLowerCase().includes("</svg>")) {
        processed = processed + "\n</svg>";
      }

      // 3. Ensure viewBox exists if missing
      if (!processed.includes("viewBox") && !processed.includes("viewbox")) {
        processed = processed.replace(/<svg/i, "<svg viewBox='0 0 400 250'");
      }

      // 4. Ensure SVG is responsive and max-width constrained for PDF print
      processed = processed.replace(/\b(width|height)\s*=\s*(['"])[^'"]*\2/gi, "");
      processed = processed.replace(/<svg([^>]*)>/i, `<svg$1 width="100%" height="auto" style="max-height: 280px; max-width: 520px; margin: 0 auto; display: block;">`);

      // 5. Clean LaTeX formulas inside <text> / <tspan> if present
      processed = processed.replace(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/gi, (match, attrs, content) => {
        return `<tspan${attrs}>${content.replace(/\\vec\{([a-zA-Z0-9]+)\}/g, "$1→").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}]/g, "")}</tspan>`;
      });
      processed = processed.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (match, attrs, content) => {
        return `<text${attrs}>${content.replace(/\\vec\{([a-zA-Z0-9]+)\}/g, "$1→").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}]/g, "")}</text>`;
      });

      const safeSvg = sanitizeSvg(processed);

      return `
        <div class="vector-diagram-pdf-card" style="margin: 16px auto; padding: 14px; background: #061c18; border: 1.5px solid rgba(103, 232, 249, 0.4); border-radius: 12px; text-align: center; page-break-inside: avoid; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.25); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <div style="font-size: 9.5px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; text-align: left; display: flex; align-items: center; gap: 6px;">
            <span>📐 Blackboard Vector Diagram</span>
          </div>
          <div class="vector-svg-stage" style="display: flex; justify-content: center; align-items: center; width: 100%;">
            ${safeSvg}
          </div>
        </div>
      `;
    } catch (err) {
      console.error("formatSvgForPDF error:", err);
      return "";
    }
  };

  // 2. Extract SVG and Diagram blocks first and replace with unique atomic placeholders
  const svgBlocks: string[] = [];
  let tokenized = "";
  let remaining = normalized;

  while (remaining.length > 0) {
    const lower = remaining.toLowerCase();
    const svgIdx = lower.indexOf("<svg");
    const diagIdx = lower.indexOf("<diagram");
    const primIdx = lower.indexOf("<primitive");

    const validIndices = [svgIdx, diagIdx, primIdx].filter(i => i !== -1);
    if (validIndices.length === 0) {
      tokenized += remaining;
      break;
    }

    const matchIdx = Math.min(...validIndices);
    if (matchIdx > 0) {
      tokenized += remaining.slice(0, matchIdx);
    }

    const rest = remaining.slice(matchIdx);
    const restLower = rest.toLowerCase();

    if (restLower.startsWith("<svg")) {
      const closeIdx = restLower.indexOf("</svg>");
      if (closeIdx !== -1) {
        const svgContent = rest.slice(0, closeIdx + 6);
        const blockPlaceholder = `\n\n@@SVG_BLOCK_${svgBlocks.length}@@\n\n`;
        svgBlocks.push(formatSvgForPDF(svgContent));
        tokenized += blockPlaceholder;
        remaining = rest.slice(closeIdx + 6);
      } else {
        // Unclosed <svg>
        const blockPlaceholder = `\n\n@@SVG_BLOCK_${svgBlocks.length}@@\n\n`;
        svgBlocks.push(formatSvgForPDF(rest));
        tokenized += blockPlaceholder;
        break;
      }
    } else {
      // <diagram> or <primitive>
      const closeTagIdx = rest.indexOf(">");
      if (closeTagIdx !== -1) {
        const tagContent = rest.slice(0, closeTagIdx + 1);
        const blockPlaceholder = `\n\n@@SVG_BLOCK_${svgBlocks.length}@@\n\n`;
        svgBlocks.push(formatSvgForPDF(tagContent));
        tokenized += blockPlaceholder;
        remaining = rest.slice(closeTagIdx + 1);
      } else {
        const blockPlaceholder = `\n\n@@SVG_BLOCK_${svgBlocks.length}@@\n\n`;
        svgBlocks.push(formatSvgForPDF(rest));
        tokenized += blockPlaceholder;
        break;
      }
    }
  }

  // 3. Split content by display math blocks and SVG placeholders
  const blockRegex = /(@@SVG_BLOCK_\d+@@|\$\$[\s\S]*?\$\$|\\begin\s*\{\s*[a-zA-Z*]+\s*\}[\s\S]*?\\end\s*\{\s*[a-zA-Z*]+\s*\})/gi;
  const parts = tokenized.split(blockRegex);

  let htmlResult = "";

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    // Check if SVG block placeholder
    const svgMatch = trimmed.match(/^@@SVG_BLOCK_(\d+)@@$/);
    if (svgMatch) {
      const blockIndex = parseInt(svgMatch[1], 10);
      if (svgBlocks[blockIndex]) {
        htmlResult += svgBlocks[blockIndex];
      }
      return;
    }

    const isBlockMath = (trimmed.startsWith("$$") && trimmed.endsWith("$$")) || 
                        /^\\begin\s*\{\s*[a-zA-Z*]+\s*\}/i.test(trimmed);

    if (isBlockMath) {
      const isEnv = /^\\begin\s*\{\s*[a-zA-Z*]+\s*\}/i.test(trimmed);
      let formula = isEnv ? trimmed : trimmed.slice(2, -2).trim();
      
      // Clean up double-backslashes inside formulas (preventing duplicate escaping)
      formula = formula.replace(/\\\\([a-zA-Z]+)/g, "\\$1");
      formula = formula.replace(/\\\\([{}_^#&%|()[\]])/g, "\\$1");
      // Normalize spaces inside \begin / \end{
      formula = formula.replace(/\\begin\s*\{\s*([a-zA-Z*]+)\s*\}/gi, "\\begin{$1}");
      formula = formula.replace(/\\end\s*\{\s*([a-zA-Z*]+)\s*\}/gi, "\\end{$1}");

      try {
        const formulaHtml = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        htmlResult += `
          <div class="block-math-pdf-container">
            ${formulaHtml}
          </div>
        `;
      } catch (err) {
        htmlResult += `<div class="error-math-pdf">${escapeHTML(formula)}</div>`;
      }
    } else {
      // Process lines for regular text, headings, lists, and inline math
      const lines = part.split(/\n+/);
      lines.forEach((line) => {
        let trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Check if standalone SVG placeholder in line
        const inlineSvgMatch = trimmedLine.match(/^@@SVG_BLOCK_(\d+)@@$/);
        if (inlineSvgMatch) {
          const blockIndex = parseInt(inlineSvgMatch[1], 10);
          if (svgBlocks[blockIndex]) {
            htmlResult += svgBlocks[blockIndex];
          }
          return;
        }

        // Convert HEADING: and SUB-HEADING: prefixes (supporting markdown bold/italic variants) to standard headings
        const rawCleanPrefix = trimmedLine.replace(/^[*_~`#\s]+/, "");
        if (/^(HEADING|TITLE|MAIN HEADING|MAIN TITLE|TOPIC|MAIN TOPIC|TOPIC HEADING)\s*(1|2)?\s*:\s*/i.test(rawCleanPrefix)) {
          const titleContent = rawCleanPrefix
            .replace(/^(HEADING|TITLE|MAIN HEADING|MAIN TITLE|TOPIC|MAIN TOPIC|TOPIC HEADING)\s*(1|2)?\s*:\s*/i, "")
            .replace(/[*_~`]+$/, "")
            .trim();
          trimmedLine = `### ${titleContent}`;
        } else if (/^(SUB-HEADING|SUBHEADING|SUB\s*HEADING|SUB-TITLE|SUBTITLE|SUB\s*TITLE|SUB-TOPIC|SUBTOPIC|SUB\s*TOPIC)\s*(1|2)?\s*:\s*/i.test(rawCleanPrefix)) {
          const subTitleContent = rawCleanPrefix
            .replace(/^(SUB-HEADING|SUBHEADING|SUB\s*HEADING|SUB-TITLE|SUBTITLE|SUB\s*TITLE|SUB-TOPIC|SUBTOPIC|SUB\s*TOPIC)\s*(1|2)?\s*:\s*/i, "")
            .replace(/[*_~`]+$/, "")
            .trim();
          trimmedLine = `#### ${subTitleContent}`;
        }

        // Check if line is a bullet/list item
        const isBullet = trimmedLine.startsWith("-") || trimmedLine.startsWith("*") || trimmedLine.startsWith("•");
        // Check if line is a definition list item (contains ":" or labels like "🌟")
        const isDefinition = trimmedLine.includes(":") && (trimmedLine.startsWith("🌟") || trimmedLine.startsWith("💡") || trimmedLine.startsWith("📌"));
        // Check if heading
        const isSubHeading = trimmedLine.startsWith("####");
        const isHeading = trimmedLine.startsWith("📌") || trimmedLine.startsWith("#") || trimmedLine.startsWith("###");

        // Parse inline math $...$
        let parsedLine = trimmedLine;
        
        // Find $...$ inline math segments
        const inlineMathRegex = /\$([\s\S]*?)\$/g;
        parsedLine = parsedLine.replace(inlineMathRegex, (match, formula) => {
          try {
            return katex.renderToString(formula, { displayMode: false, throwOnError: false });
          } catch {
            return match;
          }
        });

        // Parse Markdown formatting like bold **...** and italics _..._ / *...*
        parsedLine = parsedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        parsedLine = parsedLine.replace(/_([^_]+)_/g, "<em>$1</em>");
        parsedLine = parsedLine.replace(/`([^`]+)`/g, "<code>$1</code>");

        if (isSubHeading) {
          const subHeadingText = parsedLine.replace(/^####\s*/g, "").trim();
          htmlResult += `<h4 class="subheading-pdf" style="color: #67e8f9; font-size: 12.5px; font-weight: 700; margin-top: 12px; margin-bottom: 6px; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.2px;">🔹 ${subHeadingText}</h4>`;
        } else if (isHeading) {
          const headingText = parsedLine.replace(/^📌|^#+\s*/g, "").trim();
          const cleanHeading = headingText.toLowerCase();
          
          let headingColor = "#fbbf24"; // Rich warm gold default for headings
          if (cleanHeading.includes("formula") || cleanHeading.includes("equation") || cleanHeading.includes("math") || cleanHeading.includes("variable")) {
            headingColor = "#bae6fd"; // Pastel sky-blue
          } else if (cleanHeading.includes("tip") || cleanHeading.includes("exam") || cleanHeading.includes("warning")) {
            headingColor = "#fca5a5"; // Pastel pink
          }
          
          htmlResult += `<h3 class="heading-pdf" style="color: ${headingColor}; border-bottom: 1px solid ${headingColor}30; font-size: 14px; font-weight: 800; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.3px;">📌 ${headingText}</h3>`;
        } else if (isDefinition) {
          const colonIdx = parsedLine.indexOf(":");
          const label = parsedLine.substring(0, colonIdx).trim();
          const detail = parsedLine.substring(colonIdx + 1).trim();
          
          const cleanLabel = label.toLowerCase();
          let borderCol = "#fbbf24"; // Rich warm gold
          let bgCol = "rgba(251, 191, 36, 0.08)";
          let txtCol = "#fbbf24";
          let emoji = "🌟";
          
          if (
            /^(warning|alert|tip|hint|exam\s*tip|instruction|danger|attention|caution|error|question|answer|exercise|problem|चेतावनी|सुझाव|प्रश्न|उत्तर)$/i.test(cleanLabel) ||
            cleanLabel.includes("tip") ||
            cleanLabel.includes("warning") ||
            cleanLabel.includes("attention") ||
            cleanLabel.includes("danger")
          ) {
            borderCol = "#fca5a5"; // Pink
            bgCol = "rgba(252, 165, 165, 0.05)";
            txtCol = "#fca5a5";
            emoji = "🌸";
          } else if (
            /^(formula|equation|theorem|lemma|corollary|proof|identity|variable|math|physics|equation|maths|सूत्र|समीकरण)$/i.test(cleanLabel) ||
            cleanLabel.includes("formula") ||
            cleanLabel.includes("equation") ||
            cleanLabel.includes("theorem")
          ) {
            borderCol = "#bae6fd"; // Sky-Blue
            bgCol = "rgba(186, 230, 253, 0.05)";
            txtCol = "#bae6fd";
            emoji = "📐";
          }

          htmlResult += `
            <div class="def-pdf-card" style="border-left-color: ${borderCol}; background-color: ${bgCol}; margin-bottom: 8px;">
              <span class="def-pdf-label" style="color: ${txtCol};">${emoji} ${label}</span>
              <span class="def-pdf-detail">${detail}</span>
            </div>
          `;
        } else if (isBullet) {
          const bulletText = parsedLine.replace(/^[-*•]\s*/, "").trim();
          if (bulletText && bulletText !== "--" && bulletText !== "---" && bulletText !== "-" && bulletText !== "—") {
            htmlResult += `<li class="bullet-pdf" style="margin-bottom: 4px;">${bulletText}</li>`;
          }
        } else {
          if (parsedLine !== "--" && parsedLine !== "---" && parsedLine !== "-") {
            htmlResult += `<p class="paragraph-pdf" style="margin-bottom: 8px;">${parsedLine}</p>`;
          }
        }
      });
    }
  });

  return htmlResult;
};

const renderTextWithKaTeX = (text: string, search?: string): React.ReactNode[] => {
  if (!text) return [];
  
  // Normalize latex delimiters
  let normalized = text
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  const regex = /(\$\$[\s\S]*?\External?\$\$|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const standardRegex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = normalized.split(standardRegex);

  return parts.map((part, index) => {
    const trimmed = part.trim();
    if (!trimmed) return <span key={index}>{part}</span>;

    const isDisplayMath = trimmed.startsWith("$$") && trimmed.endsWith("$$");
    const isInlineMath = trimmed.startsWith("$") && trimmed.endsWith("$");

    if (isDisplayMath) {
      const formula = trimmed.slice(2, -2).trim();
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={index} className="my-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-teal-800 scrollbar-track-transparent" dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (err) {
        return <code key={index} className="block text-red-500 bg-red-50 p-2 rounded text-[10px]">{formula}</code>;
      }
    } else if (isInlineMath) {
      const formula = trimmed.slice(1, -1).trim();
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (err) {
        return <code key={index} className="text-red-500 bg-red-50 px-1 rounded text-[10px]">{formula}</code>;
      }
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex
      const highlightRegex = new RegExp(`(${cleanSearch})`, "gi");
      const textParts = part.split(highlightRegex);
      return (
        <span key={index}>
          {textParts.map((tPart, tIdx) => 
            highlightRegex.test(tPart) ? (
              <mark key={tIdx} className="bg-yellow-200 text-slate-900 font-extrabold rounded-xs px-0.5 shadow-xs border border-yellow-300/30">
                {tPart}
              </mark>
            ) : (
              tPart
            )
          )}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

export const StudentAccountHub: React.FC<StudentAccountHubProps> = ({
  onClose,
  studentName,
  grade,
  subject,
  board = "CBSE",
  mediumOfLearning = "Hinglish",
  totalSessionsCount = 0,
  onRefreshProfile,
  customBoardContent = "",
  pastSessions = [],
  sessionSnapshots = [],
  topics = [],
  activeTopicIndex = 0,
  topicBoardsContent = {},
  sessionId = null,
  activeDocument = null,
  onEnterClassroom,
  onDiscussWithCherry,
}) => {
  const [snapshots, setSnapshots] = useState<BoardSnapshot[]>([]);
  const [activeDesktopTab, setActiveDesktopTab] = useState<"books" | "stats" | "counselor">("stats");
  const [activeDimensionIndex, setActiveDimensionIndex] = useState<number>(0);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [isKiaraVoiceModalOpen, setIsKiaraVoiceModalOpen] = useState<boolean>(false);
  
  // Overhauled Archived PDF system core states
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [selectedBookSubjectFilter, setSelectedBookSubjectFilter] = useState<string>("all");
  const booksScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [currentBookHorizontalIndex, setCurrentBookHorizontalIndex] = useState(0);

  const handleBooksHorizontalScroll = (direction: "prev" | "next") => {
    if (!booksScrollContainerRef.current) return;
    const container = booksScrollContainerRef.current;
    const itemWidth = container.clientWidth;
    const newScrollLeft = direction === "next" 
      ? container.scrollLeft + itemWidth 
      : container.scrollLeft - itemWidth;
    container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const handleBooksScrollUpdate = () => {
    if (!booksScrollContainerRef.current) return;
    const container = booksScrollContainerRef.current;
    const itemWidth = container.clientWidth;
    if (itemWidth > 0) {
      const idx = Math.round(container.scrollLeft / itemWidth);
      setCurrentBookHorizontalIndex(Math.max(0, Math.min(idx, (filteredBooks.length || 1) - 1)));
    }
  };

  // Helper to infer or normalize subject for chapter books
  const inferBookSubject = (sess: any): string => {
    if (sess.subject && typeof sess.subject === "string" && sess.subject.trim()) {
      const s = sess.subject.trim();
      if (s.toLowerCase().includes("math")) return "Mathematics";
      if (s.toLowerCase().includes("phys")) return "Physics";
      if (s.toLowerCase().includes("chem")) return "Chemistry";
      if (s.toLowerCase().includes("bio")) return "Biology";
      if (s.toLowerCase().includes("sci")) return "Science";
      return s;
    }
    const chalkText = sess.customBoardContent || (sess.topicBoardsContent ? Object.values(sess.topicBoardsContent).join(" ") : "");
    const text = `${sess.activeDocumentName || ""} ${sess.title || ""} ${(sess.topics || []).join(" ")} ${chalkText}`.toLowerCase();
    
    // Check Chemistry first so ammonia/haber/acids/reactions/compounds are accurately recognized
    if (text.match(/ammonia|haber|nh3|hydrochloric|nitric|sulfuric|acid|base|salt|bond|reaction|organic|element|periodic|chemical|equilibrium|solution|electrochem|compound|hybridization|carbon|metal|atom|redox|titration|precipitation|catalyst|oxidation|reduction|mole|molarity|alkali|alkaline|halogen|valency|isomerism|hydrocarbon|ester|aldehyde|ketone|polymer|le chatelier|exothermic|endothermic|solubility|odour|gas/)) {
      return "Chemistry";
    }
    if (text.match(/trigonometr|algebra|calculus|derivative|integral|differential|geometry|matrix|determinant|quadratic|arithmetic|probability|polynomial|height|distance|triangle|circle|vector|parabola|hyperbola|ellipse|coordinate|logarithm|permutation|combination|binomial|limit|continuity/)) {
      return "Mathematics";
    }
    if (text.match(/cell|plant|photosynthe|genetic|dna|rna|circulation|respiration|organism|biotech|ecolog|human|tissue|reproduction|heart|blood|neuron|brain|kidney|digestion|endocrine|hormone|chromosome|mitosis|meiosis|ecosystem|bacteria|virus|fungi|enzyme|chlorophyll|stomata/)) {
      return "Biology";
    }
    if (text.match(/kinematic|motion|gravity|force|newton|momentum|energy|work|power|ohm|current|optics|lens|mirror|thermodynamic|magnetic|electromagnet|wave|frequency|wavelength|friction|light|circuit|volt|ampere|refraction|reflection|capacit|resistor|inductor|photoelectric|nuclear|doppler|torque|rotational|fluids|pressure|buoyancy|snell/)) {
      return "Physics";
    }
    return subject || "Science";
  };

  // Processed list of past sessions + Active Learning Context
  const allBooks = useMemo(() => {
    // Check if there is an active document or active chalkboard session not yet present in pastSessions
    const activeCtx = getActiveLearningContext();
    const existingSessionIds = new Set(pastSessions.map(s => s.sessionId).filter(Boolean));
    const existingDocNames = new Set(pastSessions.map(s => s.activeDocumentName).filter(Boolean));
    
    let synthesizedActiveBooks: any[] = [];
    if (activeDocument && (activeDocument.markdown || activeDocument.filename)) {
      const docName = activeDocument.filename || "Active Study Document";
      if (!existingDocNames.has(docName) && (!sessionId || !existingSessionIds.has(sessionId))) {
        synthesizedActiveBooks.push({
          sessionId: sessionId || "active_live_session",
          isLiveActive: true,
          activeDocumentName: docName,
          activeDocumentMarkdown: activeDocument.markdown || "",
          documentMarkdown: activeDocument.markdown || "",
          sourceMode: activeDocument.mimeType === "video/youtube" ? "explainer_youtube" : "explainer_doc",
          subject: activeDocument.detectedSubject || subject,
          grade: grade,
          board: board,
          customBoardContent: customBoardContent || "",
          topicBoardsContent: topicBoardsContent,
          topics: topics && topics.length > 0 ? topics : [docName],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (activeCtx && (activeCtx.documentMarkdown || activeCtx.blackboardContent) && activeCtx.sessionId && !existingSessionIds.has(activeCtx.sessionId)) {
      synthesizedActiveBooks.push({
        sessionId: activeCtx.sessionId,
        isLiveActive: true,
        activeDocumentName: activeCtx.title || "Active Learning Session",
        activeDocumentMarkdown: activeCtx.documentMarkdown || "",
        documentMarkdown: activeCtx.documentMarkdown || "",
        sourceMode: activeCtx.sourceMode || "live_blackboard",
        subject: activeCtx.subject || subject,
        grade: activeCtx.grade || grade,
        board: activeCtx.board || board,
        customBoardContent: activeCtx.blackboardContent || customBoardContent || "",
        topicBoardsContent: topicBoardsContent,
        topics: activeCtx.topics && activeCtx.topics.length > 0 ? activeCtx.topics : (topics || []),
        createdAt: activeCtx.lastUpdated || new Date().toISOString(),
        updatedAt: activeCtx.lastUpdated || new Date().toISOString(),
      });
    }

    const combinedList = [...synthesizedActiveBooks, ...pastSessions];

    return combinedList.map((sess, index) => {
      const originalTitle = sess.activeDocumentName || sess.title || `Class Lecture Hand-Handbook #${combinedList.length - index}`;
      const creationDate = sess.createdAt || sess.updatedAt;
      let dateString = sess.isLiveActive ? "🟢 Active Now (Live Context)" : "Recently Synced";
      if (creationDate && !sess.isLiveActive) {
        try {
          const date = creationDate.toDate ? creationDate.toDate() : new Date(creationDate.seconds ? creationDate.seconds * 1000 : creationDate);
          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const dayVal = String(date.getDate()).padStart(2, "0");
          const monthVal = months[date.getMonth()];
          const yearVal = date.getFullYear();
          let hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12;
          const timeVal = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
          dateString = `${dayVal} ${monthVal} ${yearVal}, ${timeVal}`;
        } catch (e) {
          dateString = "Recently Synced";
        }
      }

      // Infer appropriate sourceMode
      const resolvedSourceMode = sess.sourceMode || (
        sess.mimeType === "video/youtube" || (sess.activeDocumentName && sess.activeDocumentName.includes("YouTube"))
          ? "explainer_youtube"
          : (sess.documentMarkdown || sess.activeDocumentMarkdown)
            ? "explainer_doc"
            : "live_blackboard"
      );

      return {
        ...sess,
        processedTitle: originalTitle,
        formattedDateTime: dateString,
        index: combinedList.length - index,
        inferredSubject: inferBookSubject(sess),
        sourceMode: resolvedSourceMode,
        documentMarkdown: sess.documentMarkdown || sess.activeDocumentMarkdown || "",
        activeDocumentMarkdown: sess.activeDocumentMarkdown || sess.documentMarkdown || "",
      };
    });
  }, [pastSessions, subject, activeDocument, sessionId, customBoardContent, topicBoardsContent, topics, grade, board]);

  // Dynamic Subject Counts for Books Filter Tabs
  const bookSubjectCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allBooks.length,
      Mathematics: 0,
      Physics: 0,
      Chemistry: 0,
      Biology: 0,
      Science: 0,
    };
    allBooks.forEach((b) => {
      const subj = b.inferredSubject;
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    let result = allBooks;
    // 1. Subject filter
    if (selectedBookSubjectFilter !== "all") {
      result = result.filter((b) => b.inferredSubject.toLowerCase() === selectedBookSubjectFilter.toLowerCase());
    }
    // 2. Search query filter
    if (archiveSearchQuery.trim()) {
      const q = archiveSearchQuery.toLowerCase();
      result = result.filter((b) => 
        (b.processedTitle && b.processedTitle.toLowerCase().includes(q)) ||
        (b.inferredSubject && b.inferredSubject.toLowerCase().includes(q)) ||
        (b.formattedDateTime && b.formattedDateTime.toLowerCase().includes(q)) ||
        (Array.isArray(b.topics) && b.topics.some((t: string) => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [allBooks, selectedBookSubjectFilter, archiveSearchQuery]);
  
  // Helper to infer or normalize subject for snapshots
  const inferSnapshotSubject = (snap: any): string => {
    if (snap.subject && typeof snap.subject === "string" && snap.subject.trim()) {
      const s = snap.subject.trim();
      if (s.toLowerCase().includes("math")) return "Mathematics";
      if (s.toLowerCase().includes("phys")) return "Physics";
      if (s.toLowerCase().includes("chem")) return "Chemistry";
      if (s.toLowerCase().includes("bio")) return "Biology";
      if (s.toLowerCase().includes("sci")) return "Science";
      return s;
    }
    const text = `${snap.topicTitle || ""} ${snap.description || ""}`.toLowerCase();
    if (text.match(/ammonia|haber|nh3|hydrochloric|nitric|sulfuric|acid|base|salt|bond|reaction|organic|element|periodic|chemical|equilibrium|solution|electrochem|compound|hybridization|carbon|metal|atom|redox|titration|precipitation|catalyst|oxidation|reduction|mole|molarity|alkali|alkaline|halogen|valency|isomerism|hydrocarbon|ester|aldehyde|ketone|polymer|le chatelier|exothermic|endothermic|solubility|odour/)) {
      return "Chemistry";
    }
    if (text.match(/trigonometr|algebra|calculus|derivative|integral|differential|geometry|matrix|determinant|quadratic|arithmetic|probability|polynomial|height|distance|triangle|circle|vector|parabola|hyperbola|ellipse|coordinate|logarithm|permutation|combination|binomial|limit|continuity/)) {
      return "Mathematics";
    }
    if (text.match(/cell|plant|photosynthe|genetic|dna|rna|circulation|respiration|organism|biotech|ecolog|human|tissue|reproduction|heart|blood|neuron|brain|kidney|digestion|endocrine|hormone|chromosome|mitosis|meiosis|ecosystem|bacteria|virus|fungi|enzyme|chlorophyll|stomata/)) {
      return "Biology";
    }
    if (text.match(/kinematic|motion|gravity|force|newton|momentum|energy|work|power|ohm|current|optics|lens|mirror|thermodynamic|magnetic|electromagnet|wave|frequency|wavelength|friction|light|circuit|volt|ampere|refraction|reflection|capacit|resistor|inductor|photoelectric|nuclear|doppler|torque|rotational|fluids|pressure|buoyancy|snell/)) {
      return "Physics";
    }
    return subject || "Science";
  };

  // Combine Firestore snapshots and memory session snapshots for guest compatibility
  const allSnapshots = useMemo(() => {
    const combined: BoardSnapshot[] = [];
    const pushIfUnique = (s: any) => {
      const exists = combined.some((fb) => fb.snapshotId === s.snapshotId || (fb.topicTitle === s.topicTitle && fb.imgData === s.imgData));
      if (!exists) {
        combined.push({
          id: s.id || `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          snapshotId: s.snapshotId || s.id || `snap_${Date.now()}`,
          userId: s.userId,
          topicTitle: s.topicTitle || "Classroom Board Snapshot",
          description: s.description || "Interactive calculation whiteboard screenshot.",
          imgData: s.imgData,
          subject: inferSnapshotSubject(s),
          grade: s.grade || grade || "Class 10",
          topicIndex: typeof s.topicIndex === "number" ? s.topicIndex : undefined,
          timestamp: s.timestamp
        });
      }
    };

    snapshots.forEach(pushIfUnique);
    if (sessionSnapshots && sessionSnapshots.length > 0) {
      sessionSnapshots.forEach(pushIfUnique);
    }
    return combined;
  }, [snapshots, sessionSnapshots, subject, grade]);

  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [selectedSnapshotForModal, setSelectedSnapshotForModal] = useState<BoardSnapshot | null>(null);
  const [snapshotSearchQuery, setSnapshotSearchQuery] = useState("");
  const [selectedSnapshotSubjectFilter, setSelectedSnapshotSubjectFilter] = useState<string>("all");
  const snapshotScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [currentSnapshotHorizontalIndex, setCurrentSnapshotHorizontalIndex] = useState(0);

  const handleSnapshotHorizontalScroll = (direction: "prev" | "next") => {
    if (!snapshotScrollContainerRef.current) return;
    const container = snapshotScrollContainerRef.current;
    const itemWidth = container.clientWidth;
    const newScrollLeft = direction === "next" 
      ? container.scrollLeft + itemWidth 
      : container.scrollLeft - itemWidth;
    container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const handleSnapshotScrollUpdate = () => {
    if (!snapshotScrollContainerRef.current) return;
    const container = snapshotScrollContainerRef.current;
    const itemWidth = container.clientWidth;
    if (itemWidth > 0) {
      const idx = Math.round(container.scrollLeft / itemWidth);
      setCurrentSnapshotHorizontalIndex(Math.max(0, Math.min(idx, (filteredSnapshots.length || 1) - 1)));
    }
  };

  // Dynamic Subject Counts for Filter Tabs
  const snapshotSubjectCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allSnapshots.length,
      Mathematics: 0,
      Physics: 0,
      Chemistry: 0,
      Biology: 0,
      Science: 0,
      General: 0
    };
    allSnapshots.forEach((snap) => {
      const subj = inferSnapshotSubject(snap);
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [allSnapshots]);

  const filteredSnapshots = useMemo(() => {
    let result = allSnapshots;
    // 1. Subject filter
    if (selectedSnapshotSubjectFilter !== "all") {
      result = result.filter((s) => inferSnapshotSubject(s).toLowerCase() === selectedSnapshotSubjectFilter.toLowerCase());
    }
    // 2. Search query filter
    if (snapshotSearchQuery.trim()) {
      const q = snapshotSearchQuery.toLowerCase();
      result = result.filter((s) => 
        (s.topicTitle && s.topicTitle.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.subject && s.subject.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allSnapshots, selectedSnapshotSubjectFilter, snapshotSearchQuery]);

  // Smart Revision Deck States
  const [activeRevisionSession, setActiveRevisionSession] = useState<any | null>(null);
  const [revisionDeckData, setRevisionDeckData] = useState<any | null>(null);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [showFlashcardHint, setShowFlashcardHint] = useState(false);

    // New highly interactive states
  const [activeRevisionTab, setActiveRevisionTab] = useState<"flashcards" | "mindmap" | "summary">("flashcards");
  const [cardRatings, setCardRatings] = useState<Record<string, "hard" | "medium" | "easy">>({});
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [mindMapSearch, setMindMapSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({ 0: true });
  const [isVisualMapCollapsed, setIsVisualMapCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : true;
  });
  const [mindMapQuickFilter, setMindMapQuickFilter] = useState<"all" | "formulas" | "tips" | "concepts">("all");
  const [lastSelectedNodeId, setLastSelectedNodeId] = useState<number | null>(null);
  const [selectedSubNode, setSelectedSubNode] = useState<{ nodeId: number; subIdx: number } | null>(null);
  const [mindMapViewMode, setMindMapViewMode] = useState<"interactive" | "list">("interactive");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mindMapStyle, setMindMapStyle] = useState<"slate" | "pastel">("pastel");

  // Helper to determine active revision source mode details and styling
  const getSourceBadgeInfo = (sess: any) => {
    if (!sess) return {
      label: "Generated from Classroom Notes",
      shortLabel: "🏫 CLASS NOTES",
      icon: "🏫",
      bgClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      badgeColor: "#0d9488",
      description: "Classroom conceptual notes"
    };

    const mode = sess.sourceMode;
    const isDoc = mode === "explainer_doc" || !!sess.documentMarkdown || !!sess.activeDocumentMarkdown;
    const isYoutube = mode === "explainer_youtube" || sess.mimeType === "video/youtube" || sess.processedTitle?.includes("YouTube") || sess.processedTitle?.includes("(ID: ");
    const isDoubt = mode === "doubt_solver";
    const isMistake = mode === "mistake_vault";

    if (isDoc) {
      return {
        label: "Generated from Explainer Mode Document",
        shortLabel: "📄 EXPLAINER DOC",
        icon: "📄",
        bgClass: "bg-emerald-500/25 text-emerald-200 border-emerald-400/50",
        badgeColor: "#059669",
        description: "Parsed directly from uploaded document curriculum & notes"
      };
    }
    if (isYoutube) {
      return {
        label: "Generated from YouTube Video Lecture",
        shortLabel: "🎥 YOUTUBE LECTURE",
        icon: "🎥",
        bgClass: "bg-rose-500/25 text-rose-200 border-rose-400/50",
        badgeColor: "#e11d48",
        description: "Synthesized from YouTube video lesson transcript & curriculum"
      };
    }
    if (isDoubt) {
      return {
        label: "Generated from 1-on-1 Doubt Solver",
        shortLabel: "💡 DOUBT SOLVER",
        icon: "💡",
        bgClass: "bg-amber-500/25 text-amber-200 border-amber-400/50",
        badgeColor: "#d97706",
        description: "Constructed from interactive doubt clarification & answers"
      };
    }
    if (isMistake) {
      return {
        label: "Generated from Mistake Vault Analysis",
        shortLabel: "🛡️ MISTAKE VAULT",
        icon: "🛡️",
        bgClass: "bg-purple-500/25 text-purple-200 border-purple-400/50",
        badgeColor: "#7c3aed",
        description: "Extracted from quiz mistakes & high-yield error patterns"
      };
    }
    return {
      label: "Generated from Today's Live Blackboard",
      shortLabel: "🏫 LIVE BLACKBOARD",
      icon: "🏫",
      bgClass: "bg-teal-500/25 text-teal-200 border-teal-400/50",
      badgeColor: "#0d9488",
      description: "Direct from teacher's live chalkboard formulas & derivations"
    };
  };

  // Keyboard navigation for flashcards in Smart Revision
  useEffect(() => {
    if (!activeRevisionSession || activeRevisionTab !== "flashcards") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const total = revisionDeckData?.flashcards?.length || 0;
      if (total === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentFlashcardIndex(prev => {
          if (prev > 0) {
            setIsFlashcardFlipped(false);
            setShowFlashcardHint(false);
            return prev - 1;
          }
          return prev;
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentFlashcardIndex(prev => {
          if (prev < total - 1) {
            setIsFlashcardFlipped(false);
            setShowFlashcardHint(false);
            return prev + 1;
          }
          return prev;
        });
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlashcardFlipped(prev => !prev);
      } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowFlashcardHint(prev => !prev);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        const currentCard = revisionDeckData?.flashcards?.[currentFlashcardIndex];
        if (currentCard) {
          const cardId = currentCard.id || String(currentFlashcardIndex);
          toggleCardMastery(cardId);
        }
      } else if (isFlashcardFlipped && (e.key === "1" || e.key === "2" || e.key === "3")) {
        e.preventDefault();
        const currentCard = revisionDeckData?.flashcards?.[currentFlashcardIndex];
        if (currentCard) {
          const cardId = currentCard.id || String(currentFlashcardIndex);
          if (e.key === "1") handleRateCard(cardId, "hard");
          else if (e.key === "2") handleRateCard(cardId, "medium");
          else if (e.key === "3") handleRateCard(cardId, "easy");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeRevisionSession, activeRevisionTab, revisionDeckData, currentFlashcardIndex, isFlashcardFlipped]);

  const getPastelTheme = (index: number) => {
    const themes = [
      { fill: "#ffccd5", stroke: "#db2777", text: "#831843", badgeBg: "#fbc4b6", badgeText: "#450a0a" }, // Pink
      { fill: "#ffe3cc", stroke: "#ea580c", text: "#7c2d12", badgeBg: "#fed7aa", badgeText: "#431407" }, // Peach Orange
      { fill: "#f3e8ff", stroke: "#7c3aed", text: "#4c1d95", badgeBg: "#e9d5ff", badgeText: "#2e1065" }, // Lavender Purple
      { fill: "#e2faf5", stroke: "#0d9488", text: "#115e59", badgeBg: "#ccfbf1", badgeText: "#042f2e" }, // Mint Green
      { fill: "#fff9db", stroke: "#eab308", text: "#713f12", badgeBg: "#fef08a", badgeText: "#422006" }, // Soft Yellow
    ];
    return themes[index % themes.length];
  };

  const getSubNodePastelTheme = (parentIdx: number) => {
    const subThemes = [
      { fill: "#ccfbf1", stroke: "#0d9488", text: "#042f2e" }, // Mint Green
      { fill: "#f3e8ff", stroke: "#7c3aed", text: "#2e1065" }, // Lavender Purple
      { fill: "#ffe3cc", stroke: "#ea580c", text: "#431407" }, // Orange/Peach
      { fill: "#ffccd5", stroke: "#db2777", text: "#831843" }, // Coral/Pink
      { fill: "#fff9db", stroke: "#eab308", text: "#422006" }, // Soft Yellow
    ];
    return subThemes[(parentIdx + 1) % subThemes.length];
  };

  const getSubItems = (node: any) => {
    if (!node) return [];
    const concepts = node.keyConcepts || node.coreConcepts || [];
    const takeaways = node.subNodes || node.quickTakeaways || [];
    const items: { type: "concept" | "formula" | "tip"; text: string; label: string }[] = [];
    
    if (node.keyFormula) {
      items.push({ 
        type: "formula", 
        text: node.keyFormula, 
        label: "📐 Formula" 
      });
    }
    
    concepts.forEach((concept: string, idx: number) => {
      items.push({ 
        type: "concept", 
        text: concept, 
        label: `🧠 Concept ${idx + 1}` 
      });
    });
    
    takeaways.forEach((takeaway: string, idx: number) => {
      items.push({ 
        type: "tip", 
        text: takeaway, 
        label: `💡 Exam Tip ${idx + 1}` 
      });
    });
    
    return items;
  };

  const totalCards = revisionDeckData?.flashcards?.length || 0;

  const handleOpenRevisionDeck = (sess: any, data: any) => {
    setActiveRevisionSession(sess);
    setRevisionDeckData(data);
    setCurrentFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setShowFlashcardHint(false);
    setMindMapSearch("");
    setActiveRevisionTab("flashcards");
    setExpandedNodes({ 0: true });
    setMindMapQuickFilter("all");
    setLastSelectedNodeId(null);
    setSelectedSubNode(null);
    setMindMapViewMode("interactive");
    setIsMapFullscreen(false);
    setIsVisualMapCollapsed(typeof window !== "undefined" ? window.innerWidth < 768 : true);

    // Load mastery & ratings cache from local storage
    const storageKey = `revision_mastery_${sess.sessionId || sess.index}`;
    const ratingsKey = `revision_ratings_${sess.sessionId || sess.index}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMasteredCards(JSON.parse(saved));
      } else {
        setMasteredCards({});
      }
      const savedRatings = localStorage.getItem(ratingsKey);
      if (savedRatings) {
        setCardRatings(JSON.parse(savedRatings));
      } else {
        setCardRatings({});
      }
    } catch (_) {
      setMasteredCards({});
      setCardRatings({});
    }
  };

  const handleCloseRevisionDeck = () => {
    setActiveRevisionSession(null);
    setRevisionDeckData(null);
    setMasteredCards({});
    setCardRatings({});
    setShowFlashcardHint(false);
    setMindMapSearch("");
    setMindMapQuickFilter("all");
    setLastSelectedNodeId(null);
    setSelectedSubNode(null);
    setMindMapViewMode("interactive");
    setIsMapFullscreen(false);
  };

  const handleShuffleFlashcards = () => {
    if (!revisionDeckData?.flashcards || revisionDeckData.flashcards.length <= 1) return;
    const shuffled = [...revisionDeckData.flashcards].sort(() => Math.random() - 0.5);
    setRevisionDeckData((prev: any) => ({ ...prev, flashcards: shuffled }));
    setCurrentFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setShowFlashcardHint(false);
  };

  const handleResetMastery = () => {
    if (!activeRevisionSession) return;
    const storageKey = `revision_mastery_${activeRevisionSession.sessionId || activeRevisionSession.index}`;
    const ratingsKey = `revision_ratings_${activeRevisionSession.sessionId || activeRevisionSession.index}`;
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(ratingsKey);
    } catch (_) {}
    setMasteredCards({});
    setCardRatings({});
  };

  const handleDownloadMindMap = (format: "png" | "svg" | "pdf") => {
    // Helper to transform LaTeX formulas into clean, readable Unicode math text
    const formatLatexToReadable = (text: string): string => {
      if (!text) return "";
      let formatted = text;

      const subscripts: { [key: string]: string } = {
        "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
        "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ", "h": "ₕ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "p": "ₚ", "s": "ₛ", "t": "ₜ",
        "i": "ᵢ", "j": "ⱼ"
      };

      // Convert subscripts first to eliminate nested braces
      for (let i = 0; i < 5; i++) {
        formatted = formatted.replace(/_\{([a-zA-Z0-9]+)\}/g, (_, chars) => {
          return chars.split('').map((c: string) => subscripts[c] || c).join('');
        });
        formatted = formatted.replace(/_([a-zA-Z0-9])/g, (_, char) => subscripts[char] || char);
      }

      // Replace LaTeX frac with division slash
      for (let i = 0; i < 5; i++) {
        formatted = formatted.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2");
        formatted = formatted.replace(/\\frac\(([^()]+)\)\(([^()]+)\)/g, "$1/$2");
      }

      // LaTeX macros mapping
      formatted = formatted.replace(/\\neq\b/g, "≠");
      formatted = formatted.replace(/\\neq/g, "≠");
      formatted = formatted.replace(/\\quad\b/g, "  ");
      formatted = formatted.replace(/\\text\{([^{}]+)\}/g, "$1");
      formatted = formatted.replace(/\\Rightarrow\b/g, "⇒");
      formatted = formatted.replace(/\\Rightarrow/g, "⇒");
      formatted = formatted.replace(/\\dots\b/g, "...");
      formatted = formatted.replace(/\\dots/g, "...");
      formatted = formatted.replace(/\\cdot\b/g, "·");
      formatted = formatted.replace(/\\cdot/g, "·");
      formatted = formatted.replace(/\\pm\b/g, "±");
      formatted = formatted.replace(/\\pm/g, "±");
      formatted = formatted.replace(/\\ge\b/g, "≥");
      formatted = formatted.replace(/\\le\b/g, "≤");
      formatted = formatted.replace(/\\geq\b/g, "≥");
      formatted = formatted.replace(/\\leq\b/g, "≤");
      formatted = formatted.replace(/\\ge/g, "≥");
      formatted = formatted.replace(/\\le/g, "≤");
      formatted = formatted.replace(/\\geq/g, "≥");
      formatted = formatted.replace(/\\leq/g, "≤");
      formatted = formatted.replace(/\\approx\b/g, "≈");
      formatted = formatted.replace(/\\approx/g, "≈");

      // Greek letters mapping
      formatted = formatted.replace(/\\alpha\b/g, "α");
      formatted = formatted.replace(/\\beta\b/g, "β");
      formatted = formatted.replace(/\\gamma\b/g, "γ");
      formatted = formatted.replace(/\\theta\b/g, "θ");
      formatted = formatted.replace(/\\delta\b/g, "δ");
      formatted = formatted.replace(/\\Delta\b/g, "Δ");
      formatted = formatted.replace(/\\lambda\b/g, "λ");
      formatted = formatted.replace(/\\pi\b/g, "π");
      formatted = formatted.replace(/\\omega\b/g, "ω");
      formatted = formatted.replace(/\\phi\b/g, "φ");
      formatted = formatted.replace(/\\sigma\b/g, "σ");
      formatted = formatted.replace(/\\mu\b/g, "μ");
      formatted = formatted.replace(/\\tau\b/g, "τ");

      // Remove math dollar boundaries
      formatted = formatted.replace(/\$\$/g, "");
      formatted = formatted.replace(/\$/g, "");

      // Normalize spaces
      formatted = formatted.replace(/ \s+/g, " ");

      return formatted.trim();
    };

    // Utility functions to wrap text elegantly
    const wrapText = (text: string, maxCharsPerLine: number = 28): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      
      words.forEach(word => {
        if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
          currentLine = (currentLine + " " + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const wrapParentText = (text: string, maxLen: number = 22): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      words.forEach(word => {
        if ((currentLine + " " + word).trim().length <= maxLen) {
          currentLine = (currentLine + " " + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Helper to generate the beautifully crafted, high-definition complete SVG
    const generateFullDetailedMindMapSVG = () => {
      const nodes = revisionDeckData?.mindMap?.nodes || [];
      const subjectName = activeRevisionSession?.subject || subject || "Syllabus";
      const chapterTitle = activeRevisionSession?.processedTitle || revisionDeckData?.mindMap?.title || "Concept Mind Map";
      const gradeLevel = grade || "10";

      // Canvas config for complete layout
      const width = 1600;
      const height = 1200;
      const cx = 800;
      const cy = 600;
      const rx = 380;
      const ry = 280;
      const subDist = 210; // Comfortable distance for fanning out cards

      let svgContent = "";

      // 1. Gradients and Filters definition
      if (mindMapStyle === "pastel") {
        svgContent += `
          <defs>
            <linearGradient id="dl-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FAF6F0" />
              <stop offset="100%" stop-color="#FAF6F0" />
            </linearGradient>
            <linearGradient id="dl-hub-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#b4a4eb" />
              <stop offset="100%" stop-color="#9f86f0" />
            </linearGradient>
            <linearGradient id="dl-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#fcfbf9" />
            </linearGradient>
            <filter id="dl-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.08" />
            </filter>
            <marker id="dl-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4b5563" />
            </marker>
          </defs>
        `;
      } else {
        svgContent += `
          <defs>
            <linearGradient id="dl-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#021417" />
              <stop offset="50%" stop-color="#051e22" />
              <stop offset="100%" stop-color="#0c2e2c" />
            </linearGradient>
            <linearGradient id="dl-hub-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0d9488" />
              <stop offset="100%" stop-color="#0f766e" />
            </linearGradient>
            <linearGradient id="dl-node-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#114c47" />
              <stop offset="100%" stop-color="#0d3c38" />
            </linearGradient>
            <linearGradient id="dl-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#071b1e" />
              <stop offset="100%" stop-color="#031113" />
            </linearGradient>
            <filter id="dl-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.6" />
            </filter>
          </defs>
        `;
      }

      // Backdrop
      svgContent += `
        <rect width="${width}" height="${height}" fill="url(#dl-bg-grad)" />
        
        <!-- Background organic grid design -->
        <g opacity="${mindMapStyle === "pastel" ? "0.6" : "0.12"}">
      `;
      for (let x = 0; x < width; x += 32) {
        for (let y = 0; y < height; y += 32) {
          svgContent += `<circle cx="${x}" cy="${y}" r="1" fill="${mindMapStyle === "pastel" ? "#e5dcd0" : "#2dd4bf"}" />`;
        }
      }
      svgContent += `</g>`;

      // Outer safety border ring
      svgContent += `
        <circle cx="${cx}" cy="${cy}" r="${rx}" fill="none" stroke="${mindMapStyle === "pastel" ? "#e5dcd0" : "#114c47"}" stroke-width="1.5" stroke-dasharray="12 12" opacity="0.4" />
        <circle cx="${cx}" cy="${cy}" r="${rx + subDist}" fill="none" stroke="${mindMapStyle === "pastel" ? "#e5dcd0" : "#2dd4bf"}" stroke-width="1" stroke-dasharray="6 8" opacity="0.3" />
      `;

      // 2. Draw Connection Lines: Hub to Parent Nodes
      const N = nodes.length || 1;
      nodes.forEach((_: any, index: number) => {
        const angle = (2 * Math.PI * index) / N - Math.PI / 2;
        const targetX = cx + rx * Math.cos(angle);
        const targetY = cy + ry * Math.sin(angle);

        const pTheme = getPastelTheme(index);

        if (mindMapStyle === "pastel") {
          svgContent += `
            <!-- Connection to Topic ${index + 1} -->
            <line 
              x1="${cx}" 
              y1="${cy}" 
              x2="${targetX}" 
              y2="${targetY}" 
              stroke="${pTheme.stroke}" 
              stroke-width="2" 
              stroke-linecap="round"
              marker-end="url(#dl-arrow-head)"
            />
          `;
        } else {
          svgContent += `
            <!-- Connection to Topic ${index + 1} -->
            <line 
              x1="${cx}" 
              y1="${cy}" 
              x2="${targetX}" 
              y2="${targetY}" 
              stroke="#114c47" 
              stroke-width="3.5" 
              stroke-linecap="round"
            />
            <line 
              x1="${cx}" 
              y1="${cy}" 
              x2="${targetX}" 
              y2="${targetY}" 
              stroke="#2dd4bf" 
              stroke-width="1.5" 
              stroke-dasharray="8 6" 
              opacity="0.75"
            />
          `;
        }
      });

      // 3. Draw Sub-branch Connections and Detailed Cards
      nodes.forEach((node: any, index: number) => {
        const angle = (2 * Math.PI * index) / N - Math.PI / 2;
        const targetX = cx + rx * Math.cos(angle);
        const targetY = cy + ry * Math.sin(angle);

        const subItems = getSubItems(node);
        const K = subItems.length;
        if (K === 0) return;

        // Categorize node into sector (left, right, top, bottom) to prevent overlapping
        let sector: "top" | "bottom" | "left" | "right" = "top";
        if (targetX < cx - 80) {
          sector = "left";
        } else if (targetX > cx + 80) {
          sector = "right";
        } else if (targetY < cy) {
          sector = "top";
        } else {
          sector = "bottom";
        }

        subItems.forEach((subItem: any, i: number) => {
          let subX = targetX;
          let subY = targetY;
          let parentConnectorX = targetX;
          let parentConnectorY = targetY;
          let childConnectorX = targetX;
          let childConnectorY = targetY;

          const cardW = 195;
          const cardH = 95;

          if (sector === "left") {
            // Stack vertically in a column on the left side
            const vSpacing = 112;
            const startY = targetY - ((K - 1) * vSpacing) / 2;
            subX = targetX - 225;
            subY = startY + i * vSpacing;

            parentConnectorX = targetX - 105; // Left edge of parent capsule
            parentConnectorY = targetY;
            childConnectorX = subX + cardW / 2; // Right edge of child card
            childConnectorY = subY;
          } else if (sector === "right") {
            // Stack vertically in a column on the right side
            const vSpacing = 112;
            const startY = targetY - ((K - 1) * vSpacing) / 2;
            subX = targetX + 225;
            subY = startY + i * vSpacing;

            parentConnectorX = targetX + 105; // Right edge of parent capsule
            parentConnectorY = targetY;
            childConnectorX = subX - cardW / 2; // Left edge of child card
            childConnectorY = subY;
          } else if (sector === "top") {
            // Align horizontally above
            if (K <= 3) {
              const hSpacing = 215;
              const startX = targetX - ((K - 1) * hSpacing) / 2;
              subX = startX + i * hSpacing;
              subY = targetY - 145;
            } else {
              // Split into two neat rows to prevent side-clipping
              const row1Count = Math.min(3, Math.ceil(K / 2));
              const row2Count = K - row1Count;
              if (i < row1Count) {
                const startX = targetX - ((row1Count - 1) * 215) / 2;
                subX = startX + i * 215;
                subY = targetY - 105;
              } else {
                const row2Idx = i - row1Count;
                const startX = targetX - ((row2Count - 1) * 215) / 2;
                subX = startX + row2Idx * 215;
                subY = targetY - 220;
              }
            }

            parentConnectorX = targetX;
            parentConnectorY = targetY - 28; // Top edge of parent capsule
            childConnectorX = subX;
            childConnectorY = subY + cardH / 2; // Bottom edge of child card
          } else {
            // Align horizontally below
            if (K <= 3) {
              const hSpacing = 215;
              const startX = targetX - ((K - 1) * hSpacing) / 2;
              subX = startX + i * hSpacing;
              subY = targetY + 145;
            } else {
              const row1Count = Math.min(3, Math.ceil(K / 2));
              const row2Count = K - row1Count;
              if (i < row1Count) {
                const startX = targetX - ((row1Count - 1) * 215) / 2;
                subX = startX + i * 215;
                subY = targetY + 105;
              } else {
                const row2Idx = i - row1Count;
                const startX = targetX - ((row2Count - 1) * 215) / 2;
                subX = startX + row2Idx * 215;
                subY = targetY + 220;
              }
            }

            parentConnectorX = targetX;
            parentConnectorY = targetY + 28; // Bottom edge of parent capsule
            childConnectorX = subX;
            childConnectorY = subY - cardH / 2; // Top edge of child card
          }

          const cardX = subX - cardW / 2;
          const cardY = subY - cardH / 2;

          const pTheme = getPastelTheme(index);
          const subTheme = getSubNodePastelTheme(index);

          let typeLabel = "";
          let accentColor = "#38bdf8"; // Concept (sky blue)
          if (subItem.type === "formula") {
            typeLabel = "📐 RULE / FORMULA";
            accentColor = mindMapStyle === "pastel" ? subTheme.stroke : "#f59e0b"; // Formula (amber)
          } else if (subItem.type === "tip") {
            typeLabel = "💡 EXAM PRO-TIP";
            accentColor = mindMapStyle === "pastel" ? subTheme.stroke : "#10b981"; // Tip (emerald)
          } else {
            typeLabel = "🧠 KEY CONCEPT";
            accentColor = mindMapStyle === "pastel" ? subTheme.stroke : "#38bdf8";
          }

          // Connector line from parent node to sub-card
          if (mindMapStyle === "pastel") {
            svgContent += `
              <line 
                x1="${parentConnectorX}" 
                y1="${parentConnectorY}" 
                x2="${childConnectorX}" 
                y2="${childConnectorY}" 
                stroke="${pTheme.stroke}" 
                stroke-width="1.5" 
                marker-end="url(#dl-arrow-head)"
              />
            `;
          } else {
            svgContent += `
              <line 
                x1="${parentConnectorX}" 
                y1="${parentConnectorY}" 
                x2="${childConnectorX}" 
                y2="${childConnectorY}" 
                stroke="${accentColor}" 
                stroke-width="1.8" 
                stroke-dasharray="4 3.5" 
                opacity="0.85"
              />
              <circle cx="${childConnectorX}" cy="${childConnectorY}" r="3.5" fill="${accentColor}" />
            `;
          }

          const cardFill = mindMapStyle === "pastel" ? subTheme.fill : "url(#dl-card-grad)";
          const cardStroke = mindMapStyle === "pastel" ? subTheme.stroke : accentColor;
          const labelFill = mindMapStyle === "pastel" ? subTheme.text : accentColor;
          const textFill = mindMapStyle === "pastel" ? subTheme.text : "#e2e8f0";

          // Beautiful detailed card container with shadow
          svgContent += `
            <g filter="url(#dl-shadow)">
              <rect 
                x="${cardX}" 
                y="${cardY}" 
                width="${cardW}" 
                height="${cardH}" 
                rx="12" 
                ry="12" 
                fill="${cardFill}" 
                stroke="${cardStroke}" 
                stroke-width="1.5" 
              />
              
              <!-- Subtle accent top header plate -->
              <path 
                d="M ${cardX + 12} ${cardY} L ${cardX + cardW - 12} ${cardY} A 12 12 0 0 1 ${cardX + cardW} ${cardY + 12} L ${cardX + cardW} ${cardY + 22} L ${cardX} ${cardY + 22} L ${cardX} ${cardY + 12} A 12 12 0 0 1 ${cardX + 12} ${cardY} Z" 
                fill="${cardStroke}" 
                opacity="0.08"
              />
              
              <!-- Header badge text inside card -->
              <text 
                x="${subX}" 
                y="${cardY + 14}" 
                text-anchor="middle" 
                fill="${labelFill}" 
                font-size="8.5" 
                font-weight="900" 
                font-family="'JetBrains Mono', monospace" 
                letter-spacing="1"
              >
                ${typeLabel}
              </text>
          `;

          // Wrap actual detailed text content beautifully
          const readableText = formatLatexToReadable(subItem.text);
          const wrappedLines = wrapText(readableText, 28);
          const displayLines = wrappedLines.slice(0, 4); // Show maximum 4 lines to fit card neatly
          const lineCount = displayLines.length;
          
          // Vertically center the text lines inside card body
          const textBlockHeight = lineCount * 12;
          const startY = subY + 11 - textBlockHeight / 2;

          displayLines.forEach((lineText: string, lineIdx: number) => {
            // Escape any XML entities to ensure output SVG parses cleanly
            const escapedText = lineText
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&apos;");

            const isLastLineTruncated = lineIdx === 3 && wrappedLines.length > 4;
            const lineToRender = isLastLineTruncated ? escapedText.slice(0, 24) + "..." : escapedText;

            svgContent += `
              <text 
                x="${subX}" 
                y="${startY + lineIdx * 12}" 
                text-anchor="middle" 
                fill="${textFill}" 
                font-size="8.5" 
                font-weight="600" 
                font-family="'Inter', system-ui, sans-serif"
              >
                ${lineToRender}
              </text>
            `;
          });

          svgContent += `</g>`;
        });
      });

      // 4. Draw Parent Node Capsules (Drawn on top of lines for high-quality layering)
      nodes.forEach((node: any, index: number) => {
        const angle = (2 * Math.PI * index) / N - Math.PI / 2;
        const targetX = cx + rx * Math.cos(angle);
        const targetY = cy + ry * Math.sin(angle);

        const capW = 210;
        const capH = 56;
        const capX = targetX - capW / 2;
        const capY = targetY - capH / 2;

        const topicName = node.topicName || `Topic ${index + 1}`;
        const wrappedName = wrapParentText(topicName, 22);

        const pTheme = getPastelTheme(index);

        if (mindMapStyle === "pastel") {
          svgContent += `
            <!-- Topic Capsule ${index + 1} -->
            <g filter="url(#dl-shadow)">
              <rect 
                x="${capX}" 
                y="${capY}" 
                width="${capW}" 
                height="${capH}" 
                rx="14" 
                ry="14" 
                fill="${pTheme.fill}" 
                stroke="${pTheme.stroke}" 
                stroke-width="2" 
              />
              
              <!-- Left-side vertical indicator strip -->
              <rect 
                x="${capX + 8}" 
                y="${capY + 8}" 
                width="4" 
                height="${capH - 16}" 
                rx="2" 
                fill="${pTheme.stroke}" 
              />
              
              <!-- Bullet Badge counter index -->
              <circle 
                cx="${capX + 26}" 
                cy="${targetY}" 
                r="10" 
                fill="${pTheme.stroke}" 
                stroke="${pTheme.text}" 
                stroke-width="1.5" 
              />
              <text 
                x="${capX + 26}" 
                y="${targetY + 3.5}" 
                text-anchor="middle" 
                fill="#ffffff" 
                font-size="9" 
                font-weight="900" 
                font-family="'JetBrains Mono', monospace"
              >
                ${index + 1}
              </text>
          `;

          if (wrappedName.length <= 1) {
            const line = wrappedName[0] || topicName;
            svgContent += `
              <text 
                x="${capX + 46}" 
                y="${targetY + 4}" 
                fill="${pTheme.text}" 
                font-size="11.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${line.toUpperCase()}
              </text>
            `;
          } else {
            svgContent += `
              <text 
                x="${capX + 46}" 
                y="${targetY - 2}" 
                fill="${pTheme.text}" 
                font-size="10.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${wrappedName[0].toUpperCase()}
              </text>
              <text 
                x="${capX + 46}" 
                y="${targetY + 10}" 
                fill="${pTheme.stroke}" 
                font-size="9.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${wrappedName[1].toUpperCase()}
              </text>
            `;
          }
        } else {
          svgContent += `
            <!-- Topic Capsule ${index + 1} -->
            <g filter="url(#dl-shadow)">
              <rect 
                x="${capX}" 
                y="${capY}" 
                width="${capW}" 
                height="${capH}" 
                rx="14" 
                ry="14" 
                fill="url(#dl-node-grad)" 
                stroke="#0f766e" 
                stroke-width="2" 
              />
              
              <!-- Left-side vertical indicator strip -->
              <rect 
                x="${capX + 8}" 
                y="${capY + 8}" 
                width="4" 
                height="${capH - 16}" 
                rx="2" 
                fill="#2dd4bf" 
              />
              
              <!-- Bullet Badge counter index -->
              <circle 
                cx="${capX + 26}" 
                cy="${targetY}" 
                r="10" 
                fill="#0c2e2c" 
                stroke="#2dd4bf" 
                stroke-width="1.5" 
              />
              <text 
                x="${capX + 26}" 
                y="${targetY + 3.5}" 
                text-anchor="middle" 
                fill="#2dd4bf" 
                font-size="9" 
                font-weight="900" 
                font-family="'JetBrains Mono', monospace"
              >
                ${index + 1}
              </text>
          `;

          if (wrappedName.length <= 1) {
            const line = wrappedName[0] || topicName;
            svgContent += `
              <text 
                x="${capX + 46}" 
                y="${targetY + 4}" 
                fill="#ffffff" 
                font-size="11.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${line.toUpperCase()}
              </text>
            `;
          } else {
            svgContent += `
              <text 
                x="${capX + 46}" 
                y="${targetY - 2}" 
                fill="#ffffff" 
                font-size="10.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${wrappedName[0].toUpperCase()}
              </text>
              <text 
                x="${capX + 46}" 
                y="${targetY + 10}" 
                fill="#2dd4bf" 
                font-size="9.5" 
                font-weight="800" 
                font-family="'Inter', system-ui, sans-serif"
                letter-spacing="0.3"
              >
                ${wrappedName[1].toUpperCase()}
              </text>
            `;
          }
        }

        svgContent += `</g>`;
      });

      // 5. Draw Central Hub Bubble (Drawn on top at exact center)
      const hubW = 290;
      const hubH = 92;
      const hubX = cx - hubW / 2;
      const hubY = cy - hubH / 2;

      if (mindMapStyle === "pastel") {
        svgContent += `
          <!-- Central Hub -->
          <g filter="url(#dl-shadow)">
            <rect 
              x="${hubX}" 
              y="${hubY}" 
              width="${hubW}" 
              height="${hubH}" 
              rx="24" 
              ry="24" 
              fill="url(#dl-hub-grad)" 
              stroke="#7c3aed" 
              stroke-width="3" 
            />
            <!-- Highlighting Yellow crown banner -->
            <rect 
              x="${cx - 65}" 
              y="${hubY - 6}" 
              width="130" 
              height="18" 
              rx="6" 
              ry="6" 
              fill="#ffca28" 
            />
            <text 
              x="${cx}" 
              y="${hubY + 6}" 
              text-anchor="middle" 
              fill="#3e2723" 
              font-size="8.5" 
              font-weight="900" 
              font-family="'JetBrains Mono', monospace" 
              letter-spacing="1.5"
            >
              REVISION CENTER
            </text>
            
            <text 
              x="${cx}" 
              y="${cy + 8}" 
              text-anchor="middle" 
              fill="#ffffff" 
              font-size="14" 
              font-weight="900" 
              font-family="'Inter', system-ui, sans-serif" 
              letter-spacing="0.5"
            >
              ${subjectName.toUpperCase()}
            </text>
            
            <text 
              x="${cx}" 
              y="${cy + 27}" 
              text-anchor="middle" 
              fill="#fdfaf6" 
              font-size="9.5" 
              font-weight="800" 
              font-family="'Inter', system-ui, sans-serif" 
              letter-spacing="0.5"
              opacity="0.9"
            >
              CLASS ${gradeLevel} • ${chapterTitle.toUpperCase().slice(0, 36)}
            </text>
          </g>
        `;
      } else {
        svgContent += `
          <!-- Central Hub -->
          <g filter="url(#dl-shadow)">
            <rect 
              x="${hubX}" 
              y="${hubY}" 
              width="${hubW}" 
              height="${hubH}" 
              rx="24" 
              ry="24" 
              fill="url(#dl-hub-grad)" 
              stroke="#2dd4bf" 
              stroke-width="3" 
            />
            <!-- Highlighting Orange crown banner -->
            <rect 
              x="${cx - 65}" 
              y="${hubY - 6}" 
              width="130" 
              height="18" 
              rx="6" 
              ry="6" 
              fill="#f59e0b" 
            />
            <text 
              x="${cx}" 
              y="${hubY + 6}" 
              text-anchor="middle" 
              fill="#0f172a" 
              font-size="8.5" 
              font-weight="900" 
              font-family="'JetBrains Mono', monospace" 
              letter-spacing="1.5"
            >
              REVISION CENTER
            </text>
            
            <text 
              x="${cx}" 
              y="${cy + 8}" 
              text-anchor="middle" 
              fill="#ffffff" 
              font-size="14" 
              font-weight="900" 
              font-family="'Inter', system-ui, sans-serif" 
              letter-spacing="0.5"
            >
              ${subjectName.toUpperCase()}
            </text>
            
            <text 
              x="${cx}" 
              y="${cy + 27}" 
              text-anchor="middle" 
              fill="#e2e8f0" 
              font-size="9.5" 
              font-weight="800" 
              font-family="'Inter', system-ui, sans-serif" 
              letter-spacing="0.5"
              opacity="0.9"
            >
              CLASS ${gradeLevel} • ${chapterTitle.toUpperCase().slice(0, 36)}
            </text>
          </g>
        `;
      }

      // Wrapping inside proper standard XML container
      const finalSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 ${width} ${height}" 
  width="${width}" 
  height="${height}"
>
  <style>
    text {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      user-select: none;
    }
  </style>
  ${svgContent}
</svg>`;

      return finalSvg;
    };

    const title = revisionDeckData?.mindMap?.title || "Concept_Mind_Map";
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_").replace(/__+/g, "_");
    const subName = (activeRevisionSession?.subject || subject || "Syllabus").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${cleanTitle}_${subName}`;

    const svgString = generateFullDetailedMindMapSVG();

    if (format === "svg") {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      // PDF print window with embedded high-resolution SVG
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${title} - Concept Mind Map</title>
              <style>
                @page { size: landscape; margin: 8mm; }
                body {
                  margin: 0;
                  padding: 12px;
                  background: #ffffff;
                  color: #0f172a;
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                }
                .header {
                  text-align: center;
                  margin-bottom: 12px;
                  width: 100%;
                }
                .header h1 {
                  font-size: 18px;
                  font-weight: 900;
                  color: #0d9488;
                  margin: 0 0 4px 0;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .header p {
                  font-size: 11px;
                  color: #64748b;
                  margin: 0;
                  font-weight: 600;
                }
                .svg-container {
                  width: 100%;
                  max-width: 1000px;
                  display: flex;
                  justify-content: center;
                }
                .svg-container svg {
                  width: 100%;
                  height: auto;
                  max-height: 85vh;
                  border-radius: 12px;
                }
                @media print {
                  body { padding: 0; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${title}</h1>
                <p>Cherry AI Smart Revision Concept Map • Class ${grade} • ${subName.replace(/_/g, " ")}</p>
              </div>
              <div class="svg-container">
                ${svgString}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      // PNG format - convert SVG to high-definition Canvas
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Super high resolution rendering (1600x1200)
        canvas.width = 1600;
        canvas.height = 1200;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw SVG onto canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Clean up object URL
        URL.revokeObjectURL(url);
        
        // Download PNG
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      img.onerror = () => {
        // Fallback to direct SVG if PNG rendering fails due to canvas security/conversions
        const fallbackLink = document.createElement("a");
        fallbackLink.href = url;
        fallbackLink.download = `${filename}.svg`;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
      };
      
      img.src = url;
    }
  };

  const toggleCardMastery = (cardId: string) => {
    if (!activeRevisionSession) return;
    setMasteredCards(prev => {
      const updated = { ...prev, [cardId]: !prev[cardId] };
      const storageKey = `revision_mastery_${activeRevisionSession.sessionId || activeRevisionSession.index}`;
      safeSetItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRateCard = (cardId: string, rating: "hard" | "medium" | "easy") => {
    if (!activeRevisionSession) return;
    
    // Update rating state and localStorage
    setCardRatings(prev => {
      const updated = { ...prev, [cardId]: rating };
      const ratingsKey = `revision_ratings_${activeRevisionSession.sessionId || activeRevisionSession.index}`;
      safeSetItem(ratingsKey, JSON.stringify(updated));
      return updated;
    });

    // Update mastery status based on rating: easy/medium counts as mastered/understood, hard unmarks mastery
    setMasteredCards(prev => {
      const isMastered = rating === "easy" || rating === "medium";
      const updated = { ...prev, [cardId]: isMastered };
      const storageKey = `revision_mastery_${activeRevisionSession.sessionId || activeRevisionSession.index}`;
      safeSetItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    // If there is a next card, smoothly advance after a small 350ms delay
    const total = revisionDeckData?.flashcards?.length || 0;
    if (currentFlashcardIndex < total - 1) {
      setTimeout(() => {
        setCurrentFlashcardIndex(prev => prev + 1);
        setIsFlashcardFlipped(false);
        setShowFlashcardHint(false);
      }, 350);
    }
  };

  const handleDiscussWithCherry = (card: any) => {
    const concept = card.conceptTested || card.question?.substring(0, 60) || "Revision Concept";
    const question = card.question || "";
    const answer = card.answer || "";
    const hint = card.hint || "";
    const cardSubject = activeRevisionSession?.inferredSubject || activeRevisionSession?.subject || subject || "Mathematics";

    if (onDiscussWithCherry) {
      onDiscussWithCherry({
        topic: concept,
        question,
        answer,
        hint,
        conceptTested: card.conceptTested,
        subject: cardSubject
      });
    } else if (onEnterClassroom) {
      onEnterClassroom();
    }
  };

  const toggleNodeExpansion = (nodeIdx: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeIdx]: !prev[nodeIdx]
    }));
    setLastSelectedNodeId(nodeIdx);
    setSelectedSubNode(null);
  };

  const handleSvgNodeClick = (nodeIdx: number) => {
    setExpandedNodes({ [nodeIdx]: true });
    setLastSelectedNodeId(nodeIdx);
    setSelectedSubNode(null);
    setTimeout(() => {
      const element = document.getElementById(`mindmap-node-${nodeIdx}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleGenerateRevisionDeck = async (sess: any) => {
    setActiveRevisionSession(sess);
    setLoadingRevision(true);
    setRevisionDeckData(null);
    setCurrentFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setMindMapSearch("");
    setMindMapQuickFilter("all");
    setLastSelectedNodeId(null);
    setSelectedSubNode(null);
    setMindMapViewMode("interactive");
    setIsMapFullscreen(false);
    
    try {
      const payload = getUnifiedRevisionPayload(sess);

      const response = await fetch("/api/generate-revision-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionTitle: payload.sessionTitle,
          subject: payload.subject || sess.subject || subject,
          topics: payload.topics || [],
          sourceMode: payload.sourceMode,
          documentMarkdown: sess.documentMarkdown || sess.activeDocumentMarkdown || "",
          blackboardContent: payload.combinedContent
        })
      });

      if (!response.ok) {
        throw new Error("Generation request failed");
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        safeSetItem(`revision_deck_${sess.sessionId || sess.index}`, JSON.stringify(resData.data));
        handleOpenRevisionDeck(sess, resData.data);
      } else {
        throw new Error(resData.error || "Invalid response structure");
      }
    } catch (error) {
      console.error("Error generating revision deck:", error);
      alert("Sorry, could not generate revision deck at this time. Please try again!");
      setActiveRevisionSession(null);
    } finally {
      setLoadingRevision(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"activity" | "gallery">("activity");
  const [activeMobileSubTab, setActiveMobileSubTab] = useState<"profile" | "books" | "stats" | "counselor">("stats");
  const [editingProfile, setEditingProfile] = useState(false);
  
  // States for student editable metrics
  const [editName, setEditName] = useState(studentName);
  const [editGrade, setEditGrade] = useState(grade);
  const [editBoard, setEditBoard] = useState(board);
  const [editMediumOfLearning, setEditMediumOfLearning] = useState(mediumOfLearning);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setEditName(studentName);
    setEditGrade(grade);
    setEditBoard(board);
    setEditMediumOfLearning(mediumOfLearning);
  }, [studentName, grade, board, mediumOfLearning]);

  const currentUser = auth.currentUser || (() => {
    const cached = localStorage.getItem("local_active_user");
    if (cached) {
      try { return JSON.parse(cached); } catch (_) {}
    }
    return { uid: "local_guest_student", displayName: "Student", isAnonymous: true };
  })();

  // Retrieve blackboard snapshots from Firebase & local fallback keys
  const fetchSnapshots = async () => {
    const uid = currentUser?.uid || "local_guest_student";
    setLoadingSnapshots(true);
    try {
      if (uid === "local_guest_student" || uid.startsWith("local_")) {
        throw new Error("Local guest user bypassed database fetch");
      }
      const snapRef = collection(db, "studentProfiles", uid, "boardSnapshots");
      const q = query(snapRef, orderBy("timestamp", "desc"), limit(40));
      const snapshotDocs = await getDocs(q);
      const parsed = snapshotDocs.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          snapshotId: d.snapshotId || docSnap.id,
          userId: d.userId,
          topicTitle: d.topicTitle || "Classroom Board Snapshot",
          description: d.description || "Interactive calculation whiteboard screenshot.",
          imgData: d.imgData,
          subject: d.subject,
          grade: d.grade,
          topicIndex: d.topicIndex,
          timestamp: d.timestamp
        } as BoardSnapshot;
      });
      setSnapshots(parsed);
      safeSetItem(`snapshots_${uid}`, JSON.stringify(parsed));
    } catch (e) {
      const cachedStr = localStorage.getItem(`snapshots_${uid}`) ||
                        localStorage.getItem("snapshots_local_guest_student") ||
                        localStorage.getItem("snapshots_guest") ||
                        localStorage.getItem("all_board_snapshots");
      if (cachedStr) {
        try {
          setSnapshots(JSON.parse(cachedStr));
        } catch (_) {}
      }
    } finally {
      setLoadingSnapshots(false);
    }
  };

  // Real-time snapshots and quiz attempts listeners
  useEffect(() => {
    const uid = currentUser?.uid || "local_guest_student";
    const isGuest = uid === "local_guest_student" || uid.startsWith("local_");
    if (isGuest) {
      // Local Guest fallbacks - load across all storage keys
      const cachedSnapsStr = localStorage.getItem(`snapshots_${uid}`) ||
                             localStorage.getItem("snapshots_local_guest_student") ||
                             localStorage.getItem("snapshots_guest") ||
                             localStorage.getItem("all_board_snapshots");
      if (cachedSnapsStr) {
        try { setSnapshots(JSON.parse(cachedSnapsStr)); } catch (_) {}
      }
      const cachedQuizzes = localStorage.getItem(`guest_quiz_attempts_${subject}`);
      if (cachedQuizzes) {
        try { setQuizAttempts(JSON.parse(cachedQuizzes)); } catch (_) {}
      }
      return;
    }

    // 1. Real-time board snapshots listener
    const snapRef = collection(db, "studentProfiles", uid, "boardSnapshots");
    const qSnaps = query(snapRef, orderBy("timestamp", "desc"), limit(40));
    const unsubSnaps = onSnapshot(qSnaps, (snapshotDocs) => {
      const parsed = snapshotDocs.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          snapshotId: d.snapshotId || docSnap.id,
          userId: d.userId,
          topicTitle: d.topicTitle || "Classroom Board Snapshot",
          description: d.description || "Interactive calculation whiteboard screenshot.",
          imgData: d.imgData,
          subject: d.subject,
          grade: d.grade,
          topicIndex: d.topicIndex,
          timestamp: d.timestamp
        } as BoardSnapshot;
      });
      setSnapshots(parsed);
      safeSetItem(`snapshots_${uid}`, JSON.stringify(parsed));
    }, (error) => {
      console.warn("Realtime board snapshots listener failed, using local cache:", error);
      const cachedSnapsStr = localStorage.getItem(`snapshots_${uid}`) ||
                             localStorage.getItem("snapshots_local_guest_student") ||
                             localStorage.getItem("all_board_snapshots");
      if (cachedSnapsStr) {
        try { setSnapshots(JSON.parse(cachedSnapsStr)); } catch (_) {}
      }
    });

    // 2. Real-time quiz attempts listener
    const attemptsRef = collection(db, "studentProfiles", uid, "quizAttempts");
    const qQuizzes = query(attemptsRef, orderBy("timestamp", "desc"), limit(50));
    const unsubQuizzes = onSnapshot(qQuizzes, (snapshotDocs) => {
      const parsed = snapshotDocs.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          attemptId: docSnap.id,
          timestamp: d.timestamp,
          score: d.score,
          total: d.total,
          accuracy: d.accuracy,
          source: d.source,
          docName: d.docName,
          subject: d.subject,
          grade: d.grade,
          history: d.history || []
        };
      });
      setQuizAttempts(parsed);
      safeSetItem(`quizAttempts_${uid}`, JSON.stringify(parsed));
    }, (error) => {
      console.warn("Realtime quiz attempts listener failed:", error);
    });

    return () => {
      unsubSnaps();
      unsubQuizzes();
    };
  }, [currentUser?.uid, subject]);

  // Compute dashboard statistics in real-time
  const dashboardStats = useMemo(() => {
    // Filter attempts for currently selected subject, or use all as fallback if active subject has no attempts
    let subjectAttempts = quizAttempts.filter(
      (a) => (a.subject || "").toLowerCase() === subject.toLowerCase()
    );
    if (subjectAttempts.length === 0) {
      subjectAttempts = quizAttempts; // Fallback to all
    }

    // Default dimensions if no attempts are recorded
    let conceptClarity = 75;
    let theoreticalCore = 70;
    let calculationPrecision = 60;
    let formulaRecall = 65;
    
    // Strengths & Growth lists
    let strengths: Array<{ concept: string; category: string }> = [];
    let growths: Array<{ concept: string; category: string; explanation: string }> = [];

    if (subjectAttempts.length > 0) {
      // Gather all question answers
      let conceptCorrect = 0, conceptTotal = 0;
      let theoryCorrect = 0, theoryTotal = 0;
      let calcCorrect = 0, calcTotal = 0;
      let formulaCorrect = 0, formulaTotal = 0;

      subjectAttempts.forEach((attempt) => {
        const history = attempt.history || [];
        history.forEach((h: any) => {
          const category = (h.cognitiveCategory || "").toLowerCase();
          const isCorrect = !!h.isCorrect;
          
          if (category.includes("concept") || category.includes("clarity")) {
            conceptTotal++;
            if (isCorrect) conceptCorrect++;
          } else if (category.includes("theory") || category.includes("theoretical") || category.includes("core")) {
            theoryTotal++;
            if (isCorrect) theoryCorrect++;
          } else if (category.includes("calculation") || category.includes("solving") || category.includes("precision")) {
            calcTotal++;
            if (isCorrect) calcCorrect++;
          } else if (category.includes("formula") || category.includes("retention") || category.includes("recall")) {
            formulaTotal++;
            if (isCorrect) formulaCorrect++;
          }

          // Gather strengths and growths
          if (isCorrect) {
            if (h.conceptTested && !strengths.some(s => s.concept === h.conceptTested)) {
              strengths.push({ concept: h.conceptTested, category: h.cognitiveCategory || "Topic Mastery" });
            }
          } else {
            if (h.conceptTested && !growths.some(g => g.concept === h.conceptTested)) {
              growths.push({ 
                concept: h.conceptTested, 
                category: h.cognitiveCategory || "Topic Mastery",
                explanation: h.explanation || h.theoryTested || "A quick chalkboard review will help solidify this concept!"
              });
            }
          }
        });
      });

      if (conceptTotal > 0) conceptClarity = Math.round((conceptCorrect / conceptTotal) * 100);
      if (theoryTotal > 0) theoreticalCore = Math.round((theoryCorrect / theoryTotal) * 100);
      if (calcTotal > 0) calculationPrecision = Math.round((calcCorrect / calcTotal) * 100);
      if (formulaTotal > 0) formulaRecall = Math.round((formulaCorrect / formulaTotal) * 100);
    }

    // Classroom Engagement / Socratic Stamina calculation
    const classesSess = pastSessions?.length || 0;
    const totalSnapshots = snapshots?.length || 0;
    const totalQuizzes = quizAttempts?.length || 0;
    const masteredCount = Object.keys(masteredCards).filter(k => masteredCards[k]).length;

    const sessionScore = Math.min(45, classesSess * 15);
    const snapScore = Math.min(25, totalSnapshots * 5);
    const quizScore = Math.min(20, totalQuizzes * 10);
    const cardScore = Math.min(10, masteredCount * 2);
    
    const socraticStamina = Math.min(100, Math.max(30, sessionScore + snapScore + quizScore + cardScore));

    // Default lists if empty to keep dashboard lively
    if (strengths.length === 0) {
      strengths = [
        { concept: "Linear Equation Formulation", category: "Conceptual Application" },
        { concept: "Standard Chalkboard Definitions", category: "Theoretical Core" },
      ];
    }
    if (growths.length === 0) {
      growths = [
        { 
          concept: "Multi-Step Calculation Flow", 
          category: "Calculations & Solving", 
          explanation: "Watch for signs when transposing terms across algebraic equations." 
        },
        { 
          concept: "Formulas for Area & Volume", 
          category: "Formula Retention", 
          explanation: "Practice active recall on area coefficients of common geometric shapes." 
        }
      ];
    }

    return {
      conceptClarity,
      theoreticalCore,
      calculationPrecision,
      formulaRecall,
      socraticStamina,
      strengths,
      growths,
      subjectAttempts
    };
  }, [quizAttempts, subject, pastSessions, snapshots, masteredCards]);

  const lowestMetric = useMemo(() => {
    const metrics = [
      { name: "Concept Clarity", score: dashboardStats.conceptClarity, icon: "🎯" },
      { name: "Theoretical Core", score: dashboardStats.theoreticalCore, icon: "📖" },
      { name: "Calculation Precision", score: dashboardStats.calculationPrecision, icon: "⚡" },
      { name: "Formula Recall", score: dashboardStats.formulaRecall, icon: "🧠" },
      { name: "Socratic Stamina", score: dashboardStats.socraticStamina, icon: "🔥" },
    ];
    return metrics.reduce((min, m) => (m.score < min.score ? m : min), metrics[0]);
  }, [dashboardStats]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const profileData = {
        name: editName,
        grade: editGrade,
        subject: subject || "Mathematics", // dynamic per session/mode, retained for backward compatibility
        board: editBoard,
        mediumOfLearning: editMediumOfLearning
      };
      safeSetItem(`studentProfile_${currentUser.uid}`, JSON.stringify(profileData));

      if (currentUser.uid !== "local_guest_student" && !currentUser.uid.startsWith("local_")) {
        const profileRef = doc(db, "studentProfiles", currentUser.uid);
        await updateDoc(profileRef, {
          ...profileData,
          updatedAt: serverTimestamp()
        });
      }
      setEditingProfile(false);
      if (onRefreshProfile) onRefreshProfile();
    } catch (err) {
      console.warn("Failed saving student updates to Firestore, saved locally:", err);
      setEditingProfile(false);
      if (onRefreshProfile) onRefreshProfile();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    const uid = currentUser?.uid || "local_guest_student";
    if (!confirm("Are you sure you want to delete this board snapshot?")) return;
    try {
      // Delete from all local storage caches
      const cleanKey = (k: string) => {
        const cachedStr = localStorage.getItem(k);
        if (cachedStr) {
          try {
            const localSnaps = JSON.parse(cachedStr);
            const filtered = localSnaps.filter((s: any) => s.id !== id && s.snapshotId !== id);
            safeSetItem(k, JSON.stringify(filtered));
          } catch (_) {}
        }
      };

      cleanKey(`snapshots_${uid}`);
      cleanKey("snapshots_local_guest_student");
      cleanKey("all_board_snapshots");

      setSnapshots((prev) => prev.filter((s) => s.id !== id && s.snapshotId !== id));

      if (uid !== "local_guest_student" && !uid.startsWith("local_")) {
        await deleteDoc(doc(db, "studentProfiles", uid, "boardSnapshots", id));
      }
    } catch (e) {
      console.warn("Failed deleting snapshot from Firestore, deleted locally:", e);
    }
  };

  const handleDownloadImage = (snapshot: BoardSnapshot) => {
    try {
      const link = document.createElement("a");
      link.href = snapshot.imgData;
      link.download = `${snapshot.topicTitle.replace(/[^a-zA-Z0-9]/g, "_")}_board.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed downloading snapshot image file:", err);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Saved Topic";
    }
  };

  const handleExportSessionToPDF = (sess: any) => {
    try {
      const isCurrentSessionObj = !sess || sess.sessionId === sessionId;
      const sessTopics = sess && sess.topics ? sess.topics : (isCurrentSessionObj ? topics : []);
      const sessTopicBoards = sess && sess.topicBoardsContent ? sess.topicBoardsContent : (isCurrentSessionObj ? topicBoardsContent : {});
      const sessCustomBoard = sess && sess.customBoardContent ? sess.customBoardContent : (isCurrentSessionObj ? customBoardContent : "");

      const activeSubjectName = sess?.subject || subject || "Hindi";
      const rawTitle = sess && sess.activeDocumentName 
        ? sess.activeDocumentName 
        : (isCurrentSessionObj ? (`${activeSubjectName} - Active Classroom Session`) : "Classroom Lecture Notes");
      
      const cleanSessionTitle = sanitizeTitleForPDF(rawTitle, activeSubjectName, sessTopics);
      
      const sessionDateStr = sess && sess.updatedAt?.seconds 
        ? new Date(sess.updatedAt.seconds * 1000).toLocaleString()
        : new Date().toLocaleString();

      let compiledHtml = "";

      if (sessTopics && sessTopics.length > 0) {
        // Compile all topic sequential parts with their chalk content!
        sessTopics.forEach((topicText: string, index: number) => {
          const headerLine = topicText.split("\n")[0] || "";
          const rawHeader = headerLine.replace(/[\#\*\_]/g, "").trim() || `Topic Part ${index + 1}`;
          const cleanHeader = sanitizeTitleForPDF(rawHeader);
          
          const boardContentForTopic = sessTopicBoards[index] || "";
          
          // Fallback to custom board content for first page if empty
          let displayNotes = boardContentForTopic;
          if (index === 0 && !displayNotes && sessCustomBoard) {
            displayNotes = sessCustomBoard;
          }
          
          const cleanNotes = displayNotes ? displayNotes.trim() : "";
          const hasContent = Boolean(cleanNotes && cleanNotes.length > 0);

          if (hasContent) {
            const notesHTML = compileWhiteboardToHTML(cleanNotes);

            compiledHtml += `
              <div class="pdf-page-wrapper" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1.5px dashed rgba(255, 255, 255, 0.15); page-break-inside: avoid;">
                <div class="slide-header" style="display: flex; justify-content: space-between; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #67e8f9; font-weight: bold; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                  <span>📝 TOPIC SECTION ${index + 1}</span>
                  <span>CHERRY LECTURE HANDOUT</span>
                </div>
                <h2 class="slide-title" style="font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                  📌 ${cleanHeader}
                </h2>
                <div class="parsed-latex-topic-content font-chalk text-left" style="background-color: #0b241e; border: 1.5px solid rgba(103, 232, 249, 0.2); color: #f3f4f6; padding: 20px; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 12.5px; line-height: 1.7; box-shadow: inset 0 2px 6px rgba(0,0,0,0.3);">
                  ${notesHTML}
                </div>
              </div>
            `;
          }
        });
      } else {
        // Fallback for single general topic
        const cleanContent = sessCustomBoard ? sessCustomBoard.trim() : "";
        const notesHTML = compileWhiteboardToHTML(cleanContent);
        compiledHtml += `
          <div class="pdf-page-wrapper" style="margin-bottom: 24px; page-break-inside: avoid;">
            <div class="slide-header" style="display: flex; justify-content: space-between; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #67e8f9; font-weight: bold; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span>📝 BLACKBOARD SHEET</span>
              <span>CHERRY LECTURE HANDOUT</span>
            </div>
            <h2 class="slide-title" style="font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 800; text-transform: uppercase;">
              📌 Main Chalkboard Calculations
            </h2>
            <div class="parsed-latex-topic-content font-chalk text-left" style="background-color: #0b241e; border: 1.5px solid rgba(103, 232, 249, 0.2); color: #f3f4f6; padding: 20px; border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 12.5px; line-height: 1.7; box-shadow: inset 0 2px 6px rgba(0,0,0,0.3);">
              ${notesHTML}
            </div>
          </div>
        `;
      }

      // 2. Open pop-up window formatted perfectly as a digital Blackboard hand-book
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocker is preventing PDF generation. Please allow pop-ups for this site to export study materials!");
        return;
      }

      const bookTitle = `${cleanSessionTitle} - Blackboard Book`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${bookTitle.replace(/[^a-zA-Z0-9]/g, "_")}</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;505;600;700;850&family=Space+Grotesk:wght@600;750;850&family=JetBrains+Mono&display=swap">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #f1f5f9;
              line-height: 1.6;
              margin: 0;
              padding: 30px;
              background-color: #041411; /* Dark aesthetic blackboard classroom canvas background */
            }
            .book-container {
              max-width: 860px;
              margin: 0 auto;
              background: #061c18; /* Rich slate dark green board sheet */
              border: 1.5px solid rgba(245, 158, 11, 0.25);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            }
            .print-header {
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .print-title {
              font-family: 'Space Grotesk', sans-serif;
              color: #ffffff;
              font-size: 20px;
              font-weight: 850;
              letter-spacing: -0.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .print-subtitle {
              color: #fbbf24;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin: 4px 0 0 0;
            }
            .print-brand {
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 800;
              font-size: 11px;
              color: #061c18;
              background-color: #f59e0b;
              padding: 6px 14px;
              border-radius: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              background-color: rgba(245, 158, 11, 0.05);
              padding: 18px;
              border-radius: 12px;
              margin-bottom: 30px;
              border: 1px solid rgba(245, 158, 11, 0.15);
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
              color: #94a3b8;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .meta-value {
              font-size: 12px;
              font-weight: 700;
              color: #ffffff;
              margin-top: 2px;
            }
            .block-math-pdf-container {
              background: rgba(255,255,255,0.04);
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
              overflow-x: auto;
              border-left: 3.5px solid #f59e0b;
              text-align: center;
              box-shadow: inset 0 1px 4px rgba(0,0,0,0.2);
            }
            .block-math-pdf-container .katex-display {
              margin: 0;
            }
            .def-pdf-card {
              border-left: 4px solid #f59e0b;
              background-color: rgba(255,255,255,0.03);
              padding: 12px;
              border-radius: 0 8px 8px 0;
              margin: 12px 0;
            }
            .def-pdf-label {
              display: block;
              font-weight: 800;
              font-family: 'Space Grotesk', sans-serif;
              font-size: 11px;
              color: #fbbf24;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .def-pdf-detail {
              font-size: 12px;
              color: #e2e8f0;
            }
            .heading-pdf {
              font-family: 'Space Grotesk', sans-serif;
              font-size: 13px;
              color: #fbbf24;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              padding-bottom: 4px;
              margin-top: 20px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .vector-diagram-pdf-card {
              margin: 16px auto;
              padding: 14px;
              background: #061c18 !important;
              border: 1.5px solid rgba(103, 232, 249, 0.4) !important;
              border-radius: 12px;
              text-align: center;
              page-break-inside: avoid;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .vector-diagram-pdf-card svg {
              max-height: 280px;
              max-width: 520px;
              width: 100%;
              height: auto;
              margin: 0 auto;
              display: block;
            }
            .print-footer {
              margin-top: 40px;
              border-top: 1px solid rgba(245, 158, 11, 0.2);
              padding-top: 16px;
              font-size: 10.5px;
              color: #cbd5e1;
              font-weight: 600;
              text-transform: uppercase;
              text-align: center;
              letter-spacing: 1px;
            }
            .action-panel {
              background: #082621;
              border: 1.5px dashed rgba(245, 158, 11, 0.3);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              color: white;
            }
            .action-btn {
              background-color: #f59e0b;
              color: #061c18;
              border: none;
              padding: 10px 20px;
              font-size: 12px;
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 800;
              border-radius: 8px;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              transition: all 0.2s;
            }
            .action-btn:hover {
              background-color: #d97706;
              transform: translateY(-1px);
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 0;
                background-color: transparent;
                color: #000000 !important;
              }
              .book-container {
                border: none;
                padding: 0;
                box-shadow: none;
                background: transparent !important;
              }
              .print-header {
                border-bottom: 2px solid #0f766e !important;
              }
              .print-title {
                color: #1e293b !important;
              }
              .print-subtitle {
                color: #0f766e !important;
                font-weight: 800 !important;
              }
              .print-brand {
                border: 1.5px solid #0f766e !important;
                background-color: transparent !important;
                color: #0f766e !important;
              }
              .slide-header {
                color: #0f766e !important;
                border-bottom-color: #e2e8f0 !important;
              }
              .slide-title {
                color: #0f172a !important;
              }
              .meta-grid {
                background-color: #f1f5f9 !important;
                border: 1px solid #cbd5e1 !important;
              }
              .meta-value {
                color: #1e293b !important;
              }
              .meta-label {
                color: #64748b !important;
              }
              .parsed-latex-topic-content {
                background-color: #f8fafc !important;
                border: 1.5px solid #e2e8f0 !important;
                color: #1e293b !important;
                box-shadow: none !important;
              }
              .block-math-pdf-container {
                background: #f1f5f9 !important;
                border-left-color: #0f766e !important;
              }
              .heading-pdf {
                color: #0f766e !important;
                border-bottom-color: #cbd5e1 !important;
                font-weight: 800 !important;
              }
              .subheading-pdf {
                color: #0369a1 !important;
                font-weight: 700 !important;
              }
              .def-pdf-card {
                border-left-color: #0f766e !important;
              }
              .def-pdf-label {
                color: #0f766e !important;
              }
              .def-pdf-detail {
                color: #334155 !important;
              }
              .empty-topic-compact {
                background-color: #f8fafc !important;
                border-color: #cbd5e1 !important;
              }
              .empty-topic-compact .empty-topic-title {
                color: #475569 !important;
              }
              .empty-topic-compact .empty-topic-badge {
                color: #94a3b8 !important;
              }
              .vector-diagram-pdf-card {
                background: #061c18 !important;
                border: 1.5px solid #0284c7 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                page-break-inside: avoid !important;
              }
              .vector-diagram-pdf-card svg {
                display: block !important;
                max-height: 280px !important;
              }
              .print-footer {
                border-top-color: #cbd5e1 !important;
                color: #64748b !important;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="action-panel no-print">
            <div style="text-align: left;">
              <span style="font-size: 13px; font-weight: 850; color: #ffffff;">Board-Book Generation Center</span>
              <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 0 0;">Review your formatted math calculations & chalkboard slides, then tap below to download as a secure PDF.</p>
            </div>
            <button class="action-btn" onclick="window.print()">🖨️ Save as PDF / Print Book</button>
          </div>

          <div class="book-container">
            <div class="print-header">
              <div style="text-align: left;">
                <h1 class="print-title">${cleanSessionTitle}</h1>
                <p class="print-subtitle">Maestry Whiteboard Session Study Handout</p>
              </div>
              <div class="print-brand">
                Cherry Ma'am
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Prepared For</span>
                <span class="meta-value">${studentName || "Cherry's Student"}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Class Year & Subject</span>
                <span class="meta-value">${grade} • ${subject}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Class Topic</span>
                <span class="meta-value">${cleanSessionTitle}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Saved Time</span>
                <span class="meta-value">${sessionDateStr}</span>
              </div>
            </div>

            <div class="notes-section">
              ${compiledHtml}
            </div>

            <div class="print-footer">
              Study material synchronized via Maestry Cloud Sync • Optimized for PDF Printout 🌸
            </div>
          </div>

          <script>
            window.addEventListener('DOMContentLoaded', () => {
              if (window.renderMathInElement) {
                renderMathInElement(document.body, {
                  delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                  ]
                });
              }
              setTimeout(() => {
                window.print();
              }, 800);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Single Session PDF download compilation failed:", err);
    }
  };

  const handleExportToPDF = (sessionTitle: string, latexContent: string, timestampStr: string) => {
    try {
      const cleanTitle = sanitizeTitleForPDF(sessionTitle, subject, topics);
      // 1. Compile LaTeX blackboard to highly formatted print-ready HTML
      const parsedHTML = compileWhiteboardToHTML(latexContent);

      // 2. Open pop-up window for clean native system printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocker is preventing PDF generation. Please allow pop-ups for this site to export study materials!");
        return;
      }

      // 3. Populate HTML template styled perfectly for print-to-PDF output
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Session Study Notes - ${sessionTitle.replace(/[^a-zA-Z0-9]/g, "_")}</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono&display=swap');
            
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #1e293b;
              line-height: 1.6;
              margin: 0;
              padding: 45px;
              background-color: #ffffff;
            }
            .print-header {
              border-bottom: 2px dashed #0f766e;
              padding-bottom: 16px;
              margin-bottom: 28px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header-main {
              flex: 1;
            }
            .print-title {
              font-family: 'Space Grotesk', sans-serif;
              color: #0f3c42;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: -0.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .print-subtitle {
              color: #0f766e;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 6px 0 0 0;
            }
            .print-brand {
              text-align: right;
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 700;
              font-size: 11px;
              color: #0f766e;
              border: 1.5px solid #0f766e;
              padding: 4px 10px;
              border-radius: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              background: #f0fdfa;
              border: 1px solid #ccfbf1;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 32px;
              font-size: 12.5px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              color: #0d9488;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.8px;
            }
            .meta-value {
              color: #1e293b;
              font-weight: 650;
              margin-top: 3px;
            }
            .notes-section {
              margin-top: 20px;
              min-height: 300px;
            }
            .heading-pdf {
              font-family: 'Space Grotesk', sans-serif;
              color: #0c4f52;
              font-size: 17px;
              font-weight: 750;
              margin-top: 28px;
              margin-bottom: 12px;
              border-left: 4.5px solid #14b8a6;
              padding-left: 12px;
              page-break-after: avoid;
            }
            .paragraph-pdf {
              font-size: 13px;
              margin-bottom: 12px;
              color: #334155;
              text-align: justify;
            }
            .bullet-pdf {
              font-size: 13px;
              margin-bottom: 8px;
              color: #334155;
              margin-left: 24px;
              list-style-type: square;
            }
            .block-math-pdf-container {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
              overflow-x: auto;
              page-break-inside: avoid;
              box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.02);
            }
            .katex-display {
              margin: 0.5em 0 !important;
              overflow-x: auto;
              overflow-y: hidden;
            }
            .def-pdf-card {
              background: #fffbeb;
              border-left: 4.5px solid #f59e0b;
              border-radius: 4px 10px 10px 4px;
              padding: 14px 18px;
              margin: 18px 0;
              page-break-inside: avoid;
            }
            .def-pdf-label {
              display: block;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 800;
              color: #b45309;
              letter-spacing: 0.8px;
            }
            .def-pdf-detail {
              display: block;
              font-size: 12.5px;
              color: #78350f;
              margin-top: 5px;
              font-weight: 500;
            }
            code {
              font-family: 'JetBrains Mono', monospace;
              background-color: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              color: #0f172a;
              border: 1px solid #e2e8f0;
            }
            strong {
              color: #0f172a;
              font-weight: 700;
            }
            .error-math-pdf {
              color: #ef4444;
              font-family: 'JetBrains Mono', monospace;
              background: #fef2f2;
              border: 1px solid #fee2e2;
              padding: 12px;
              border-radius: 10px;
              margin: 12px 0;
              font-size: 11px;
            }
            .print-footer {
              margin-top: 60px;
              border-top: 1.5px solid #e2e8f0;
              padding-top: 20px;
              text-align: center;
              font-size: 10.5px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              page-break-inside: avoid;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
              @page {
                size: A4;
                margin: 2cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="header-main">
              <h1 class="print-title">${cleanTitle}</h1>
              <p class="print-subtitle">Maestry Interactive Classroom Handout</p>
            </div>
            <div class="print-brand">
              Cherry Ma'am
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Prepared For</span>
              <span class="meta-value">\${studentName || "Cherry's Student"}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Class Year & Subject</span>
              <span class="meta-value">\${grade} • \${subject}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Class Topic</span>
              <span class="meta-value">\${cleanTitle}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Saved Time</span>
              <span class="meta-value">\${timestampStr}</span>
            </div>
          </div>

          <div class="notes-section">
            \${parsedHTML}
          </div>

          <div class="print-footer">
            Study material synchronized via Maestry Cloud Sync • Optimized for PDF Printout 🌸
          </div>

          <script>
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => {
                window.print();
              }, 600);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("PDF generator crash details:", err);
    }
  };

  const handleExportCombinedPDF = () => {
    try {
      const isSnapshotsEmpty = !allSnapshots || allSnapshots.length === 0;
      
      const bookTitle = `${subject} Combined Blackboard Lecture-Book`;
      const subTitle = isSnapshotsEmpty 
        ? "Syllabus Taught Sequence Handouts" 
        : "Whiteboard Snapped Lecture Pages";

      let combinedHtml = "";
      
      const sortedSnapshots = [...allSnapshots].sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      if (!isSnapshotsEmpty) {
        sortedSnapshots.forEach((item, index) => {
          const dateStr = formatDate(item.timestamp);
          const cleanSlideTitle = sanitizeTitleForPDF(item.topicTitle);
          combinedHtml += `
            <div class="pdf-page-wrapper">
              <div class="slide-header">
                <span class="slide-number">BOARD SLIDE #${String(index + 1).padStart(2, '0')}</span>
                <span class="slide-time">📅 ${dateStr}</span>
              </div>
              
              <h2 class="slide-title">📌 ${cleanSlideTitle}</h2>
              
              <div class="chalkboard-frame-container">
                ${item.imgData ? `
                  <img src="${item.imgData}" alt="${cleanSlideTitle}" class="chalkboard-image" referrerpolicy="no-referrer" />
                ` : `
                  <div class="no-image-placeholder">Visual Board Frame Preview Pending</div>
                `}
              </div>

              <div class="slide-notes-card">
                <div class="notes-badge">🎓 TOPIC EXPLANATION & STUDY NOTE</div>
                <p class="notes-text">${item.description || "Interactive whiteboard derivations, drawings, and chalkboard notes."}</p>
              </div>
            </div>
          `;
        });
      } else if (topics && topics.length > 0) {
        // Compile ALL topics/slides from active syllabus in chronological sequence! This is an amazing feature!
        topics.forEach((topicContent, index) => {
          const rawHeading = topicContent.split("\n")[0].replace(/[#*]/g, "").trim() || `Topic ${index + 1}`;
          const headingText = sanitizeTitleForPDF(rawHeading);
          const contentHTML = compileWhiteboardToHTML(topicContent);
          
          combinedHtml += `
            <div class="pdf-page-wrapper">
              <div class="slide-header">
                <span class="slide-number">SYLLABUS TOPIC #${String(index + 1).padStart(2, '0')}</span>
                <span class="slide-time">📚 Sequence Taught Material</span>
              </div>
              
              <h2 class="slide-title">📌 ${headingText}</h2>
              
              <div class="parsed-latex-topic-content">
                ${contentHTML}
              </div>
            </div>
          `;
        });
      } else {
        const fallbackHTML = compileWhiteboardToHTML(customBoardContent || "No active whiteboard chalkboard notes compiled in active lecture workspace yet.");
        combinedHtml += `
          <div class="pdf-page-wrapper">
            <div class="slide-header">
              <span class="slide-number">ACTIVE SLATE BOARD</span>
              <span class="slide-time">📸 Instant Handout</span>
            </div>
            <h2 class="slide-title">📌 Active Whiteboard Formulas</h2>
            <div class="parsed-latex-topic-content">
              ${fallbackHTML}
            </div>
          </div>
        `;
      }

      const finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${bookTitle} - ${studentName || "Cherry's Student"}</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono&display=swap">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #1e293b;
              line-height: 1.6;
              margin: 0;
              padding: 30px;
              background-color: #f8fafc;
            }
            .book-container {
              max-width: 840px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            }
            .print-header {
              border-bottom: 2px solid #0f766e;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .print-title {
              font-family: 'Space Grotesk', sans-serif;
              color: #0f3c42;
              font-size: 21px;
              font-weight: 850;
              letter-spacing: -0.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .print-subtitle {
              color: #0d9488;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin: 4px 0 0 0;
            }
            .print-brand {
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 800;
              font-size: 11px;
              color: #0f766e;
              border: 2px solid #0f766e;
              padding: 6px 12px;
              border-radius: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: #f0fdfa;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px 18px;
              margin-bottom: 30px;
              font-size: 11px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
              text-align: left;
            }
            .meta-label {
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.8px;
            }
            .meta-value {
              color: #0f172a;
              font-weight: 700;
              margin-top: 2px;
            }
            .instructions-box {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 24px;
              text-align: left;
              font-size: 11.5px;
              color: #78350f;
            }
            .pdf-page-wrapper {
              page-break-after: always;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 30px;
              background: #ffffff;
            }
            .pdf-page-wrapper:last-child {
              page-break-after: avoid;
              margin-bottom: 0;
            }
            .slide-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 10px;
              margin-bottom: 16px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10.5px;
              color: #0d9488;
              font-weight: bold;
            }
            .slide-number {
              background: rgba(13, 148, 136, 0.1);
              color: #0f766e;
              padding: 2px 8px;
              border-radius: 4px;
            }
            .slide-time {
              color: #64748b;
            }
            .slide-title {
              font-family: 'Space Grotesk', sans-serif;
              color: #0f3c42;
              font-size: 16.5px;
              font-weight: 800;
              margin: 0 0 16px 0;
              text-align: left;
            }
            .chalkboard-frame-container {
              background: #0c201a;
              border-radius: 12px;
              padding: 8px;
              aspect-ratio: 16 / 9;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #0a2d24;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              margin-bottom: 16px;
              overflow: hidden;
            }
            .chalkboard-image {
              width: 100%;
              height: 105%;
              object-fit: contain;
              border-radius: 8px;
            }
            .no-image-placeholder {
              color: #10b981;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
            }
            .slide-notes-card {
              background: #f0fdfa;
              border-left: 4px solid #0d9488;
              border-radius: 4px 12px 12px 4px;
              padding: 12px 16px;
              text-align: left;
            }
            .notes-badge {
              font-family: 'JetBrains Mono', monospace;
              color: #0d9488;
              font-size: 9px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .notes-text {
              font-size: 11.5px;
              color: #334155;
              margin: 0;
              font-weight: 500;
              line-height: 1.5;
            }
            .parsed-latex-topic-content {
              text-align: left;
              font-size: 12px;
              color: #0f172a;
              background: #faf8f5;
              border: 1px solid #edd1d1;
              padding: 18px;
              border-radius: 12px;
              font-family: 'Inter', system-ui, sans-serif;
              line-height: 1.6;
            }
            .parsed-latex-topic-content h1, .parsed-latex-topic-content h2, .parsed-latex-topic-content h3 {
              font-family: 'Space Grotesk', sans-serif;
              color: #0f3c42;
              margin-top: 0;
            }
            .parsed-latex-topic-content code {
              font-family: 'JetBrains Mono', monospace;
              background: #eaebf0;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
            }
            .vector-diagram-pdf-card {
              margin: 16px auto;
              padding: 14px;
              background: #061c18 !important;
              border: 1.5px solid rgba(103, 232, 249, 0.4) !important;
              border-radius: 12px;
              text-align: center;
              page-break-inside: avoid;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .vector-diagram-pdf-card svg {
              max-height: 280px;
              max-width: 520px;
              width: 100%;
              height: auto;
              margin: 0 auto;
              display: block;
            }
            .print-footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .action-blocks {
              display: flex;
              gap: 12px;
              margin-bottom: 24px;
              justify-content: center;
            }
            .action-btn {
              background: #0f766e;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
              font-family: 'Space Grotesk', sans-serif;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              transition: background 0.2s;
            }
            .action-btn:hover {
              background: #0d9488;
            }
            .action-btn-alt {
              background: #e2e8f0;
              color: #334155;
            }
            .action-btn-alt:hover {
              background: #cbd5e1;
            }

            @media print {
              body {
                padding: 0;
                background-color: #ffffff;
              }
              .book-container {
                border: none;
                padding: 0;
                box-shadow: none;
                max-width: 100%;
              }
              .instructions-box, .action-blocks {
                display: none !important;
              }
              .pdf-page-wrapper {
                border: none;
                padding: 20px 0;
                margin-bottom: 0;
                page-break-after: always;
              }
              .pdf-page-wrapper:last-child {
                page-break-after: avoid;
              }
              .vector-diagram-pdf-card {
                background: #061c18 !important;
                border: 1.5px solid #0284c7 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                page-break-inside: avoid !important;
              }
              .vector-diagram-pdf-card svg {
                display: block !important;
                max-height: 280px !important;
              }
              @page {
                size: A4 portrait;
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="book-container">
            <div class="action-blocks">
              <button class="action-btn" onclick="window.print()">🖨️ Save as PDF / Print Book</button>
              <button class="action-btn action-btn-alt" onclick="window.close()">❌ Close Book</button>
            </div>

            <div class="instructions-box">
              <strong>📘 Direct PDF Save Option:</strong> Click the <strong>"Save as PDF / Print Book"</strong> button above, or press <strong>Ctrl + P</strong> (Cmd + P on Mac). Choose <strong>"Save as PDF"</strong> as your destination, and hit save!
            </div>

            <div class="print-header">
              <div class="header-main">
                <h1 class="print-title">${bookTitle}</h1>
                <p class="print-subtitle">${subTitle}</p>
              </div>
              <div class="print-brand">
                Maestry Learning Sync
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Student Name</span>
                <span class="meta-value">${escapeHTML(studentName || "Cherry's Student")}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Class Year</span>
                <span class="meta-value">${escapeHTML(grade)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Subject Standard</span>
                <span class="meta-value">${escapeHTML(subject)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Taught Chronology</span>
                <span class="meta-value">${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div class="board-pages-container">
              ${combinedHtml}
            </div>

            <div class="print-footer">
              Digital Lecture Copy Synchronized via Maestry Cloud • Secure Verification PDF
            </div>
          </div>

          <script>
            document.addEventListener("DOMContentLoaded", function() {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\\\(', right: '\\\\)', display: false},
                  {left: '\\\\[', right: '\\\\]', display: true}
                ],
                throwOnError: false
              });
              setTimeout(() => {
                window.print();
              }, 600);
            });
          </script>
        </body>
        </html>
      `;

      const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Maestry_Lecture_Book_${subject.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Combined PDF export error:", err);
    }
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col z-30 overflow-hidden">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden relative">
        
        {/* Unified Tab bar Selector */}
        <div className="border-b border-zinc-200 bg-slate-50 shrink-0 select-none">
          {/* Mobile view tabs */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setActiveMobileSubTab("profile")}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "profile" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              👤 Profile
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("counselor"); setActiveDesktopTab("counselor"); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "counselor" 
                  ? "border-teal-800 text-teal-900 bg-white font-bold" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              👩‍🎓 Kiara AI
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("stats"); setActiveDesktopTab("stats"); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "stats" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Performance
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("books"); setActiveDesktopTab("books"); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "books" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📚 Books
            </button>
          </div>

          {/* Desktop view tabs */}
          <div className="hidden md:flex justify-end px-6 py-2 gap-3 bg-slate-100/50 border-b border-zinc-150">
            <div className="text-xs font-mono font-bold text-[#486a73] flex items-center mr-auto">
              🎯 Classroom Hub Workspaces:
            </div>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("stats"); setActiveDesktopTab("stats"); }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesktopTab === "stats" && activeMobileSubTab !== "profile"
                  ? "bg-[#0a3641] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>📊 Performance Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("counselor"); setActiveDesktopTab("counselor"); }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesktopTab === "counselor" && activeMobileSubTab !== "profile"
                  ? "bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-sm font-extrabold ring-1 ring-emerald-400/30"
                  : "text-teal-900 hover:text-teal-950 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-500/30"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>👩‍🎓 Kiara (AI Counselor)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("books"); setActiveDesktopTab("books"); }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesktopTab === "books" && activeMobileSubTab !== "profile"
                  ? "bg-[#0a3641] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 Study Handbooks</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-white">
          
          {/* Left Sidebar: Student Profile Parameter Controls & Milestones */}
          <div className={`${activeMobileSubTab === "profile" ? "flex flex-1 min-h-0" : "hidden md:flex"} w-full md:w-80 bg-slate-50 border-r border-zinc-150 p-4 sm:p-5 flex-col justify-between overflow-y-auto md:shrink-0 select-none`}>
            <div className="space-y-5 sm:space-y-6">
              
              {/* Profile Details section */}
              <div>
                <h3 className="text-[11px] uppercase font-mono font-black tracking-widest text-[#0a3641] flex items-center gap-1.5 pb-2 border-b border-zinc-200">
                  <User className="w-3.5 h-3.5 text-teal-800" /> Student Profile
                </h3>

                {editingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3.5 pt-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-[#dae1dd] focus:border-[#0a3641] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Class Grade</label>
                      <select 
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full bg-white border border-[#dae1dd] text-[#0a3641] rounded-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                        <option value="JEE/NEET Prep">JEE/NEET Prep</option>
                        <option value="College Level">College Level</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Educational Board</label>
                      <select 
                        value={editBoard}
                        onChange={(e) => setEditBoard(e.target.value)}
                        className="w-full bg-white border border-[#dae1dd] text-[#0a3641] rounded-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="CBSE">CBSE Board</option>
                        <option value="ICSE">ICSE / ISC Board</option>
                        <option value="UP Board">UP Board (Uttar Pradesh)</option>
                        <option value="MP Board">MP Board (Madhya Pradesh)</option>
                        <option value="Rajasthan Board">Rajasthan Board (RBSE)</option>
                        <option value="Maharashtra Board">Maharashtra Board (MSBSHSE)</option>
                        <option value="Bihar Board">Bihar Board (BSEB)</option>
                        <option value="Jharkhand Board">Jharkhand Board (JAC)</option>
                        <option value="Odisha Board">Odisha Board (CHSE/BSE)</option>
                        <option value="West Bengal Board">West Bengal Board (WBBSE/WBCHSE)</option>
                        <option value="Other State Board">Other State Board</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Medium of Learning</label>
                      <select 
                        value={editMediumOfLearning}
                        onChange={(e) => setEditMediumOfLearning(e.target.value)}
                        className="w-full bg-white border border-[#dae1dd] text-[#0a3641] rounded-lg px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="Hinglish">Hinglish</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Bangla">Bangla</option>
                        <option value="Oriya">Oriya</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 bg-teal-800 hover:bg-[#0a3641] text-white text-[10px] font-black tracking-wider uppercase py-2 rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        {savingProfile ? "Saving..." : "Save updates"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="px-3 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 text-[10px] uppercase font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 pt-3 text-left">
                    <div>
                      <span className="text-[9px] font-mono text-[#486a73] uppercase block font-semibold leading-none">Full Name</span>
                      <p className="font-extrabold text-[#0a3641] text-xs py-1 border-b border-transparent leading-relaxed">{studentName || "Cherry's Student"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-mono text-[#486a73] uppercase block font-semibold leading-none">Grade Level</span>
                        <p className="font-bold text-[#0a3641] text-xs mt-0.5">{grade}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-[#486a73] uppercase block font-semibold leading-none">Edu Board</span>
                        <p className="font-bold text-[#0a3641] text-xs mt-0.5">{board}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-mono text-[#486a73] uppercase block font-semibold leading-none">Language</span>
                        <p className="font-bold text-[#0a3641] text-xs mt-0.5">{mediumOfLearning}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-[#486a73] uppercase block font-semibold leading-none">Database Status</span>
                        <p className="text-[10px] font-bold text-emerald-700 mt-0.5 capitalize flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
                          {currentUser?.isAnonymous ? "Guest Profile (Local)" : "Verified Cloud Account"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="w-full border border-dashed border-teal-800/40 hover:border-teal-700 hover:bg-teal-50/50 text-[10px] text-[#0a3641] py-2 rounded-xl transition-all cursor-pointer font-black tracking-widest uppercase text-center mt-2.5"
                    >
                      ✏️ Edit particulars
                    </button>
                  </div>
                )}
              </div>

              {/* Milestones & Progress scorecard */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-[11px] uppercase font-mono font-black tracking-widest text-[#0a3641] flex items-center gap-1.5 pb-2 border-b border-zinc-200">
                  <Award className="w-3.5 h-3.5 text-teal-800" /> Academic Progress
                </h3>

                <div className="space-y-2">
                  <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-semibold">Total Classes Attended</span>
                      <span className="text-xl font-black text-[#0a3641] block mt-0.5">{totalSessionsCount}</span>
                    </div>
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">📈</span>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-semibold">Total Slides Saved</span>
                      <span className="text-xl font-black text-[#0a3641] block mt-0.5">{allSnapshots.length}</span>
                    </div>
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">📸</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🏆</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0a3641]">Active Scholar Badge</span>
                  </div>
                  <p className="text-[10px] text-[#486a73] font-medium mt-1 leading-relaxed">
                    Automatically unlocked for participating in live lectures and compiling direct board-books!
                  </p>
                </div>

                {/* Kiara AI Student Counselor Widget */}
                <div className="bg-gradient-to-br from-[#06242c] via-[#09323c] to-[#04191f] text-white border border-teal-500/25 rounded-2xl p-3.5 sm:p-4 text-left space-y-2.5 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-xs shrink-0 flex items-center justify-center text-sm">
                        <span>👩‍🎓</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black tracking-wider text-white font-mono flex items-center gap-1.5">
                          KIARA AI
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </h4>
                        <span className="text-[8px] font-mono font-bold text-teal-300 uppercase tracking-widest block">AI Mindset Counselor</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-teal-100/85 leading-relaxed font-sans relative z-10">
                    Exam stress? Timetable issues? Need mnemonics or study strategies?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsKiaraVoiceModalOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] relative z-10"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Talk to Kiara Counselor (Live Voice 🎙️)</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="text-[9.5px] text-zinc-400 font-mono text-left pt-6 border-t border-zinc-200 mt-6 leading-relaxed">
              * Classroom Handbooks are automatically formatted into optimized multi-page books using integrated LaTeX formulas.
            </div>
          </div>

          {/* Right Column: Unified Board-Book Hub (Main Arena) */}
          <div className={`${(activeMobileSubTab === "books" || activeMobileSubTab === "stats" || activeMobileSubTab === "counselor") ? "flex" : "hidden md:flex"} flex-1 p-3.5 sm:p-4 flex-col space-y-4 overflow-y-auto text-left min-h-0 bg-white`}>
            
            {/* Premium Header - Unified Performance Hub */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-2.5 gap-2 shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                {activeDesktopTab === "counselor" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] truncate">
                      Kiara • AI Mindset & Academic Success Counselor
                    </h3>
                  </>
                ) : activeDesktopTab === "stats" ? (
                  <>
                    <LayoutGrid className="w-4 h-4 text-[#0a3641] shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] truncate">
                      Performance Analytics & Cognitive Radar
                    </h3>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-[#0a3641] shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] truncate">
                      Classroom Study Handbooks (Board-Books)
                    </h3>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9.5px] bg-[#0a3641] text-[#c4f500] px-2 py-0.5 rounded-md font-mono font-black uppercase tracking-wider">
                  {subject} • {grade}
                </span>
              </div>
            </div>

            {activeDesktopTab === "counselor" ? (
              <div className="flex-1 min-h-[620px] text-left">
                <KiaraCounselor
                  studentName={studentName}
                  grade={grade}
                  subject={subject}
                  board={board}
                  mediumOfLearning={mediumOfLearning}
                  analytics={{
                    conceptClarity: dashboardStats.conceptClarity,
                    theoreticalCore: dashboardStats.theoreticalCore,
                    calculationPrecision: dashboardStats.calculationPrecision,
                    formulaRecall: dashboardStats.formulaRecall,
                    socraticStamina: dashboardStats.socraticStamina,
                    strengths: dashboardStats.strengths,
                    growths: dashboardStats.growths,
                    totalQuizzes: quizAttempts?.length || 0,
                    classesCompleted: pastSessions?.length || 0,
                    snapshotsSaved: snapshots?.length || 0,
                    lowestMetric: lowestMetric,
                  }}
                  onNavigateToClassroom={onEnterClassroom}
                  onStartVoiceCall={() => setIsKiaraVoiceModalOpen(true)}
                />
              </div>
            ) : activeDesktopTab === "stats" ? (
              <div className="space-y-4 animate-fade-in text-left">
                {/* Dashboard Introduction Header - Compact & Sleek */}
                <div className="bg-gradient-to-r from-[#0a3641] to-[#041a1e] px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl text-white shadow-xs relative overflow-hidden flex items-center justify-between gap-3 shrink-0 min-h-[52px]">
                  <div className="flex items-center gap-2.5 min-w-0 z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">
                      📊
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                        Namaste, {studentName}! Performance Analytics 🌟
                      </h3>
                      <p className="text-[10px] sm:text-[10.5px] text-teal-100/85 font-medium truncate">
                        Real-time cognitive blueprint based on blackboard activity, saved notes & test accuracy.
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex text-[9px] font-mono font-bold uppercase tracking-wider bg-[#c4f500]/20 text-[#c4f500] px-2.5 py-1 rounded-lg border border-[#c4f500]/20 shrink-0 z-10">
                    Insights Active
                  </span>
                </div>

                {/* Main Bento Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* TILE 1: Radar Chart (Cognitive Mastery Dimensions) - Spans 2 columns on desktop */}
                  <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between">
                    
                    {/* SVG Radar Chart container */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-between w-full mb-3 pb-1 border-b border-zinc-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-sans flex items-center gap-1">
                          🛡️ Micro-Cognitive Dimensions
                        </span>
                        <span className="text-[9px] font-mono font-black bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                          Real-time Sync
                        </span>
                      </div>

                      {/* Real dynamic SVG Radar Chart */}
                      {(() => {
                        // Calculate Radar points
                        const width = 300;
                        const height = 300;
                        const cx = width / 2;
                        const cy = height / 2;
                        const rMax = 80;

                        // 5 Dimensions matching the discussed points
                        const keys = [
                          { label: "Concept Clarity", val: dashboardStats.conceptClarity, icon: "🎯" },
                          { label: "Theoretical Core", val: dashboardStats.theoreticalCore, icon: "📖" },
                          { label: "Calculations", val: dashboardStats.calculationPrecision, icon: "🧮" },
                          { label: "Formula Recall", val: dashboardStats.formulaRecall, icon: "⚡" },
                          { label: "Socratic Stamina", val: dashboardStats.socraticStamina, icon: "🔥" }
                        ];

                        const points = keys.map((key, i) => {
                          const angle = (-90 + i * 72) * Math.PI / 180;
                          const length = rMax * (key.val / 100);
                          const x = cx + Math.cos(angle) * length;
                          const y = cy + Math.sin(angle) * length;
                          return { x, y, label: key.label, score: key.val, angle };
                        });

                        const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

                        // Grid Polygons
                        const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

                        return (
                          <div className="relative w-full max-w-[280px] h-[280px]">
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
                              {/* Background Grids */}
                              {gridLevels.map((lvl, idx) => {
                                const gridPoints = Array.from({ length: 5 }, (_, i) => {
                                  const angle = (-90 + i * 72) * Math.PI / 180;
                                  const x = cx + Math.cos(angle) * rMax * lvl;
                                  const y = cy + Math.sin(angle) * rMax * lvl;
                                  return `${x},${y}`;
                                }).join(" ");

                                return (
                                  <polygon
                                    key={idx}
                                    points={gridPoints}
                                    className="fill-none stroke-zinc-200"
                                    strokeWidth="1"
                                    strokeDasharray={idx < 4 ? "3,3" : "none"}
                                  />
                                );
                              })}

                              {/* Spoke lines */}
                              {Array.from({ length: 5 }, (_, i) => {
                                const angle = (-90 + i * 72) * Math.PI / 180;
                                const x = cx + Math.cos(angle) * rMax;
                                const y = cy + Math.sin(angle) * rMax;
                                return (
                                  <line
                                    key={i}
                                    x1={cx}
                                    y1={cy}
                                    x2={x}
                                    y2={y}
                                    className="stroke-zinc-200"
                                    strokeWidth="1"
                                  />
                                );
                              })}

                              {/* Performance Polygon Area with gradient */}
                              <polygon
                                points={pointsStr}
                                className="fill-teal-500/15 stroke-teal-600"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                              />

                              {/* Vertex interactive markers */}
                              {points.map((p, i) => {
                                const labelAngle = p.angle;
                                // Shift labels slightly outward based on angle
                                const labelDist = rMax + 18;
                                const lx = cx + Math.cos(labelAngle) * labelDist;
                                const ly = cy + Math.sin(labelAngle) * labelDist;

                                const isSelected = activeDimensionIndex === i;

                                return (
                                  <g key={i} className="cursor-pointer" onClick={() => setActiveDimensionIndex(i)}>
                                    {/* Invisible large hit-target */}
                                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                                    {/* Glowing active point */}
                                    {isSelected && (
                                      <circle cx={p.x} cy={p.y} r="8" className="fill-teal-500/30 animate-ping" />
                                    )}
                                    {/* Score vertex circle */}
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r={isSelected ? "5.5" : "4.5"}
                                      className={`${isSelected ? "fill-teal-600 stroke-white" : "fill-white stroke-teal-500"}`}
                                      strokeWidth="2"
                                    />
                                    {/* Label text */}
                                    <text
                                      x={lx}
                                      y={ly}
                                      textAnchor="middle"
                                      alignmentBaseline="middle"
                                      className={`text-[8.5px] font-black font-sans transition-all ${
                                        isSelected ? "fill-teal-800 scale-105 font-extrabold" : "fill-zinc-500"
                                      }`}
                                    >
                                      {keys[i].icon} {p.label} ({p.score}%)
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Dimension Educator Insights box */}
                    <div className="w-full md:w-64 bg-slate-50 border border-zinc-150 p-4.5 rounded-2xl flex flex-col justify-between space-y-3.5 h-full min-h-[220px]">
                      {(() => {
                        const dim = DIMENSION_DETAILS[activeDimensionIndex];
                        const dimensionScore = 
                          activeDimensionIndex === 0 ? dashboardStats.conceptClarity :
                          activeDimensionIndex === 1 ? dashboardStats.theoreticalCore :
                          activeDimensionIndex === 2 ? dashboardStats.calculationPrecision :
                          activeDimensionIndex === 3 ? dashboardStats.formulaRecall :
                          dashboardStats.socraticStamina;

                        return (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                                <span className="text-[9px] font-mono font-black text-teal-800 uppercase tracking-wider">
                                  {dim.icon} Active Dimension
                                </span>
                                <span className="text-[11px] font-black font-mono text-[#0a3641] bg-white px-2 py-0.5 rounded-sm border border-zinc-200">
                                  {dimensionScore}%
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-[#0a3641] tracking-tight">
                                {dim.name}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                {dim.description}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-zinc-150 space-y-1.5">
                              <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1">
                                💡 Cherry's Strategic Advice:
                              </span>
                              <p className="text-[9.5px] text-zinc-700 font-bold leading-normal italic">
                                "{dim.recommendation.replace("{score}", dimensionScore.toString())}"
                              </p>
                            </div>

                            <div className="text-[8.5px] text-zinc-400 font-mono">
                              * Click other spoke nodes in the radar to inspect.
                            </div>
                          </>
                        );
                      })()}
                    </div>

                  </div>

                  {/* TILE 2: Consistency, Milestone & Badges Progress */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-sans flex items-center gap-1">
                          Consistency Milestone
                        </span>
                        <span className="text-[8.5px] font-bold text-zinc-400 font-mono">
                          Target: Scholar
                        </span>
                      </div>

                      {/* Dynamic Gauge details */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" className="stroke-slate-100" strokeWidth="4.5" fill="transparent" />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              className="stroke-amber-500 transition-all duration-500"
                              strokeWidth="4.5"
                              fill="transparent"
                              strokeDasharray="175.9"
                              strokeDashoffset={175.9 - (175.9 * dashboardStats.socraticStamina) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xs font-black font-mono text-zinc-800">
                            {dashboardStats.socraticStamina}%
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                            Socratic Stamina
                          </span>
                          <p className="text-[9.5px] text-zinc-500 font-medium leading-relaxed">
                            Calculated dynamically based on your classroom attendance, notes saved, and quiz participation.
                          </p>
                        </div>
                      </div>

                      {/* Classroom Real-time sync list */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-2.5 text-center">
                          <span className="text-[11px] font-black font-mono text-[#0a3641] block">
                            {pastSessions?.length || 0}
                          </span>
                          <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Classes Done
                          </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-2.5 text-center">
                          <span className="text-[11px] font-black font-mono text-[#0a3641] block">
                            {snapshots?.length || 0}
                          </span>
                          <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Saved Notes
                          </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-2.5 text-center">
                          <span className="text-[11px] font-black font-mono text-[#0a3641] block">
                            {quizAttempts?.length || 0}
                          </span>
                          <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Quizzes Taken
                          </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-2.5 text-center">
                          <span className="text-[11px] font-black font-mono text-[#0a3641] block">
                            {Object.keys(masteredCards).filter(k => masteredCards[k]).length}
                          </span>
                          <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Decks Mastered
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unlocked Badges Row */}
                    <div className="pt-3 border-t border-zinc-100 space-y-2">
                      <span className="text-[7.5px] font-black uppercase text-zinc-400 tracking-widest block">
                        🏆 Earned Scholars Badges:
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {pastSessions?.length > 0 && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Attended at least 1 live session with Cherry Ma'am">
                            🌿 Chalkboard Pioneer
                          </span>
                        )}
                        {snapshots?.length > 0 && (
                          <span className="bg-blue-50 text-blue-800 border border-blue-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Saved chalkboard whiteboard equations">
                            📸 Formula Archivist
                          </span>
                        )}
                        {quizAttempts?.length > 0 && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Completed at least 1 practice classroom quiz">
                            📝 Quiz Conqueror
                          </span>
                        )}
                        {Object.keys(masteredCards).filter(k => masteredCards[k]).length > 0 && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Marked flashcards as mastered in spaced recall">
                            ⚡ Recall Prodigy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TILE 3: Academic Performance Accuracy Timeline (Smooth Curved Wavy Area/Line Chart) - Spans 2 columns */}
                  <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-sans flex items-center gap-1">
                          📈 Classroom Quiz Accuracy Trendline
                        </span>
                        <span className="text-[8.5px] font-mono font-bold text-zinc-400">
                          Timeline Order
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Tracks your accuracy percentages chronologically across your class test sittings to visualize your learning trajectory.
                      </p>
                    </div>

                    {/* Elegant custom inline SVG Line Chart */}
                    <div className="h-44 w-full relative flex items-center justify-center">
                      {(() => {
                        // Chronological attempts (ascending order of timestamp)
                        const chronological = [...dashboardStats.subjectAttempts].reverse();
                        const count = chronological.length;

                        if (count === 0) {
                          // Display a beautiful mock visual path for "Initial Baseline"
                          return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-150 p-4 select-none">
                              <span className="text-lg">⏳</span>
                              <div className="space-y-0.5">
                                <h6 className="text-[10px] font-black text-zinc-500 uppercase tracking-wide">
                                  No Test History Available Yet
                                </h6>
                                <p className="text-[9px] text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
                                  Take your first classroom-aligned Quick Quiz to unlock your dynamic learning accuracy trendline and watch your curve grow!
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // Dimensions
                        const w = 480;
                        const h = 150;
                        const paddingX = 40;
                        const paddingY = 20;

                        const chartW = w - paddingX * 2;
                        const chartH = h - paddingY * 2;

                        // Map chronological attempts to chart points
                        const points = chronological.map((att, i) => {
                          const x = paddingX + (count > 1 ? (i / (count - 1)) * chartW : chartW / 2);
                          // Accuracy: 0 to 100
                          const y = h - paddingY - (att.accuracy / 100) * chartH;
                          return { x, y, accuracy: att.accuracy, date: att.docName?.split("•")?.[0]?.trim() || "Quiz" };
                        });

                        // Draw curved path using cubic Bézier curves (smooth wavy curve)
                        let dPath = "";
                        if (points.length === 1) {
                          dPath = `M ${points[0].x - 10} ${points[0].y} L ${points[0].x + 10} ${points[0].y}`;
                        } else if (points.length > 1) {
                          dPath = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 0; i < points.length - 1; i++) {
                            const curr = points[i];
                            const next = points[i + 1];
                            const cp1X = curr.x + (next.x - curr.x) / 2;
                            const cp1Y = curr.y;
                            const cp2X = curr.x + (next.x - curr.x) / 2;
                            const cp2Y = next.y;
                            dPath += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
                          }
                        }

                        // Area path (closed polygon back to bottom axis for gradient filling)
                        let dArea = "";
                        if (points.length > 1) {
                          dArea = `${dPath} L ${points[points.length - 1].x} ${h - paddingY} L ${points[0].x} ${h - paddingY} Z`;
                        }

                        return (
                          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal gridlines */}
                            {[0, 25, 50, 75, 100].map((val) => {
                              const y = h - paddingY - (val / 100) * chartH;
                              return (
                                <g key={val}>
                                  <line x1={paddingX} y1={y} x2={w - paddingX} y2={y} className="stroke-zinc-100" strokeWidth="1" />
                                  <text x={paddingX - 10} y={y} textAnchor="end" alignmentBaseline="middle" className="text-[7px] font-mono font-bold fill-zinc-400">
                                    {val}%
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area Gradient */}
                            {dArea && <path d={dArea} fill="url(#chartAreaGrad)" />}

                            {/* Crisp wavy line path */}
                            {dPath && <path d={dPath} fill="none" className="stroke-teal-600" strokeWidth="2.5" strokeLinecap="round" />}

                            {/* Point circles & tooltips */}
                            {points.map((p, idx) => (
                              <g key={idx} className="cursor-pointer group">
                                <circle cx={p.x} cy={p.y} r="7" className="fill-white stroke-teal-500 opacity-0 group-hover:opacity-20" strokeWidth="4" />
                                <circle cx={p.x} cy={p.y} r="4.5" className="fill-teal-600 stroke-white" strokeWidth="2" />
                                
                                {/* Label index below point */}
                                <text x={p.x} y={h - paddingY + 12} textAnchor="middle" className="text-[6.5px] font-mono font-extrabold fill-zinc-400">
                                  #{idx + 1}
                                </text>

                                {/* Mini overlay tooltip on hover */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                                  <rect x={p.x - 30} y={p.y - 24} width="60" height="16" rx="4" className="fill-zinc-900" />
                                  <text x={p.x} y={p.y - 14} textAnchor="middle" className="text-[8px] font-bold fill-white">
                                    {p.accuracy}% Correct
                                  </text>
                                </g>
                              </g>
                            ))}
                          </svg>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400 pt-2 border-t border-zinc-100">
                      <span>⬅️ Earlier attempts</span>
                      <span>Latest sittings ➡️</span>
                    </div>
                  </div>

                  {/* TILE 4: Conceptual Strengths (Mastery Highlights) */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 font-sans flex items-center gap-1">
                          🏆 Conceptual Strengths
                        </span>
                        <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded-sm">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Topics & theories where you have demonstrated flawless accuracy and solid deductive clarity in class tests.
                      </p>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-48 scrollbar-thin">
                      {dashboardStats.strengths.slice(0, 4).map((str, idx) => (
                        <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-left flex items-start gap-2.5">
                          <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                            ✓
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-mono font-black uppercase tracking-wider text-emerald-700 block">
                              {str.category}
                            </span>
                            <p className="text-[10px] text-slate-800 font-extrabold leading-tight">
                              {str.concept}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[8px] text-emerald-600/80 font-bold bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex items-center gap-1 justify-center">
                      <span>💎 Keep it up! These are ready for board revisions.</span>
                    </div>
                  </div>

                  {/* TILE 5: Growth Areas & Recommendations */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-sans flex items-center gap-1">
                          ⚠️ Mastery Focus Areas
                        </span>
                        <span className="text-[8.5px] bg-amber-50 text-amber-700 font-mono font-bold px-1.5 py-0.5 rounded-sm">
                          Targeted
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Concepts where mistakes were flagged. Revise these carefully to optimize your board examination scores!
                      </p>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-48 scrollbar-thin">
                      {dashboardStats.growths.slice(0, 3).map((g, idx) => (
                        <div key={idx} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-left flex flex-col gap-1.5 font-sans">
                          <div className="flex items-start gap-2">
                            <span className="p-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-black leading-none">
                              !
                            </span>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-mono font-black uppercase tracking-wider text-amber-700 block">
                                {g.category}
                              </span>
                              <p className="text-[10px] text-slate-800 font-extrabold leading-tight">
                                {g.concept}
                              </p>
                            </div>
                          </div>
                          <p className="text-[9px] text-zinc-600 font-medium bg-white p-2 rounded-xl border border-zinc-150 leading-relaxed">
                            {g.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="text-[8px] text-amber-700 font-bold bg-amber-500/5 p-2 rounded-xl border border-amber-500/10 flex items-center gap-1 justify-center">
                      <span>📖 Practice flashcards to master these topics!</span>
                    </div>
                  </div>

                </div>

                {/* Dashboard bottom educational advice summary */}
                <div className="bg-slate-50 border border-zinc-150 p-4.5 rounded-2xl flex items-start gap-3.5 text-left text-zinc-500 text-[10.5px] leading-relaxed">
                  <HelpCircle className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-[#0a3641] block uppercase tracking-wider text-[8.5px]">
                      Why Cognitive Radar-Bento Hub?
                    </span>
                    <p>
                      According to educational psychometrics, learning progress is multi-dimensional. Standard scores mask where a student is stumbling (e.g. they might understand the core theory but fail multi-step algebra calculation precision). By breaking down your performance into <strong className="text-zinc-700">Concept Clarity</strong>, <strong className="text-zinc-700">Theoretical core definitions</strong>, and <strong className="text-zinc-700">Calculation precision</strong>, this board-book synchronizes with your active lectures in real-time, giving you an edge of smart spaced-repetition.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-6 animate-fade-in text-left">
                {/* Unified Board-Book Hub Header - Ultra Premium & Sleek */}
                <div className="bg-gradient-to-r from-[#07242b] via-[#0a3641] to-[#041a1e] px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-white shadow-sm border border-teal-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 min-h-[58px]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 min-w-0 relative z-10">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400/25 to-teal-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center text-base font-bold shrink-0 shadow-inner">
                      📚
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                          Unified Board-Book Hub
                        </h3>
                        <span className="text-[8px] font-mono font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded-md hidden xs:inline-block">
                          PRO ARCHIVE
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-teal-100/80 font-medium truncate mt-0.5">
                        Centralized repository for live blackboard slates, comprehensive lecture books & AI revision decks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative z-10 shrink-0 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider bg-black/25 text-teal-200 px-3 py-1 rounded-xl border border-teal-400/20 shadow-inner">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{allSnapshots.length} Slates</span>
                      <span className="text-teal-400/50">•</span>
                      <span>{pastSessions.length} Books</span>
                    </span>
                  </div>
                </div>

                {/* Panel 1: Auto-Captured Blackboard Snapshots Gallery & Downloader */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-150">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60">
                          <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <h4 className="text-xs uppercase font-mono tracking-widest text-[#0a3641] font-black">
                          Auto-Captured Blackboard Snapshots ({allSnapshots.length})
                        </h4>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 font-sans mt-1">
                        High-fidelity vector & chalk slates captured in real-time as Cherry Ma'am writes derivations and diagrams.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50/80 border border-teal-200 text-teal-900 text-[9.5px] font-mono font-black self-start sm:self-auto shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Blackboard Sync
                    </span>
                  </div>

                  {allSnapshots && allSnapshots.length > 0 ? (
                    <div className="space-y-3.5">
                      {/* Subject Filter Pills Bar */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {[
                          { key: "all", label: "All Subjects", icon: "📚", count: snapshotSubjectCounts.all || 0 },
                          { key: "Mathematics", label: "Mathematics", icon: "📐", count: snapshotSubjectCounts.Mathematics || 0 },
                          { key: "Physics", label: "Physics", icon: "⚡", count: snapshotSubjectCounts.Physics || 0 },
                          { key: "Chemistry", label: "Chemistry", icon: "🧪", count: snapshotSubjectCounts.Chemistry || 0 },
                          { key: "Biology", label: "Biology", icon: "🌱", count: snapshotSubjectCounts.Biology || 0 },
                          { key: "Science", label: "Science", icon: "🔬", count: snapshotSubjectCounts.Science || 0 },
                          { key: "General", label: "General", icon: "📖", count: snapshotSubjectCounts.General || 0 }
                        ]
                          .filter((tab) => tab.key === "all" || tab.count > 0 || tab.key.toLowerCase() === (subject || "").toLowerCase())
                          .map((tab) => {
                            const isSelected = selectedSnapshotSubjectFilter.toLowerCase() === tab.key.toLowerCase();
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setSelectedSnapshotSubjectFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                                  isSelected
                                    ? "bg-gradient-to-r from-[#0a3641] to-[#082b34] text-white border-[#0a3641] shadow-xs font-black ring-1 ring-teal-500/30"
                                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-slate-50 hover:text-zinc-900 hover:border-zinc-300"
                                }`}
                              >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-black ${
                                    isSelected
                                      ? "bg-white/20 text-[#c4f500]"
                                      : "bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                                  }`}
                                >
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                      </div>

                      {/* Search Bar & Horizontal Navigation Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                          <input 
                            type="text" 
                            value={snapshotSearchQuery} 
                            onChange={(e) => setSnapshotSearchQuery(e.target.value)} 
                            placeholder="Search board slates by topic, formula, or concept..." 
                            className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold placeholder:text-zinc-400 text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all font-mono shadow-2xs"
                          />
                          {snapshotSearchQuery && (
                            <button 
                              onClick={() => setSnapshotSearchQuery("")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-mono font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Navigation Arrows & Counter for Horizontal Scrolling */}
                        {filteredSnapshots.length > 1 && (
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-2xs">
                            <span className="text-[10px] font-mono font-black text-[#0a3641] uppercase tracking-wider">
                              Slide <span className="text-teal-700 font-extrabold">{currentSnapshotHorizontalIndex + 1}</span> of {filteredSnapshots.length}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSnapshotHorizontalScroll("prev")}
                                disabled={currentSnapshotHorizontalIndex === 0}
                                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-teal-50 hover:text-teal-800 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all border border-zinc-200 cursor-pointer"
                                title="Previous Slide (Swipe Left)"
                              >
                                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSnapshotHorizontalScroll("next")}
                                disabled={currentSnapshotHorizontalIndex >= filteredSnapshots.length - 1}
                                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-teal-50 hover:text-teal-800 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all border border-zinc-200 cursor-pointer"
                                title="Next Slide (Swipe Right)"
                              >
                                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {filteredSnapshots.length === 0 ? (
                        <div className="border border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 text-center select-none space-y-2">
                          <p className="text-xs font-black text-zinc-600">No matching blackboard snapshots found</p>
                          <p className="text-[10.5px] text-zinc-400 max-w-sm mx-auto">
                            {selectedSnapshotSubjectFilter !== "all" 
                              ? `No chalkboard snapshots captured for ${selectedSnapshotSubjectFilter} yet.`
                              : "Try searching with a different topic keyword or clearing your filter."}
                          </p>
                          {selectedSnapshotSubjectFilter !== "all" && (
                            <button
                              type="button"
                              onClick={() => setSelectedSnapshotSubjectFilter("all")}
                              className="mt-2 px-3.5 py-1.5 bg-[#0a3641] hover:bg-teal-800 text-white rounded-xl text-[10px] font-bold font-mono transition-colors cursor-pointer shadow-xs"
                            >
                              Show All Subjects
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Horizontal Scrolling Snapshot Container (Each container box is ~screen length wide) */}
                          <div 
                            ref={snapshotScrollContainerRef}
                            onScroll={handleSnapshotScrollUpdate}
                            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-1 scroll-smooth scrollbar-thin rounded-2xl select-none"
                            style={{ scrollSnapType: "x mandatory" }}
                          >
                            {filteredSnapshots.map((snap, idx) => {
                              const snapSubject = snap.subject || inferSnapshotSubject(snap);
                              return (
                                <div 
                                  key={snap.id || snap.snapshotId || idx}
                                  className="w-full min-w-full flex-shrink-0 snap-center group border border-zinc-200/90 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all flex flex-col md:flex-row"
                                >
                                  {/* Left/Top: High-Definition Widescreen Blackboard Slate */}
                                  <div 
                                    onClick={() => setSelectedSnapshotForModal(snap)}
                                    className="relative w-full md:w-3/5 lg:w-2/3 h-56 sm:h-64 md:h-76 bg-[#071f18] overflow-hidden cursor-pointer flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-100 shrink-0 group/slate"
                                  >
                                    {snap.imgData ? (
                                      <img 
                                        src={snap.imgData} 
                                        alt={snap.topicTitle} 
                                        className="w-full h-full object-contain md:object-cover group-hover/slate:scale-[1.02] transition-transform duration-300"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="text-center p-4 text-zinc-400 font-mono text-xs">
                                        <span>Blackboard Slate</span>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-[#0a3641]/40 opacity-0 group-hover/slate:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                      <span className="px-3.5 py-2 bg-white/95 text-[#0a3641] rounded-xl shadow-lg text-xs font-black flex items-center gap-2 transform translate-y-1 group-hover/slate:translate-y-0 transition-transform">
                                        <ZoomIn className="w-4 h-4 stroke-[2.5] text-teal-700" /> Click to Inspect in Fullscreen
                                      </span>
                                    </div>
                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#07242b]/90 text-[#c4f500] text-[9.5px] font-mono font-black uppercase backdrop-blur-xs border border-teal-500/30 shadow-xs">
                                      Slide #{idx + 1} of {filteredSnapshots.length}
                                    </span>
                                  </div>

                                  {/* Right/Bottom: Topic Details, Subject & Direct Actions */}
                                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-white via-[#fcfdfe] to-zinc-50/50">
                                    <div className="space-y-2.5">
                                      {/* Subject & Grade Badge */}
                                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                        <span className={`text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                                          snapSubject === "Mathematics" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                          snapSubject === "Physics" ? "bg-sky-50 text-sky-800 border-sky-200" :
                                          snapSubject === "Chemistry" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                          snapSubject === "Biology" ? "bg-teal-50 text-teal-800 border-teal-200" :
                                          snapSubject === "Science" ? "bg-purple-50 text-purple-800 border-purple-200" :
                                          "bg-slate-50 text-slate-800 border-slate-200"
                                        }`}>
                                          <span>{snapSubject === "Mathematics" ? "📐" : snapSubject === "Physics" ? "⚡" : snapSubject === "Chemistry" ? "🧪" : snapSubject === "Biology" ? "🌱" : "🔬"}</span>
                                          <span>{snapSubject}</span>
                                        </span>
                                        {snap.grade && (
                                          <span className="text-[9px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs">
                                            {snap.grade}
                                          </span>
                                        )}
                                      </div>

                                      <h5 className="text-sm sm:text-base font-black text-[#0a3641] font-sans leading-snug">
                                        {snap.topicTitle || "Classroom Board Snapshot"}
                                      </h5>
                                      <p className="text-[11px] text-zinc-500 line-clamp-3 font-sans leading-relaxed">
                                        {snap.description || "Auto-saved blackboard derivation, formulas & step-by-step calculations."}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-500 pt-1">
                                        <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                        <span>Captured: {formatDate(snap.timestamp)}</span>
                                      </div>
                                    </div>

                                    {/* Action Buttons: Direct High-Def JPG Download, Fullscreen & Delete */}
                                    <div className="pt-3.5 border-t border-zinc-150 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadImage(snap)}
                                        className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-teal-700 to-[#0a3641] hover:from-teal-600 hover:to-teal-900 active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                        title="Download high-definition blackboard image"
                                      >
                                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Download Slide JPG</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSnapshotForModal(snap)}
                                        className="p-2.5 bg-zinc-50 hover:bg-teal-50 hover:border-teal-200 text-zinc-600 hover:text-teal-800 rounded-xl transition-colors cursor-pointer border border-zinc-200 shadow-2xs"
                                        title="Zoom in Fullscreen"
                                      >
                                        <ZoomIn className="w-4 h-4 stroke-[2]" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSnapshot(snap.id || snap.snapshotId)}
                                        className="p-2.5 bg-zinc-50 hover:bg-red-50 hover:border-red-200 text-zinc-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer border border-zinc-200 shadow-2xs"
                                        title="Delete snapshot from archive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick Jump Slide Pill Steppers */}
                          {filteredSnapshots.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                              {filteredSnapshots.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={() => {
                                    if (snapshotScrollContainerRef.current) {
                                      const w = snapshotScrollContainerRef.current.clientWidth;
                                      snapshotScrollContainerRef.current.scrollTo({ left: dotIdx * w, behavior: "smooth" });
                                      setCurrentSnapshotHorizontalIndex(dotIdx);
                                    }
                                  }}
                                  className={`transition-all rounded-full cursor-pointer ${
                                    dotIdx === currentSnapshotHorizontalIndex
                                      ? "w-7 h-2 bg-[#0a3641]"
                                      : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                                  }`}
                                  title={`Jump to Slide ${dotIdx + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-teal-200/80 rounded-2xl p-8 bg-teal-50/25 text-center select-none space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100/70 text-teal-800 flex items-center justify-center mx-auto text-xl font-bold shadow-inner">
                        📸
                      </div>
                      <p className="text-xs font-black text-[#0a3641]">Automatic Blackboard Capture is Active</p>
                      <p className="text-[10.5px] text-[#486a73] max-w-md mx-auto leading-relaxed">
                        Whenever Cherry Ma'am writes formulas, diagrams, or changes blackboard topics during your live classes, high-definition snapshots will automatically be captured and appear here for instant download. No manual buttons needed!
                      </p>
                    </div>
                  )}
                </div>

                {/* Panel 2: Past Sessions Board-Book Arc Archives Block (Horizontal Screen-Length Scroll & Subject Filters) */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 pb-2">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 stroke-[2.5] text-amber-600" />
                        </span>
                        <h4 className="text-xs uppercase font-mono tracking-widest text-[#0a3641] font-black">
                          Subject-Wise Chapter Smart Revision Decks & Books ({filteredBooks.length})
                        </h4>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 font-sans mt-1">
                        Interactive AI-powered revision flashcards, key takeaway concepts & dynamic mind maps organized by subject.
                      </p>
                    </div>

                    {filteredBooks.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/70 self-start sm:self-auto shrink-0 shadow-2xs">
                        {filteredBooks.length} {filteredBooks.length === 1 ? "Book" : "Books"} Available
                      </span>
                    )}
                  </div>

                  {pastSessions && pastSessions.length > 0 ? (
                    <div className="space-y-3.5">
                      {/* Subject Selection Tabs / Pills Bar */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                        {[
                          { key: "all", label: "All Subjects", icon: "📚", count: bookSubjectCounts.all || allBooks.length },
                          { key: "Mathematics", label: "Mathematics", icon: "📐", count: bookSubjectCounts.Mathematics || 0 },
                          { key: "Physics", label: "Physics", icon: "⚡", count: bookSubjectCounts.Physics || 0 },
                          { key: "Chemistry", label: "Chemistry", icon: "🧪", count: bookSubjectCounts.Chemistry || 0 },
                          { key: "Biology", label: "Biology", icon: "🌱", count: bookSubjectCounts.Biology || 0 },
                          { key: "Science", label: "Science", icon: "🔬", count: bookSubjectCounts.Science || 0 },
                          ...Object.keys(bookSubjectCounts)
                            .filter(k => !["all", "Mathematics", "Physics", "Chemistry", "Biology", "Science"].includes(k) && bookSubjectCounts[k] > 0)
                            .map(k => ({ key: k, label: k, icon: "📖", count: bookSubjectCounts[k] }))
                        ]
                          .filter(tab => tab.key === "all" || tab.count > 0)
                          .map((tab) => {
                            const isActive = selectedBookSubjectFilter.toLowerCase() === tab.key.toLowerCase();
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                  setSelectedBookSubjectFilter(tab.key);
                                  setCurrentBookHorizontalIndex(0);
                                  if (booksScrollContainerRef.current) {
                                    booksScrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border ${
                                  isActive
                                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs"
                                    : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-2xs hover:border-zinc-300"
                                }`}
                              >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                                  isActive ? "bg-white/20 text-[#c4f500]" : "bg-zinc-100 text-zinc-600"
                                }`}>
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                      </div>

                      {/* Search Bar + Slide Navigation Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                          <input 
                            type="text" 
                            value={archiveSearchQuery} 
                            onChange={(e) => {
                              setArchiveSearchQuery(e.target.value);
                              setCurrentBookHorizontalIndex(0);
                              if (booksScrollContainerRef.current) {
                                booksScrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
                              }
                            }} 
                            placeholder="Search chapter books by title, topic, or date..." 
                            className="w-full pl-10 pr-10 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold placeholder:text-zinc-400 text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all font-mono shadow-2xs"
                          />
                          {archiveSearchQuery && (
                            <button 
                              onClick={() => {
                                setArchiveSearchQuery("");
                                setCurrentBookHorizontalIndex(0);
                              }}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-mono font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Slide Stepper Controls */}
                        {filteredBooks.length > 0 && (
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-zinc-500 font-bold px-2 py-1 bg-zinc-100/80 rounded-lg border border-zinc-200/60">
                              Slide {Math.min(currentBookHorizontalIndex + 1, filteredBooks.length)} of {filteredBooks.length}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleBooksHorizontalScroll("prev")}
                                disabled={currentBookHorizontalIndex === 0}
                                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs active:scale-95"
                                title="Previous Book Slide"
                              >
                                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBooksHorizontalScroll("next")}
                                disabled={currentBookHorizontalIndex >= filteredBooks.length - 1}
                                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs active:scale-95"
                                title="Next Book Slide"
                              >
                                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content: Empty Search / Books Horizontal Ribbon */}
                      {filteredBooks.length === 0 ? (
                        <div className="border border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 text-center select-none space-y-1">
                          <p className="text-xs font-black text-zinc-500">No matching lecture books found</p>
                          <p className="text-[10px] text-zinc-400">Try adjusting your keyword search or selected subject filter.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Horizontal Snap Scrolling Ribbon */}
                          <div 
                            ref={booksScrollContainerRef}
                            onScroll={handleBooksScrollUpdate}
                            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 pt-1 scroll-smooth scrollbar-thin rounded-2xl"
                            style={{ scrollbarWidth: "thin" }}
                          >
                            {filteredBooks.map((sess, idx) => {
                              const hasContent = !!(
                                sess.customBoardContent || 
                                sess.documentMarkdown || 
                                sess.activeDocumentMarkdown || 
                                (sess.topicBoardsContent && Object.keys(sess.topicBoardsContent).length > 0) || 
                                (sess.topics && sess.topics.length > 0)
                              );
                              const isYoutubeSess = sess.processedTitle?.includes("YouTube") || sess.processedTitle?.includes("(ID: ");
                              const bookSubject = sess.inferredSubject;
                              const subjectIcon = bookSubject === "Mathematics" ? "📐" : bookSubject === "Physics" ? "⚡" : bookSubject === "Chemistry" ? "🧪" : bookSubject === "Biology" ? "🌱" : "🔬";
                              const topicCount = sess.topics && sess.topics.length > 0 ? sess.topics.length : 1;
                              
                              // Topics preview list
                              const topicsList = sess.topics && Array.isArray(sess.topics) && sess.topics.length > 0
                                ? sess.topics.slice(0, 3).map((t: string) => t.split("\n")[0]?.replace(/[\#\*\_]/g, "").trim()).filter(Boolean)
                                : [];

                              return (
                                <div 
                                  key={sess.sessionId || sess.id || idx}
                                  className="w-full min-w-full flex-shrink-0 snap-center group border border-zinc-200/90 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all flex flex-col md:flex-row"
                                >
                                  {/* Left/Top: High-Definition Widescreen Chalkboard Lecture Book Cover Slate */}
                                  <div 
                                    onClick={() => {
                                      if (!hasContent) return;
                                      const cachedDeck = localStorage.getItem(`revision_deck_${sess.sessionId || sess.index}`);
                                      if (cachedDeck) {
                                        try {
                                          const parsed = JSON.parse(cachedDeck);
                                          const hasValidMindMap = parsed && parsed.mindMap && Array.isArray(parsed.mindMap.nodes) && parsed.mindMap.nodes.length > 0;
                                          if (hasValidMindMap) {
                                            handleOpenRevisionDeck(sess, parsed);
                                            return;
                                          }
                                        } catch (_) {}
                                      }
                                      handleGenerateRevisionDeck(sess);
                                    }}
                                    className="relative w-full md:w-3/5 lg:w-2/3 min-h-[230px] sm:min-h-[250px] md:h-76 bg-[#071f18] overflow-hidden cursor-pointer flex flex-col justify-between p-5 sm:p-6 border-b md:border-b-0 md:border-r border-zinc-100 shrink-0 group/bookcover select-none"
                                  >
                                    {/* Subtle Grid / Chalkboard texture glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(#115e59_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                                    {/* Top Banner inside Slate */}
                                    <div className="relative z-10 flex items-center justify-between gap-2">
                                      <span className="px-2.5 py-1 rounded-lg bg-[#07242b]/90 text-[#c4f500] text-[9.5px] font-mono font-black uppercase backdrop-blur-xs border border-teal-500/30 shadow-xs flex items-center gap-1.5">
                                        <span>📖</span>
                                        <span>Deck #{idx + 1} of {filteredBooks.length}</span>
                                      </span>

                                      {isYoutubeSess && (
                                        <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-600/90 text-white flex items-center gap-1 font-mono shadow-xs border border-red-400/30">
                                          <Youtube className="w-2.5 h-2.5" /> Video Lecture Sync
                                        </span>
                                      )}
                                    </div>

                                    {/* Center Book Slate Info */}
                                    <div className="relative z-10 my-auto space-y-2 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl sm:text-2xl">{subjectIcon}</span>
                                        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-teal-300 uppercase">
                                          {bookSubject} • {sess.grade || grade || "Class 10"}
                                        </span>
                                      </div>

                                      <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight leading-snug line-clamp-2 drop-shadow-sm font-sans">
                                        {sess.processedTitle}
                                      </h3>

                                      {topicsList.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                          {topicsList.map((tName: string, tIdx: number) => (
                                            <span 
                                              key={tIdx}
                                              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-teal-100/90 border border-white/10 max-w-[200px] truncate backdrop-blur-2xs"
                                            >
                                              • {tName}
                                            </span>
                                          ))}
                                          {sess.topics && sess.topics.length > 3 && (
                                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-400/20 text-[#c4f500]">
                                              +{sess.topics.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom slate meta */}
                                    <div className="relative z-10 flex items-center justify-between text-[9.5px] font-mono text-teal-200/80 pt-2 border-t border-white/10">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-teal-400" />
                                        {sess.formattedDateTime}
                                      </span>
                                      <span className="text-teal-300 font-bold">
                                        {topicCount} {topicCount === 1 ? "Section" : "Sections"} Formatted
                                      </span>
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-[#0a3641]/50 opacity-0 group-hover/bookcover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-20">
                                      <span className="px-4 py-2 bg-white/95 text-[#0a3641] rounded-xl shadow-lg text-xs font-black flex items-center gap-2 transform translate-y-1 group-hover/bookcover:translate-y-0 transition-transform cursor-pointer">
                                        <Sparkles className="w-4 h-4 stroke-[2.5] text-amber-600 animate-pulse" /> Launch Smart Revision
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right/Bottom: Topic Details, Subject & Direct Actions */}
                                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-white via-[#fcfdfe] to-zinc-50/50">
                                    <div className="space-y-2.5">
                                      {/* Subject & Lesson Badge */}
                                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                        <span className={`text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                                          bookSubject === "Mathematics" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                          bookSubject === "Physics" ? "bg-sky-50 text-sky-800 border-sky-200" :
                                          bookSubject === "Chemistry" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                          bookSubject === "Biology" ? "bg-teal-50 text-teal-800 border-teal-200" :
                                          bookSubject === "Science" ? "bg-purple-50 text-purple-800 border-purple-200" :
                                          "bg-slate-50 text-slate-800 border-slate-200"
                                        }`}>
                                          <span>{subjectIcon}</span>
                                          <span>{bookSubject}</span>
                                        </span>

                                        <span className="text-[9px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs">
                                          Lesson #{sess.index}
                                        </span>
                                      </div>

                                      {/* Title & Description */}
                                      <h4 className="text-sm font-black text-[#0a3641] tracking-tight leading-snug line-clamp-2">
                                        {sess.processedTitle}
                                      </h4>

                                      <p className="text-[11px] text-zinc-500 line-clamp-3 font-sans leading-relaxed">
                                        Interactive revision handbook equipped with AI flashcards, dynamic mind maps, and structured chapter summaries.
                                      </p>

                                      {/* Metadata Badges */}
                                      <div className="space-y-1 pt-1">
                                        <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-zinc-500">
                                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                          <span>Saved: {sess.formattedDateTime}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-teal-700 font-bold">
                                          <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                          <span>{topicCount} Study Chapter Modules</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3.5 border-t border-zinc-150 flex items-stretch sm:items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cachedDeck = localStorage.getItem(`revision_deck_${sess.sessionId || sess.index}`);
                                          if (cachedDeck) {
                                            try {
                                              const parsed = JSON.parse(cachedDeck);
                                              const hasValidMindMap = parsed && parsed.mindMap && Array.isArray(parsed.mindMap.nodes) && parsed.mindMap.nodes.length > 0;
                                              if (hasValidMindMap) {
                                                handleOpenRevisionDeck(sess, parsed);
                                                return;
                                              }
                                            } catch (_) {}
                                          }
                                          handleGenerateRevisionDeck(sess);
                                        }}
                                        disabled={!hasContent}
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                                          hasContent
                                            ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white active:scale-[0.98] shadow-amber-500/20 ring-1 ring-amber-400/40"
                                            : "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                                        }`}
                                        title={hasContent ? "Generate AI Flashcards & Mind Map for this lecture session" : "This session's board notes are empty"}
                                      >
                                        <Sparkles className="w-4 h-4 stroke-[2.5] text-amber-200 animate-pulse" />
                                        <span>Launch Smart Revision (Flashcards & Mind Map)</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick Jump Slide Dots */}
                          {filteredBooks.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                              {filteredBooks.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={() => {
                                    if (booksScrollContainerRef.current) {
                                      const w = booksScrollContainerRef.current.clientWidth;
                                      booksScrollContainerRef.current.scrollTo({ left: dotIdx * w, behavior: "smooth" });
                                      setCurrentBookHorizontalIndex(dotIdx);
                                    }
                                  }}
                                  className={`transition-all rounded-full cursor-pointer ${
                                    dotIdx === currentBookHorizontalIndex
                                      ? "w-7 h-2 bg-[#0a3641]"
                                      : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                                  }`}
                                  title={`Jump to Book ${dotIdx + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 text-center select-none space-y-2">
                      <p className="text-xs font-black text-zinc-500">Archive Locker Empty</p>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Once you conduct or complete live classrooms with Cherry Ma'am, your completed board-books will compile and archive here automatically under secure token sync.
                      </p>
                    </div>
                  )}
                </div>

          </div>
        )}
      </div>
    </div>

        {/* Smart Revision Deck Interactive Overlay Modal */}
        {activeRevisionSession && (
          <div className="fixed inset-0 bg-[#06181b]/95 flex items-center justify-center z-50 p-0 md:p-4 animate-fade-in select-none">
            {loadingRevision ? (
              <div className="bg-[#0b282d] border-2 border-teal-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl space-y-6 flex flex-col items-center mx-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                  <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-mono tracking-widest font-black uppercase text-amber-400">
                    Cherry's Revision Lab
                  </h3>
                  <h4 className="text-base font-extrabold text-white">
                    Synthesizing Study Materials...
                  </h4>
                  <div className="text-left bg-[#05171a] border border-teal-950 p-4 rounded-xl space-y-2 text-[11px] font-mono text-teal-300">
                    <p className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> Reading classroom board-book
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> Analyzing scientific formulas
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> Generating visual concept map
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-amber-400 animate-pulse">⟳</span> Compiling flashcard recall deck
                    </p>
                  </div>
                  <p className="text-xs text-teal-100/60 leading-relaxed font-sans max-w-xs mx-auto">
                    Cherry Ma'am is preparing custom interactive flashcards and conceptual mind maps to help you master this session's topics.
                  </p>
                </div>
              </div>
            ) : revisionDeckData ? (
              <div className="bg-[#f8fafc] border-0 md:border border-slate-200/80 md:rounded-3xl w-full max-w-7xl h-full md:h-[94vh] flex flex-col overflow-hidden shadow-2xl relative transition-all">
                
                {/* Header of Revision Center */}
                {(() => {
                  const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                  return (
                    <div className="bg-gradient-to-r from-[#0d2d2a] via-[#113a37] to-[#0c2e2c] border-b border-emerald-800/20 text-white px-4 py-2 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
                      <div className="text-left space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-400 text-slate-950 text-[8.5px] font-black tracking-widest uppercase py-0.5 px-2 rounded-md shadow-2xs">
                            🧠 SMART REVISION
                          </span>
                          
                          {/* Context Source Badge */}
                          <span 
                            className={`text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 shadow-2xs ${sourceBadge.bgClass}`}
                            title={sourceBadge.description}
                          >
                            <span>{sourceBadge.icon}</span>
                            <span>{sourceBadge.label}</span>
                          </span>

                          <span className="text-[9.5px] font-mono font-bold text-teal-300 truncate hidden sm:inline">
                            {activeRevisionSession.subject || subject} • Class {grade}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-base font-black truncate max-w-xs sm:max-w-md md:max-w-xl text-teal-50">
                          {activeRevisionSession.processedTitle}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {/* Sync Latest Session / Re-generate Button */}
                        <button
                          onClick={() => handleGenerateRevisionDeck(activeRevisionSession)}
                          disabled={loadingRevision}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-teal-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-black tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                          title="Re-sync latest classroom/document notes and re-generate deck"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingRevision ? "animate-spin" : ""}`} />
                          <span className="hidden sm:inline">Sync / Re-generate</span>
                          <span className="sm:hidden">Sync</span>
                        </button>

                        <button 
                          onClick={handleCloseRevisionDeck}
                          className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-all cursor-pointer hover:rotate-90 duration-300 shrink-0"
                          title="Close Revision Deck"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Interactive Study Progress Sub-banner with 3-tier active recall breakdown */}
                {(() => {
                  const totalCards = revisionDeckData.flashcards?.length || 0;
                  const hardCount = Object.values(cardRatings).filter(r => r === "hard").length;
                  const mediumCount = Object.values(cardRatings).filter(r => r === "medium").length;
                  const easyCount = Object.values(cardRatings).filter(r => r === "easy").length;
                  const masteredCount = Object.keys(masteredCards).filter(k => masteredCards[k]).length;
                  const ratedCount = Object.keys(cardRatings).length;
                  
                  // Weighted revision score: Easy = 100%, Medium = 75%, Hard = 30%
                  const weightedPoints = (easyCount * 100) + (mediumCount * 75) + (hardCount * 30);
                  const maxPoints = totalCards * 100;
                  const revisionScore = totalCards > 0 ? Math.round((weightedPoints / maxPoints) * 100) : 0;
                  const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

                  return (
                    <div className="bg-[#fefce8] border-b border-amber-200/50 px-4 py-2 sm:px-6 sm:py-2.5 shrink-0 flex items-center justify-between gap-3 text-left flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[10px] sm:text-xs text-amber-950 font-bold truncate leading-none">
                            <strong className="hidden sm:inline">Active Recall Session: </strong>
                            <span>{ratedCount}/{totalCards} Cards Rated</span>
                          </p>
                          {ratedCount > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                              {easyCount > 0 && (
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300/40">
                                  {easyCount} Easy
                                </span>
                              )}
                              {mediumCount > 0 && (
                                <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded border border-sky-300/40">
                                  {mediumCount} Good
                                </span>
                              )}
                              {hardCount > 0 && (
                                <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-300/40">
                                  {hardCount} Review
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs font-black text-amber-950 leading-none">
                            Revision Score: <span className={revisionScore >= 80 ? "text-emerald-700 font-extrabold" : revisionScore >= 50 ? "text-amber-700 font-extrabold" : "text-rose-700 font-extrabold"}>{revisionScore}%</span>
                          </p>
                          <p className="text-[8.5px] font-mono text-amber-800/80 font-bold mt-0.5">
                            {masteredCount}/{totalCards} Mastered ({masteryPercentage}%)
                          </p>
                        </div>
                        <div className="w-16 sm:w-28 bg-amber-200/50 h-2 rounded-full overflow-hidden border border-amber-300/60 p-0.5 flex">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                              revisionScore >= 80 ? "bg-emerald-500" : revisionScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.max(revisionScore, 4)}%` }}
                          />
                        </div>
                        {revisionScore >= 90 && totalCards > 0 && (
                          <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black tracking-wider uppercase py-0.5 px-2 rounded-md animate-bounce hidden xs:inline-block shadow-2xs">
                            🏆 Mastery Achieved!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-navigation & Layout Controllers with Hindi labels */}
                <div className="bg-white border-b border-slate-200/50 px-3 py-1.5 sm:py-2.5 shrink-0 flex items-center justify-center">
                  {/* Tab Swappers */}
                  <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl w-full max-w-2xl border border-slate-200/40 shadow-2xs">
                    <button
                      onClick={() => setActiveRevisionTab("flashcards")}
                      className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                        activeRevisionTab === "flashcards"
                          ? "bg-teal-800 text-white shadow-md shadow-teal-900/20"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Interactive Cards</span>
                      <span className="text-[8px] opacity-75 font-normal tracking-normal capitalize font-mono hidden xs:inline">
                        (फ्लैशकार्ड्स)
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveRevisionTab("mindmap")}
                      className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                        activeRevisionTab === "mindmap"
                          ? "bg-teal-800 text-white shadow-md shadow-teal-900/20"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                      }`}
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Concept Mind Map</span>
                      <span className="text-[8px] opacity-75 font-normal tracking-normal capitalize font-mono hidden xs:inline">
                        (माइंड मैप)
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveRevisionTab("summary")}
                      className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                        activeRevisionTab === "summary"
                          ? "bg-teal-800 text-white shadow-md shadow-teal-900/20"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Topic Summary</span>
                      <span className="text-[8px] opacity-75 font-normal tracking-normal capitalize font-mono hidden xs:inline">
                        (सारांश)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50">
                  
                  {/* Left Column: Interactive Flashcards */}
                  {activeRevisionTab === "flashcards" && (
                    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 flex flex-col justify-between overflow-y-auto min-h-0 bg-white flex-1 md:rounded-3xl md:shadow-md md:border md:border-slate-100/60 md:my-4">
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs uppercase font-mono tracking-widest font-black text-slate-500 flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 text-teal-700" /> Interactive Flashcards
                            </h4>
                            {/* Keyboard guide tip */}
                            <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              <kbd className="font-bold text-slate-600">Space</kbd> Flip • <kbd className="font-bold text-slate-600">1/2/3</kbd> Rate • <kbd className="font-bold text-slate-600">←/→</kbd> Navigate • <kbd className="font-bold text-slate-600">H</kbd> Hint
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleShuffleFlashcards}
                              title="Shuffle flashcards order"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-200/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Shuffle className="w-3 h-3" /> Shuffle
                            </button>
                            {Object.keys(masteredCards).length > 0 && (
                              <button
                                onClick={handleResetMastery}
                                title="Reset mastery progress for this session"
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border border-rose-200/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                              >
                                <RefreshCw className="w-3 h-3" /> Reset
                              </button>
                            )}
                            <span className="text-[10px] font-mono font-black tracking-widest text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg shadow-2xs">
                              CARD {currentFlashcardIndex + 1} OF {revisionDeckData.flashcards?.length || 0}
                            </span>
                          </div>
                        </div>

                        {/* Ruled index card & chalkboard flashcard animation */}
                        {revisionDeckData.flashcards && revisionDeckData.flashcards.length > 0 ? (
                          (() => {
                            const totalCards = revisionDeckData.flashcards.length;
                            const easyCount = Object.values(cardRatings).filter(r => r === "easy").length;
                            const mediumCount = Object.values(cardRatings).filter(r => r === "medium").length;
                            const hardCount = Object.values(cardRatings).filter(r => r === "hard").length;
                            const ratedCount = easyCount + mediumCount + hardCount;
                            const masteredCount = Object.values(masteredCards).filter(Boolean).length;
                            const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
                            // Revision Score: Easy = 100%, Medium = 60%, Hard = 20%
                            const totalEarnedPoints = (easyCount * 100) + (mediumCount * 60) + (hardCount * 20);
                            const maxPossiblePoints = totalCards * 100;
                            const revisionScorePercentage = maxPossiblePoints > 0 ? Math.round((totalEarnedPoints / maxPossiblePoints) * 100) : 0;

                            const currentCard = revisionDeckData.flashcards[currentFlashcardIndex];
                            const cardId = currentCard.id || String(currentFlashcardIndex);
                            const currentRating = cardRatings[cardId];
                            const isMastered = !!masteredCards[cardId];

                            return (
                              <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center">
                                {/* Real-time Session Revision Score & Active Recall Mastery Tracker */}
                                <div className="w-full max-w-4xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="bg-[#0a3641] text-[#c4f500] px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
                                        <Sparkles className="w-3.5 h-3.5 text-[#c4f500]" />
                                        <span>REVISION SCORE: {revisionScorePercentage}%</span>
                                      </div>
                                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold tracking-wider flex items-center gap-1">
                                        <span>🎯 Mastery: {masteryPercentage}% ({masteredCount}/{totalCards})</span>
                                      </div>
                                    </div>

                                    {/* Rating Breakdown Badges */}
                                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold flex-wrap">
                                      <span className="bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        ✅ Mastered: {easyCount}
                                      </span>
                                      <span className="bg-sky-100/80 text-sky-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        ⚡ Medium: {mediumCount}
                                      </span>
                                      <span className="bg-rose-100/80 text-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        ❌ Hard: {hardCount}
                                      </span>
                                      <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                                        ⚪ Unrated: {Math.max(0, totalCards - ratedCount)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-emerald-500 transition-all duration-300"
                                      style={{ width: `${totalCards > 0 ? (easyCount / totalCards) * 100 : 0}%` }}
                                      title={`Mastered / Easy: ${easyCount}`}
                                    />
                                    <div 
                                      className="bg-sky-500 transition-all duration-300"
                                      style={{ width: `${totalCards > 0 ? (mediumCount / totalCards) * 100 : 0}%` }}
                                      title={`Good / Medium: ${mediumCount}`}
                                    />
                                    <div 
                                      className="bg-rose-500 transition-all duration-300"
                                      style={{ width: `${totalCards > 0 ? (hardCount / totalCards) * 100 : 0}%` }}
                                      title={`Confused / Hard: ${hardCount}`}
                                    />
                                  </div>
                                </div>
                                <div 
                                  onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                                  className="w-full max-w-4xl mx-auto h-[22rem] sm:h-[28rem] md:h-[32rem] lg:h-[35rem] cursor-pointer [perspective:1000px] select-none relative group"
                                >
                                  <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${isFlashcardFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                                    
                                    {/* Card Front: Ruled school notebook style */}
                                    <div className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 pb-4 sm:pb-6 flex flex-col justify-between shadow-md hover:shadow-lg hover:border-slate-300 transition-all [backface-visibility:hidden] overflow-hidden [background-image:linear-gradient(#f1f5f9_1px,transparent_1px)] [background-size:100%_2rem]">
                                      {/* Mini clipboard metal clip */}
                                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-slate-200 rounded-b-md border-x border-b border-slate-300/80 z-20 shadow-2xs flex items-center justify-center">
                                        <div className="w-10 h-1 bg-slate-400 rounded-full" />
                                      </div>

                                      {/* Pink margin index line */}
                                      <div className="absolute left-10 sm:left-12 top-0 bottom-0 w-[1.5px] bg-rose-300/60" />

                                      {/* Front Header Details */}
                                      <div className="flex items-center justify-between z-10 pl-8 sm:pl-12 shrink-0 mt-2 gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="bg-teal-50 text-teal-800 border border-teal-100 text-[8.5px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                                            ❓ ACTIVE RECALL
                                          </span>
                                          {currentCard.difficulty && (
                                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${
                                              currentCard.difficulty.toLowerCase() === 'easy'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : currentCard.difficulty.toLowerCase() === 'hard'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                              {currentCard.difficulty}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                                          {/* Instant "Discuss with Cherry Ma'am" Action Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDiscussWithCherry(currentCard);
                                            }}
                                            className="bg-gradient-to-r from-[#0a3641] to-[#124e5d] hover:from-[#0d4756] hover:to-[#1a6577] text-[#c4f500] hover:text-white border border-[#0a3641]/30 hover:border-[#c4f500]/50 text-[8.5px] sm:text-[9.5px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 z-30"
                                            title="Open Live Classroom & discuss this concept with Cherry Ma'am"
                                          >
                                            <span className="text-xs">🎙️</span>
                                            <span className="font-bold whitespace-nowrap">Discuss with Cherry Ma'am</span>
                                            <Sparkles className="w-3 h-3 text-[#c4f500] animate-pulse shrink-0 hidden sm:inline" />
                                          </button>

                                          {currentRating ? (
                                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full tracking-wider border flex items-center gap-1 ${
                                              currentRating === "easy"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : currentRating === "medium"
                                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}>
                                              {currentRating === "easy" ? "✅ MASTERED / EASY" : currentRating === "medium" ? "⚡ GOOD / MEDIUM" : "❌ REVIEW / HARD"}
                                            </span>
                                          ) : isMastered ? (
                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                                              ✓ MASTERED
                                            </span>
                                          ) : (
                                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                              UNRATED
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Question Body with LaTeX math rendering */}
                                      <div className="text-center my-auto py-2 z-10 pl-8 sm:pl-12 overflow-y-auto max-h-[70%] scrollbar-none">
                                        <div className="bg-amber-100/60 text-amber-900 border border-amber-200/30 text-[9.5px] sm:text-[11px] font-mono font-black uppercase px-2.5 py-1 rounded-md tracking-wider inline-block mb-3 sm:mb-4">
                                          Concept: {currentCard.conceptTested || "General Review"}
                                        </div>
                                        <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800 leading-snug tracking-tight px-2 sm:px-6">
                                          {renderTextWithKaTeX(currentCard.question)}
                                        </div>

                                        {/* Optional Socratic Hint Box */}
                                        {currentCard.hint && (
                                          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              onClick={() => setShowFlashcardHint(!showFlashcardHint)}
                                              className="text-[10px] sm:text-xs font-mono font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                            >
                                              <Lightbulb className={`w-3.5 h-3.5 ${showFlashcardHint ? "text-amber-600 fill-amber-400" : "text-amber-500"}`} />
                                              {showFlashcardHint ? "Hide Cherry Ma'am's Hint" : "💡 Need a Hint? (Press H)"}
                                            </button>
                                            {showFlashcardHint && (
                                              <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left text-xs sm:text-sm text-amber-950 font-medium max-w-lg mx-auto shadow-2xs animate-in fade-in duration-200">
                                                <span className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                                                  🧠 Thought Trigger:
                                                </span>
                                                {renderTextWithKaTeX(currentCard.hint)}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Bottom indicator */}
                                      <div className="text-center pt-2 border-t border-dashed border-slate-100 z-10 pl-8 sm:pl-12 shrink-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-[#4c8491] animate-pulse flex items-center justify-center gap-1.5">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-teal-600" /> Tap card or Press Space to flip & reveal answer
                                        </p>
                                      </div>
                                    </div>

                                    {/* Card Back: Slate Chalkboard style */}
                                    <div className="absolute inset-0 w-full h-full bg-[#0d2220] text-white rounded-2xl p-6 sm:p-8 pb-4 sm:pb-6 flex flex-col justify-between shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
                                      {/* Realistic blackboard wooden frame shadow border */}
                                      <div className="absolute inset-0 border-[8px] border-[#8b5a2b] rounded-2xl pointer-events-none z-20 shadow-inner" />
                                      {/* Inner chalkboard chalk line border */}
                                      <div className="absolute inset-2.5 border border-dashed border-teal-500/20 rounded-lg pointer-events-none z-10" />

                                      {/* Back Header */}
                                      <div className="flex items-center justify-between z-10 shrink-0 px-4 mt-2 gap-2">
                                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9.5px] sm:text-[11px] font-mono font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                                          CHERRY MA'AM'S LESSON ANSWER
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {/* Instant "Discuss with Cherry Ma'am" Action Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDiscussWithCherry(currentCard);
                                            }}
                                            className="bg-[#c4f500] hover:bg-[#d4ff33] text-[#0a3641] font-black text-[8.5px] sm:text-[9.5px] font-mono uppercase px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 z-30"
                                            title="Open Live Classroom & discuss this concept with Cherry Ma'am"
                                          >
                                            <span>🎙️ Discuss with Cherry Ma'am</span>
                                            <Sparkles className="w-3 h-3 text-[#0a3641] shrink-0 hidden sm:inline" />
                                          </button>
                                          <span className="text-[9px] sm:text-[10px] font-mono text-emerald-300/80 hidden md:inline">
                                            Double-tap to flip back
                                          </span>
                                        </div>
                                      </div>

                                      {/* Answer content (Scrollable if too long) */}
                                      <div className="text-left my-auto py-4 px-4 overflow-y-auto max-h-[70%] scrollbar-thin scrollbar-thumb-amber-400/20 scrollbar-track-transparent pr-1 z-10">
                                        <div className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-teal-50 leading-relaxed space-y-3">
                                          {renderTextWithKaTeX(currentCard.answer)}
                                        </div>
                                      </div>

                                      {/* 3-Tier Active Recall Rating Buttons on Card Back */}
                                      <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="pt-3 sm:pt-4 border-t border-dashed border-[#1c4e49] shrink-0 z-30 px-2 sm:px-4"
                                      >
                                        <p className="text-[10px] sm:text-xs font-mono font-bold text-amber-200/90 text-center mb-2.5 flex items-center justify-center gap-1">
                                          <span>🤔 How well did you know this concept?</span>
                                        </p>

                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto">
                                          {/* Confused / Hard button */}
                                          <button
                                            onClick={() => handleRateCard(cardId, "hard")}
                                            className={`py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer border active:scale-95 shadow-2xs ${
                                              currentRating === "hard"
                                                ? "bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40"
                                                : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-700/50"
                                            }`}
                                            title="Need to review again soon (Hotkey: 1)"
                                          >
                                            <span className="text-sm">❌</span>
                                            <span className="truncate">Confused / Hard</span>
                                            <span className="text-[8.5px] opacity-75 font-mono hidden md:inline">(1)</span>
                                          </button>

                                          {/* Good / Medium button */}
                                          <button
                                            onClick={() => handleRateCard(cardId, "medium")}
                                            className={`py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer border active:scale-95 shadow-2xs ${
                                              currentRating === "medium"
                                                ? "bg-sky-600 text-white border-sky-400 ring-2 ring-sky-400/40"
                                                : "bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 border-sky-700/50"
                                            }`}
                                            title="Good recall with slight effort (Hotkey: 2)"
                                          >
                                            <span className="text-sm">⚡</span>
                                            <span className="truncate">Good / Medium</span>
                                            <span className="text-[8.5px] opacity-75 font-mono hidden md:inline">(2)</span>
                                          </button>

                                          {/* Mastered / Easy button */}
                                          <button
                                            onClick={() => handleRateCard(cardId, "easy")}
                                            className={`py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer border active:scale-95 shadow-2xs ${
                                              currentRating === "easy"
                                                ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40"
                                                : "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border-emerald-700/50"
                                            }`}
                                            title="Crystal clear & mastered completely (Hotkey: 3)"
                                          >
                                            <span className="text-sm">✅</span>
                                            <span className="truncate">Mastered / Easy</span>
                                            <span className="text-[8.5px] opacity-75 font-mono hidden md:inline">(3)</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                                {/* Tactile Navigation Controls */}
                                <div className="flex items-center justify-between pt-4 max-w-4xl mx-auto w-full shrink-0">
                                  <button
                                    disabled={currentFlashcardIndex === 0}
                                    onClick={() => {
                                      setCurrentFlashcardIndex(prev => prev - 1);
                                      setIsFlashcardFlipped(false);
                                      setShowFlashcardHint(false);
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                  >
                                    <ChevronLeft className="w-4 h-4 stroke-[3]" /> Prev
                                  </button>

                                  <button
                                    onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                                    className="px-6 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                                  >
                                    <RefreshCw className="w-4 h-4" /> Flip Card
                                  </button>

                                  <button
                                    disabled={currentFlashcardIndex === totalCards - 1}
                                    onClick={() => {
                                      setCurrentFlashcardIndex(prev => prev + 1);
                                      setIsFlashcardFlipped(false);
                                      setShowFlashcardHint(false);
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                  >
                                    Next <ChevronRight className="w-4 h-4 stroke-[3]" />
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 text-xs shadow-2xs flex-1 flex items-center justify-center">
                            No flashcards available.
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200 mt-6 text-center shrink-0">
                        <p className="text-[9.5px] font-mono text-slate-400 font-black tracking-wider uppercase">
                          Active recall helps translate whiteboard explanations into exam success.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeRevisionTab === "mindmap" && (
                    <div className="w-full max-w-4xl mx-auto p-3 sm:p-5 md:p-6 flex flex-col overflow-hidden min-h-0 bg-white flex-1 md:rounded-3xl md:shadow-md md:border md:border-slate-100/60 md:my-4">
                      {/* Top Action Header */}
                      {(() => {
                        const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                        return (
                          <div className="border-b border-slate-150 pb-3 mb-4 shrink-0 flex flex-col text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs uppercase font-mono tracking-widest font-black text-slate-500 flex items-center gap-1.5">
                                    <Brain className="w-4 h-4 text-teal-800 animate-pulse" /> CONCEPT RECALL MIND MAP
                                  </h4>
                                  {/* Smart Source Badge */}
                                  <span 
                                    className="inline-flex items-center gap-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-300"
                                    title={sourceBadge.description}
                                  >
                                    <span>{sourceBadge.icon}</span>
                                    <span>{sourceBadge.label}</span>
                                  </span>
                                </div>
                                <p className="text-xs text-slate-800 font-black tracking-wide uppercase">
                                  {activeRevisionSession.processedTitle || revisionDeckData.mindMap?.title || "Classroom Conceptual Flow Diagram"}
                                </p>
                              </div>

                              <button
                                onClick={() => handleGenerateRevisionDeck(activeRevisionSession)}
                                disabled={loadingRevision}
                                className="self-start sm:self-auto px-3 py-1.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-[10.5px] font-mono font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Fetch freshest classroom blackboard notes and rebuild mind map"
                              >
                                <RefreshCw className={`w-3 h-3 ${loadingRevision ? "animate-spin" : ""}`} />
                                <span>Sync / Re-generate</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* MODE 1: INTERACTIVE MAP GRAPH VIEW */}
                      <div className="flex-1 flex flex-col overflow-hidden min-h-0 text-left animate-fade-in">
                          
                          {/* Instructions Header with Fullscreen & Download Trigger */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 bg-teal-50/50 border border-teal-100/30 px-3.5 py-2 rounded-xl shrink-0">
                            <p className="text-[10.5px] text-teal-900 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0" />
                              <span>Tap any node branch to review details instantly.</span>
                            </p>
                            
                            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                              {/* Download PNG Button */}
                              <button
                                onClick={() => handleDownloadMindMap("png")}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9.5px] font-mono font-black rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-102 active:scale-95"
                                title="Download Mind Map as Image (PNG)"
                              >
                                <Download className="w-3 h-3" /> PNG
                              </button>

                              {/* Download SVG Button */}
                              <button
                                onClick={() => handleDownloadMindMap("svg")}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[9.5px] font-mono font-black rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-102 active:scale-95"
                                title="Download Mind Map as Vector Graphic (SVG)"
                              >
                                <HardDriveDownload className="w-3 h-3" /> SVG
                              </button>

                              {/* Download PDF Button */}
                              <button
                                onClick={() => handleDownloadMindMap("pdf")}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9.5px] font-mono font-black rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer hover:scale-102 active:scale-95"
                                title="Print / Export Mind Map as PDF"
                              >
                                <Printer className="w-3 h-3" /> PDF
                              </button>

                              <button
                                onClick={() => {
                                  setIsMapFullscreen(true);
                                  if (lastSelectedNodeId === null) {
                                    setLastSelectedNodeId(0);
                                    setExpandedNodes({ 0: true });
                                  }
                                }}
                                className="px-2.5 py-1 bg-teal-800 hover:bg-teal-950 text-white text-[9.5px] font-mono font-black rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                              >
                                <Maximize2 className="w-3 h-3" /> FULLSCREEN
                              </button>
                            </div>
                          </div>

                          {/* Map Slate Container */}
                          <div 
                            onClick={() => setSelectedSubNode(null)}
                            className={`border-2 rounded-2xl p-2 sm:p-4 mb-4 relative overflow-visible select-none shrink-0 transition-all duration-300 ${
                              mindMapStyle === "pastel" 
                                ? "bg-[#FAF6F0] border-[#e5dcd0] shadow-[inset_0_2px_8px_rgba(0,0,0,0.01)]" 
                                : "bg-[#051e22] border-teal-950/40 shadow-inner"
                            }`}
                          >
                            {/* Backdrop grid elements */}
                            <div 
                              className={`absolute inset-0 [background-size:16px_16px] pointer-events-none transition-all duration-300 ${
                                mindMapStyle === "pastel"
                                  ? "bg-[radial-gradient(#e5dcd0_1.2px,transparent_1.2px)] opacity-60"
                                  : "bg-[radial-gradient(#1e3b3a_1px,transparent_1px)] opacity-20"
                              }`} 
                            />
                            
                            <svg 
                              id="mindmap-svg"
                              viewBox="0 0 800 420" 
                              width="100%" 
                              className="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[380px] select-none overflow-visible"
                            >
                              <defs>
                                <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="4" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                                  <feDropShadow 
                                    dx="0" 
                                    dy={mindMapStyle === "pastel" ? "3" : "4"} 
                                    stdDeviation={mindMapStyle === "pastel" ? "2" : "3"} 
                                    floodOpacity={mindMapStyle === "pastel" ? "0.08" : "0.4"} 
                                  />
                                </filter>
                                <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={mindMapStyle === "pastel" ? "#b4a4eb" : "#1e5156"} />
                                  <stop offset="100%" stopColor={mindMapStyle === "pastel" ? "#9f86f0" : "#0a2c30"} />
                                </linearGradient>
                                <linearGradient id="selectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#0d9488" />
                                  <stop offset="100%" stopColor="#0f766e" />
                                </linearGradient>
                                <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#115e59" />
                                  <stop offset="100%" stopColor="#134e4a" />
                                </linearGradient>
                                <marker 
                                  id="arrow-head" 
                                  viewBox="0 0 10 10" 
                                  refX="8" 
                                  refY="5" 
                                  markerWidth="5" 
                                  markerHeight="5" 
                                  orient="auto-start-reverse"
                                >
                                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={mindMapStyle === "pastel" ? "#4b5563" : "#2dd4bf"} />
                                </marker>
                              </defs>

                              {/* 1. Connecting curves from center (400, 210) to nodes */}
                              {(() => {
                                const nodes = revisionDeckData.mindMap?.nodes || [];
                                const N = nodes.length || 1;
                                const center = { x: 400, y: 210 };
                                const rx = 245;
                                const ry = 135;

                                return nodes.map((node: any, index: number) => {
                                  const angle = (2 * Math.PI * index) / N - Math.PI / 2;
                                  const targetX = center.x + rx * Math.cos(angle);
                                  const targetY = center.y + ry * Math.sin(angle);

                                  const isSelected = lastSelectedNodeId === index;
                                  const isMatched = (() => {
                                    if (!mindMapSearch.trim()) return false;
                                    const queryText = mindMapSearch.toLowerCase();
                                    return (
                                      node.topicName?.toLowerCase().includes(queryText) ||
                                      node.keyFormula?.toLowerCase().includes(queryText) ||
                                      (node.keyConcepts || node.coreConcepts || []).some((c: string) => c.toLowerCase().includes(queryText))
                                    );
                                  })();

                                  const cx1 = center.x + (targetX - center.x) * 0.45;
                                  const cy1 = center.y;
                                  const cx2 = center.x + (targetX - center.x) * 0.55;
                                  const cy2 = targetY;

                                  const pathD = `M ${center.x} ${center.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
                                  const pTheme = getPastelTheme(index);

                                  return (
                                    <g key={`path-${index}`} className="pointer-events-none">
                                      {isSelected && (
                                        <path 
                                          d={pathD} 
                                          fill="none" 
                                          stroke={mindMapStyle === "pastel" ? pTheme.stroke : "#fbbf24"} 
                                          strokeWidth="7" 
                                          opacity={mindMapStyle === "pastel" ? "0.15" : "0.35"} 
                                          strokeLinecap="round"
                                          className="animate-pulse"
                                        />
                                      )}
                                      <path 
                                        d={pathD} 
                                        fill="none" 
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? (isSelected ? pTheme.stroke : isMatched ? "#10b981" : "#4b5563")
                                            : (isSelected ? "#fbbf24" : isMatched ? "#2dd4bf" : "#114c47")
                                        } 
                                        strokeWidth={isSelected ? "2.5" : isMatched ? "2" : "1.5"} 
                                        strokeDasharray={
                                          mindMapStyle === "pastel" 
                                            ? "none" 
                                            : (isMatched || isSelected ? "none" : "5 4")
                                        }
                                        markerEnd={mindMapStyle === "pastel" ? "url(#arrow-head)" : undefined}
                                        className="transition-all duration-300"
                                        strokeLinecap="round"
                                      />
                                      {isSelected && (
                                        <circle 
                                          cx={targetX} 
                                          cy={targetY} 
                                          r="12" 
                                          fill="none" 
                                          stroke={mindMapStyle === "pastel" ? pTheme.stroke : "#fbbf24"} 
                                          strokeWidth="1.5" 
                                          className="animate-ping" 
                                          opacity="0.6"
                                        />
                                      )}
                                    </g>
                                  );
                                });
                              })()}

                              {/* 2. Central Hub Bubble */}
                              {(() => {
                                const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                                const rawTitle = activeRevisionSession.processedTitle || revisionDeckData.mindMap?.title || "Core Concept Hub";
                                const maxChar = 22;
                                
                                return (
                                  <g filter="url(#shadow)" className="cursor-pointer" onClick={(e) => {
                                    e.stopPropagation();
                                    setLastSelectedNodeId(0);
                                    setExpandedNodes({ 0: true });
                                    setSelectedSubNode(null);
                                  }}>
                                    <rect 
                                      x="270" 
                                      y="166" 
                                      width="260" 
                                      height="88" 
                                      rx="22" 
                                      ry="22" 
                                      fill="url(#centerGrad)" 
                                      stroke={mindMapStyle === "pastel" ? "#7c3aed" : "#0d9488"} 
                                      strokeWidth="2.5" 
                                      className="hover:stroke-teal-400 transition-all duration-300 active:scale-98"
                                    />
                                    {/* Source Tag Bubble on Top */}
                                    <rect 
                                      x="320" 
                                      y="154" 
                                      width="160" 
                                      height="22" 
                                      rx="7" 
                                      ry="7" 
                                      fill={mindMapStyle === "pastel" ? "#ffca28" : "#f59e0b"} 
                                    />
                                    <text 
                                      x="400" 
                                      y="168" 
                                      textAnchor="middle" 
                                      fill={mindMapStyle === "pastel" ? "#3e2723" : "#0f172a"} 
                                      fontSize="8.5" 
                                      fontWeight="900" 
                                      letterSpacing="0.8"
                                      className="font-mono uppercase select-none"
                                    >
                                      {sourceBadge.shortLabel}
                                    </text>

                                    {/* Prominently render Chapter / Document Name */}
                                    {(() => {
                                      if (rawTitle.length <= maxChar) {
                                        return (
                                          <text 
                                            x="400" 
                                            y="204" 
                                            textAnchor="middle" 
                                            fill="#ffffff" 
                                            fontSize="12.5" 
                                            fontWeight="900" 
                                            className="font-sans tracking-wide uppercase select-none"
                                          >
                                            {rawTitle}
                                          </text>
                                        );
                                      }
                                      const words = rawTitle.split(" ");
                                      let line1 = "";
                                      let line2 = "";
                                      for (const w of words) {
                                        if ((line1 + " " + w).trim().length <= maxChar && line2 === "") {
                                          line1 = (line1 + " " + w).trim();
                                        } else {
                                          line2 = (line2 + " " + w).trim();
                                        }
                                      }
                                      if (line2.length > maxChar) line2 = line2.slice(0, maxChar - 2) + "...";
                                      return (
                                        <g>
                                          <text 
                                            x="400" 
                                            y="197" 
                                            textAnchor="middle" 
                                            fill="#ffffff" 
                                            fontSize="11.5" 
                                            fontWeight="900" 
                                            className="font-sans tracking-wide uppercase select-none"
                                          >
                                            {line1 || rawTitle.slice(0, maxChar)}
                                          </text>
                                          <text 
                                            x="400" 
                                            y="214" 
                                            textAnchor="middle" 
                                            fill="#ffffff" 
                                            fontSize="11" 
                                            fontWeight="800" 
                                            className="font-sans tracking-wide uppercase select-none"
                                          >
                                            {line2}
                                          </text>
                                        </g>
                                      );
                                    })()}

                                    <text 
                                      x="400" 
                                      y="238" 
                                      textAnchor="middle" 
                                      fill={mindMapStyle === "pastel" ? "#fdfaf6" : "#99f6e4"} 
                                      fontSize="9" 
                                      fontWeight="700" 
                                      className="font-mono uppercase tracking-widest select-none opacity-95"
                                    >
                                      {activeRevisionSession.subject || subject} • CLASS {grade}
                                    </text>
                                  </g>
                                );
                              })()}

                              {/* 3. Branch Concept Capsules */}
                              {(() => {
                                const nodes = revisionDeckData.mindMap?.nodes || [];
                                const N = nodes.length || 1;
                                const center = { x: 400, y: 210 };
                                const rx = 245;
                                const ry = 135;

                                return nodes.map((node: any, index: number) => {
                                  const angle = (2 * Math.PI * index) / N - Math.PI / 2;
                                  const targetX = center.x + rx * Math.cos(angle);
                                  const targetY = center.y + ry * Math.sin(angle);

                                  const isSelected = lastSelectedNodeId === index;
                                  const isMatched = (() => {
                                    if (!mindMapSearch.trim()) return false;
                                    const queryText = mindMapSearch.toLowerCase();
                                    return (
                                      node.topicName?.toLowerCase().includes(queryText) ||
                                      node.keyFormula?.toLowerCase().includes(queryText) ||
                                      (node.keyConcepts || node.coreConcepts || []).some((c: string) => c.toLowerCase().includes(queryText))
                                    );
                                  })();

                                  const capW = 164;
                                  const capH = 48;
                                  const capX = targetX - capW / 2;
                                  const capY = targetY - capH / 2;

                                  const maxLen = 18;
                                  const rawName = node.topicName || "General Topic";
                                  const dispName = rawName.length > maxLen ? rawName.slice(0, maxLen - 2) + "..." : rawName;
                                  const pTheme = getPastelTheme(index);

                                  return (
                                    <g 
                                      key={`node-${index}`} 
                                      filter="url(#shadow)" 
                                      className="cursor-pointer group select-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLastSelectedNodeId(index);
                                        setExpandedNodes({ [index]: true });
                                        setSelectedSubNode(null);
                                      }}
                                    >
                                      {/* Outer border highlight */}
                                      <rect 
                                        x={capX - (isSelected ? 3 : 1)} 
                                        y={capY - (isSelected ? 3 : 1)} 
                                        width={capW + (isSelected ? 6 : 2)} 
                                        height={capH + (isSelected ? 6 : 2)} 
                                        rx="14" 
                                        ry="14" 
                                        fill="none" 
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? (isSelected ? pTheme.stroke : isMatched ? "#10b981" : "transparent")
                                            : (isSelected ? "#fbbf24" : isMatched ? "#2dd4bf" : "transparent")
                                        } 
                                        strokeWidth={isSelected ? "3" : isMatched ? "2" : "0"} 
                                        opacity={isSelected ? "1" : isMatched ? "0.85" : "0"}
                                        className="transition-all duration-300"
                                      />

                                      {/* Core node capsule */}
                                      <rect 
                                        x={capX} 
                                        y={capY} 
                                        width={capW} 
                                        height={capH} 
                                        rx="12" 
                                        ry="12" 
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? pTheme.fill
                                            : (isSelected ? "url(#selectedGrad)" : "url(#nodeGrad)")
                                        } 
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? (isSelected ? "#7c3aed" : isMatched ? "#059669" : pTheme.stroke)
                                            : (isSelected ? "#f59e0b" : isMatched ? "#0f766e" : "#0d3c38")
                                        } 
                                        strokeWidth={mindMapStyle === "pastel" ? "1.8" : "1.5"} 
                                        className="transition-all duration-300 group-hover:stroke-teal-400 group-active:scale-98"
                                      />

                                      {/* Index Circle Indicator */}
                                      <circle 
                                        cx={capX + 16} 
                                        cy={targetY} 
                                        r="8.5" 
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? pTheme.stroke
                                            : (isSelected ? "#115e59" : "#0d3d39")
                                        } 
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? pTheme.text
                                            : (isSelected ? "#fbbf24" : "#0d9488")
                                        }
                                        strokeWidth="1"
                                      />
                                      <text 
                                        x={capX + 16} 
                                        y={targetY + 3} 
                                        textAnchor="middle" 
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? "#ffffff"
                                            : (isSelected ? "#fbbf24" : "#2dd4bf")
                                        } 
                                        fontSize="8" 
                                        fontWeight="900" 
                                        className="font-mono select-none"
                                      >
                                        {index + 1}
                                      </text>

                                      {/* Main Text Label */}
                                      <text 
                                        x={capX + 32} 
                                        y={targetY + 3} 
                                        fill={mindMapStyle === "pastel" ? pTheme.text : "#ffffff"} 
                                        fontSize="9.5" 
                                        fontWeight="900" 
                                        className="font-sans uppercase tracking-wide select-none group-hover:opacity-80 transition-colors"
                                      >
                                        {dispName}
                                      </text>

                                      {/* Mini Item Counter badge */}
                                      <g transform={`translate(${capX + capW - 24}, ${targetY - 6.5})`}>
                                        <rect 
                                          width="16" 
                                          height="13" 
                                          rx="4" 
                                          ry="4" 
                                          fill={
                                            mindMapStyle === "pastel"
                                              ? pTheme.stroke
                                              : (isSelected ? "#0d534f" : "#114c47")
                                          } 
                                          opacity={mindMapStyle === "pastel" ? "0.15" : "1"}
                                        />
                                        <text 
                                          x="8" 
                                          y="9" 
                                          textAnchor="middle" 
                                          fill={mindMapStyle === "pastel" ? pTheme.text : "#ffffff"} 
                                          fontSize="7.5" 
                                          fontWeight="bold" 
                                          className="font-mono"
                                        >
                                          {getSubItems(node).length}
                                        </text>
                                      </g>
                                    </g>
                                  );
                                });
                              })()}

                              {/* 4. Sub-branch nodes for the selected parent node */}
                              {(() => {
                                if (lastSelectedNodeId === null) return null;
                                const parentNode = revisionDeckData.mindMap?.nodes?.[lastSelectedNodeId];
                                if (!parentNode) return null;

                                const nodes = revisionDeckData.mindMap?.nodes || [];
                                const N = nodes.length || 1;
                                const center = { x: 400, y: 210 };
                                const rx = 245;
                                const ry = 135;

                                const angle = (2 * Math.PI * lastSelectedNodeId) / N - Math.PI / 2;
                                const targetX = center.x + rx * Math.cos(angle);
                                const targetY = center.y + ry * Math.sin(angle);

                                const subItems = getSubItems(parentNode);
                                const K = subItems.length;
                                if (K === 0) return null;

                                const spread = K <= 1 ? 0 : Math.min(Math.PI * 0.75, (K - 1) * 0.38);
                                const startAngle = angle - spread / 2;

                                const pTheme = getPastelTheme(lastSelectedNodeId);
                                const subTheme = getSubNodePastelTheme(lastSelectedNodeId);

                                return subItems.map((subItem: any, i: number) => {
                                  const subAngle = K <= 1 ? angle : startAngle + (i * spread) / (K - 1);
                                  const subDist = 80;
                                  const subX = targetX + subDist * Math.cos(subAngle);
                                  const subY = targetY + subDist * Math.sin(subAngle);

                                  const subW = 114;
                                  const subH = 28;
                                  const subX_rect = subX - subW / 2;
                                  const subY_rect = subY - subH / 2;

                                  const isSubSelected = selectedSubNode?.nodeId === lastSelectedNodeId && selectedSubNode?.subIdx === i;

                                  return (
                                    <g 
                                      key={`sub-${lastSelectedNodeId}-${i}`}
                                      className="cursor-pointer group select-none animate-fade-in"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSubNode({ nodeId: lastSelectedNodeId, subIdx: i });
                                      }}
                                    >
                                      {/* Connector Line */}
                                      <line
                                        x1={targetX}
                                        y1={targetY}
                                        x2={subX}
                                        y2={subY}
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? pTheme.stroke
                                            : (isSubSelected ? "#fbbf24" : "#2dd4bf")
                                        }
                                        strokeWidth={
                                          mindMapStyle === "pastel"
                                            ? "1.5"
                                            : (isSubSelected ? "2" : "1.2")
                                        }
                                        strokeDasharray={
                                          mindMapStyle === "pastel"
                                            ? "none"
                                            : (isSubSelected ? "none" : "3 2")
                                        }
                                        markerEnd={mindMapStyle === "pastel" ? "url(#arrow-head)" : undefined}
                                        opacity="0.8"
                                      />
                                      
                                      {/* Sub-node bubble */}
                                      <rect
                                        x={subX_rect}
                                        y={subY_rect}
                                        width={subW}
                                        height={subH}
                                        rx="8"
                                        ry="8"
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? (isSubSelected ? "#ffca28" : subTheme.fill)
                                            : (isSubSelected ? "#fbbf24" : "#0f3a40")
                                        }
                                        stroke={
                                          mindMapStyle === "pastel"
                                            ? (isSubSelected ? "#d97706" : subTheme.stroke)
                                            : (isSubSelected ? "#d97706" : subItem.type === "formula" ? "#f59e0b" : subItem.type === "tip" ? "#34d399" : "#38bdf8")
                                        }
                                        strokeWidth={isSubSelected ? "2" : "1.5"}
                                        className="transition-all duration-300 group-hover:scale-105"
                                      />
                                      
                                      {/* Label */}
                                      <text
                                        x={subX}
                                        y={subY + 3.5}
                                        textAnchor="middle"
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? (isSubSelected ? "#431407" : subTheme.text)
                                            : (isSubSelected ? "#0f172a" : "#e2e8f0")
                                        }
                                        fontSize="7.5"
                                        fontWeight="900"
                                        className="font-mono tracking-wider select-none uppercase"
                                      >
                                        {subItem.label}
                                      </text>
                                    </g>
                                  );
                                });
                              })()}
                            </svg>

                            {/* Floating Custom HTML Tooltip / Popover inside the board */}
                            {selectedSubNode && (() => {
                              const nodeIdx = selectedSubNode.nodeId;
                              const subIdx = selectedSubNode.subIdx;
                              const activeNode = revisionDeckData.mindMap?.nodes?.[nodeIdx];
                              if (!activeNode) return null;
                              
                              const subItems = getSubItems(activeNode);
                              const subItem = subItems[subIdx];
                              if (!subItem) return null;
                              
                              const N = revisionDeckData.mindMap?.nodes?.length || 1;
                              const center = { x: 400, y: 210 };
                              const rx = 245;
                              const ry = 135;
                              
                              const angle = (2 * Math.PI * nodeIdx) / N - Math.PI / 2;
                              const targetX = center.x + rx * Math.cos(angle);
                              const targetY = center.y + ry * Math.sin(angle);
                              
                              const K = subItems.length;
                              const spread = K <= 1 ? 0 : Math.min(Math.PI * 0.75, (K - 1) * 0.38);
                              const startAngle = angle - spread / 2;
                              const subAngle = K <= 1 ? angle : startAngle + (subIdx * spread) / (K - 1);
                              
                              const subDist = 80;
                              const subX = targetX + subDist * Math.cos(subAngle);
                              const subY = targetY + subDist * Math.sin(subAngle);
                              
                              const leftPercent = (subX / 800) * 100;
                              const topPercent = (subY / 420) * 100;
                              
                              const xOffset = subX > 400 ? -260 : 20;
                              const yOffset = subY > 210 ? -120 : 10;
                              
                              return (
                                <div 
                                  className={`absolute border rounded-2xl p-4 shadow-2xl z-40 w-64 text-left animate-fade-in backdrop-blur-md pointer-events-auto transition-all ${
                                    mindMapStyle === "pastel"
                                      ? "bg-white/95 border-slate-250/60 text-slate-800"
                                      : "bg-slate-900/95 border-teal-500/30 text-white"
                                  }`}
                                  style={{
                                    left: `calc(${leftPercent}% + ${xOffset}px)`,
                                    top: `calc(${topPercent}% + ${yOffset}px)`,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 shrink-0 ${
                                    mindMapStyle === "pastel" ? "border-slate-100" : "border-teal-800/40"
                                  }`}>
                                    <span className={`text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1 ${
                                      mindMapStyle === "pastel" ? "text-indigo-600" : "text-amber-400"
                                    }`}>
                                      {subItem.type === "formula" ? "📐 RULE / FORMULA" : subItem.type === "tip" ? "💡 EXAM TIP" : "🧠 KEY CONCEPT"}
                                    </span>
                                    <button 
                                      onClick={() => setSelectedSubNode(null)}
                                      className={`font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                        mindMapStyle === "pastel"
                                          ? "text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
                                          : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                                      }`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className={`text-[11px] sm:text-xs font-semibold leading-relaxed overflow-y-auto max-h-40 scrollbar-thin ${
                                    mindMapStyle === "pastel" ? "text-slate-700" : "text-teal-50"
                                  }`}>
                                    {renderTextWithKaTeX(subItem.text)}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                        </div>



                      {/* Small Bottom Info Disclaimer */}
                      <div className="pt-3 border-t border-slate-100 mt-4 shrink-0 text-center">
                        <p className="text-[9.5px] font-mono text-slate-400 font-bold">
                          Concept map parsed dynamically from Direct Classroom parameters
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Topic Summary & Key Highlights */}
                  {activeRevisionTab === "summary" && (
                    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pb-24 sm:pb-8 flex flex-col overflow-y-auto min-h-0 bg-white flex-1 md:rounded-3xl md:shadow-md md:border md:border-slate-100/60 md:my-4">
                      {(() => {
                        const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                        const subName = activeRevisionSession?.inferredSubject || activeRevisionSession?.subject || subject || "Science";
                        const chapTitle = activeRevisionSession?.processedTitle || revisionDeckData?.mindMap?.title || "Class Lecture";
                        const keyConcepts = revisionDeckData?.mindMap?.nodes || [];
                        const flashcards = revisionDeckData?.flashcards || [];
                        const masteredCount = Object.values(masteredCards).filter(Boolean).length;
                        const totalCardsCount = flashcards.length;

                        return (
                          <div className="space-y-6">
                            {/* Summary Header Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-lg border border-teal-700/40">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="p-1.5 bg-amber-400 text-slate-950 rounded-lg text-xs font-black">
                                    <Sparkles className="w-4 h-4" />
                                  </span>
                                  <h3 className="text-sm sm:text-base font-mono font-black tracking-wider uppercase text-amber-300">
                                    Executive Concept Summary
                                  </h3>
                                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border bg-emerald-950/60 text-emerald-300 border-emerald-500/40">
                                    <span>{sourceBadge.icon}</span>
                                    <span>{sourceBadge.label}</span>
                                  </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                                  {chapTitle}
                                </h2>
                                <p className="text-xs text-teal-200 font-mono">
                                  {subName} • Class {grade} • {board} Board Curriculum
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                <button
                                  onClick={() => handleDownloadMindMap("pdf")}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-95"
                                  title="Print / Save Full Revision Document as PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" /> PRINT / PDF
                                </button>
                                <button
                                  onClick={() => handleGenerateRevisionDeck(activeRevisionSession)}
                                  disabled={loadingRevision}
                                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-mono font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-95 disabled:opacity-50"
                                  title="Sync & Regenerate with latest notes"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRevision ? "animate-spin" : ""}`} /> SYNC
                                </button>
                              </div>
                            </div>

                            {/* Revision Stats Glance */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/60 flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">Core Topics</span>
                                <span className="text-xl font-mono font-black text-teal-950 mt-1">{keyConcepts.length}</span>
                                <span className="text-[9px] text-teal-600 font-semibold mt-0.5">High-yield themes</span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">Interactive Cards</span>
                                <span className="text-xl font-mono font-black text-amber-950 mt-1">{totalCardsCount}</span>
                                <span className="text-[9px] text-amber-600 font-semibold mt-0.5">Flashcard prompts</span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Mastered</span>
                                <span className="text-xl font-mono font-black text-emerald-950 mt-1">{masteredCount} / {totalCardsCount}</span>
                                <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                                  {totalCardsCount > 0 ? Math.round((masteredCount / totalCardsCount) * 100) : 0}% retention rate
                                </span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">Formulas & Rules</span>
                                <span className="text-xl font-mono font-black text-indigo-950 mt-1">
                                  {keyConcepts.reduce((acc: number, n: any) => acc + (n.subNodes?.filter((s: any) => s.type === "formula" || s.type === "rule").length || 0), 0)}
                                </span>
                                <span className="text-[9px] text-indigo-600 font-semibold mt-0.5">Tested equations</span>
                              </div>
                            </div>

                            {/* Section: Structured Concept Notes & Mind Map Breakdown */}
                            <div className="space-y-4">
                              <h4 className="text-xs uppercase font-mono font-black text-slate-700 tracking-wider flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-teal-700" />
                                <span>Mastery Breakdown & Key Formulations</span>
                              </h4>

                              <div className="space-y-4">
                                {keyConcepts.map((node: any, idx: number) => {
                                  const formulas = (node.subNodes || []).filter((s: any) => s.type === "formula" || s.type === "rule");
                                  const concepts = (node.subNodes || []).filter((s: any) => s.type === "concept");
                                  const tips = (node.subNodes || []).filter((s: any) => s.type === "tip" || s.type === "warning");

                                  return (
                                    <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all shadow-2xs">
                                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/60">
                                        <div className="flex items-center gap-2.5">
                                          <span className="w-6 h-6 rounded-lg bg-teal-800 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                                            {idx + 1}
                                          </span>
                                          <h5 className="text-sm font-black text-slate-800 tracking-tight uppercase font-mono">
                                            {node.topicName || `Topic ${idx + 1}`}
                                          </h5>
                                        </div>
                                        <button
                                          onClick={() => {
                                            if (onDiscussWithCherry) {
                                              onDiscussWithCherry({
                                                topic: node.topicName || chapTitle,
                                                subject: subName,
                                                conceptTested: "Full Topic Review",
                                              });
                                            }
                                          }}
                                          className="text-[10px] font-mono font-bold text-teal-700 hover:text-teal-900 bg-teal-100/60 hover:bg-teal-200/70 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>💡 Clarify with Cherry</span>
                                        </button>
                                      </div>

                                      {/* Core Concepts */}
                                      {concepts.length > 0 && (
                                        <div className="mb-3 space-y-1.5">
                                          <span className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider">
                                            Core Principles & Mechanics:
                                          </span>
                                          <ul className="space-y-1.5 pl-2">
                                            {concepts.map((c: any, cIdx: number) => (
                                              <li key={cIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                                                <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                                                <div className="flex-1">{renderTextWithKaTeX(c.text)}</div>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Formulas & Equations Grid */}
                                      {formulas.length > 0 && (
                                        <div className="mb-3 p-3 rounded-xl bg-teal-900/5 border border-teal-500/20 space-y-2">
                                          <span className="text-[10px] font-mono font-black uppercase text-teal-800 tracking-wider flex items-center gap-1">
                                            <span>📐 Mathematical Laws & Formulas:</span>
                                          </span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {formulas.map((f: any, fIdx: number) => (
                                              <div key={fIdx} className="p-2 rounded-lg bg-white border border-teal-200/60 shadow-2xs text-xs font-semibold text-teal-950">
                                                {renderTextWithKaTeX(f.text)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Exam Tips & High-Yield Alerts */}
                                      {tips.length > 0 && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1.5">
                                          <span className="text-[10px] font-mono font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                                            <span>💡 Examiner Alert & Board Exam Tips:</span>
                                          </span>
                                          <div className="space-y-1">
                                            {tips.map((t: any, tIdx: number) => (
                                              <div key={tIdx} className="text-xs text-amber-950 leading-relaxed font-medium">
                                                {renderTextWithKaTeX(t.text)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bottom Help Disclaimer */}
                            <div className="pt-4 border-t border-slate-100 text-center text-[10px] font-mono text-slate-400 font-bold">
                              Summary dynamically parsed from active classroom chalkboards and lesson artifacts.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* IMMERSIVE FULLSCREEN MODE BACKDROP PORTAL OVERLAY */}
                  {activeRevisionTab === "mindmap" && isMapFullscreen && (
                    <div 
                      onClick={() => setSelectedSubNode(null)}
                      className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fade-in text-left transition-all duration-300 ${
                        mindMapStyle === "pastel"
                          ? "bg-[#FAF6F0] text-slate-800"
                          : "bg-[#031316] text-white"
                      }`}
                    >
                      
                      {/* Interactive Diagram chalkboard panel */}
                      <div className="flex-1 flex flex-col min-w-0 h-full relative">
                        {/* Chalkboard Slate Grid */}
                        <div 
                          className={`absolute inset-0 [background-size:24px_24px] pointer-events-none transition-all duration-300 ${
                            mindMapStyle === "pastel"
                              ? "bg-[radial-gradient(#e5dcd0_1.5px,transparent_1.5px)] opacity-60"
                              : "bg-[radial-gradient(#1e3b3a_1.2px,transparent_1.2px)] opacity-25"
                          }`}
                        />
                        
                        {/* Fullscreen Overlay Header */}
                        {(() => {
                          const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                          return (
                            <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 shrink-0 ${
                              mindMapStyle === "pastel"
                                ? "bg-[#FAF6F0]/95 border-[#e5dcd0]"
                                : "bg-[#041a1e]/95 border-teal-950/80"
                            }`}>
                              <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-amber-500 text-slate-900 rounded-xl shadow-xs">
                                  <Brain className="w-4 h-4 animate-pulse" />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={`text-xs sm:text-sm font-mono font-black tracking-widest uppercase ${
                                      mindMapStyle === "pastel" ? "text-indigo-700" : "text-amber-400"
                                    }`}>
                                      IMMERSIVE CONCEPTUAL FLOW BOARD
                                    </h3>
                                    {/* Smart Source Badge */}
                                    <span 
                                      className="inline-flex items-center gap-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-300"
                                      title={sourceBadge.description}
                                    >
                                      <span>{sourceBadge.icon}</span>
                                      <span>{sourceBadge.label}</span>
                                    </span>
                                  </div>
                                  <p className={`text-[10.5px] font-bold uppercase tracking-wide truncate max-w-sm sm:max-w-md ${
                                    mindMapStyle === "pastel" ? "text-slate-700" : "text-teal-100"
                                  }`}>
                                    {activeRevisionSession.processedTitle || revisionDeckData.mindMap?.title} • {activeRevisionSession.subject || subject} (Class {grade})
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Sync Latest Button in Fullscreen Header */}
                                <button
                                  onClick={() => handleGenerateRevisionDeck(activeRevisionSession)}
                                  disabled={loadingRevision}
                                  className={`px-3 py-2 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md disabled:opacity-50 ${
                                    mindMapStyle === "pastel"
                                      ? "bg-teal-700 hover:bg-teal-800 text-white"
                                      : "bg-teal-700 hover:bg-teal-800 text-white border border-teal-500/40"
                                  }`}
                                  title="Sync latest classroom notes and regenerate"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRevision ? "animate-spin" : ""}`} />
                                  <span>SYNC</span>
                                </button>

                                {/* Theme Toggle Button in Fullscreen Header */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMindMapStyle(prev => prev === "slate" ? "pastel" : "slate");
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md ${
                                    mindMapStyle === "pastel"
                                      ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                                      : "bg-teal-900/80 hover:bg-teal-800 text-teal-200"
                                  }`}
                                >
                                  🎨 THEME: {mindMapStyle === "pastel" ? "PASTEL" : "DARK SLATE"}
                                </button>

                                {/* Download PNG Button */}
                                <button
                                  onClick={() => handleDownloadMindMap("png")}
                                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                                  title="Download Mind Map as Image (PNG)"
                                >
                                  <Download className="w-3.5 h-3.5" /> PNG
                                </button>

                                {/* Download SVG Button */}
                                <button
                                  onClick={() => handleDownloadMindMap("svg")}
                                  className="px-3 py-2 bg-teal-800 hover:bg-teal-750 text-teal-100 border border-teal-700/50 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                                  title="Download Mind Map as Vector Graphic (SVG)"
                                >
                                  <HardDriveDownload className="w-3.5 h-3.5" /> SVG
                                </button>

                                {/* Download PDF Button */}
                                <button
                                  onClick={() => handleDownloadMindMap("pdf")}
                                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/30 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                                  title="Print / Export Mind Map as PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" /> PDF
                                </button>

                                <button
                                  onClick={() => setIsMapFullscreen(false)}
                                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/30 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
                                >
                                  <Minimize2 className="w-3.5 h-3.5" /> EXIT FULLSCREEN
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Large SVG Viewport */}
                        <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0 select-none">
                          <svg 
                            id="mindmap-fullscreen-svg"
                            viewBox="0 0 800 420" 
                            width="100%" 
                            className="w-full max-w-4xl h-auto select-none overflow-visible"
                          >
                            <defs>
                              <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                              <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow 
                                  dx="0" 
                                  dy={mindMapStyle === "pastel" ? "3" : "4"} 
                                  stdDeviation={mindMapStyle === "pastel" ? "2" : "3"} 
                                  floodOpacity={mindMapStyle === "pastel" ? "0.08" : "0.4"} 
                                />
                              </filter>
                              <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={mindMapStyle === "pastel" ? "#b4a4eb" : "#1e5156"} />
                                <stop offset="100%" stopColor={mindMapStyle === "pastel" ? "#9f86f0" : "#0a2c30"} />
                              </linearGradient>
                              <linearGradient id="selectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0d9488" />
                                <stop offset="100%" stopColor="#0f766e" />
                              </linearGradient>
                              <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#115e59" />
                                <stop offset="100%" stopColor="#134e4a" />
                              </linearGradient>
                              <marker 
                                id="arrow-head" 
                                viewBox="0 0 10 10" 
                                refX="8" 
                                refY="5" 
                                markerWidth="5" 
                                markerHeight="5" 
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={mindMapStyle === "pastel" ? "#4b5563" : "#2dd4bf"} />
                              </marker>
                            </defs>

                            {/* 1. Curved lines */}
                            {(() => {
                              const nodes = revisionDeckData.mindMap?.nodes || [];
                              const N = nodes.length || 1;
                              const center = { x: 400, y: 210 };
                              const rx = 245;
                              const ry = 135;

                              return nodes.map((node: any, index: number) => {
                                const angle = (2 * Math.PI * index) / N - Math.PI / 2;
                                const targetX = center.x + rx * Math.cos(angle);
                                const targetY = center.y + ry * Math.sin(angle);

                                const isSelected = lastSelectedNodeId === index;
                                const isMatched = (() => {
                                  if (!mindMapSearch.trim()) return false;
                                  const queryText = mindMapSearch.toLowerCase();
                                  return (
                                    node.topicName?.toLowerCase().includes(queryText) ||
                                    node.keyFormula?.toLowerCase().includes(queryText) ||
                                    (node.keyConcepts || node.coreConcepts || []).some((c: string) => c.toLowerCase().includes(queryText))
                                  );
                                })();

                                const cx1 = center.x + (targetX - center.x) * 0.45;
                                  const cy1 = center.y;
                                  const cx2 = center.x + (targetX - center.x) * 0.55;
                                  const cy2 = targetY;

                                  const pathD = `M ${center.x} ${center.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
                                  const pTheme = getPastelTheme(index);

                                return (
                                  <g key={`fs-path-${index}`} className="pointer-events-none">
                                    {isSelected && (
                                      <path 
                                        d={pathD} 
                                        fill="none" 
                                        stroke={mindMapStyle === "pastel" ? pTheme.stroke : "#fbbf24"} 
                                        strokeWidth="7" 
                                        opacity={mindMapStyle === "pastel" ? "0.15" : "0.35"} 
                                        strokeLinecap="round"
                                        className="animate-pulse"
                                      />
                                    )}
                                    <path 
                                      d={pathD} 
                                      fill="none" 
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? (isSelected ? pTheme.stroke : isMatched ? "#10b981" : "#4b5563")
                                          : (isSelected ? "#fbbf24" : isMatched ? "#2dd4bf" : "#114c47")
                                      } 
                                      strokeWidth={isSelected ? "2.5" : isMatched ? "2" : "1.5"} 
                                      strokeDasharray={
                                        mindMapStyle === "pastel" 
                                          ? "none" 
                                          : (isMatched || isSelected ? "none" : "5 4")
                                      }
                                      markerEnd={mindMapStyle === "pastel" ? "url(#arrow-head)" : undefined}
                                      className="transition-all duration-300"
                                      strokeLinecap="round"
                                    />
                                    {isSelected && (
                                      <circle 
                                        cx={targetX} 
                                        cy={targetY} 
                                        r="12" 
                                        fill="none" 
                                        stroke={mindMapStyle === "pastel" ? pTheme.stroke : "#fbbf24"} 
                                        strokeWidth="1.5" 
                                        className="animate-ping" 
                                        opacity="0.6"
                                      />
                                    )}
                                  </g>
                                );
                              });
                            })()}

                            {/* 2. Central Hub bubble */}
                            {(() => {
                              const sourceBadge = getSourceBadgeInfo(activeRevisionSession);
                              const rawTitle = activeRevisionSession.processedTitle || revisionDeckData.mindMap?.title || "Core Concept Hub";
                              const maxChar = 22;

                              return (
                                <g filter="url(#shadow)" className="cursor-pointer" onClick={(e) => {
                                  e.stopPropagation();
                                  setLastSelectedNodeId(0);
                                  setExpandedNodes({ 0: true });
                                  setSelectedSubNode(null);
                                }}>
                                  <rect 
                                    x="270" 
                                    y="166" 
                                    width="260" 
                                    height="88" 
                                    rx="22" 
                                    ry="22" 
                                    fill="url(#centerGrad)" 
                                    stroke={mindMapStyle === "pastel" ? "#7c3aed" : "#0d9488"} 
                                    strokeWidth="2.5" 
                                  />
                                  {/* Source Tag Bubble on Top */}
                                  <rect 
                                    x="320" 
                                    y="154" 
                                    width="160" 
                                    height="22" 
                                    rx="7" 
                                    ry="7" 
                                    fill={mindMapStyle === "pastel" ? "#ffca28" : "#f59e0b"} 
                                  />
                                  <text 
                                    x="400" 
                                    y="168" 
                                    textAnchor="middle" 
                                    fill={mindMapStyle === "pastel" ? "#3e2723" : "#0f172a"} 
                                    fontSize="8.5" 
                                    fontWeight="900" 
                                    letterSpacing="0.8"
                                    className="font-mono uppercase select-none"
                                  >
                                    {sourceBadge.shortLabel}
                                  </text>

                                  {/* Prominently render Chapter / Document Name */}
                                  {(() => {
                                    if (rawTitle.length <= maxChar) {
                                      return (
                                        <text 
                                          x="400" 
                                          y="204" 
                                          textAnchor="middle" 
                                          fill="#ffffff" 
                                          fontSize="12.5" 
                                          fontWeight="900" 
                                          className="font-sans tracking-wide uppercase select-none"
                                        >
                                          {rawTitle}
                                        </text>
                                      );
                                    }
                                    const words = rawTitle.split(" ");
                                    let line1 = "";
                                    let line2 = "";
                                    for (const w of words) {
                                      if ((line1 + " " + w).trim().length <= maxChar && line2 === "") {
                                        line1 = (line1 + " " + w).trim();
                                      } else {
                                        line2 = (line2 + " " + w).trim();
                                      }
                                    }
                                    if (line2.length > maxChar) line2 = line2.slice(0, maxChar - 2) + "...";
                                    return (
                                      <g>
                                        <text 
                                          x="400" 
                                          y="197" 
                                          textAnchor="middle" 
                                          fill="#ffffff" 
                                          fontSize="11.5" 
                                          fontWeight="900" 
                                          className="font-sans tracking-wide uppercase select-none"
                                        >
                                          {line1 || rawTitle.slice(0, maxChar)}
                                        </text>
                                        <text 
                                          x="400" 
                                          y="214" 
                                          textAnchor="middle" 
                                          fill="#ffffff" 
                                          fontSize="11" 
                                          fontWeight="800" 
                                          className="font-sans tracking-wide uppercase select-none"
                                        >
                                          {line2}
                                        </text>
                                      </g>
                                    );
                                  })()}

                                  <text 
                                    x="400" 
                                    y="238" 
                                    textAnchor="middle" 
                                    fill={mindMapStyle === "pastel" ? "#fdfaf6" : "#99f6e4"} 
                                    fontSize="9" 
                                    fontWeight="700" 
                                    className="font-mono uppercase tracking-widest select-none opacity-95"
                                  >
                                    {activeRevisionSession.subject || subject} • CLASS {grade}
                                  </text>
                                </g>
                              );
                            })()}

                            {/* 3. Capsules */}
                            {(() => {
                              const nodes = revisionDeckData.mindMap?.nodes || [];
                              const N = nodes.length || 1;
                              const center = { x: 400, y: 210 };
                              const rx = 245;
                              const ry = 135;

                              return nodes.map((node: any, index: number) => {
                                const angle = (2 * Math.PI * index) / N - Math.PI / 2;
                                const targetX = center.x + rx * Math.cos(angle);
                                const targetY = center.y + ry * Math.sin(angle);

                                const isSelected = lastSelectedNodeId === index;
                                const isMatched = (() => {
                                  if (!mindMapSearch.trim()) return false;
                                  const queryText = mindMapSearch.toLowerCase();
                                  return (
                                    node.topicName?.toLowerCase().includes(queryText) ||
                                    node.keyFormula?.toLowerCase().includes(queryText) ||
                                    (node.keyConcepts || node.coreConcepts || []).some((c: string) => c.toLowerCase().includes(queryText))
                                  );
                                })();

                                const capW = 164;
                                const capH = 48;
                                const capX = targetX - capW / 2;
                                const capY = targetY - capH / 2;

                                const maxLen = 18;
                                const rawName = node.topicName || "General Topic";
                                const dispName = rawName.length > maxLen ? rawName.slice(0, maxLen - 2) + "..." : rawName;
                                const pTheme = getPastelTheme(index);

                                return (
                                  <g 
                                    key={`fs-node-${index}`} 
                                    filter="url(#shadow)" 
                                    className="cursor-pointer group select-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLastSelectedNodeId(index);
                                      setExpandedNodes({ [index]: true });
                                      setSelectedSubNode(null);
                                    }}
                                  >
                                    <rect 
                                      x={capX - (isSelected ? 3 : 1)} 
                                      y={capY - (isSelected ? 3 : 1)} 
                                      width={capW + (isSelected ? 6 : 2)} 
                                      height={capH + (isSelected ? 6 : 2)} 
                                      rx="14" 
                                      ry="14" 
                                      fill="none" 
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? (isSelected ? pTheme.stroke : isMatched ? "#10b981" : "transparent")
                                          : (isSelected ? "#fbbf24" : isMatched ? "#2dd4bf" : "transparent")
                                      } 
                                      strokeWidth={isSelected ? "3" : isMatched ? "2" : "0"} 
                                      opacity={isSelected ? "1" : isMatched ? "0.85" : "0"}
                                      className="transition-all duration-300"
                                    />
                                    <rect 
                                      x={capX} 
                                      y={capY} 
                                      width={capW} 
                                      height={capH} 
                                      rx="12" 
                                      ry="12" 
                                      fill={
                                        mindMapStyle === "pastel"
                                          ? pTheme.fill
                                          : (isSelected ? "url(#selectedGrad)" : "url(#nodeGrad)")
                                      } 
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? (isSelected ? "#7c3aed" : isMatched ? "#059669" : pTheme.stroke)
                                          : (isSelected ? "#f59e0b" : isMatched ? "#0f766e" : "#0d3c38")
                                      } 
                                      strokeWidth={mindMapStyle === "pastel" ? "1.8" : "1.5"} 
                                      className="transition-all duration-300 group-hover:stroke-teal-400 group-active:scale-98"
                                    />
                                    <circle 
                                      cx={capX + 16} 
                                      cy={targetY} 
                                      r="8.5" 
                                      fill={
                                        mindMapStyle === "pastel"
                                          ? pTheme.stroke
                                          : (isSelected ? "#115e59" : "#0d3d39")
                                      } 
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? pTheme.text
                                          : (isSelected ? "#fbbf24" : "#0d9488")
                                      }
                                      strokeWidth="1"
                                    />
                                    <text 
                                      x={capX + 16} 
                                      y={targetY + 3} 
                                      textAnchor="middle" 
                                      fill={
                                        mindMapStyle === "pastel"
                                          ? "#ffffff"
                                          : (isSelected ? "#fbbf24" : "#2dd4bf")
                                      } 
                                      fontSize="8" 
                                      fontWeight="900" 
                                      className="font-mono select-none"
                                    >
                                      {index + 1}
                                    </text>
                                    <text 
                                      x={capX + 32} 
                                      y={targetY + 3} 
                                      fill={mindMapStyle === "pastel" ? pTheme.text : "#ffffff"} 
                                      fontSize="9.5" 
                                      fontWeight="900" 
                                      className="font-sans uppercase tracking-wide select-none group-hover:opacity-80 transition-colors"
                                    >
                                      {dispName}
                                    </text>
                                    <g transform={`translate(${capX + capW - 24}, ${targetY - 6.5})`}>
                                      <rect 
                                        width="16" 
                                        height="13" 
                                        rx="4" 
                                        ry="4" 
                                        fill={
                                          mindMapStyle === "pastel"
                                            ? pTheme.stroke
                                            : (isSelected ? "#0d534f" : "#114c47")
                                        } 
                                        opacity={mindMapStyle === "pastel" ? "0.15" : "1"}
                                      />
                                      <text 
                                        x="8" 
                                        y="9" 
                                        textAnchor="middle" 
                                        fill={mindMapStyle === "pastel" ? pTheme.text : "#ffffff"} 
                                        fontSize="7.5" 
                                        fontWeight="bold" 
                                        className="font-mono"
                                      >
                                        {getSubItems(node).length}
                                      </text>
                                    </g>
                                  </g>
                                );
                              });
                            })()}

                            {/* 4. Sub-branch nodes for the selected parent node in fullscreen */}
                            {(() => {
                              if (lastSelectedNodeId === null) return null;
                              const parentNode = revisionDeckData.mindMap?.nodes?.[lastSelectedNodeId];
                              if (!parentNode) return null;

                              const nodes = revisionDeckData.mindMap?.nodes || [];
                              const N = nodes.length || 1;
                              const center = { x: 400, y: 210 };
                              const rx = 245;
                              const ry = 135;

                              const angle = (2 * Math.PI * lastSelectedNodeId) / N - Math.PI / 2;
                              const targetX = center.x + rx * Math.cos(angle);
                              const targetY = center.y + ry * Math.sin(angle);

                              const subItems = getSubItems(parentNode);
                              const K = subItems.length;
                              if (K === 0) return null;

                              const spread = K <= 1 ? 0 : Math.min(Math.PI * 0.75, (K - 1) * 0.38);
                              const startAngle = angle - spread / 2;

                              const pTheme = getPastelTheme(lastSelectedNodeId);
                              const subTheme = getSubNodePastelTheme(lastSelectedNodeId);

                              return subItems.map((subItem: any, i: number) => {
                                const subAngle = K <= 1 ? angle : startAngle + (i * spread) / (K - 1);
                                const subDist = 80;
                                const subX = targetX + subDist * Math.cos(subAngle);
                                const subY = targetY + subDist * Math.sin(subAngle);

                                const subW = 114;
                                const subH = 28;
                                const subX_rect = subX - subW / 2;
                                const subY_rect = subY - subH / 2;

                                const isSubSelected = selectedSubNode?.nodeId === lastSelectedNodeId && selectedSubNode?.subIdx === i;

                                return (
                                  <g 
                                    key={`fs-sub-${lastSelectedNodeId}-${i}`}
                                    className="cursor-pointer group select-none animate-fade-in"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSubNode({ nodeId: lastSelectedNodeId, subIdx: i });
                                    }}
                                  >
                                    {/* Connector Line */}
                                    <line
                                      x1={targetX}
                                      y1={targetY}
                                      x2={subX}
                                      y2={subY}
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? pTheme.stroke
                                          : (isSubSelected ? "#fbbf24" : "#2dd4bf")
                                      }
                                      strokeWidth={
                                        mindMapStyle === "pastel"
                                          ? "1.5"
                                          : (isSubSelected ? "2" : "1.2")
                                      }
                                      strokeDasharray={
                                        mindMapStyle === "pastel"
                                          ? "none"
                                          : (isSubSelected ? "none" : "3 2")
                                      }
                                      markerEnd={mindMapStyle === "pastel" ? "url(#arrow-head)" : undefined}
                                      opacity="0.8"
                                    />
                                    
                                    {/* Sub-node bubble */}
                                    <rect
                                      x={subX_rect}
                                      y={subY_rect}
                                      width={subW}
                                      height={subH}
                                      rx="8"
                                      ry="8"
                                      fill={
                                        mindMapStyle === "pastel"
                                          ? (isSubSelected ? "#ffca28" : subTheme.fill)
                                          : (isSubSelected ? "#fbbf24" : "#0f3a40")
                                      }
                                      stroke={
                                        mindMapStyle === "pastel"
                                          ? (isSubSelected ? "#d97706" : subTheme.stroke)
                                          : (isSubSelected ? "#d97706" : subItem.type === "formula" ? "#f59e0b" : subItem.type === "tip" ? "#34d399" : "#38bdf8")
                                      }
                                      strokeWidth={isSubSelected ? "2" : "1.5"}
                                      className="transition-all duration-300 group-hover:scale-105"
                                    />
                                    
                                    {/* Label */}
                                    <text
                                      x={subX}
                                      y={subY + 3.5}
                                      textAnchor="middle"
                                      fill={
                                        mindMapStyle === "pastel"
                                          ? (isSubSelected ? "#431407" : subTheme.text)
                                          : (isSubSelected ? "#0f172a" : "#e2e8f0")
                                      }
                                      fontSize="7.5"
                                      fontWeight="900"
                                      className="font-mono tracking-wider select-none uppercase"
                                    >
                                      {subItem.label}
                                    </text>
                                  </g>
                                );
                              });
                            })()}
                          </svg>
                        </div>

                        {/* Interactive Hint */}
                        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 border px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shrink-0 select-none z-10 pointer-events-none ${
                          mindMapStyle === "pastel"
                            ? "bg-white/95 border-slate-200"
                            : "bg-slate-950/80 backdrop-blur-xs border-teal-500/20"
                        }`}>
                          <span className={`w-2 h-2 rounded-full animate-pulse ${
                            mindMapStyle === "pastel" ? "bg-indigo-600" : "bg-teal-400"
                          }`} />
                          <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            mindMapStyle === "pastel" ? "text-indigo-900" : "text-teal-300"
                          }`}>
                            TAP BRANCH CAPSULES ABOVE TO REVEAL KEY DETAIL METADATA INSTANTLY
                          </p>
                        </div>

                        {/* Floating Custom HTML Tooltip / Popover inside fullscreen board */}
                        {selectedSubNode && (() => {
                          const nodeIdx = selectedSubNode.nodeId;
                          const subIdx = selectedSubNode.subIdx;
                          const activeNode = revisionDeckData.mindMap?.nodes?.[nodeIdx];
                          if (!activeNode) return null;
                          
                          const subItems = getSubItems(activeNode);
                          const subItem = subItems[subIdx];
                          if (!subItem) return null;
                          
                          const N = revisionDeckData.mindMap?.nodes?.length || 1;
                          const center = { x: 400, y: 210 };
                          const rx = 245;
                          const ry = 135;
                          
                          const angle = (2 * Math.PI * nodeIdx) / N - Math.PI / 2;
                          const targetX = center.x + rx * Math.cos(angle);
                          const targetY = center.y + ry * Math.sin(angle);
                          
                          const K = subItems.length;
                          const spread = K <= 1 ? 0 : Math.min(Math.PI * 0.75, (K - 1) * 0.38);
                          const startAngle = angle - spread / 2;
                          const subAngle = K <= 1 ? angle : startAngle + (subIdx * spread) / (K - 1);
                          
                          const subDist = 80;
                          const subX = targetX + subDist * Math.cos(subAngle);
                          const subY = targetY + subDist * Math.sin(subAngle);
                          
                          const leftPercent = (subX / 800) * 100;
                          const topPercent = (subY / 420) * 100;
                          
                          const xOffset = subX > 400 ? -260 : 20;
                          const yOffset = subY > 210 ? -120 : 10;
                          
                          return (
                            <div 
                              className={`absolute border rounded-2xl p-4 shadow-2xl z-40 w-64 text-left animate-fade-in backdrop-blur-md pointer-events-auto transition-all ${
                                mindMapStyle === "pastel"
                                  ? "bg-white/95 border-slate-250/60 text-slate-800"
                                  : "bg-slate-900/95 border-teal-500/30 text-white"
                              }`}
                              style={{
                                left: `calc(${leftPercent}% + ${xOffset}px)`,
                                top: `calc(${topPercent}% + ${yOffset}px)`,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={`flex items-center justify-between border-b pb-1.5 mb-2 shrink-0 ${
                                mindMapStyle === "pastel" ? "border-slate-100" : "border-teal-800/40"
                              }`}>
                                <span className={`text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1 ${
                                  mindMapStyle === "pastel" ? "text-indigo-600" : "text-amber-400"
                                }`}>
                                  {subItem.type === "formula" ? "📐 RULE / FORMULA" : subItem.type === "tip" ? "💡 EXAM TIP" : "🧠 KEY CONCEPT"}
                                </span>
                                <button 
                                  onClick={() => setSelectedSubNode(null)}
                                  className={`font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    mindMapStyle === "pastel"
                                      ? "text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
                                      : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                                  }`}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className={`text-[11px] sm:text-xs font-semibold leading-relaxed overflow-y-auto max-h-40 scrollbar-thin ${
                                mindMapStyle === "pastel" ? "text-slate-700" : "text-teal-50"
                              }`}>
                                {renderTextWithKaTeX(subItem.text)}
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  )}

                </div>

                {/* Footer of Revision Center */}
                <div className="bg-slate-50 border-t border-slate-200/60 p-4 shrink-0 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 font-black tracking-wider uppercase">
                    Cherry Ma'am Study Companion v2.5
                  </span>
                  <button 
                    onClick={handleCloseRevisionDeck}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Close Deck
                  </button>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* Kiara Live Voice Counselor Modal */}
        <KiaraLiveVoiceModal
          isOpen={isKiaraVoiceModalOpen}
          onClose={() => setIsKiaraVoiceModalOpen(false)}
          studentName={studentName}
          grade={grade}
          board={board}
          subject={subject}
          lowestMetric={lowestMetric}
          performanceData={{
            conceptClarity: dashboardStats.conceptClarity,
            theoreticalCore: dashboardStats.theoreticalCore,
            calculationPrecision: dashboardStats.calculationPrecision,
            formulaRecall: dashboardStats.formulaRecall,
            socraticStamina: dashboardStats.socraticStamina,
            strengths: dashboardStats.strengths,
            growths: dashboardStats.growths,
            totalQuizzes: quizAttempts?.length || 0,
            classesCompleted: pastSessions?.length || 0,
            snapshotsSaved: snapshots?.length || 0,
            lowestMetric: lowestMetric,
          }}
        />

        {/* High-Definition Blackboard Snapshot Zoom & Download Modal */}
        {selectedSnapshotForModal && (
          <div className="fixed inset-0 bg-[#06181b]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in select-none">
            <div className="bg-[#0a221a] border border-teal-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
              {/* Modal Header */}
              <div className="p-4 bg-[#071a14] border-b border-teal-900/60 flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-[#c4f500] flex items-center justify-center text-sm font-bold shrink-0">
                    📸
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                      {selectedSnapshotForModal.topicTitle || "Classroom Blackboard Snapshot"}
                    </h4>
                    <p className="text-[10px] text-teal-300/80 font-mono">
                      Auto-Captured • {formatDate(selectedSnapshotForModal.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSnapshotForModal(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Large Image Preview Slate */}
              <div className="p-4 sm:p-6 bg-[#04120e] flex-1 overflow-auto flex items-center justify-center">
                {selectedSnapshotForModal.imgData ? (
                  <img
                    src={selectedSnapshotForModal.imgData}
                    alt={selectedSnapshotForModal.topicTitle}
                    className="max-h-[60vh] max-w-full rounded-xl shadow-lg border border-teal-900/40 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-12 text-center text-teal-300/60 font-mono text-xs">
                    No image data available for this snapshot slate.
                  </div>
                )}
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 bg-[#071a14] border-t border-teal-900/60 flex items-center justify-between gap-3">
                <p className="text-[10.5px] text-teal-200/70 font-sans hidden sm:block truncate max-w-md">
                  {selectedSnapshotForModal.description || "High-definition blackboard formula notes & chalkboard derivations."}
                </p>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      handleDownloadImage(selectedSnapshotForModal);
                    }}
                    className="py-2 px-4 bg-teal-500 hover:bg-teal-400 active:scale-95 text-[#041a14] rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Download HD JPG</span>
                  </button>
                  <button
                    onClick={() => setSelectedSnapshotForModal(null)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
