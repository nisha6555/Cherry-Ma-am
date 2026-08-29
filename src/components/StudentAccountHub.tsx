import { StudentReportCardModal } from "./StudentReportCardModal";
import { InAppBookReaderModal } from "./InAppBookReaderModal";
import React, { useState, useEffect, useMemo } from "react";
import { 
  User, Award, Calendar, Clock, BookOpen, Download, Trash2, Edit3, 
  Sparkles, X, LayoutGrid, FileText, Share2, Shield, Bookmark, HardDriveDownload,
  Search, ChevronRight, ChevronDown, Folder, FolderOpen, Youtube,
  Brain, ChevronLeft, HelpCircle, RefreshCw, Maximize2, Minimize2,
  Play, Pause, Heart, Volume2, VolumeX, MessageSquare, Copy, Check,
  Zap, Film, Smartphone, Send, Flame, ThumbsUp, Video as VideoIcon,
  Camera, Image as ImageIcon, Eye, ZoomIn, Layers, Shuffle, Lightbulb,
  Printer, CheckCircle2, SlidersHorizontal, ArrowUpDown, Grid, List, ListOrdered, Star,
  ListTodo, CheckSquare, Square, Target, TrendingUp, Radio, Gauge, Activity, CheckCircle, Crosshair, Hourglass, BarChart2, PieChart, Filter, ArrowLeft, ArrowRight, AlertTriangle
, RotateCw } from "lucide-react";
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
import { MathRenderer } from "./MathRenderer";
import { safeSetItem } from "../utils/safeStorage";
import { 
  getUnifiedRevisionPayload, 
  getActiveLearningContext, 
  saveActiveLearningContext 
} from "../utils/activeLearningStore";
import { ConceptInfographicPoster } from "./ConceptInfographicPoster";
import { CurriculumBlindspotTracker } from "./CurriculumBlindspotTracker";
import { PrerequisiteGapFinder } from "./PrerequisiteGapFinder";
import { ExamSpeedSprintSimulator } from "./ExamSpeedSprintSimulator";
import { GitFork } from "lucide-react";
import { Compass } from "lucide-react";
import { ConceptInfographicData } from "../types";

const DIMENSION_DETAILS = [
  {
    name: "üéØ Concept Clarity",
    icon: "üéØ",
    description: "Evaluates your capability to synthesize formulas and apply them to novel, non-routine application questions. True mastery means recognizing which formula to use under variable conditions.",
    recommendation: "Your concept clarity is currently at {score}%. Great work! Ensure you are practicing cross-concept whiteboard problem sets to build deductive flexibility.",
    benefit: "Equips you to tackle higher-order thinking (HOTS) board-exam questions and easily crack advanced competitive exams."
  },
  {
    name: "üìñ Theoretical Understanding",
    icon: "üìñ",
    description: "Measures recall of exact textbook definitions, scientific/mathematical constants, core classroom theorems, and textbook-grade proofs.",
    recommendation: "Your core theoretical core score is {score}%. Re-read slide summaries and use the direct hand-handbook PDFs to memorize formal definitions precisely.",
    benefit: "Allows you to write highly structured, formal answers that score 100% marks from strict board examiners."
  },
  {
    name: "üßÆ Calculation Precision",
    icon: "üßÆ",
    description: "Tracks algebraic accuracy, arithmetic transposition precision, algebraic sign changes, and step-by-step mathematical reasoning.",
    recommendation: "Your calculation precision is at {score}%. Silly errors are usually due to transposing terms too quickly. Write out every single algebraic step on your scratchpad.",
    benefit: "Completely eliminates exam-day calculation slip-ups and builds high confidence during high-pressure timed exams."
  },
  {
    name: "‚ö° Formula Recall & Recall",
    icon: "‚ö°",
    description: "Gauges rapid recall of standard formulas, units of measurement, coefficients of equations, and historical/scientific facts discussed on chalkboard.",
    recommendation: "Your formula recall is at {score}%. Boost this immediately by opening the Smart Revision tab and playing the AI flashcards for 5 minutes daily.",
    benefit: "Saves critical minutes during timed tests, leaving you with surplus time to review and polish your calculations."
  },
  {
    name: "üî• Socratic Stamina & Consistency",
    icon: "üî•",
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
      return fallbackSubject ? `${fallbackSubject} ‚Ä¢ ${firstTopicHeader}` : firstTopicHeader;
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
      return fallbackSubject ? `${fallbackSubject} ‚Ä¢ ${firstTopicHeader}` : firstTopicHeader;
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
    .replace(/\\{1,4}hexagon\b/g, "‚¨°")
    .replace(/\\{1,4}pentagon\b/g, "‚¨†")
    .replace(/\\{1,4}octagon\b/g, "‚ØÉ")
    .replace(/\\{1,4}heptagon\b/g, "‚¨°")
    .replace(/\\{1,4}triangle\b/g, "‚ñ≥")
    .replace(/\\{1,4}square\b/g, "‚òê")
    .replace(/\\{1,4}circle\b/g, "‚óØ")
    .replace(/\\{1,4}bigcirc\b/g, "‚óØ")
    .replace(/\\{1,4}rectangle\b/g, "‚ñ≠")
    .replace(/\\{1,4}parallelogram\b/g, "‚ñ±")
    .replace(/\\{1,4}trapezoid\b/g, "‚è¢")
    .replace(/\\{1,4}kite\b/g, "‚¨®")
    .replace(/\\{1,4}rhombus\b/g, "‚óä");

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
        return `<tspan${attrs}>${content.replace(/\\vec\{([a-zA-Z0-9]+)\}/g, "$1‚Üí").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}]/g, "")}</tspan>`;
      });
      processed = processed.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (match, attrs, content) => {
        return `<text${attrs}>${content.replace(/\\vec\{([a-zA-Z0-9]+)\}/g, "$1‚Üí").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}]/g, "")}</text>`;
      });

      const safeSvg = sanitizeSvg(processed);

      return `
        <div class="vector-diagram-pdf-card" style="margin: 16px auto; padding: 14px; background: #061c18; border: 1.5px solid rgba(103, 232, 249, 0.4); border-radius: 12px; text-align: center; page-break-inside: avoid; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.25); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <div style="font-size: 9.5px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; text-align: left; display: flex; align-items: center; gap: 6px;">
            <span>üìê Blackboard Vector Diagram</span>
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
        const isBullet = trimmedLine.startsWith("-") || trimmedLine.startsWith("*") || trimmedLine.startsWith("‚Ä¢");
        // Check if line is a definition list item (contains ":" or labels like "üåü")
        const isDefinition = trimmedLine.includes(":") && (trimmedLine.startsWith("üåü") || trimmedLine.startsWith("üí°") || trimmedLine.startsWith("üìå"));
        // Check if heading
        const isSubHeading = trimmedLine.startsWith("####");
        const isHeading = trimmedLine.startsWith("üìå") || trimmedLine.startsWith("#") || trimmedLine.startsWith("###");

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
          htmlResult += `<h4 class="subheading-pdf" style="color: #67e8f9; font-size: 12.5px; font-weight: 700; margin-top: 12px; margin-bottom: 6px; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.2px;">üîπ ${subHeadingText}</h4>`;
        } else if (isHeading) {
          const headingText = parsedLine.replace(/^üìå|^#+\s*/g, "").trim();
          const cleanHeading = headingText.toLowerCase();
          
          let headingColor = "#fbbf24"; // Rich warm gold default for headings
          if (cleanHeading.includes("formula") || cleanHeading.includes("equation") || cleanHeading.includes("math") || cleanHeading.includes("variable")) {
            headingColor = "#bae6fd"; // Pastel sky-blue
          } else if (cleanHeading.includes("tip") || cleanHeading.includes("exam") || cleanHeading.includes("warning")) {
            headingColor = "#fca5a5"; // Pastel pink
          }
          
          htmlResult += `<h3 class="heading-pdf" style="color: ${headingColor}; border-bottom: 1px solid ${headingColor}30; font-size: 14px; font-weight: 800; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.3px;">üìå ${headingText}</h3>`;
        } else if (isDefinition) {
          const colonIdx = parsedLine.indexOf(":");
          const label = parsedLine.substring(0, colonIdx).trim();
          const detail = parsedLine.substring(colonIdx + 1).trim();
          
          const cleanLabel = label.toLowerCase();
          let borderCol = "#fbbf24"; // Rich warm gold
          let bgCol = "rgba(251, 191, 36, 0.08)";
          let txtCol = "#fbbf24";
          let emoji = "üåü";
          
          if (
            /^(warning|alert|tip|hint|exam\s*tip|instruction|danger|attention|caution|error|question|answer|exercise|problem|‡§ö‡•á‡§§‡§æ‡§µ‡§®‡•Ä|‡§∏‡•Å‡§ù‡§æ‡§µ|‡§™‡•ç‡§∞‡§∂‡•ç‡§®|‡§â‡§§‡•ç‡§§‡§∞)$/i.test(cleanLabel) ||
            cleanLabel.includes("tip") ||
            cleanLabel.includes("warning") ||
            cleanLabel.includes("attention") ||
            cleanLabel.includes("danger")
          ) {
            borderCol = "#fca5a5"; // Pink
            bgCol = "rgba(252, 165, 165, 0.05)";
            txtCol = "#fca5a5";
            emoji = "üå∏";
          } else if (
            /^(formula|equation|theorem|lemma|corollary|proof|identity|variable|math|physics|equation|maths|‡§∏‡•Ç‡§§‡•ç‡§∞|‡§∏‡§Æ‡•Ä‡§ï‡§∞‡§£)$/i.test(cleanLabel) ||
            cleanLabel.includes("formula") ||
            cleanLabel.includes("equation") ||
            cleanLabel.includes("theorem")
          ) {
            borderCol = "#bae6fd"; // Sky-Blue
            bgCol = "rgba(186, 230, 253, 0.05)";
            txtCol = "#bae6fd";
            emoji = "üìê";
          }

          htmlResult += `
            <div class="def-pdf-card" style="border-left-color: ${borderCol}; background-color: ${bgCol}; margin-bottom: 8px;">
              <span class="def-pdf-label" style="color: ${txtCol};">${emoji} ${label}</span>
              <span class="def-pdf-detail">${detail}</span>
            </div>
          `;
        } else if (isBullet) {
          const bulletText = parsedLine.replace(/^[-*‚Ä¢]\s*/, "").trim();
          if (bulletText && bulletText !== "--" && bulletText !== "---" && bulletText !== "-" && bulletText !== "‚Äî") {
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

// KaTeX HTML rendering memoization cache for ultra-smooth UI transitions
const katexRenderCache: Record<string, string> = {};
const renderKaTeXHtmlSafe = (formulaStr?: string): string => {
  if (!formulaStr) return "";
  if (katexRenderCache[formulaStr]) return katexRenderCache[formulaStr];
  try {
    const rendered = katex.renderToString(formulaStr, { displayMode: false, throwOnError: false });
    katexRenderCache[formulaStr] = rendered;
    return rendered;
  } catch {
    return formulaStr;
  }
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
  const [isKiaraFullScreenOpen, setIsKiaraFullScreenOpen] = useState<boolean>(false);
  
  // Phase 1: Micro-Diagnostics & Mistake Matrix States
  const [performanceWorkspaceTab, setPerformanceWorkspaceTab] = useState<"macro" | "micro" | "retention" | "agility" | "curriculum" | "prerequisites" | "sprint">("macro");
  
  // Phase 3: Cognitive Agility, Speed-Accuracy Matrix & Exam Stamina States
  const [staminaQuadrantFilter, setStaminaQuadrantFilter] = useState<"all" | "flow" | "overthink" | "rushing" | "roadblock">("all");
  const [staminaActiveSubject, setStaminaActiveSubject] = useState<string>("all");
  const [selectedAgilityDrillTopic, setSelectedAgilityDrillTopic] = useState<any | null>(null);
  const [activeSprintSeconds, setActiveSprintSeconds] = useState<number>(60);
  const [isSprintRunning, setIsSprintRunning] = useState<boolean>(false);
  const [sprintStepIndex, setSprintStepIndex] = useState<number>(0);
  const [sprintScore, setSprintScore] = useState<number>(0);
  
  // Phase 2: Spaced Repetition & Retention States
  const [retentionFilterUrgency, setRetentionFilterUrgency] = useState<"all" | "critical" | "warning" | "stable">("all");
  const [retentionActiveSubject, setRetentionActiveSubject] = useState<string>("all");
  const [retentionViewMode, setRetentionViewMode] = useState<"carousel" | "list">("carousel");
  const [staminaViewMode, setStaminaViewMode] = useState<"carousel" | "list">("carousel");
  const [selectedRetentionFlashcard, setSelectedRetentionFlashcard] = useState<any | null>(null);
  const [activeFlashcardFlipped, setActiveFlashcardFlipped] = useState<boolean>(false);
  const [microSubjectFilter, setMicroSubjectFilter] = useState<string>("all");
  const [microMasteryFilter, setMicroMasteryFilter] = useState<"all" | "critical" | "practicing" | "mastered">("all");
  const [microMistakeFilter, setMicroMistakeFilter] = useState<"all" | "conceptual" | "calculation" | "formula" | "speed">("all");
  const [microSearchQuery, setMicroSearchQuery] = useState<string>("");
  const [microViewMode, setMicroViewMode] = useState<"carousel" | "list">("carousel");
  const [selectedDrillSubtopic, setSelectedDrillSubtopic] = useState<any | null>(null);
  
  // Overhauled Archived PDF system core states
  const [bookHubActiveTab, setBookHubActiveTab] = useState<"books" | "slates">("books");
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [selectedBookSubjectFilter, setSelectedBookSubjectFilter] = useState<string>("all");
  const [booksViewMode, setBooksViewMode] = useState<"grid" | "carousel">("grid");
  const [bookSortOrder, setBookSortOrder] = useState<"newest" | "oldest" | "title" | "topics">("newest");
  const booksScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const bookSearchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for quick library search (Press "/" or "Ctrl+K")
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDesktopTab === "books" && (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"))) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault();
          bookSearchInputRef.current?.focus();
          bookSearchInputRef.current?.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDesktopTab]);
  const statsScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Smooth scroll to top when switching analytics sub-tabs (Macro / Micro / Retention / Agility)
  useEffect(() => {
    if (statsScrollContainerRef.current) {
      statsScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [performanceWorkspaceTab]);
  const [currentBookHorizontalIndex, setCurrentBookHorizontalIndex] = useState(0);

  // In-App Quick Reader Modal States
  const [selectedBookForReader, setSelectedBookForReader] = useState<any | null>(null);
  const [readerActiveTopicIndex, setReaderActiveTopicIndex] = useState<number>(0);
  const [readerTheme, setReaderTheme] = useState<"chalkboard" | "paper">("chalkboard");
  const [readerCopied, setReaderCopied] = useState<boolean>(false);

  // Starred / Favorite Books (Persisted)
  const [starredBookIds, setStarredBookIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cherry_starred_books") : null;
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const toggleStarBook = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStarredBookIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("cherry_starred_books", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // TTS Speech Narration State
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);

  const handleSpeakText = (text: string, cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return;

    if (speakingCardId === cardId) {
      window.speechSynthesis.cancel();
      setSpeakingCardId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\\\[|\\\]|\\\(/g, "")
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
      .replace(/\\cdot/g, " times ")
      .replace(/\\times/g, " times ")
      .replace(/\\pm/g, " plus or minus ")
      .replace(/\\approx/g, " approximately ")
      .replace(/\\neq/g, " not equal to ")
      .replace(/\\le/g, " less than or equal to ")
      .replace(/\\ge/g, " greater than or equal to ")
      .replace(/\\theta/g, " theta ")
      .replace(/\\pi/g, " pi ")
      .replace(/[\#\*\_]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onend = () => setSpeakingCardId(null);
    utterance.onerror = () => setSpeakingCardId(null);
    setSpeakingCardId(cardId);
    window.speechSynthesis.speak(utterance);
  };

  // Quick Practice Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState<number>(0);

  // Phase 4 States: Official Report Card Modal & Weekly Study Timetable Planner
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState<boolean>(false);
  const [activePlannerDayIndex, setActivePlannerDayIndex] = useState<number>(0);
  const [completedPlannerTasks, setCompletedPlannerTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cherry_study_planner_tasks") : null;
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const togglePlannerTask = (taskId: string) => {
    setCompletedPlannerTasks(prev => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem("cherry_study_planner_tasks", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Phase 4: Batch Export Snapshots Album in Markdown/HTML
  const handleBatchExportSnapshotsMarkdown = () => {
    const list = snapshots && snapshots.length > 0 ? snapshots : [];
    if (list.length === 0) return;

    let md = `# üì∏ Blackboard Derivations & Chalkboard Slates Album\n\n`;
    md += `*Student: ${studentName || "Scholar"} | Grade: ${grade || "Class 10"} | Board: ${board || "CBSE"} | Subject: ${subject || "Mathematics"}*\n`;
    md += `*Generated via Cherry AI Socratic Classroom on ${new Date().toLocaleDateString()}*\n\n`;
    md += `---\n\n`;

    list.forEach((snap, idx) => {
      md += `## Slide ${idx + 1}: ${snap.topicTitle || "Lecture Derivation"}\n`;
      md += `**Subject**: ${snap.subject || subject || "Science"} | **Timestamp**: ${new Date(snap.timestamp).toLocaleString()}\n\n`;
      if (snap.description) {
        md += `> ${snap.description}\n\n`;
      }
      if (snap.latexEquations && Array.isArray(snap.latexEquations) && snap.latexEquations.length > 0) {
        md += `### Key Mathematical Formulas:\n`;
        snap.latexEquations.forEach((eq: string) => {
          md += `$$\n${eq}\n$$\n\n`;
        });
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Blackboard_Snapshots_Album_${(studentName || "Student").replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Full Revision Study Pack Export Handler
  const handleExportStudyPack = () => {
    if (!activeRevisionSession || !revisionDeckData) return;
    const cards = revisionDeckData.flashcards || [];
    const nodes = revisionDeckData.mindMap?.nodes || [];
    const summary = revisionDeckData.summary || {};

    let markdown = `# ${activeRevisionSession.processedTitle || "Classroom Study Pack"}\n\n`;
    markdown += `*Subject: ${activeRevisionSession.inferredSubject || activeRevisionSession.subject || subject || "Science"} | Grade: Class ${activeRevisionSession.grade || grade || "10"} | Generated via Cherry Ma'am AI Classroom*\n\n`;
    markdown += `---\n\n## üìñ Executive Chapter Summary\n\n${summary.overview || activeRevisionSession.customBoardContent || "Comprehensive chapter overview notes."}\n\n`;

    if (summary.keyTakeaways && Array.isArray(summary.keyTakeaways) && summary.keyTakeaways.length > 0) {
      markdown += `### üåü Key Takeaways\n\n`;
      summary.keyTakeaways.forEach((k: string) => {
        markdown += `- ${k}\n`;
      });
      markdown += `\n`;
    }

    if (nodes.length > 0) {
      markdown += `## üß† Mind Map Conceptual Hierarchy\n\n`;
      nodes.forEach((n: any, i: number) => {
        markdown += `### ${i + 1}. ${n.topicName || "Concept"}\n`;
        if (n.keyFormula) markdown += `- **Key Formula/Law**: ${n.keyFormula}\n`;
        if (n.examTip) markdown += `- **Board Exam Tip**: ${n.examTip}\n`;
        if (Array.isArray(n.coreConcepts || n.keyConcepts)) {
          (n.coreConcepts || n.keyConcepts).forEach((c: string) => {
            markdown += `- ${c}\n`;
          });
        }
        markdown += `\n`;
      });
    }

    if (cards.length > 0) {
      markdown += `## ‚ùì Active Recall Flashcards\n\n`;
      cards.forEach((c: any, i: number) => {
        markdown += `#### Card ${i + 1}: ${c.question}\n`;
        markdown += `**Answer**: ${c.answer}\n`;
        if (c.hint) markdown += `*Hint*: ${c.hint}\n`;
        markdown += `\n`;
      });
    }

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeRevisionSession.processedTitle || "Study_Pack").replace(/[^a-zA-Z0-9_-]/g, "_")}_Revision_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper for 3D Book Spine and Radiant Subject Themes
  const getSubjectBookTheme = (subj: string) => {
    const s = (subj || "").toLowerCase();
    if (s.includes("math")) {
      return {
        name: "Mathematics",
        icon: "üìê",
        spineBg: "from-[#022c22] via-[#064e3b] to-[#022c22]",
        spineBorder: "border-emerald-500/40",
        accentPillBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        glowColor: "rgba(16, 185, 129, 0.15)",
        badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        gradientBar: "from-emerald-400 to-teal-500",
        pageEdge: "border-r-4 border-emerald-900/30",
        chalkAccent: "text-emerald-300",
        tagColor: "#34d399",
      };
    }
    if (s.includes("phys")) {
      return {
        name: "Physics",
        icon: "‚ö°",
        spineBg: "from-[#082f49] via-[#0369a1] to-[#082f49]",
        spineBorder: "border-sky-500/40",
        accentPillBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
        glowColor: "rgba(14, 165, 233, 0.15)",
        badgeBg: "bg-sky-50 text-sky-800 border-sky-200",
        gradientBar: "from-sky-400 to-blue-500",
        pageEdge: "border-r-4 border-sky-900/30",
        chalkAccent: "text-sky-300",
        tagColor: "#38bdf8",
      };
    }
    if (s.includes("chem")) {
      return {
        name: "Chemistry",
        icon: "üß™",
        spineBg: "from-[#451a03] via-[#78350f] to-[#451a03]",
        spineBorder: "border-amber-500/40",
        accentPillBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        glowColor: "rgba(245, 158, 11, 0.15)",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
        gradientBar: "from-amber-400 to-orange-500",
        pageEdge: "border-r-4 border-amber-900/30",
        chalkAccent: "text-amber-300",
        tagColor: "#fbbf24",
      };
    }
    if (s.includes("bio")) {
      return {
        name: "Biology",
        icon: "üå±",
        spineBg: "from-[#064e3b] via-[#047857] to-[#064e3b]",
        spineBorder: "border-teal-500/40",
        accentPillBg: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        glowColor: "rgba(20, 184, 166, 0.15)",
        badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
        gradientBar: "from-teal-400 to-emerald-500",
        pageEdge: "border-r-4 border-teal-900/30",
        chalkAccent: "text-teal-300",
        tagColor: "#2dd4bf",
      };
    }
    return {
      name: subj || "Science",
      icon: "üî¨",
      spineBg: "from-[#2e1065] via-[#581c87] to-[#2e1065]",
      spineBorder: "border-purple-500/40",
      accentPillBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      glowColor: "rgba(168, 85, 247, 0.15)",
      badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
      gradientBar: "from-purple-400 to-indigo-500",
      pageEdge: "border-r-4 border-purple-900/30",
      chalkAccent: "text-purple-300",
      tagColor: "#c084fc",
    };
  };

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
      let dateString = sess.isLiveActive ? "üü¢ Active Now (Live Context)" : "Recently Synced";
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
      starred: 0,
      Mathematics: 0,
      Physics: 0,
      Chemistry: 0,
      Biology: 0,
      Science: 0,
    };
    allBooks.forEach((b) => {
      const subj = b.inferredSubject;
      counts[subj] = (counts[subj] || 0) + 1;
      const bKey = b.sessionId || b.id || `book_${b.index}`;
      if (starredBookIds[bKey]) {
        counts.starred = (counts.starred || 0) + 1;
      }
    });
    return counts;
  }, [allBooks, starredBookIds]);

  const filteredBooks = useMemo(() => {
    let result = [...allBooks];
    // 1. Subject filter
    if (selectedBookSubjectFilter === "starred") {
      result = result.filter((b) => !!starredBookIds[b.sessionId || b.id || `book_${b.index}`]);
    } else if (selectedBookSubjectFilter !== "all") {
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
    // 3. Sort Order
    if (bookSortOrder === "oldest") {
      result = [...result].reverse();
    } else if (bookSortOrder === "title") {
      result = [...result].sort((a, b) => (a.processedTitle || "").localeCompare(b.processedTitle || ""));
    } else if (bookSortOrder === "topics") {
      result = [...result].sort((a, b) => ((b.topics?.length || 1) - (a.topics?.length || 1)));
    }
    return result;
  }, [allBooks, selectedBookSubjectFilter, archiveSearchQuery, bookSortOrder, starredBookIds]);
  
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

  // Combine Firestore snapshots and memory session snapshots with Intelligent Topic-Level Deduplication
  const allSnapshots = useMemo(() => {
    const combined: BoardSnapshot[] = [];
    const pushIfUnique = (s: any) => {
      if (!s || !s.imgData) return;
      const sub = inferSnapshotSubject(s);
      // Look for existing snapshot of the same topic (by snapshotId, topicIndex, or topicTitle within subject)
      const existingIdx = combined.findIndex((fb) => 
        fb.snapshotId === s.snapshotId || 
        (typeof s.topicIndex === "number" && typeof fb.topicIndex === "number" && fb.topicIndex === s.topicIndex && fb.subject?.toLowerCase() === sub.toLowerCase()) ||
        (fb.topicTitle?.trim().toLowerCase() === (s.topicTitle || "").trim().toLowerCase() && fb.subject?.toLowerCase() === sub.toLowerCase())
      );

      const normalized: BoardSnapshot = {
        id: s.id || `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        snapshotId: s.snapshotId || s.id || `snap_${Date.now()}`,
        userId: s.userId,
        topicTitle: s.topicTitle || "Classroom Board Snapshot",
        description: s.description || "Interactive calculation whiteboard screenshot.",
        imgData: s.imgData,
        subject: sub,
        grade: s.grade || grade || "Class 10",
        topicIndex: typeof s.topicIndex === "number" ? s.topicIndex : undefined,
        timestamp: s.timestamp
      };

      if (existingIdx >= 0) {
        // Replace with the updated / latest version for this topic
        combined[existingIdx] = normalized;
      } else {
        combined.push(normalized);
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
  const [snapshotsViewMode, setSnapshotsViewMode] = useState<"grid" | "carousel">("grid");
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
  const [activeRevisionTab, setActiveRevisionTab] = useState<"flashcards" | "mindmap" | "summary" | "quiz">("flashcards");
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
      shortLabel: "üè´ CLASS NOTES",
      icon: "üè´",
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
        shortLabel: "üìÑ EXPLAINER DOC",
        icon: "üìÑ",
        bgClass: "bg-emerald-500/25 text-emerald-200 border-emerald-400/50",
        badgeColor: "#059669",
        description: "Parsed directly from uploaded document curriculum & notes"
      };
    }
    if (isYoutube) {
      return {
        label: "Generated from YouTube Video Lecture",
        shortLabel: "üé• YOUTUBE LECTURE",
        icon: "üé•",
        bgClass: "bg-rose-500/25 text-rose-200 border-rose-400/50",
        badgeColor: "#e11d48",
        description: "Synthesized from YouTube video lesson transcript & curriculum"
      };
    }
    if (isDoubt) {
      return {
        label: "Generated from 1-on-1 Doubt Solver",
        shortLabel: "üí° DOUBT SOLVER",
        icon: "üí°",
        bgClass: "bg-amber-500/25 text-amber-200 border-amber-400/50",
        badgeColor: "#d97706",
        description: "Constructed from interactive doubt clarification & answers"
      };
    }
    if (isMistake) {
      return {
        label: "Generated from Mistake Vault Analysis",
        shortLabel: "üõ°Ô∏è MISTAKE VAULT",
        icon: "üõ°Ô∏è",
        bgClass: "bg-purple-500/25 text-purple-200 border-purple-400/50",
        badgeColor: "#7c3aed",
        description: "Extracted from quiz mistakes & high-yield error patterns"
      };
    }
    return {
      label: "Generated from Today's Live Blackboard",
      shortLabel: "üè´ LIVE BLACKBOARD",
      icon: "üè´",
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
        label: "üìê Formula" 
      });
    }
    
    concepts.forEach((concept: string, idx: number) => {
      items.push({ 
        type: "concept", 
        text: concept, 
        label: `üß† Concept ${idx + 1}` 
      });
    });
    
    takeaways.forEach((takeaway: string, idx: number) => {
      items.push({ 
        type: "tip", 
        text: takeaway, 
        label: `üí° Exam Tip ${idx + 1}` 
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
        "0": "‚ÇÄ", "1": "‚ÇÅ", "2": "‚ÇÇ", "3": "‚ÇÉ", "4": "‚ÇÑ", "5": "‚ÇÖ", "6": "‚ÇÜ", "7": "‚Çá", "8": "‚Çà", "9": "‚Çâ",
        "a": "‚Çê", "e": "‚Çë", "o": "‚Çí", "x": "‚Çì", "h": "‚Çï", "k": "‚Çñ", "l": "‚Çó", "m": "‚Çò", "n": "‚Çô", "p": "‚Çö", "s": "‚Çõ", "t": "‚Çú",
        "i": "·µ¢", "j": "‚±º"
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
      formatted = formatted.replace(/\\neq\b/g, "‚â†");
      formatted = formatted.replace(/\\neq/g, "‚â†");
      formatted = formatted.replace(/\\quad\b/g, "  ");
      formatted = formatted.replace(/\\text\{([^{}]+)\}/g, "$1");
      formatted = formatted.replace(/\\Rightarrow\b/g, "‚áí");
      formatted = formatted.replace(/\\Rightarrow/g, "‚áí");
      formatted = formatted.replace(/\\dots\b/g, "...");
      formatted = formatted.replace(/\\dots/g, "...");
      formatted = formatted.replace(/\\cdot\b/g, "¬∑");
      formatted = formatted.replace(/\\cdot/g, "¬∑");
      formatted = formatted.replace(/\\pm\b/g, "¬±");
      formatted = formatted.replace(/\\pm/g, "¬±");
      formatted = formatted.replace(/\\ge\b/g, "‚â•");
      formatted = formatted.replace(/\\le\b/g, "‚â§");
      formatted = formatted.replace(/\\geq\b/g, "‚â•");
      formatted = formatted.replace(/\\leq\b/g, "‚â§");
      formatted = formatted.replace(/\\ge/g, "‚â•");
      formatted = formatted.replace(/\\le/g, "‚â§");
      formatted = formatted.replace(/\\geq/g, "‚â•");
      formatted = formatted.replace(/\\leq/g, "‚â§");
      formatted = formatted.replace(/\\approx\b/g, "‚âà");
      formatted = formatted.replace(/\\approx/g, "‚âà");

      // Greek letters mapping
      formatted = formatted.replace(/\\alpha\b/g, "Œ±");
      formatted = formatted.replace(/\\beta\b/g, "Œ≤");
      formatted = formatted.replace(/\\gamma\b/g, "Œ≥");
      formatted = formatted.replace(/\\theta\b/g, "Œ∏");
      formatted = formatted.replace(/\\delta\b/g, "Œ¥");
      formatted = formatted.replace(/\\Delta\b/g, "Œî");
      formatted = formatted.replace(/\\lambda\b/g, "Œª");
      formatted = formatted.replace(/\\pi\b/g, "œÄ");
      formatted = formatted.replace(/\\omega\b/g, "œâ");
      formatted = formatted.replace(/\\phi\b/g, "œÜ");
      formatted = formatted.replace(/\\sigma\b/g, "œÉ");
      formatted = formatted.replace(/\\mu\b/g, "Œº");
      formatted = formatted.replace(/\\tau\b/g, "œÑ");

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
            typeLabel = "üìê RULE / FORMULA";
            accentColor = mindMapStyle === "pastel" ? subTheme.stroke : "#f59e0b"; // Formula (amber)
          } else if (subItem.type === "tip") {
            typeLabel = "üí° EXAM PRO-TIP";
            accentColor = mindMapStyle === "pastel" ? subTheme.stroke : "#10b981"; // Tip (emerald)
          } else {
            typeLabel = "üß† KEY CONCEPT";
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
              CLASS ${gradeLevel} ‚Ä¢ ${chapterTitle.toUpperCase().slice(0, 36)}
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
              CLASS ${gradeLevel} ‚Ä¢ ${chapterTitle.toUpperCase().slice(0, 36)}
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
                <p>Cherry AI Smart Revision Concept Map ‚Ä¢ Class ${grade} ‚Ä¢ ${subName.replace(/_/g, " ")}</p>
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

// Phase 1: Micro-Diagnostics & Granular Sub-Topic Catalog Engine
  const microDiagnosticsData = useMemo(() => {
    // Standard Syllabus Sub-Topic Pools
    const SUBTOPIC_CATALOG: Array<{
      id: string;
      name: string;
      chapter: string;
      subject: string;
      defaultMastery: number;
      benchmarkLatencySec: number;
      dominantMistake: "conceptual" | "calculation" | "formula" | "speed";
      keyFormulas: string[];
      prescriptionHint: string;
      typicalQuestion: string;
      explanation: string;
    }> = [
      // Mathematics
      {
        id: "math-quad-1",
        name: "Quadratic Formula & Discriminant Analysis",
        chapter: "Quadratic Equations",
        subject: "Mathematics",
        defaultMastery: 58,
        benchmarkLatencySec: 55,
        dominantMistake: "calculation",
        keyFormulas: ["x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}", "D = b^2 - 4ac"],
        prescriptionHint: "Pay special attention to negative signs inside b^2 - 4ac when b is negative.",
        typicalQuestion: "Find the roots of 2x^2 - 7x + 3 = 0 using the quadratic formula.",
        explanation: "Keep sign brackets explicit: -(-7) = +7, and (-7)^2 = 49."
      },
      {
        id: "math-trig-1",
        name: "Trigonometric Identities & Pythagorean Relations",
        chapter: "Trigonometry",
        subject: "Mathematics",
        defaultMastery: 52,
        benchmarkLatencySec: 65,
        dominantMistake: "formula",
        keyFormulas: ["\sin^2\theta + \cos^2\theta = 1", "1 + \tan^2\theta = \sec^2\theta", "1 + \cot^2\theta = \csc^2\theta"],
        prescriptionHint: "Convert complex expressions into terms of sin and cos first to eliminate terms cleanly.",
        typicalQuestion: "Prove that (sin Œ∏ + cos Œ∏)^2 + (sin Œ∏ - cos Œ∏)^2 = 2.",
        explanation: "Expanding (sin^2 + 2sin cos + cos^2) + (sin^2 - 2sin cos + cos^2) leaves 2(sin^2 + cos^2) = 2."
      },
      {
        id: "math-calc-1",
        name: "Chain Rule & Differentiation Precision",
        chapter: "Calculus",
        subject: "Mathematics",
        defaultMastery: 74,
        benchmarkLatencySec: 50,
        dominantMistake: "conceptual",
        keyFormulas: ["\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)"],
        prescriptionHint: "Always differentiate the outer function first, then multiply by the derivative of the inner layer.",
        typicalQuestion: "Differentiate y = sin(3x^2 + 5) with respect to x.",
        explanation: "dy/dx = cos(3x^2 + 5) * d/dx(3x^2 + 5) = 6x cos(3x^2 + 5)."
      },
      {
        id: "math-geom-1",
        name: "Coordinate Geometry: Distance & Section Formula",
        chapter: "Coordinate Geometry",
        subject: "Mathematics",
        defaultMastery: 86,
        benchmarkLatencySec: 40,
        dominantMistake: "speed",
        keyFormulas: ["d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}", "P = \left(\frac{m x_2 + n x_1}{m+n}, \frac{m y_2 + n y_1}{m+n}\right)"],
        prescriptionHint: "Write coordinate points with explicit indices (x1, y1) and (x2, y2) to prevent swapping.",
        typicalQuestion: "Find the distance between points A(3, -2) and B(7, 1).",
        explanation: "d = sqrt((7-3)^2 + (1 - (-2))^2) = sqrt(16 + 9) = sqrt(25) = 5 units."
      },
      {
        id: "math-prob-1",
        name: "Conditional Probability & Bayes' Theorem",
        chapter: "Probability & Statistics",
        subject: "Mathematics",
        defaultMastery: 62,
        benchmarkLatencySec: 70,
        dominantMistake: "conceptual",
        keyFormulas: ["P(A|B) = \frac{P(A \cap B)}{P(B)}", "P(B) = \sum P(B|A_i)P(A_i)"],
        prescriptionHint: "Clearly define events A and B before substituting into conditional probability formulas.",
        typicalQuestion: "Two dice are rolled. Given that the sum is 8, find the probability that one die is 3.",
        explanation: "Possible pairs with sum 8 are (2,6),(3,5),(4,4),(5,3),(6,2). Pairs with a 3 are (3,5) and (5,3). P = 2/5."
      },
      // Physics
      {
        id: "phy-kin-1",
        name: "Kinematic Equations & Projectile Motion",
        chapter: "Kinematics",
        subject: "Physics",
        defaultMastery: 64,
        benchmarkLatencySec: 60,
        dominantMistake: "calculation",
        keyFormulas: ["v = u + at", "s = ut + \frac{1}{2}at^2", "v^2 = u^2 + 2as", "H_{max} = \frac{u^2 \sin^2\theta}{2g}"],
        prescriptionHint: "Choose an explicit sign convention (+y upward, -y downward) before writing equations.",
        typicalQuestion: "A ball thrown upwards reaches max height in 3s. Find initial velocity (g = 9.8 m/s^2).",
        explanation: "At max height v = 0. 0 = u - (9.8)(3) => u = 29.4 m/s."
      },
      {
        id: "phy-elec-1",
        name: "Current Electricity: Kirchhoff's Laws & Circuit Loops",
        chapter: "Current Electricity",
        subject: "Physics",
        defaultMastery: 54,
        benchmarkLatencySec: 75,
        dominantMistake: "conceptual",
        keyFormulas: ["\sum I = 0", "\sum \Delta V = \sum IR"],
        prescriptionHint: "Follow loop traversal direction consistently; entering negative battery terminal gives +E.",
        typicalQuestion: "Apply KVL to a closed mesh containing a 12V battery and 4Œ©, 2Œ© resistors.",
        explanation: "Net loop emf: 12 - 4I - 2I = 0 => 6I = 12 => I = 2A."
      },
      {
        id: "phy-opt-1",
        name: "Lens Formula & Sign Convention (Ray Optics)",
        chapter: "Ray & Wave Optics",
        subject: "Physics",
        defaultMastery: 78,
        benchmarkLatencySec: 45,
        dominantMistake: "formula",
        keyFormulas: ["\frac{1}{f} = \frac{1}{v} - \frac{1}{u}", "m = \frac{v}{u}"],
        prescriptionHint: "Remember for lenses: 1/f = 1/v - 1/u (minus sign), whereas mirrors use plus.",
        typicalQuestion: "An object is placed 20cm before a convex lens (f = 10cm). Find image distance v.",
        explanation: "u = -20cm, f = +10cm. 1/v = 1/f + 1/u = 1/10 - 1/20 = 1/20 => v = +20cm (real image)."
      },
      {
        id: "phy-thermo-1",
        name: "First Law of Thermodynamics & Heat Engines",
        chapter: "Thermodynamics",
        subject: "Physics",
        defaultMastery: 82,
        benchmarkLatencySec: 50,
        dominantMistake: "speed",
        keyFormulas: ["\Delta Q = \Delta U + W", "W = P\Delta V", "\eta = 1 - \frac{T_2}{T_1}"],
        prescriptionHint: "For isothermal processes, ŒîU = 0 so ŒîQ = W. Temperatures must always be in Kelvin.",
        typicalQuestion: "Find efficiency of a Carnot engine working between 600K and 300K.",
        explanation: "eta = 1 - (300/600) = 1 - 0.5 = 50%."
      },
      // Chemistry
      {
        id: "chem-bond-1",
        name: "VSEPR Theory, Molecular Geometry & Hybridization",
        chapter: "Chemical Bonding",
        subject: "Chemistry",
        defaultMastery: 60,
        benchmarkLatencySec: 55,
        dominantMistake: "conceptual",
        keyFormulas: ["\text{Steric No.} = \sigma\text{-bonds} + \text{Lone Pairs}", "sp^3d \rightarrow \text{Trigonal Bipyramidal}"],
        prescriptionHint: "Count valence electrons of central atom and lone pairs before predicting molecular shape.",
        typicalQuestion: "Determine hybridization and shape of XeF4 molecule.",
        explanation: "Xe has 8 valence e-. 4 bonds + 2 lone pairs = Steric No. 6 => sp^3d^2 hybridization, Square Planar shape."
      },
      {
        id: "chem-thermo-1",
        name: "Gibbs Free Energy & Spontaneity (ŒîG = ŒîH - TŒîS)",
        chapter: "Thermodynamics",
        subject: "Chemistry",
        defaultMastery: 56,
        benchmarkLatencySec: 60,
        dominantMistake: "calculation",
        keyFormulas: ["\Delta G^\circ = \Delta H^\circ - T\Delta S^\circ", "\Delta G^\circ = -RT\ln K"],
        prescriptionHint: "Units mismatch trap: Convert ŒîS from J/(mol¬∑K) to kJ/(mol¬∑K) before subtracting from ŒîH.",
        typicalQuestion: "A reaction has ŒîH = -40 kJ and ŒîS = -100 J/K at 298K. Is it spontaneous?",
        explanation: "TŒîS = 298 * (-0.1 kJ/K) = -29.8 kJ. ŒîG = -40 - (-29.8) = -10.2 kJ (< 0, so Spontaneous)."
      },
      {
        id: "chem-org-1",
        name: "Nucleophilic Substitution (SN1 vs SN2 Mechanisms)",
        chapter: "Organic Chemistry",
        subject: "Chemistry",
        defaultMastery: 72,
        benchmarkLatencySec: 50,
        dominantMistake: "formula",
        keyFormulas: ["\text{SN1: 3}^\circ > 2^\circ > 1^\circ\text{ (Carbocation)}", "\text{SN2: 1}^\circ > 2^\circ > 3^\circ\text{ (Inversion)}"],
        prescriptionHint: "SN2 is favored by primary halides and polar aprotic solvents with backside attack (Walden Inversion).",
        typicalQuestion: "Which substrate reacts fastest via SN2: 1-bromobutane or 2-bromobutane?",
        explanation: "1-bromobutane is primary, having less steric hindrance for nucleophilic attack."
      },
      // Biology & Science
      {
        id: "bio-gen-1",
        name: "Mendelian Dihybrid Cross & Independent Assortment",
        chapter: "Genetics & Inheritance",
        subject: "Biology",
        defaultMastery: 65,
        benchmarkLatencySec: 55,
        dominantMistake: "calculation",
        keyFormulas: ["\text{F2 Phenotypic Ratio: } 9:3:3:1", "\text{Gametes} = 2^n"],
        prescriptionHint: "Use branch diagram method for multi-gene crosses instead of drawing massive Punnett squares.",
        typicalQuestion: "In a cross RrYy x RrYy, what proportion of offspring will be round green (R_yy)?",
        explanation: "P(Round R_) = 3/4. P(Green yy) = 1/4. P(Round Green) = 3/4 * 1/4 = 3/16."
      },
      {
        id: "bio-phys-1",
        name: "Cellular Respiration & ATP Yield Calculation",
        chapter: "Plant & Cell Physiology",
        subject: "Biology",
        defaultMastery: 75,
        benchmarkLatencySec: 45,
        dominantMistake: "formula",
        keyFormulas: ["1\text{ NADH} \approx 2.5\text{ ATP}", "1\text{ FADH}_2 \approx 1.5\text{ ATP}", "\text{Net} \approx 30-32\text{ ATP}"],
        prescriptionHint: "Remember glycolysis generates net 2 ATP directly and 2 NADH in cytoplasm.",
        typicalQuestion: "How many ATPs are yielded in complete aerobic breakdown of one glucose molecule?",
        explanation: "Net total is approximately 30 to 32 ATP depending on the shuttle system."
      }
    ];

    // Combine real quiz attempts with topic catalog
    const allAttempts = quizAttempts || [];
    
    // Aggregate real question logs
    const realQuestionLogs: Record<string, any[]> = {};
    let totalAttemptsAnalyzed = 0;
    let mistakeCounts = {
      conceptual: 0,
      calculation: 0,
      formula: 0,
      speed: 0
    };
    let totalLatencySec = 0;
    let latencyCount = 0;

    allAttempts.forEach((attempt) => {
      const history = attempt.history || [];
      history.forEach((q: any) => {
        totalAttemptsAnalyzed++;
        const testedConcept = (q.conceptTested || q.topic || "").toLowerCase();
        const isCorrect = !!q.isCorrect;
        const latency = q.timeTakenSec || Math.floor(35 + Math.random() * 30);
        totalLatencySec += latency;
        latencyCount++;

        // Determine mistake archetype
        let mType: "conceptual" | "calculation" | "formula" | "speed" = "conceptual";
        const cat = (q.cognitiveCategory || "").toLowerCase();
        if (cat.includes("calc") || cat.includes("precision")) mType = "calculation";
        else if (cat.includes("formula") || cat.includes("recall")) mType = "formula";
        else if (latency < 20 || latency > 90) mType = "speed";
        else mType = "conceptual";

        if (!isCorrect) {
          mistakeCounts[mType]++;
        }

        // Map into subtopics
        SUBTOPIC_CATALOG.forEach(sub => {
          if (
            testedConcept.includes(sub.name.toLowerCase()) || 
            testedConcept.includes(sub.chapter.toLowerCase()) ||
            (q.subject && q.subject.toLowerCase() === sub.subject.toLowerCase())
          ) {
            if (!realQuestionLogs[sub.id]) realQuestionLogs[sub.id] = [];
            realQuestionLogs[sub.id].push({
              question: q.question || sub.typicalQuestion,
              userAnswer: q.userAnswer || (isCorrect ? "Correct Option" : "Incorrect Option"),
              correctAnswer: q.correctAnswer || "Correct Standard Solution",
              isCorrect,
              explanation: q.explanation || sub.explanation,
              latencySec: latency,
              mistakeType: mType,
              conceptTested: q.conceptTested || sub.name
            });
          }
        });
      });
    });

    // Populate processed subtopics
    const processedSubtopics = SUBTOPIC_CATALOG.map((item) => {
      const logs = realQuestionLogs[item.id] || [];
      let mastery = item.defaultMastery;
      let totalQ = logs.length;
      let correctQ = logs.filter(l => l.isCorrect).length;
      let avgLatency = item.benchmarkLatencySec;

      if (totalQ > 0) {
        mastery = Math.round((correctQ / totalQ) * 100);
        avgLatency = Math.round(logs.reduce((acc, l) => acc + l.latencySec, 0) / totalQ);
      } else {
        // Synthesize dynamic realism from dashboardStats
        if (item.subject.toLowerCase() === subject.toLowerCase()) {
          if (item.dominantMistake === "calculation") {
            mastery = Math.max(40, Math.min(95, dashboardStats.calculationPrecision));
          } else if (item.dominantMistake === "formula") {
            mastery = Math.max(40, Math.min(95, dashboardStats.formulaRecall));
          } else {
            mastery = Math.max(40, Math.min(95, dashboardStats.conceptClarity));
          }
        }
      }

      // Archetype distribution for this subtopic
      const itemMistakes = {
        conceptual: logs.filter(l => !l.isCorrect && l.mistakeType === "conceptual").length || (mastery < 70 && item.dominantMistake === "conceptual" ? 3 : 1),
        calculation: logs.filter(l => !l.isCorrect && l.mistakeType === "calculation").length || (mastery < 70 && item.dominantMistake === "calculation" ? 4 : 1),
        formula: logs.filter(l => !l.isCorrect && l.mistakeType === "formula").length || (mastery < 70 && item.dominantMistake === "formula" ? 3 : 1),
        speed: logs.filter(l => !l.isCorrect && l.mistakeType === "speed").length || (mastery < 70 && item.dominantMistake === "speed" ? 2 : 1),
      };

      const masteryStatus: "critical" | "practicing" | "mastered" = 
        mastery >= 80 ? "mastered" : mastery >= 60 ? "practicing" : "critical";

      return {
        ...item,
        masteryScore: mastery,
        accuracy: totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : mastery,
        totalAttempts: totalQ > 0 ? totalQ : 4,
        avgLatencySec: avgLatency,
        masteryStatus,
        mistakeBreakdown: itemMistakes,
        recentQuestions: logs.length > 0 ? logs : [
          {
            question: item.typicalQuestion,
            userAnswer: mastery >= 75 ? "Step-by-Step Verified Answer" : "Common Misstep / Calculation Error",
            correctAnswer: "Standard Model Solution",
            isCorrect: mastery >= 75,
            explanation: item.explanation,
            latencySec: item.benchmarkLatencySec,
            mistakeType: item.dominantMistake,
            conceptTested: item.name
          }
        ]
      };
    });

    const totalErrors = Math.max(1, mistakeCounts.conceptual + mistakeCounts.calculation + mistakeCounts.formula + mistakeCounts.speed);
    const overallAvgLatency = latencyCount > 0 ? Math.round(totalLatencySec / latencyCount) : 52;

    // Filter by subject, mastery, mistake type, search
    const filteredSubtopics = processedSubtopics.filter((sub) => {
      // Subject filter
      if (microSubjectFilter !== "all" && sub.subject.toLowerCase() !== microSubjectFilter.toLowerCase()) {
        return false;
      }
      // Mastery filter
      if (microMasteryFilter !== "all" && sub.masteryStatus !== microMasteryFilter) {
        return false;
      }
      // Mistake filter
      if (microMistakeFilter !== "all" && sub.dominantMistake !== microMistakeFilter) {
        return false;
      }
      // Search
      if (microSearchQuery.trim()) {
        const q = microSearchQuery.toLowerCase();
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.chapter.toLowerCase().includes(q) ||
          sub.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const criticalGapsCount = processedSubtopics.filter(s => s.masteryStatus === "critical").length;
    const practicingCount = processedSubtopics.filter(s => s.masteryStatus === "practicing").length;
    const masteredCount = processedSubtopics.filter(s => s.masteryStatus === "mastered").length;

    return {
      subtopics: filteredSubtopics,
      allSubtopics: processedSubtopics,
      criticalGapsCount,
      practicingCount,
      masteredCount,
      overallAvgLatency,
      mistakeDistribution: {
        conceptual: {
          count: mistakeCounts.conceptual || 8,
          percent: Math.round(((mistakeCounts.conceptual || 8) / (totalErrors + 14)) * 100),
          title: "Conceptual Gap",
          icon: "üéØ",
          color: "text-rose-600 bg-rose-50 border-rose-200",
          remedy: "Socratic Proof & Visual Derivation on Blackboard"
        },
        calculation: {
          count: mistakeCounts.calculation || 11,
          percent: Math.round(((mistakeCounts.calculation || 11) / (totalErrors + 14)) * 100),
          title: "Calculation Slip",
          icon: "üßÆ",
          color: "text-amber-600 bg-amber-50 border-amber-200",
          remedy: "Step-by-Step Scratchpad & Sign Verification"
        },
        formula: {
          count: mistakeCounts.formula || 6,
          percent: Math.round(((mistakeCounts.formula || 6) / (totalErrors + 14)) * 100),
          title: "Formula Misrecall",
          icon: "‚ö°",
          color: "text-purple-600 bg-purple-50 border-purple-200",
          remedy: "KaTeX Formula Flashcards & Dimensional Checks"
        },
        speed: {
          count: mistakeCounts.speed || 4,
          percent: Math.round(((mistakeCounts.speed || 4) / (totalErrors + 14)) * 100),
          title: "Speed / Panic Trap",
          icon: "‚è±Ô∏è",
          color: "text-sky-600 bg-sky-50 border-sky-200",
          remedy: "45s Timed Sprints & Elimination Technique"
        }
      }
    };
  }, [quizAttempts, subject, dashboardStats, microSubjectFilter, microMasteryFilter, microMistakeFilter, microSearchQuery]);


  // Phase 2: Ebbinghaus Forgetting Curve & Spaced Repetition Decay Engine
  const retentionEngineData = useMemo(() => {
    // Current timestamp reference (in days)
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Subtopics catalog with realistic past study milestones
    const MEMORY_TRACKS: Array<{
      id: string;
      topicName: string;
      chapter: string;
      subject: string;
      initialStrength: number; // 0 - 100
      lastStudiedDaysAgo: number;
      repetitionCount: number; // 1, 2, 3, 4+
      halfLifeDays: number; // Stability S in Ebbinghaus R = e^(-t/S)
      keyPoints: string[];
      flashcardPrompt: string;
      flashcardAnswer: string;
      formulaKatex?: string;
    }> = [
      {
        id: "eb-quad",
        topicName: "Quadratic Equations: Discriminant & Nature of Roots",
        chapter: "Quadratic Equations",
        subject: "Mathematics",
        initialStrength: 90,
        lastStudiedDaysAgo: 8,
        repetitionCount: 2,
        halfLifeDays: 5.5,
        keyPoints: [
          "D > 0: Two distinct real roots",
          "D = 0: Real and equal roots (x = -b / 2a)",
          "D < 0: Complex conjugate roots"
        ],
        flashcardPrompt: "What is the condition for equal roots in ax¬≤ + bx + c = 0, and what are the roots?",
        flashcardAnswer: "Discriminant D = b¬≤ - 4ac = 0. The equal roots are given by x = -b / (2a).",
        formulaKatex: "D = b^2 - 4ac \\ge 0"
      },
      {
        id: "eb-trig",
        topicName: "Trigonometric Compound Angles & Identites",
        chapter: "Trigonometry",
        subject: "Mathematics",
        initialStrength: 85,
        lastStudiedDaysAgo: 14,
        repetitionCount: 1,
        halfLifeDays: 4.0,
        keyPoints: [
          "sin(A ¬± B) = sin A cos B ¬± cos A sin B",
          "cos(A ¬± B) = cos A cos B ‚àì sin A sin B",
          "tan(A + B) = (tan A + tan B) / (1 - tan A tan B)"
        ],
        flashcardPrompt: "State the expansion of cos(A + B) and cos(A - B).",
        flashcardAnswer: "cos(A + B) = cos A cos B - sin A sin B, and cos(A - B) = cos A cos B + sin A sin B (sign flips).",
        formulaKatex: "\\cos(A \\pm B) = \\cos A \\cos B \\mp \\sin A \\sin B"
      },
      {
        id: "eb-calc",
        topicName: "Definite Integrals & Fundamental Theorem of Calculus",
        chapter: "Calculus",
        subject: "Mathematics",
        initialStrength: 95,
        lastStudiedDaysAgo: 2,
        repetitionCount: 3,
        halfLifeDays: 12.0,
        keyPoints: [
          "‚à´_a^b f(x) dx = F(b) - F(a)",
          "King's Property: ‚à´_0^a f(x)dx = ‚à´_0^a f(a - x)dx",
          "Odd function symmetry: ‚à´_-a^a f(x)dx = 0 if f(-x) = -f(x)"
        ],
        flashcardPrompt: "State King's Property of definite integrals for ‚à´_0^a f(x) dx.",
        flashcardAnswer: "‚à´_0^a f(x) dx = ‚à´_0^a f(a - x) dx. This is extremely useful for evaluating trigonometric fractions.",
        formulaKatex: "\\int_0^a f(x)\\,dx = \\int_0^a f(a - x)\\,dx"
      },
      {
        id: "eb-kin",
        topicName: "Projectile Motion: Time of Flight & Maximum Height",
        chapter: "Kinematics",
        subject: "Physics",
        initialStrength: 92,
        lastStudiedDaysAgo: 11,
        repetitionCount: 2,
        halfLifeDays: 6.0,
        keyPoints: [
          "Time of Flight T = (2u sin Œ∏) / g",
          "Maximum Height H = (u¬≤ sin¬≤ Œ∏) / (2g)",
          "Horizontal Range R = (u¬≤ sin 2Œ∏) / g"
        ],
        flashcardPrompt: "What angle of projection yields the maximum horizontal range on flat ground?",
        flashcardAnswer: "Œ∏ = 45¬∞ yields maximum range R_max = u¬≤ / g because sin(2 * 45¬∞) = sin(90¬∞) = 1.",
        formulaKatex: "R_{max} = \\frac{u^2}{g} \\quad (\\text{at } \\theta = 45^\\circ)"
      },
      {
        id: "eb-kirch",
        topicName: "Current Electricity: Kirchhoff's Mesh Rules & Wheatstone Bridge",
        chapter: "Current Electricity",
        subject: "Physics",
        initialStrength: 80,
        lastStudiedDaysAgo: 18,
        repetitionCount: 1,
        halfLifeDays: 3.8,
        keyPoints: [
          "KCL (Junction Rule): Conservation of electric charge (‚àë I = 0)",
          "KVL (Loop Rule): Conservation of energy (‚àë ŒîV = 0)",
          "Balanced Wheatstone Bridge: P / Q = R / S => Galvanometer current = 0"
        ],
        flashcardPrompt: "Which conservation law underpins Kirchhoff's First Law (KCL) and Second Law (KVL)?",
        flashcardAnswer: "KCL is based on the Law of Conservation of Charge; KVL is based on the Law of Conservation of Energy.",
        formulaKatex: "\\frac{P}{Q} = \\frac{R}{S} \\implies I_g = 0"
      },
      {
        id: "eb-optics",
        topicName: "Ray Optics: Total Internal Reflection & Snell's Law",
        chapter: "Optics",
        subject: "Physics",
        initialStrength: 88,
        lastStudiedDaysAgo: 4,
        repetitionCount: 3,
        halfLifeDays: 14.0,
        keyPoints: [
          "Snell's Law: n1 sin Œ∏1 = n2 sin Œ∏2",
          "Critical Angle condition: sin Œ∏_c = n2 / n1 (where n1 > n2)",
          "TIR occurs when light travels from denser to rarer medium at angle > Œ∏_c"
        ],
        flashcardPrompt: "What are the two mandatory conditions for Total Internal Reflection (TIR) to occur?",
        flashcardAnswer: "1. Light must travel from a denser optical medium to a rarer medium. 2. Angle of incidence must exceed the critical angle (i > c).",
        formulaKatex: "\\sin \\theta_c = \\frac{n_{\\text{rare}}}{n_{\\text{dense}}}"
      },
      {
        id: "eb-chem-bond",
        topicName: "Chemical Bonding: Hybridization & Molecular Orbital Theory",
        chapter: "Chemical Bonding",
        subject: "Chemistry",
        initialStrength: 84,
        lastStudiedDaysAgo: 21,
        repetitionCount: 1,
        halfLifeDays: 3.5,
        keyPoints: [
          "Bond Order = 0.5 * (N_b - N_a)",
          "Paramagnetism occurs when unpaired electrons exist in MOs (e.g. O2)",
          "Diamagnetic species have all paired electrons (e.g. N2)"
        ],
        flashcardPrompt: "Why is the Oxygen molecule (O2) paramagnetic according to MOT?",
        flashcardAnswer: "O2 has 16 electrons, resulting in 2 unpaired electrons in degenerate antibonding œÄ*2px and œÄ*2py orbitals.",
        formulaKatex: "\\text{Bond Order} = \\frac{N_b - N_a}{2}"
      },
      {
        id: "eb-chem-thermo",
        topicName: "Thermodynamics: Enthalpy, Entropy & Spontaneity",
        chapter: "Thermodynamics",
        subject: "Chemistry",
        initialStrength: 86,
        lastStudiedDaysAgo: 6,
        repetitionCount: 2,
        halfLifeDays: 7.0,
        keyPoints: [
          "ŒîG = ŒîH - TŒîS",
          "ŒîG < 0: Strictly spontaneous process",
          "ŒîG = 0: Dynamic chemical equilibrium"
        ],
        flashcardPrompt: "At what temperature does a non-spontaneous endothermic reaction (ŒîH > 0, ŒîS > 0) become spontaneous?",
        flashcardAnswer: "When temperature T > (ŒîH / ŒîS), the -TŒîS term dominates and makes ŒîG negative (< 0).",
        formulaKatex: "\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ < 0"
      },
      {
        id: "eb-bio-gen",
        topicName: "Genetics: Mendelian Inheritance & Chromosomal Mapping",
        chapter: "Genetics",
        subject: "Biology",
        initialStrength: 88,
        lastStudiedDaysAgo: 16,
        repetitionCount: 1,
        halfLifeDays: 4.2,
        keyPoints: [
          "Law of Segregation: Alleles separate during gamete formation",
          "Law of Independent Assortment: Dihybrid 9:3:3:1 ratio",
          "Linkage violates independent assortment (discovered by Morgan in Drosophila)"
        ],
        flashcardPrompt: "Why does genetic linkage deviate from Mendel's Law of Independent Assortment?",
        flashcardAnswer: "Linked genes sit close together on the same chromosome and tend to be inherited together without recombining.",
        formulaKatex: "\\text{Recombination Freq} = \\frac{\\text{Recombinant Offspring}}{\\text{Total Offspring}} \\times 100"
      }
    ];

    // Compute retention decay scores using Ebbinghaus Model: R = S0 * e^(-t / S)
    const computedItems = MEMORY_TRACKS.map((item) => {
      // Time t in days
      const t = item.lastStudiedDaysAgo;
      // Exponential decay: R = initial * exp(-t / halfLife)
      const retentionDecimal = Math.exp(-t / item.halfLifeDays);
      const currentRetentionPercent = Math.max(12, Math.min(100, Math.round(item.initialStrength * retentionDecimal)));

      // Next optimal review day according to Leitner schedule (1, 3, 7, 14, 30 days)
      const reviewIntervals = [1, 3, 7, 14, 30];
      const nextReviewDays = reviewIntervals[Math.min(reviewIntervals.length - 1, item.repetitionCount)];
      const daysOverdue = Math.max(0, t - nextReviewDays);

      // Urgency Classification
      let urgency: "critical" | "warning" | "stable" = "stable";
      let urgencyLabel = "Optimal Retention";
      let urgencyColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

      if (currentRetentionPercent < 50 || daysOverdue >= 5) {
        urgency = "critical";
        urgencyLabel = "Immediate Revision Due";
        urgencyColor = "text-rose-700 bg-rose-50 border-rose-200";
      } else if (currentRetentionPercent < 72 || daysOverdue > 0) {
        urgency = "warning";
        urgencyLabel = "Decaying (Review Soon)";
        urgencyColor = "text-amber-700 bg-amber-50 border-amber-200";
      }

      // Memory Curve Projection Points: Day 0, Day 1, Day 3, Day 7, Day 14, Day 30
      const curveTimeline = [
        { day: 0, r: 100 },
        { day: 1, r: Math.round(100 * Math.exp(-1 / item.halfLifeDays)) },
        { day: 3, r: Math.round(100 * Math.exp(-3 / item.halfLifeDays)) },
        { day: 7, r: Math.round(100 * Math.exp(-7 / item.halfLifeDays)) },
        { day: 14, r: Math.round(100 * Math.exp(-14 / item.halfLifeDays)) },
        { day: 30, r: Math.round(100 * Math.exp(-30 / item.halfLifeDays)) }
      ];

      return {
        ...item,
        currentRetention: currentRetentionPercent,
        daysOverdue,
        nextReviewDays,
        urgency,
        urgencyLabel,
        urgencyColor,
        curveTimeline
      };
    });

    // Filter by subject and urgency
    const filtered = computedItems.filter((item) => {
      if (retentionActiveSubject !== "all" && item.subject.toLowerCase() !== retentionActiveSubject.toLowerCase()) {
        return false;
      }
      if (retentionFilterUrgency !== "all" && item.urgency !== retentionFilterUrgency) {
        return false;
      }
      return true;
    });

    const criticalCount = computedItems.filter(i => i.urgency === "critical").length;
    const warningCount = computedItems.filter(i => i.urgency === "warning").length;
    const stableCount = computedItems.filter(i => i.urgency === "stable").length;
    const avgRetention = Math.round(computedItems.reduce((acc, i) => acc + i.currentRetention, 0) / computedItems.length);

    return {
      items: filtered,
      allItems: computedItems,
      criticalCount,
      warningCount,
      stableCount,
      avgRetention
    };
  }, [retentionFilterUrgency, retentionActiveSubject]);

  // Phase 3: Cognitive Agility, Speed-Accuracy Quadrant Matrix & Socratic Stamina Engine
  const staminaAnalyticsData = useMemo(() => {
    // Topics catalog with accuracy and average latency metrics
    const AGILITY_TOPICS: Array<{
      id: string;
      topicName: string;
      chapter: string;
      subject: string;
      accuracy: number; // 0 - 100%
      avgLatencySec: number; // seconds
      benchmarkSec: number;
      dominantSlip: string;
      speedStrategy: string;
      rapidFireQuestion: string;
      rapidFireOptions: string[];
      correctOptionIndex: number;
      explanation: string;
    }> = [
      {
        id: "ag-calc-chain",
        topicName: "Calculus: Chain Rule & Multi-Layer Differentiation",
        chapter: "Calculus",
        subject: "Mathematics",
        accuracy: 92,
        avgLatencySec: 32,
        benchmarkSec: 45,
        dominantSlip: "None (High Automaticity)",
        speedStrategy: "Outer-to-inner peeling method without rewriting auxiliary variables.",
        rapidFireQuestion: "Differentiate y = (3x¬≤ - 5)‚Å¥ with respect to x.",
        rapidFireOptions: ["24x(3x¬≤ - 5)¬≥", "12x(3x¬≤ - 5)¬≥", "4(3x¬≤ - 5)¬≥", "24(3x¬≤ - 5)¬≥"],
        correctOptionIndex: 0,
        explanation: "dy/dx = 4(3x¬≤ - 5)¬≥ * d/dx(3x¬≤ - 5) = 4(3x¬≤ - 5)¬≥ * 6x = 24x(3x¬≤ - 5)¬≥."
      },
      {
        id: "ag-quad-roots",
        topicName: "Quadratic Equations: Sum & Product of Roots (Vieta's)",
        chapter: "Algebra",
        subject: "Mathematics",
        accuracy: 88,
        avgLatencySec: 28,
        benchmarkSec: 40,
        dominantSlip: "Occasional sign reversal in -b/a",
        speedStrategy: "Instant Vieta inspection: sum = -b/a, product = c/a directly from standard form.",
        rapidFireQuestion: "For 2x¬≤ - 8x + 6 = 0, what is the sum and product of the roots (Œ± + Œ≤, Œ±Œ≤)?",
        rapidFireOptions: ["Sum = 4, Product = 3", "Sum = -4, Product = 3", "Sum = 4, Product = -3", "Sum = 8, Product = 6"],
        correctOptionIndex: 0,
        explanation: "Sum = -(-8)/2 = 4. Product = 6/2 = 3."
      },
      {
        id: "ag-int-parts",
        topicName: "Integration by Parts & ILATE Hierarchy",
        chapter: "Calculus",
        subject: "Mathematics",
        accuracy: 84,
        avgLatencySec: 68,
        benchmarkSec: 50,
        dominantSlip: "Over-writing intermediate algebra steps",
        speedStrategy: "Use tabular DI (Derivative-Integral) method for polynomial-exponential products.",
        rapidFireQuestion: "Evaluate ‚à´ x ¬∑ e^(2x) dx.",
        rapidFireOptions: ["(x/2 - 1/4) e^(2x) + C", "(x/2 + 1/4) e^(2x) + C", "x e^(2x) - 2 e^(2x) + C", "(x - 1/2) e^(2x) + C"],
        correctOptionIndex: 0,
        explanation: "Using tabular integration: D: x -> 1 -> 0, I: e^(2x) -> 1/2 e^(2x) -> 1/4 e^(2x). Result = 1/2 x e^(2x) - 1/4 e^(2x) + C."
      },
      {
        id: "ag-trig-sub",
        topicName: "Trigonometric Transformations & Product-to-Sum",
        chapter: "Trigonometry",
        subject: "Mathematics",
        accuracy: 86,
        avgLatencySec: 62,
        benchmarkSec: 45,
        dominantSlip: "Hesitation between 2sinAcosB formulas",
        speedStrategy: "Recall 2sinAcosB = sin(A+B) + sin(A-B) as alternating sum.",
        rapidFireQuestion: "Express 2 sin(4Œ∏) cos(2Œ∏) as a sum of sines.",
        rapidFireOptions: ["sin(6Œ∏) + sin(2Œ∏)", "sin(6Œ∏) - sin(2Œ∏)", "cos(6Œ∏) + cos(2Œ∏)", "2 sin(6Œ∏)"],
        correctOptionIndex: 0,
        explanation: "2 sin A cos B = sin(A+B) + sin(A-B). Here A=4Œ∏, B=2Œ∏ => sin(6Œ∏) + sin(2Œ∏)."
      },
      {
        id: "ag-kin-proj",
        topicName: "Projectile Motion: Maximum Range & Complementary Angles",
        chapter: "Kinematics",
        subject: "Physics",
        accuracy: 45,
        avgLatencySec: 22,
        benchmarkSec: 45,
        dominantSlip: "Impulsive rushing without reading flat vs inclined plane",
        speedStrategy: "Enforce 5-second problem diagramming before selecting formula.",
        rapidFireQuestion: "For projection angles Œ∏ and (90¬∞ - Œ∏) at the same initial speed u, what is the ratio of horizontal ranges R1 : R2?",
        rapidFireOptions: ["1 : 1", "tan Œ∏ : 1", "sin Œ∏ : cos Œ∏", "1 : 2"],
        correctOptionIndex: 0,
        explanation: "Horizontal range R = u¬≤ sin(2Œ∏)/g. Since sin(2(90¬∞-Œ∏)) = sin(180¬∞-2Œ∏) = sin(2Œ∏), the ranges are identical (1:1)."
      },
      {
        id: "ag-elec-coulomb",
        topicName: "Electrostatics: Coulomb's Law & Vector Superposition",
        chapter: "Electrostatics",
        subject: "Physics",
        accuracy: 52,
        avgLatencySec: 26,
        benchmarkSec: 50,
        dominantSlip: "Misplacing attraction/repulsion arrow directions",
        speedStrategy: "Draw explicit force vectors with charge signs at the test charge.",
        rapidFireQuestion: "If the distance between two point charges is halved and both charges are doubled, the electrostatic force becomes:",
        rapidFireOptions: ["16 times", "4 times", "8 times", "2 times"],
        correctOptionIndex: 0,
        explanation: "F = k q1 q2 / r¬≤. If q1, q2 double and r becomes r/2, F' = k(2)(2)/(1/2)¬≤ = 4 / (1/4) = 16 F."
      },
      {
        id: "ag-optics-lens",
        topicName: "Ray Optics: Lens Maker's Formula & Thin Lens Combination",
        chapter: "Optics",
        subject: "Physics",
        accuracy: 42,
        avgLatencySec: 74,
        benchmarkSec: 50,
        dominantSlip: "Sign convention ambiguity in concave/convex radii",
        speedStrategy: "First-principles Cartesian sign convention drill on digital chalkboard.",
        rapidFireQuestion: "An equiconvex lens of focal length f is cut into two equal halves along the principal axis. The focal length of each half is:",
        rapidFireOptions: ["f", "2f", "f / 2", "4f"],
        correctOptionIndex: 0,
        explanation: "Cutting along the principal axis retains the same radius of curvature and refractive index, so focal length remains f."
      },
      {
        id: "ag-chem-thermo",
        topicName: "Thermodynamics: Hess's Law & Enthalpy of Formation",
        chapter: "Thermodynamics",
        subject: "Chemistry",
        accuracy: 48,
        avgLatencySec: 78,
        benchmarkSec: 55,
        dominantSlip: "Reversing reaction stoichiometry signs incorrectly",
        speedStrategy: "Box target equation elements and multiply row-by-row systematically.",
        rapidFireQuestion: "For the reaction N2(g) + 3H2(g) -> 2NH3(g), what is the relation between ŒîH and ŒîU?",
        rapidFireOptions: ["ŒîH = ŒîU - 2RT", "ŒîH = ŒîU + 2RT", "ŒîH = ŒîU - RT", "ŒîH = ŒîU + RT"],
        correctOptionIndex: 0,
        explanation: "Œîn_g = 2 - (1 + 3) = -2. Using ŒîH = ŒîU + Œîn_g RT => ŒîH = ŒîU - 2RT."
      },
      {
        id: "ag-chem-rate",
        topicName: "Chemical Kinetics: Arrhenius Equation & Activation Energy",
        chapter: "Chemical Kinetics",
        subject: "Chemistry",
        accuracy: 90,
        avgLatencySec: 36,
        benchmarkSec: 45,
        dominantSlip: "Minor unit mismatch (J vs kJ)",
        speedStrategy: "Inspect slope m = -Ea / (2.303 R) from log k vs 1/T graphs directly.",
        rapidFireQuestion: "If a reaction's rate doubles when temperature increases from 300 K to 310 K, the temperature coefficient is:",
        rapidFireOptions: ["2", "1.5", "3", "0.5"],
        correctOptionIndex: 0,
        explanation: "Temperature coefficient Œº = Rate at (T+10) / Rate at T = 2."
      }
    ];

    // Compute Speed-Accuracy Quadrant Classification
    // Quadrants:
    // 1. Flow State (High Accuracy >= 75%, Fast Latency <= 45s) -> Emerald
    // 2. Overthink / Deep Thinker (High Accuracy >= 75%, Slow Latency > 45s) -> Sky/Blue
    // 3. Impulsive Rushing (Low Accuracy < 75%, Fast Latency <= 45s) -> Amber
    // 4. Cognitive Roadblock (Low Accuracy < 75%, Slow Latency > 45s) -> Rose
    const classifiedTopics = AGILITY_TOPICS.map((item) => {
      const isHighAcc = item.accuracy >= 75;
      const isFast = item.avgLatencySec <= 45;

      let quadrant: "flow" | "overthink" | "rushing" | "roadblock" = "flow";
      let quadrantTitle = "Flow State (Automaticity)";
      let quadrantBadge = "‚ö° Optimal Mastery";
      let quadrantColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
      let prescription = "Maintain high-speed automaticity with weekly spaced recall.";

      if (isHighAcc && !isFast) {
        quadrant = "overthink";
        quadrantTitle = "Over-Calculation / Deep Deliberation";
        quadrantBadge = "‚è±Ô∏è Slow but Accurate";
        quadrantColor = "text-sky-700 bg-sky-50 border-sky-200";
        prescription = "Learn algebraic shortcuts and tabular methods to save 30+ seconds per problem.";
      } else if (!isHighAcc && isFast) {
        quadrant = "rushing";
        quadrantTitle = "Impulsive Rushing / Panic Trap";
        quadrantBadge = "‚ö†Ô∏è Rushed Mistakes";
        quadrantColor = "text-amber-700 bg-amber-50 border-amber-200";
        prescription = "Enforce 5-second diagram verification before selecting an answer choice.";
      } else if (!isHighAcc && !isFast) {
        quadrant = "roadblock";
        quadrantTitle = "Cognitive Roadblock / Concept Gap";
        quadrantBadge = "üî¥ Critical Bottleneck";
        quadrantColor = "text-rose-700 bg-rose-50 border-rose-200";
        prescription = "First-principles derivation with Cherry Ma'am on chalkboard to rebuild foundation.";
      }

      return {
        ...item,
        quadrant,
        quadrantTitle,
        quadrantBadge,
        quadrantColor,
        prescription
      };
    });

    // Filter by subject and quadrant
    const filteredTopics = classifiedTopics.filter((t) => {
      if (staminaActiveSubject !== "all" && t.subject.toLowerCase() !== staminaActiveSubject.toLowerCase()) {
        return false;
      }
      if (staminaQuadrantFilter !== "all" && t.quadrant !== staminaQuadrantFilter) {
        return false;
      }
      return true;
    });

    const flowCount = classifiedTopics.filter(t => t.quadrant === "flow").length;
    const overthinkCount = classifiedTopics.filter(t => t.quadrant === "overthink").length;
    const rushingCount = classifiedTopics.filter(t => t.quadrant === "rushing").length;
    const roadblockCount = classifiedTopics.filter(t => t.quadrant === "roadblock").length;

    // Socratic Session Fatigue Degradation Timeline
    const sessionFatigueCurve = [
      { phase: "Warm-Up (0‚Äì10m)", accuracy: 88, latencySec: 36, cognitiveLoad: 42, status: "Calibrated" },
      { phase: "Peak Flow (10‚Äì25m)", accuracy: 94, latencySec: 29, cognitiveLoad: 28, status: "Zone of Genius" },
      { phase: "Cognitive Friction (25‚Äì40m)", accuracy: 79, latencySec: 46, cognitiveLoad: 68, status: "Early Fatigue" },
      { phase: "Exhaustion Dip (40m+)", accuracy: 63, latencySec: 64, cognitiveLoad: 89, status: "Socratic Dip" }
    ];

    // Predictive Exam Readiness Forecast
    const projectedRawScore = Math.min(96, Math.max(68, Math.round(
      (flowCount * 96 + overthinkCount * 88 + rushingCount * 65 + roadblockCount * 45) / Math.max(1, classifiedTopics.length)
    )));
    const confidenceMargin = 4;
    const agilityScore = Math.round(((flowCount * 1.0 + overthinkCount * 0.75 + rushingCount * 0.5 + roadblockCount * 0.3) / classifiedTopics.length) * 100);

    return {
      topics: filteredTopics,
      allTopics: classifiedTopics,
      flowCount,
      overthinkCount,
      rushingCount,
      roadblockCount,
      sessionFatigueCurve,
      projectedRawScore,
      confidenceMargin,
      agilityScore,
      optimalFocusMinutes: 25
    };
  }, [staminaQuadrantFilter, staminaActiveSubject]);

  const lowestMetric = useMemo(() => {
    const metrics = [
      { name: "Concept Clarity", score: dashboardStats.conceptClarity, icon: "üéØ" },
      { name: "Theoretical Core", score: dashboardStats.theoreticalCore, icon: "üìñ" },
      { name: "Calculation Precision", score: dashboardStats.calculationPrecision, icon: "‚ö°" },
      { name: "Formula Recall", score: dashboardStats.formulaRecall, icon: "üß†" },
      { name: "Socratic Stamina", score: dashboardStats.socraticStamina, icon: "üî•" },
    ];
    return metrics.reduce((min, m) => (m.score < min.score ? m : min), metrics[0]);
  }, [dashboardStats]);

  // Persist synced performance analytics for Kiara Counselor & Live Voice across all views
  useEffect(() => {
    try {
      const statsPayload = {
        conceptClarity: dashboardStats.conceptClarity,
        theoreticalCore: dashboardStats.theoreticalCore,
        calculationPrecision: dashboardStats.calculationPrecision,
        formulaRecall: dashboardStats.formulaRecall,
        socraticStamina: dashboardStats.socraticStamina,
        strengths: dashboardStats.strengths || [],
        growths: dashboardStats.growths || [],
        totalQuizzes: quizAttempts?.length || 0,
        classesCompleted: pastSessions?.length || 0,
        snapshotsSaved: snapshots?.length || 0,
        lowestMetric: lowestMetric,
      };
      safeSetItem("maestry_student_performance_analytics", JSON.stringify(statsPayload));
    } catch (e) {}
  }, [dashboardStats, quizAttempts?.length, pastSessions?.length, snapshots?.length, lowestMetric]);

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
                  <span>üìù TOPIC SECTION ${index + 1}</span>
                  <span>CHERRY LECTURE HANDOUT</span>
                </div>
                <h2 class="slide-title" style="font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                  üìå ${cleanHeader}
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
              <span>üìù BLACKBOARD SHEET</span>
              <span>CHERRY LECTURE HANDOUT</span>
            </div>
            <h2 class="slide-title" style="font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 800; text-transform: uppercase;">
              üìå Main Chalkboard Calculations
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
            <button class="action-btn" onclick="window.print()">üñ®Ô∏è Save as PDF / Print Book</button>
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
                <span class="meta-value">${grade} ‚Ä¢ ${subject}</span>
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
              Study material synchronized via Maestry Cloud Sync ‚Ä¢ Optimized for PDF Printout üå∏
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
              <span class="meta-value">\${grade} ‚Ä¢ \${subject}</span>
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
            Study material synchronized via Maestry Cloud Sync ‚Ä¢ Optimized for PDF Printout üå∏
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
                <span class="slide-time">üìÖ ${dateStr}</span>
              </div>
              
              <h2 class="slide-title">üìå ${cleanSlideTitle}</h2>
              
              <div class="chalkboard-frame-container">
                ${item.imgData ? `
                  <img src="${item.imgData}" alt="${cleanSlideTitle}" class="chalkboard-image" referrerpolicy="no-referrer" />
                ` : `
                  <div class="no-image-placeholder">Visual Board Frame Preview Pending</div>
                `}
              </div>

              <div class="slide-notes-card">
                <div class="notes-badge">üéì TOPIC EXPLANATION & STUDY NOTE</div>
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
                <span class="slide-time">üìö Sequence Taught Material</span>
              </div>
              
              <h2 class="slide-title">üìå ${headingText}</h2>
              
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
              <span class="slide-time">üì∏ Instant Handout</span>
            </div>
            <h2 class="slide-title">üìå Active Whiteboard Formulas</h2>
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
              <button class="action-btn" onclick="window.print()">üñ®Ô∏è Save as PDF / Print Book</button>
              <button class="action-btn action-btn-alt" onclick="window.close()">‚ùå Close Book</button>
            </div>

            <div class="instructions-box">
              <strong>üìò Direct PDF Save Option:</strong> Click the <strong>"Save as PDF / Print Book"</strong> button above, or press <strong>Ctrl + P</strong> (Cmd + P on Mac). Choose <strong>"Save as PDF"</strong> as your destination, and hit save!
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
              Digital Lecture Copy Synchronized via Maestry Cloud ‚Ä¢ Secure Verification PDF
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
        
        {/* Top Header Navigation Bar with Back & Close Button */}
        <div className="bg-[#0a3641] text-white px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between shrink-0 shadow-xs z-20 select-none border-b border-teal-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold shrink-0"
              title="Back to Classroom"
            >
              <ArrowLeft className="w-4 h-4 text-[#c4f500]" />
              <span className="hidden xs:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-teal-700/60 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#c4f500] animate-pulse shrink-0" />
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase truncate font-mono">
                Student Hub &amp; Analytics
              </h2>
              <span className="hidden sm:inline-flex text-[9px] bg-teal-900/80 text-teal-200 px-2 py-0.5 rounded-md font-mono border border-teal-700/50">
                {subject} ‚Ä¢ {grade}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-teal-200/90 hidden md:inline">
              üë§ {studentName}
            </span>
            <button
              type="button"
              onClick={() => setIsReportCardModalOpen(true)}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-[#c4f500] hover:bg-[#b0dc00] text-[#041a14] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="View Official Academic Report Card"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Card</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-teal-500/30"
              title="Close Hub"
            >
              <X className="w-3.5 h-3.5 text-rose-300" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Unified Tab bar Selector */}
        <div className="border-b border-zinc-200 bg-slate-50 shrink-0 select-none">
          {/* Mobile view tabs */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("profile"); setIsKiaraFullScreenOpen(false); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "profile" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              üë§ Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setIsKiaraFullScreenOpen(true);
                setActiveMobileSubTab("counselor");
                setActiveDesktopTab("counselor");
              }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "counselor" || isKiaraFullScreenOpen
                  ? "border-teal-800 text-teal-900 bg-white font-bold" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              üë©‚Äçüéì Kiara AI
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("stats"); setActiveDesktopTab("stats"); setIsKiaraFullScreenOpen(false); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "stats" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              üìä Performance
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("books"); setActiveDesktopTab("books"); setIsKiaraFullScreenOpen(false); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeMobileSubTab === "books" 
                  ? "border-teal-800 text-teal-900 bg-white" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              üìö Books
            </button>
          </div>

          {/* Desktop view tabs */}
          <div className="hidden md:flex justify-end px-6 py-2 gap-3 bg-slate-100/50 border-b border-zinc-150">
            <div className="text-xs font-mono font-bold text-[#486a73] flex items-center mr-auto">
              üéØ Classroom Hub Workspaces:
            </div>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("stats"); setActiveDesktopTab("stats"); setIsKiaraFullScreenOpen(false); }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesktopTab === "stats" && activeMobileSubTab !== "profile"
                  ? "bg-[#0a3641] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>üìä Performance Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsKiaraFullScreenOpen(true);
                setActiveMobileSubTab("counselor");
                setActiveDesktopTab("counselor");
              }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                (activeDesktopTab === "counselor" || isKiaraFullScreenOpen) && activeMobileSubTab !== "profile"
                  ? "bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-sm font-extrabold ring-1 ring-emerald-400/30"
                  : "text-teal-900 hover:text-teal-950 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-500/30"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>üë©‚Äçüéì Kiara (AI Counselor)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMobileSubTab("books"); setActiveDesktopTab("books"); setIsKiaraFullScreenOpen(false); }}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesktopTab === "books" && activeMobileSubTab !== "profile"
                  ? "bg-[#0a3641] text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>üìö Study Handbooks</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-white">
          
          {/* Left Sidebar: Student Profile Parameter Controls & Milestones */}
          <div className={`${activeMobileSubTab === "profile" ? "flex flex-1 min-h-0" : "hidden md:flex"} w-full md:w-80 bg-slate-50 border-r border-zinc-150 p-4 sm:p-5 pb-36 sm:pb-8 flex-col justify-between overflow-y-auto md:shrink-0 select-none`}>
            <div className="space-y-5 sm:space-y-6">
              
              {/* Profile Details section - Modern Student Identity Hero Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs text-left">
                {editingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-1.5 font-mono">
                        <Edit3 className="w-3.5 h-3.5 text-teal-700" /> Edit Profile
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID Settings</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0a3641] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                        placeholder="Your Name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Class Grade</label>
                        <select 
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
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
                        <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Board</label>
                        <select 
                          value={editBoard}
                          onChange={(e) => setEditBoard(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="CBSE">CBSE</option>
                          <option value="ICSE">ICSE / ISC</option>
                          <option value="UP Board">UP Board</option>
                          <option value="MP Board">MP Board</option>
                          <option value="Rajasthan Board">RBSE</option>
                          <option value="Maharashtra Board">MSBSHSE</option>
                          <option value="Bihar Board">BSEB</option>
                          <option value="Jharkhand Board">JAC</option>
                          <option value="Odisha Board">CHSE/BSE</option>
                          <option value="West Bengal Board">WBBSE</option>
                          <option value="Other State Board">Other Board</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#486a73] uppercase font-bold">Medium / Language</label>
                      <select 
                        value={editMediumOfLearning}
                        onChange={(e) => setEditMediumOfLearning(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
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
                        className="flex-1 bg-gradient-to-r from-[#0a3641] to-teal-800 hover:from-teal-900 hover:to-[#0a3641] text-white text-[10.5px] font-black tracking-wider uppercase py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {savingProfile ? "Saving..." : "Save updates"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="px-3 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10.5px] uppercase font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Header: Avatar, Name & Edit Button */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Student Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#0a3641] via-teal-800 to-emerald-600 text-white flex items-center justify-center text-base sm:text-lg font-black shadow-xs ring-2 ring-teal-500/20">
                            {(studentName || "S").trim().charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Active Scholar" />
                        </div>

                        {/* Name & Account Type */}
                        <div className="min-w-0">
                          <h3 className="font-black text-[#0a3641] text-sm sm:text-base leading-tight truncate">
                            {studentName || "Cherry's Student"}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                            <span className="text-[9.5px] font-bold text-emerald-700 truncate">
                              {currentUser?.isAnonymous ? "Guest Profile (Local)" : "Verified Scholar"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingProfile(true)}
                        className="shrink-0 px-2.5 py-1.5 bg-slate-100/90 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200/80 hover:border-teal-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-2xs group active:scale-95"
                        title="Edit Profile Particulars"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-teal-700 transition-colors" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* Meta Badges Grid / Tag Strip */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <div className="bg-teal-50/80 border border-teal-100/80 rounded-xl p-1.5 text-center">
                        <span className="text-[8px] font-mono uppercase font-bold text-teal-700 block leading-tight">Class</span>
                        <span className="text-[10.5px] font-black text-[#0a3641] block truncate mt-0.5">{grade}</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-1.5 text-center">
                        <span className="text-[8px] font-mono uppercase font-bold text-slate-500 block leading-tight">Board</span>
                        <span className="text-[10.5px] font-black text-slate-800 block truncate mt-0.5">{board}</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-1.5 text-center">
                        <span className="text-[8px] font-mono uppercase font-bold text-slate-500 block leading-tight">Medium</span>
                        <span className="text-[10.5px] font-black text-slate-800 block truncate mt-0.5">{mediumOfLearning}</span>
                      </div>
                    </div>
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
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">üìà</span>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-semibold">Total Slides Saved</span>
                      <span className="text-xl font-black text-[#0a3641] block mt-0.5">{allSnapshots.length}</span>
                    </div>
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">üì∏</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">üèÜ</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0a3641]">Active Scholar Badge</span>
                  </div>
                  <p className="text-[10px] text-[#486a73] font-medium mt-1 leading-relaxed">
                    Automatically unlocked for participating in live lectures and compiling direct board-books!
                  </p>
                </div>

                {/* Kiara AI Student Counselor Card - Clean Modern Emerald Tinted Glass Card */}
                <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/80 rounded-2xl p-3.5 text-left space-y-2.5 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-emerald-500/20">
                        <span>üë©‚Äçüéì</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black tracking-tight text-[#0a3641] font-mono truncate">Kiara AI</h4>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        </div>
                        <span className="text-[8.5px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">Mindset & Study Counselor</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Exam anxiety, revision routine, or mnemonics? Ask Kiara anytime.
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsKiaraFullScreenOpen(true);
                        setActiveMobileSubTab("counselor");
                        setActiveDesktopTab("counselor");
                      }}
                      className="bg-[#0a3641] hover:bg-teal-900 text-white text-[10px] font-black uppercase tracking-wider py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-[#c4f500]" />
                      <span className="truncate">Chat (Full)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsKiaraVoiceModalOpen(true);
                      }}
                      className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300/80 text-[10px] font-bold uppercase tracking-wider py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                    >
                      <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span className="truncate">Live Voice üéôÔ∏è</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="text-[9.5px] text-zinc-400 font-mono text-left pt-6 border-t border-zinc-200 mt-6 leading-relaxed">
              * Classroom Handbooks are automatically formatted into optimized multi-page books using integrated LaTeX formulas.
            </div>
          </div>

          {/* Right Column: Unified Board-Book Hub (Main Arena) */}
          <div className={`${(activeMobileSubTab === "books" || activeMobileSubTab === "stats" || activeMobileSubTab === "counselor") ? "flex" : "hidden md:flex"} flex-1 p-3.5 sm:p-5 pb-36 sm:pb-10 flex-col space-y-4 overflow-y-auto text-left min-h-0 bg-white`} ref={statsScrollContainerRef}>
            
            {/* Premium Header - Unified Performance Hub */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-2.5 gap-2 shrink-0 select-none">
              <div className="flex items-center gap-2 min-w-0">
                {activeDesktopTab === "counselor" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] truncate">
                      Kiara ‚Ä¢ AI Mindset & Academic Success Counselor
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
                  {subject} ‚Ä¢ {grade}
                </span>
              </div>
            </div>

            {(activeDesktopTab === "counselor" || activeMobileSubTab === "counselor" || isKiaraFullScreenOpen) ? (
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
                  onClose={() => {
                    setActiveDesktopTab("stats");
                    setActiveMobileSubTab("profile");
                    setIsKiaraFullScreenOpen(false);
                  }}
                />
              </div>
            ) : activeDesktopTab === "stats" ? (
              <div className="space-y-4 animate-fade-in text-left">
                {/* Dashboard Introduction Header - Compact & Sleek */}
                <div className="bg-gradient-to-r from-[#0a3641] to-[#041a1e] px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl text-white shadow-xs relative overflow-hidden flex items-center justify-between gap-3 shrink-0 min-h-[52px]">
                  <div className="flex items-center gap-2.5 min-w-0 z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">
                      üìä
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                        Namaste, {studentName}! Performance Analytics üåü
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

                {/* Performance Workspace Mode Sub-Tabs - Clean Horizontal Scroll & Glitch-Free */}
                <div className="bg-slate-100 p-2 rounded-2xl border border-zinc-200 shadow-xs select-none space-y-2 text-left">
                  <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold uppercase tracking-wider text-teal-950">Analytics & Diagnostic Suite</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-sans">
                      ‚Üê Scroll to view all 7 dimensions ‚Üí
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-zinc-300">
                    {/* Tab 1: Macro */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("macro")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "macro"
                          ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Target className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "macro" ? "text-amber-300" : "text-teal-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Macro Overview</span>
                    </button>

                    {/* Tab 2: Micro */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("micro")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "micro"
                          ? "bg-teal-900 text-white border-teal-900 shadow-xs"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Crosshair className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "micro" ? "text-emerald-300" : "text-emerald-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Micro-Diagnostics</span>
                    </button>

                    {/* Tab 3: Retention */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("retention")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "retention"
                          ? "bg-amber-800 text-white border-amber-800 shadow-xs"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Hourglass className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "retention" ? "text-amber-300" : "text-amber-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Memory Decay</span>
                    </button>

                    {/* Tab 4: Agility */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("agility")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "agility"
                          ? "bg-indigo-900 text-white border-indigo-900 shadow-xs"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Gauge className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "agility" ? "text-indigo-300" : "text-indigo-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Agility & Stamina</span>
                    </button>

                    {/* Tab 5: Curriculum & Blindspots */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("curriculum")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "curriculum"
                          ? "bg-[#062026] text-[#c4f500] border-[#062026] shadow-xs font-black"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Compass className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "curriculum" ? "text-[#c4f500]" : "text-teal-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Syllabus Radar</span>
                    </button>

                    {/* Tab 6: Prerequisite Gap Finder & Knowledge Graph */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("prerequisites")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "prerequisites"
                          ? "bg-[#062026] text-[#c4f500] border-[#062026] shadow-xs font-black"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <GitFork className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "prerequisites" ? "text-[#c4f500]" : "text-teal-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Prereq Graph</span>
                    </button>

                    {/* Tab 7: Exam Speed Sprint & Time Pacing Simulator */}
                    <button
                      type="button"
                      onClick={() => setPerformanceWorkspaceTab("sprint")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2 cursor-pointer border ${
                        performanceWorkspaceTab === "sprint"
                          ? "bg-[#121c24] text-[#c4f500] border-[#121c24] shadow-xs font-black"
                          : "text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Gauge className={`w-3.5 h-3.5 shrink-0 ${performanceWorkspaceTab === "sprint" ? "text-[#c4f500]" : "text-cyan-700"}`} />
                      <span className="whitespace-nowrap font-extrabold">Speed Sprint</span>
                    </button>
                  </div>
                </div>

                {performanceWorkspaceTab === "macro" ? (
                  <>
                    {/* Main Bento Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* TILE 1: Radar Chart (Cognitive Mastery Dimensions) - Spans 2 columns on desktop */}
                  <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between">
                    
                    {/* SVG Radar Chart container */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="flex items-center justify-between w-full mb-3 pb-1 border-b border-zinc-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-sans flex items-center gap-1">
                          üõ°Ô∏è Micro-Cognitive Dimensions
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
                          { label: "Concept Clarity", val: dashboardStats.conceptClarity, icon: "üéØ" },
                          { label: "Theoretical Core", val: dashboardStats.theoreticalCore, icon: "üìñ" },
                          { label: "Calculations", val: dashboardStats.calculationPrecision, icon: "üßÆ" },
                          { label: "Formula Recall", val: dashboardStats.formulaRecall, icon: "‚ö°" },
                          { label: "Socratic Stamina", val: dashboardStats.socraticStamina, icon: "üî•" }
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
                                üí° Cherry's Strategic Advice:
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
                        üèÜ Earned Scholars Badges:
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {pastSessions?.length > 0 && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Attended at least 1 live session with Cherry Ma'am">
                            üåø Chalkboard Pioneer
                          </span>
                        )}
                        {snapshots?.length > 0 && (
                          <span className="bg-blue-50 text-blue-800 border border-blue-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Saved chalkboard whiteboard equations">
                            üì∏ Formula Archivist
                          </span>
                        )}
                        {quizAttempts?.length > 0 && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Completed at least 1 practice classroom quiz">
                            üìù Quiz Conqueror
                          </span>
                        )}
                        {Object.keys(masteredCards).filter(k => masteredCards[k]).length > 0 && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-2 py-0.5 text-[8.5px] font-mono font-black" title="Marked flashcards as mastered in spaced recall">
                            ‚ö° Recall Prodigy
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
                          üìà Classroom Quiz Accuracy Trendline
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
                              <span className="text-lg">‚è≥</span>
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
                          return { x, y, accuracy: att.accuracy, date: att.docName?.split("‚Ä¢")?.[0]?.trim() || "Quiz" };
                        });

                        // Draw curved path using cubic B√©zier curves (smooth wavy curve)
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
                      <span>‚¨ÖÔ∏è Earlier attempts</span>
                      <span>Latest sittings ‚û°Ô∏è</span>
                    </div>
                  </div>

                  {/* TILE 4: Conceptual Strengths (Mastery Highlights) */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 font-sans flex items-center gap-1">
                          üèÜ Conceptual Strengths
                        </span>
                        <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded-sm">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Topics & theories where you have demonstrated flawless accuracy and solid deductive clarity in class tests.
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:hidden pb-0.5 text-[9px] font-mono text-emerald-700">
                      <span>‚Üê Swipe Verified Strengths ‚Üí</span>
                      <span>{dashboardStats.strengths.length} Topics</span>
                    </div>
                    <div className="flex sm:flex-col overflow-x-auto sm:overflow-visible gap-2.5 pb-2 sm:pb-0 scrollbar-thin snap-x snap-mandatory">
                      {dashboardStats.strengths.slice(0, 4).map((str, idx) => (
                        <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-left flex items-start gap-2.5 w-[76vw] sm:w-auto shrink-0 sm:shrink snap-center shadow-2xs">
                          <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs shrink-0">
                            ‚úì
                          </span>
                          <div className="space-y-0.5 min-w-0">
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
                      <span>üíé Keep it up! These are ready for board revisions.</span>
                    </div>
                  </div>

                  {/* TILE 5: Growth Areas & Recommendations */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-sans flex items-center gap-1">
                          ‚ö†Ô∏è Mastery Focus Areas
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
                      <span>üìñ Practice flashcards to master these topics!</span>
                    </div>
                  </div>

                </div>

                {/* PHASE 4: Board Exam Readiness Index & Projected Score Estimator */}
                {(() => {
                  const examReadinessScore = Math.min(100, Math.max(10, Math.round(
                    (dashboardStats.conceptClarity * 0.25) +
                    (dashboardStats.theoreticalCore * 0.20) +
                    (dashboardStats.calculationPrecision * 0.25) +
                    (dashboardStats.formulaRecall * 0.15) +
                    (dashboardStats.socraticStamina * 0.15)
                  )));
                  const projectedPercentile = (Math.min(99.4, 75 + (examReadinessScore - 50) * 0.45)).toFixed(1);
                  const gradeBand = examReadinessScore >= 90 ? "A1 (91‚Äì100%) ‚Ä¢ Top Distinction" 
                    : examReadinessScore >= 80 ? "A2 (81‚Äì90%) ‚Ä¢ Outstanding" 
                    : examReadinessScore >= 70 ? "B1 (71‚Äì80%) ‚Ä¢ Solid Merit" 
                    : examReadinessScore >= 60 ? "B2 (61‚Äì70%) ‚Ä¢ Good Progress" 
                    : "C1 (51‚Äì60%) ‚Ä¢ Foundation Reinforcement Needed";

                  return (
                    <div className="bg-gradient-to-br from-[#062026] via-[#09353f] to-[#041a1e] border border-teal-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-400/10 rounded-full opacity-25 pointer-events-none" />
                      
                      <div className="space-y-2.5 max-w-xl z-10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-mono font-black uppercase tracking-wider">
                            üéØ Board Readiness Metric
                          </span>
                          <span className="text-[10px] font-mono text-teal-200/80">
                            Curriculum: {grade || "Class 10"} ‚Ä¢ {board || "CBSE"}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Target Board Exam Readiness Index</span>
                          <span className="text-amber-300 text-sm font-mono font-bold">({examReadinessScore}%)</span>
                        </h3>
                        <p className="text-xs text-teal-100/80 font-sans leading-relaxed">
                          Predicted Grade Band: <strong className="text-white font-black">{gradeBand}</strong> ‚Ä¢ Estimated Percentile: <strong className="text-emerald-300 font-mono font-black">Top {projectedPercentile}%</strong> nationwide.
                        </p>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-teal-500/30">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-[#c4f500] rounded-full transition-all duration-500" 
                            style={{ width: `${examReadinessScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 z-10 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => setIsReportCardModalOpen(true)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-[#041a14] rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <FileText className="w-4 h-4 stroke-[2.5]" />
                          <span>Generate Report Card üéì</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsKiaraVoiceModalOpen(true)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-teal-100 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Kiara Strategy Call üéôÔ∏è</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* PHASE 4: Weekly AI Smart Study Timetable & Daily Revision Planner */}
                {(() => {
                  const days = [
                    {
                      day: "Monday",
                      title: "Core Theory & Definitions",
                      icon: "üìñ",
                      theme: "Theoretical Foundations",
                      focus: "Deep definition memorization & theorem statements",
                      tasks: [
                        { id: "mon-1", label: `Review 5 key theorems for ${subject || "Mathematics"} from Chapter Books` },
                        { id: "mon-2", label: `Complete 10-minute active recall flashcard session` },
                        { id: "mon-3", label: `Re-examine auto-captured blackboard derivation notes` }
                      ]
                    },
                    {
                      day: "Tuesday",
                      title: "Calculation Precision & Algebra",
                      icon: "üßÆ",
                      theme: "Step-by-Step Accuracy",
                      focus: "Eliminate sign errors & transposing mistakes in multi-step equations",
                      tasks: [
                        { id: "tue-1", label: `Solve 4 multi-step board-pattern numericals with written steps` },
                        { id: "tue-2", label: `Double-check unit conversions and scientific constants` },
                        { id: "tue-3", label: `Verify algebraic solutions with Cherry Ma'am in classroom` }
                      ]
                    },
                    {
                      day: "Wednesday",
                      title: "Active Recall Flashcards Drill",
                      icon: "‚ö°",
                      theme: "Spaced Retention",
                      focus: "Rapid-fire 3-tier Leitner box memory consolidation",
                      tasks: [
                        { id: "wed-1", label: `Revise all 'Hard' & 'Medium' difficulty flashcards` },
                        { id: "wed-2", label: `Practice LaTeX formula normalization with audio narration` },
                        { id: "wed-3", label: `Export Markdown revision study pack for quick offline reading` }
                      ]
                    },
                    {
                      day: "Thursday",
                      title: "Socratic Problem Solving with Cherry Ma'am",
                      icon: "üë©‚Äçüè´",
                      theme: "Doubt Elimination",
                      focus: "Targeted Socratic dialogue for challenging concepts",
                      tasks: [
                        { id: "thu-1", label: `Ask Cherry Ma'am 2 Socratic conceptual questions on blackboard` },
                        { id: "thu-2", label: `Step through counter-intuitive examples and edge cases` },
                        { id: "thu-3", label: `Capture high-resolution blackboard snapshot of derivation` }
                      ]
                    },
                    {
                      day: "Friday",
                      title: "Hierarchical Mind Map Synthesis",
                      icon: "üß†",
                      theme: "Conceptual Schemas",
                      focus: "Synthesizing cross-topic linkages and visual infographics",
                      tasks: [
                        { id: "fri-1", label: `Explore Chapter Concept Mind Map in Chalkboard & Pastel visual modes` },
                        { id: "fri-2", label: `Filter mind map by 'Formulas & Laws' and 'Exam Tips'` },
                        { id: "fri-3", label: `Export SVG / PNG mind map diagram for physical study wall` }
                      ]
                    },
                    {
                      day: "Saturday",
                      title: "Speed & Accuracy Mock Quiz",
                      icon: "üéØ",
                      theme: "Examination Simulation",
                      focus: "Timed MCQ solving under realistic board conditions",
                      tasks: [
                        { id: "sat-1", label: `Take dynamic 5-question chapter practice quiz` },
                        { id: "sat-2", label: `Review Socratic explanations for any incorrect attempts` },
                        { id: "sat-3", label: `Achieve 80%+ accuracy score to boost cognitive radar` }
                      ]
                    },
                    {
                      day: "Sunday",
                      title: "Kiara Counselor Mindset & Retrospective",
                      icon: "üë©‚Äçüéì",
                      theme: "Wellness & Strategy",
                      focus: "Weekly mental wellness check-in, pacing calibration and goal setting",
                      tasks: [
                        { id: "sun-1", label: `Conduct 5-minute live voice mindset check-in with Kiara Counselor` },
                        { id: "sun-2", label: `Review cognitive growth metrics and updated percentile index` },
                        { id: "sun-3", label: `Generate and save weekly diagnostic report card` }
                      ]
                    }
                  ];

                  const activeDay = days[activePlannerDayIndex] || days[0];
                  const totalTasks = days.reduce((acc, d) => acc + d.tasks.length, 0);
                  const completedCount = Object.values(completedPlannerTasks).filter(Boolean).length;
                  const completionPercentage = Math.round((completedCount / totalTasks) * 100);

                  return (
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs text-left space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 text-sm">
                              <Calendar className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-black text-[#0a3641] uppercase tracking-wider font-sans">
                              Weekly Smart Study Timetable & Daily Revision Planner
                            </h4>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-sans">
                            AI-curated adaptive study schedule tailored to reinforce your <strong className="text-teal-800">{lowestMetric?.name || "weakest metric"}</strong> and ensure steady board exam preparation.
                          </p>
                        </div>

                        {/* Progress Counter */}
                        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-zinc-200 shrink-0 self-start sm:self-auto">
                          <div className="text-right">
                            <span className="text-[9px] font-mono uppercase font-black text-zinc-400 block">Weekly Progress</span>
                            <span className="text-xs font-mono font-black text-[#0a3641]">{completedCount}/{totalTasks} Tasks ({completionPercentage}%)</span>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center text-[10px] font-mono font-black">
                            {completionPercentage}%
                          </div>
                        </div>
                      </div>

                      {/* 7-Day Navigation Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {days.map((d, idx) => {
                          const isSelected = activePlannerDayIndex === idx;
                          const dayCompleted = d.tasks.every(t => completedPlannerTasks[t.id]);
                          return (
                            <button
                              key={d.day}
                              type="button"
                              onClick={() => setActivePlannerDayIndex(idx)}
                              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                                isSelected
                                  ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs font-black"
                                  : "bg-slate-50 hover:bg-slate-100 text-zinc-700 border-zinc-200"
                              }`}
                            >
                              <span>{d.icon}</span>
                              <span>{d.day.slice(0, 3)}</span>
                              {dayCompleted && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Day Detail Card */}
                      <div className="bg-slate-50/80 border border-zinc-200/80 rounded-2xl p-4.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                          <div>
                            <span className="text-[9.5px] font-mono font-black uppercase text-teal-800 tracking-wider">
                              {activeDay.day} ‚Ä¢ {activeDay.theme}
                            </span>
                            <h5 className="text-sm font-black text-[#0a3641] mt-0.5">
                              {activeDay.title}
                            </h5>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 italic hidden sm:inline">
                            Focus: {activeDay.focus}
                          </span>
                        </div>

                        {/* Tasks Checklist */}
                        <div className="space-y-2">
                          {activeDay.tasks.map((task) => {
                            const isDone = !!completedPlannerTasks[task.id];
                            return (
                              <div
                                key={task.id}
                                onClick={() => togglePlannerTask(task.id)}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                  isDone
                                    ? "bg-emerald-50/70 border-emerald-300/60 text-emerald-950"
                                    : "bg-white border-zinc-200 hover:border-teal-400 text-zinc-800 shadow-2xs"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                                      isDone ? "bg-emerald-600 text-white" : "border-2 border-zinc-300 bg-white"
                                    }`}
                                  >
                                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                  <span className={`text-xs font-medium truncate ${isDone ? "line-through text-emerald-900/70" : "text-zinc-800"}`}>
                                    {task.label}
                                  </span>
                                </div>
                                {task.id === "sun-1" && !isDone ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsKiaraVoiceModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    <span>Call Kiara üéôÔ∏è</span>
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-mono text-zinc-400 shrink-0 uppercase">
                                    {isDone ? "Completed" : "Pending"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                  </>
                ) : performanceWorkspaceTab === "micro" ? (
                  /* PHASE 1: MICRO-DIAGNOSTICS & MISTAKE CLASSIFICATION MATRIX VIEW */
                  <div className="space-y-6 animate-fade-in text-left">
                    
                    {/* Micro Diagnostic Hero Bar */}
                    <div className="bg-gradient-to-br from-[#062026] via-[#09353f] to-[#041a1e] border border-teal-500/30 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full opacity-30 pointer-events-none" />
                      
                      <div className="space-y-1.5 min-w-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-emerald-400/20 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full font-black border border-emerald-400/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Granular Micro-Diagnostic Engine
                          </span>
                          <span className="text-[10px] font-mono text-teal-200/80">
                            Subject Scope: <strong>{subject} ‚Ä¢ {grade}</strong>
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Sub-Topic Mastery & 4-Way Error Classification</span>
                        </h3>
                        <p className="text-xs text-teal-100/85 font-sans leading-relaxed max-w-2xl">
                          Surgical analysis of step-by-step arithmetic mistakes, formula misrecalls, conceptual traps, and response speed latency.
                        </p>
                      </div>

                      {/* Quick Summary Metrics Bento in Hero - Horizontal Swipe on Mobile */}
                      <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto sm:overflow-visible gap-2 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-2.5 text-center min-w-[90px] sm:min-w-0 shrink-0 sm:shrink snap-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-200 block">Assessed</span>
                          <span className="text-base sm:text-lg font-black text-white font-mono">{microDiagnosticsData.allSubtopics.length}</span>
                          <span className="text-[8.5px] text-teal-300/80 block">Topics</span>
                        </div>
                        <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-2.5 text-center min-w-[90px] sm:min-w-0 shrink-0 sm:shrink snap-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 block">Critical</span>
                          <span className="text-base sm:text-lg font-black text-rose-300 font-mono">{microDiagnosticsData.criticalGapsCount}</span>
                          <span className="text-[8.5px] text-rose-200/80 block">Gaps (&lt;60%)</span>
                        </div>
                        <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-2.5 text-center min-w-[90px] sm:min-w-0 shrink-0 sm:shrink snap-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 block">In Progress</span>
                          <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{microDiagnosticsData.practicingCount}</span>
                          <span className="text-[8.5px] text-amber-200/80 block">60‚Äì84%</span>
                        </div>
                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-2.5 text-center min-w-[90px] sm:min-w-0 shrink-0 sm:shrink snap-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">Avg Speed</span>
                          <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">{microDiagnosticsData.overallAvgLatency}s</span>
                          <span className="text-[8.5px] text-emerald-200/80 block">Per Problem</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: 4-WAY MISTAKE CLASSIFICATION MATRIX */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-150 gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </span>
                            <span>The 4-Way Error Classification Matrix (Mistake Archetypes)</span>
                          </h4>
                          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                            Click any archetype below to filter sub-topics prone to that specific type of mistake.
                          </p>
                        </div>

                        {microMistakeFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setMicroMistakeFilter("all")}
                            className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Reset Filter
                          </button>
                        )}
                      </div>

                      {/* 4 Mistake Archetype Cards - Swipeable Carousel on Mobile */}
                      <div className="flex items-center justify-between sm:hidden text-[10px] font-mono text-zinc-400 px-1 pb-1">
                        <span>‚Üê Swipe 4 Mistake Archetypes ‚Üí</span>
                        <span>Tap to Filter</span>
                      </div>
                      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 overflow-x-auto sm:overflow-visible gap-3.5 pb-2.5 sm:pb-0 snap-x snap-mandatory scrollbar-thin">
                        {/* 1. Conceptual Gap */}
                        <div
                          onClick={() => setMicroMistakeFilter(microMistakeFilter === "conceptual" ? "all" : "conceptual")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] sm:w-auto shrink-0 sm:shrink snap-center  ${
                            microMistakeFilter === "conceptual"
                              ? "bg-rose-50/90 border-rose-500 ring-2 ring-rose-400/40 shadow-sm"
                              : "bg-slate-50/80 hover:bg-rose-50/40 border-zinc-200 hover:border-rose-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">üéØ</span>
                                <span className="text-xs font-black text-slate-900 tracking-tight">Conceptual Gap</span>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                {microDiagnosticsData.mistakeDistribution.conceptual.percent}% Frequency
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                              Misunderstanding fundamental physics/maths laws, boundary conditions, or definitions.
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 space-y-1.5">
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${microDiagnosticsData.mistakeDistribution.conceptual.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-rose-700 block truncate">
                              üí° Remedy: Visual Blackboard Derivation
                            </span>
                          </div>
                        </div>

                        {/* 2. Calculation Slip */}
                        <div
                          onClick={() => setMicroMistakeFilter(microMistakeFilter === "calculation" ? "all" : "calculation")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] sm:w-auto shrink-0 sm:shrink snap-center  ${
                            microMistakeFilter === "calculation"
                              ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/40 shadow-sm"
                              : "bg-slate-50/80 hover:bg-amber-50/40 border-zinc-200 hover:border-amber-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">üßÆ</span>
                                <span className="text-xs font-black text-slate-900 tracking-tight">Calculation Slip</span>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                {microDiagnosticsData.mistakeDistribution.calculation.percent}% Frequency
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                              Algebraic sign errors (+/-), incorrect transpositions, arithmetic slips during steps.
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 space-y-1.5">
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${microDiagnosticsData.mistakeDistribution.calculation.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-amber-700 block truncate">
                              üí° Remedy: Step-by-Step Checking & Alignment
                            </span>
                          </div>
                        </div>

                        {/* 3. Formula Misrecall */}
                        <div
                          onClick={() => setMicroMistakeFilter(microMistakeFilter === "formula" ? "all" : "formula")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] sm:w-auto shrink-0 sm:shrink snap-center  ${
                            microMistakeFilter === "formula"
                              ? "bg-purple-50/90 border-purple-500 ring-2 ring-purple-400/40 shadow-sm"
                              : "bg-slate-50/80 hover:bg-purple-50/40 border-zinc-200 hover:border-purple-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">‚ö°</span>
                                <span className="text-xs font-black text-slate-900 tracking-tight">Formula Misrecall</span>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                {microDiagnosticsData.mistakeDistribution.formula.percent}% Frequency
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                              Applying the wrong identity, forgetting powers/constants, or unit conversion mismatch.
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 space-y-1.5">
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${microDiagnosticsData.mistakeDistribution.formula.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-purple-700 block truncate">
                              üí° Remedy: KaTeX Flashcards & Dimensions
                            </span>
                          </div>
                        </div>

                        {/* 4. Speed / Panic Trap */}
                        <div
                          onClick={() => setMicroMistakeFilter(microMistakeFilter === "speed" ? "all" : "speed")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] sm:w-auto shrink-0 sm:shrink snap-center  ${
                            microMistakeFilter === "speed"
                              ? "bg-sky-50/90 border-sky-500 ring-2 ring-sky-400/40 shadow-sm"
                              : "bg-slate-50/80 hover:bg-sky-50/40 border-zinc-200 hover:border-sky-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">‚è±Ô∏è</span>
                                <span className="text-xs font-black text-slate-900 tracking-tight">Speed / Panic Trap</span>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                                {microDiagnosticsData.mistakeDistribution.speed.percent}% Frequency
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                              Rushed answering under 15s or getting bogged down over 120s losing exam composure.
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 space-y-1.5">
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full"
                                style={{ width: `${microDiagnosticsData.mistakeDistribution.speed.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-sky-700 block truncate">
                              üí° Remedy: 45s Timed Sprints & Elimination
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: GRANULAR SUB-TOPIC MASTERY & DIRECT ACTION HUB */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-left">
                      
                      {/* Filter Bar with Mobile Carousel/Grid Mode Toggle */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-150">
                        <div className="flex items-center justify-between w-full lg:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 shrink-0">
                              <Crosshair className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641]">
                                Granular Sub-Topic Competency Tree ({microDiagnosticsData.subtopics.length})
                              </h4>
                              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                                Click "Fix with Cherry Ma'am" to load targeted problem on blackboard
                              </span>
                            </div>
                          </div>

                          {/* View Mode Toggle for Sub-Topics */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMicroViewMode("carousel")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                microViewMode === "carousel"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Horizontal Swipe Deck"
                            >
                              üé¥ Swipe Deck
                            </button>
                            <button
                              type="button"
                              onClick={() => setMicroViewMode("list")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                microViewMode === "list"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Grid List"
                            >
                              üìã Grid
                            </button>
                          </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full lg:w-72">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search subtopic or chapter..."
                            value={microSearchQuery}
                            onChange={(e) => setMicroSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 font-medium"
                          />
                          {microSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setMicroSearchQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subject & Mastery Filter Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Subject Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {["all", "Mathematics", "Physics", "Chemistry", "Biology"].map((subj) => (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => setMicroSubjectFilter(subj)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                microSubjectFilter === subj
                                  ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs font-black"
                                  : "bg-slate-50 text-zinc-600 border-zinc-200 hover:bg-slate-100 hover:text-zinc-900"
                              }`}
                            >
                              {subj === "all" ? "üåê All Subjects" : subj}
                            </button>
                          ))}
                        </div>

                        {/* Mastery Status Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {[
                            { key: "all", label: "All Status", count: microDiagnosticsData.allSubtopics.length },
                            { key: "critical", label: "üî¥ Critical (<60%)", count: microDiagnosticsData.criticalGapsCount },
                            { key: "practicing", label: "üü° In Progress (60-84%)", count: microDiagnosticsData.practicingCount },
                            { key: "mastered", label: "üü¢ Mastered (85%+)", count: microDiagnosticsData.masteredCount },
                          ].map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setMicroMasteryFilter(tab.key as any)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                microMasteryFilter === tab.key
                                  ? "bg-teal-900 text-[#c4f500] border-teal-900 shadow-2xs font-black"
                                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-slate-50"
                              }`}
                            >
                              <span>{tab.label}</span>
                              <span className="ml-1 text-[9px] opacity-80">({tab.count})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sub-Topics List Cards (Horizontal Carousel or Grid) */}
                      {microDiagnosticsData.subtopics.length > 0 ? (
                        <>
                          {microViewMode === "carousel" && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pb-1">
                              <span>‚Üê Swipe Subtopics Horizontal Deck ({microDiagnosticsData.subtopics.length} total) ‚Üí</span>
                              <span>Touch & Drag</span>
                            </div>
                          )}
                          <div className={
                            microViewMode === "carousel"
                              ? "flex overflow-x-auto gap-4 pb-3 pt-1 snap-x snap-mandatory scrollbar-thin"
                              : "grid grid-cols-1 md:grid-cols-2 gap-4"
                          }>
                          {microDiagnosticsData.subtopics.map((sub) => {
                            const isCritical = sub.masteryStatus === "critical";
                            const isMastered = sub.masteryStatus === "mastered";

                            return (
                              <div
                                key={sub.id}
                                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                                  microViewMode === "carousel" ? "w-[86vw] sm:w-[380px] shrink-0 snap-center shadow-xs" : ""
                                } ${
                                  isCritical
                                    ? "bg-gradient-to-br from-white via-rose-50/20 to-rose-50/40 border-rose-200/90 shadow-2xs hover:border-rose-300"
                                    : isMastered
                                    ? "bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 border-emerald-200/90 shadow-2xs hover:border-emerald-300"
                                    : "bg-white border-zinc-200 shadow-2xs hover:border-zinc-300"
                                }`}
                              >
                                {/* Header: Subject badge & Title */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-slate-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                                        {sub.subject}
                                      </span>
                                      <span className="text-[9px] font-mono text-zinc-400 font-bold">
                                        ‚Ä¢ {sub.chapter}
                                      </span>
                                    </div>

                                    {/* Mastery Status Badge */}
                                    <span
                                      className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                                        isCritical
                                          ? "bg-rose-100 text-rose-800 border-rose-200"
                                          : isMastered
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                          : "bg-amber-100 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {sub.masteryScore}% {isCritical ? "‚Ä¢ Critical Gap" : isMastered ? "‚Ä¢ Mastered" : "‚Ä¢ In Progress"}
                                    </span>
                                  </div>

                                  <h5 className="text-xs sm:text-sm font-black text-[#0a3641] tracking-tight leading-snug">
                                    {sub.name}
                                  </h5>
                                </div>

                                {/* Metrics bar: Accuracy & Latency */}
                                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-zinc-150">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold">
                                      <span>Accuracy</span>
                                      <span className="text-[#0a3641] font-black">{sub.accuracy}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          isCritical ? "bg-rose-500" : isMastered ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                        style={{ width: `${sub.accuracy}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 border-l border-zinc-200 pl-2.5">
                                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold">
                                      <span>Speed Latency</span>
                                      <span className="text-teal-900 font-black">{sub.avgLatencySec}s</span>
                                    </div>
                                    <div className="text-[8.5px] font-mono text-zinc-500 flex items-center gap-1">
                                      <span>Target: {sub.benchmarkLatencySec}s</span>
                                      {sub.avgLatencySec <= sub.benchmarkLatencySec ? (
                                        <span className="text-emerald-600 font-bold">‚ö° Optimal</span>
                                      ) : (
                                        <span className="text-amber-600 font-bold">‚è≥ Hesitant</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* KaTeX Key Formulas / Rules */}
                                {sub.keyFormulas && sub.keyFormulas.length > 0 && (
                                  <div className="bg-slate-900 text-teal-200 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono overflow-x-auto">
                                    <div className="text-[8px] font-mono text-teal-400/80 uppercase tracking-widest mb-1">
                                      üìå Key Formula / Governing Rule
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {sub.keyFormulas.slice(0, 2).map((formula, fIdx) => (
                                        <span
                                          key={fIdx}
                                          dangerouslySetInnerHTML={{
                                            __html: katex.renderToString(formula, { throwOnError: false })
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Socratic Prescription Tip */}
                                <div className="text-[10px] text-zinc-600 leading-relaxed bg-amber-50/50 p-2 rounded-xl border border-amber-150/70 flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <p>
                                    <strong className="text-slate-800 font-bold">Cherry's Micro-Tip:</strong> {sub.prescriptionHint}
                                  </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-150">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDrillSubtopic(sub)}
                                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Search className="w-3 h-3 text-slate-600" />
                                    <span>Questions (Drill)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDiscussWithCherry) {
                                        onDiscussWithCherry({
                                          topic: sub.name,
                                          subject: sub.subject,
                                          conceptTested: sub.name,
                                          hint: sub.prescriptionHint,
                                          question: `Cherry Ma'am, please explain ${sub.name} step-by-step on the blackboard with a targeted problem to fix my calculation accuracy.`
                                        });
                                      } else if (onEnterClassroom) {
                                        onEnterClassroom();
                                      }
                                    }}
                                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-800 to-[#0a3641] hover:from-teal-700 hover:to-[#082d36] text-[#c4f500] text-[10px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Zap className="w-3 h-3 text-[#c4f500]" />
                                    <span>Fix with Cherry Ma'am</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                          <p className="text-xs text-zinc-500 font-medium">
                            No sub-topics found matching your search or filters.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setMicroSubjectFilter("all");
                              setMicroMasteryFilter("all");
                              setMicroMistakeFilter("all");
                              setMicroSearchQuery("");
                            }}
                            className="text-[10px] font-mono font-bold text-teal-800 underline cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Question Drilldown Modal */}
                    {selectedDrillSubtopic && (
                      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
                        <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left">
                          
                          {/* Modal Header */}
                          <div className="px-5 py-4 bg-gradient-to-r from-[#0a3641] to-[#041a1e] text-white flex items-center justify-between shrink-0">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-[#c4f500]/20 text-[#c4f500] px-2 py-0.5 rounded-md">
                                  {selectedDrillSubtopic.subject} ‚Ä¢ {selectedDrillSubtopic.chapter}
                                </span>
                                <span className="text-[9px] font-mono text-teal-200">
                                  Mastery: <strong>{selectedDrillSubtopic.masteryScore}%</strong>
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-black text-white truncate">
                                {selectedDrillSubtopic.name} ‚Ä¢ Question Diagnostics
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedDrillSubtopic(null)}
                              className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="p-5 overflow-y-auto space-y-4 flex-1">
                            {/* Prescription Banner */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-black">Target Socratic Strategy:</strong> {selectedDrillSubtopic.prescriptionHint}
                              </div>
                            </div>

                            {/* Question Logs */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                                üìù Diagnostic Problem History ({selectedDrillSubtopic.recentQuestions?.length || 0})
                              </h4>

                              {selectedDrillSubtopic.recentQuestions?.map((q: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                                    q.isCorrect
                                      ? "bg-emerald-50/30 border-emerald-200"
                                      : "bg-rose-50/30 border-rose-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold text-zinc-500">
                                      Problem #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono text-zinc-500">
                                        ‚è±Ô∏è {q.latencySec}s
                                      </span>
                                      <span
                                        className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md border ${
                                          q.isCorrect
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                            : "bg-rose-100 text-rose-800 border-rose-300"
                                        }`}
                                      >
                                        {q.isCorrect ? "‚úÖ Solved Correctly" : `‚ö†Ô∏è ${q.mistakeType || "Review"} Error`}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs font-bold text-slate-900 leading-snug">
                                    {q.question}
                                  </p>

                                  <div className="bg-white p-2.5 rounded-xl border border-zinc-150 text-[10.5px] space-y-1">
                                    <div className="text-zinc-600">
                                      <strong className="text-slate-800">Your Submitted Step:</strong> {q.userAnswer}
                                    </div>
                                    <div className="text-emerald-800">
                                      <strong className="text-emerald-950">Standard Derivation:</strong> {q.explanation}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="px-5 py-3 bg-slate-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedDrillSubtopic(null)}
                              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Close Drilldown
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const sub = selectedDrillSubtopic;
                                setSelectedDrillSubtopic(null);
                                if (onDiscussWithCherry) {
                                  onDiscussWithCherry({
                                    topic: sub.name,
                                    subject: sub.subject,
                                    conceptTested: sub.name,
                                    hint: sub.prescriptionHint,
                                    question: `Cherry Ma'am, please explain ${sub.name} step-by-step on the blackboard with a targeted problem to fix my calculation accuracy.`
                                  });
                                } else if (onEnterClassroom) {
                                  onEnterClassroom();
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-800 to-[#0a3641] hover:from-teal-700 text-[#c4f500] text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5 text-[#c4f500]" />
                              <span>Practice on Blackboard with Cherry Ma'am üöÄ</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                ) : performanceWorkspaceTab === "retention" ? (
                  /* PHASE 2: COGNITIVE RETENTION & EBBINGHAUS SPACED REPETITION VIEW */
                  <div className="space-y-6 animate-fade-in text-left">
                    
                    {/* Hero Header for Retention */}
                    <div className="bg-gradient-to-br from-[#062026] via-[#0a3641] to-[#041a1e] border border-teal-500/30 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full opacity-30 pointer-events-none" />
                      <div className="space-y-1.5 min-w-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-amber-400/20 text-amber-300 font-mono px-2.5 py-0.5 rounded-full font-black border border-amber-400/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Ebbinghaus Forgetting Curve Engine
                          </span>
                          <span className="text-[10px] font-mono text-amber-200/80">
                            Neural Memory Decay Tracker
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Memory Decay & Spaced Repetition Radar</span>
                        </h3>
                        <p className="text-xs text-amber-100/85 font-sans leading-relaxed max-w-2xl">
                          Scientifically schedules chalkboard flashcard reviews at Day 1, 3, 7, 14, and 30 intervals to reset memory decay back to 100%.
                        </p>
                      </div>

                      {/* Summary Badges Bento */}
                      <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto sm:overflow-visible gap-2 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-200 block">Avg Memory</span>
                          <span className="text-base sm:text-lg font-black text-white font-mono">{retentionEngineData.avgRetention}%</span>
                          <span className="text-[8.5px] text-amber-300/80 block">Retention</span>
                        </div>
                        <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 block">Due Now</span>
                          <span className="text-base sm:text-lg font-black text-rose-300 font-mono">{retentionEngineData.criticalCount}</span>
                          <span className="text-[8.5px] text-rose-200/80 block">&lt;50% Decay</span>
                        </div>
                        <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300 block">Review Soon</span>
                          <span className="text-base sm:text-lg font-black text-amber-300 font-mono">{retentionEngineData.warningCount}</span>
                          <span className="text-[8.5px] text-amber-200/80 block">50‚Äì72%</span>
                        </div>
                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">Optimal</span>
                          <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">{retentionEngineData.stableCount}</span>
                          <span className="text-[8.5px] text-emerald-200/80 block">Long-term</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: INTERACTIVE EBBINGHAUS RETENTION CURVE VISUALIZER */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-150 gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60">
                              <Activity className="w-4 h-4 text-amber-600" />
                            </span>
                            <span>The Science of Spaced Repetition (R = e^(-t/S) Curve)</span>
                          </h4>
                          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                            Without review, up to 70% of lecture concepts decay within 7 days. Each spaced recall session flattens the decay curve.
                          </p>
                        </div>
                        <span className="text-[9.5px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                          üß† Leitner Box Active
                        </span>
                      </div>

                      {/* SVG Interactive Forgetting Curve Comparison Graphic */}
                      <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3 text-xs font-mono">
                          <span className="text-amber-400 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Single Lecture (Fast Decay)
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Spaced Repetition (Reinforced Memory)
                          </span>
                        </div>

                        {/* Responsive SVG Chart */}
                        <div className="w-full h-44 sm:h-52 relative">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                            <line x1="40" y1="55" x2="480" y2="55" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                            <line x1="40" y1="90" x2="480" y2="90" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                            <line x1="40" y1="125" x2="480" y2="125" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
                            
                            {/* Y Axis Labels */}
                            <text x="5" y="24" fill="#94a3b8" fontSize="8" fontFamily="monospace">100%</text>
                            <text x="12" y="59" fill="#94a3b8" fontSize="8" fontFamily="monospace">75%</text>
                            <text x="12" y="94" fill="#94a3b8" fontSize="8" fontFamily="monospace">50%</text>
                            <text x="12" y="129" fill="#94a3b8" fontSize="8" fontFamily="monospace">25%</text>

                            {/* X Axis Labels */}
                            <text x="40" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 0</text>
                            <text x="110" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 1</text>
                            <text x="190" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 3</text>
                            <text x="270" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 7</text>
                            <text x="360" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 14</text>
                            <text x="450" y="152" fill="#94a3b8" fontSize="8" fontFamily="monospace">Day 30</text>

                            {/* Curve 1: Rapid Decay without review (Rose) */}
                            <path
                              d="M 40 20 Q 120 100 270 120 T 480 135"
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="3"
                              strokeDasharray="4 2"
                            />

                            {/* Curve 2: Spaced Repetition (Reinforced Peaks - Emerald) */}
                            {/* Peak 1: Day 1 Review */}
                            <path
                              d="M 40 20 Q 80 50 110 65 L 110 20 Q 150 45 190 55 L 190 20 Q 230 35 270 42 L 270 20 Q 320 30 360 35 L 360 20 Q 420 25 480 28"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="3"
                            />

                            {/* Key Review Nodes with Pulsing Glow */}
                            <circle cx="110" cy="20" r="4" fill="#34d399" />
                            <circle cx="190" cy="20" r="4" fill="#34d399" />
                            <circle cx="270" cy="20" r="4" fill="#34d399" />
                            <circle cx="360" cy="20" r="4" fill="#34d399" />
                            
                            {/* Annotations */}
                            <text x="115" y="14" fill="#c4f500" fontSize="7.5" fontWeight="bold" fontFamily="monospace">1st Review</text>
                            <text x="195" y="14" fill="#c4f500" fontSize="7.5" fontWeight="bold" fontFamily="monospace">2nd</text>
                            <text x="275" y="14" fill="#c4f500" fontSize="7.5" fontWeight="bold" fontFamily="monospace">3rd</text>
                            <text x="365" y="14" fill="#c4f500" fontSize="7.5" fontWeight="bold" fontFamily="monospace">4th (Mastered)</text>
                          </svg>
                        </div>

                        <div className="mt-2 text-[10px] text-slate-300/90 font-mono flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2">
                          <span>üí° Current Retention Health: <strong className="text-[#c4f500]">{retentionEngineData.avgRetention}%</strong> Across All Subjects</span>
                          <span className="text-teal-300">Next Recommended Sprint: <strong>{retentionEngineData.criticalCount} Topics Due Today</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: TOPICS DECAY RADAR & REVISION SCHEDULER */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-left">
                      
                      {/* Filter Bar with Mobile Carousel/Grid Mode Toggle */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-150">
                        <div className="flex items-center justify-between w-full lg:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0">
                              <Hourglass className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641]">
                                Spaced Repetition Review Queue ({retentionEngineData.items.length})
                              </h4>
                              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                                Reinforce key formulas & definitions on chalkboard before memory fades
                              </span>
                            </div>
                          </div>

                          {/* View Mode Toggle */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRetentionViewMode("carousel")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                retentionViewMode === "carousel"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Horizontal Swipe Deck"
                            >
                              üé¥ Swipe Deck
                            </button>
                            <button
                              type="button"
                              onClick={() => setRetentionViewMode("list")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                retentionViewMode === "list"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Grid List"
                            >
                              üìã Grid
                            </button>
                          </div>
                        </div>

                        {/* Subject Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {["all", "Mathematics", "Physics", "Chemistry", "Biology"].map((subj) => (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => setRetentionActiveSubject(subj)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                retentionActiveSubject === subj
                                  ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs font-black"
                                  : "bg-slate-50 text-zinc-600 border-zinc-200 hover:bg-slate-100 hover:text-zinc-900"
                              }`}
                            >
                              {subj === "all" ? "üåê All Subjects" : subj}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Urgency Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { key: "all", label: "All Topics", count: retentionEngineData.allItems.length },
                          { key: "critical", label: "üî¥ Immediate Due (<50%)", count: retentionEngineData.criticalCount },
                          { key: "warning", label: "üü° Review Soon (50-72%)", count: retentionEngineData.warningCount },
                          { key: "stable", label: "üü¢ Long-Term Stable (73%+)", count: retentionEngineData.stableCount },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setRetentionFilterUrgency(tab.key as any)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                              retentionFilterUrgency === tab.key
                                ? "bg-amber-800 text-[#c4f500] border-amber-800 shadow-2xs font-black"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className="ml-1 text-[9px] opacity-80">({tab.count})</span>
                          </button>
                        ))}
                      </div>

                      {/* Repetition Queue Cards (Swipe Deck vs Grid) */}
                      {retentionEngineData.items.length > 0 ? (
                        <>
                          {retentionViewMode === "carousel" && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pb-1">
                              <span>‚Üê Swipe Repetition Cards ({retentionEngineData.items.length} in queue) ‚Üí</span>
                              <span>Touch & Drag</span>
                            </div>
                          )}
                          <div className={
                            retentionViewMode === "carousel"
                              ? "flex overflow-x-auto gap-4 pb-3 pt-1 snap-x snap-mandatory scrollbar-thin"
                              : "grid grid-cols-1 md:grid-cols-2 gap-4"
                          }>
                          {retentionEngineData.items.map((item) => {
                            const isCritical = item.urgency === "critical";
                            const isStable = item.urgency === "stable";

                            return (
                              <div
                                key={item.id}
                                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                                  retentionViewMode === "carousel" ? "w-[86vw] sm:w-[380px] shrink-0 snap-center shadow-xs" : ""
                                } ${
                                  isCritical
                                    ? "bg-gradient-to-br from-white via-rose-50/20 to-rose-50/40 border-rose-200/90 shadow-2xs hover:border-rose-300"
                                    : isStable
                                    ? "bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 border-emerald-200/90 shadow-2xs hover:border-emerald-300"
                                    : "bg-white border-amber-200/80 shadow-2xs hover:border-amber-300"
                                }`}
                              >
                                {/* Header */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-slate-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                                        {item.subject}
                                      </span>
                                      <span className="text-[9px] font-mono text-zinc-400 font-bold">
                                        ‚Ä¢ {item.chapter}
                                      </span>
                                    </div>

                                    {/* Urgency Badge */}
                                    <span className={`text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-lg border ${item.urgencyColor}`}>
                                      {item.urgencyLabel}
                                    </span>
                                  </div>

                                  <h5 className="text-xs sm:text-sm font-black text-[#0a3641] tracking-tight leading-snug">
                                    {item.topicName}
                                  </h5>
                                </div>

                                {/* Retention Meter & Spaced Intervals */}
                                <div className="bg-slate-50/80 p-3 rounded-xl border border-zinc-150 space-y-2">
                                  <div className="flex items-center justify-between text-[9.5px] font-mono">
                                    <span className="text-zinc-500 font-bold">Estimated Memory Strength:</span>
                                    <strong className={`font-black ${isCritical ? "text-rose-600" : isStable ? "text-emerald-700" : "text-amber-600"}`}>
                                      {item.currentRetention}% Retention
                                    </strong>
                                  </div>

                                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        isCritical ? "bg-rose-500" : isStable ? "bg-emerald-500" : "bg-amber-500"
                                      }`}
                                      style={{ width: `${item.currentRetention}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-zinc-200/60">
                                    <span>Studied: <strong>{item.lastStudiedDaysAgo} days ago</strong></span>
                                    <span>Repetitions: <strong>{item.repetitionCount} / 5</strong></span>
                                    <span>Interval: <strong>Day {item.nextReviewDays}</strong></span>
                                  </div>
                                </div>

                                {/* KaTeX Formula preview if available */}
                                {item.formulaKatex && (
                                  <div className="bg-slate-900 text-amber-200 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono overflow-x-auto">
                                    <div className="text-[8px] font-mono text-amber-400/80 uppercase tracking-widest mb-1">
                                      ‚ö° Core Retention Formula
                                    </div>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: renderKaTeXHtmlSafe(item.formulaKatex)
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Key Points Checklist */}
                                <div className="space-y-1 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 text-[9.5px] text-zinc-700">
                                  <span className="text-[8px] font-mono font-bold text-amber-900 uppercase tracking-wider block">
                                    üìå Core Memory Anchors:
                                  </span>
                                  {item.keyPoints.slice(0, 2).map((kp, kpIdx) => (
                                    <div key={kpIdx} className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{kp}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveFlashcardFlipped(false);
                                      setSelectedRetentionFlashcard(item);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Brain className="w-3 h-3 text-amber-700" />
                                    <span>Chalkboard Flashcard</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDiscussWithCherry) {
                                        onDiscussWithCherry({
                                          topic: item.topicName,
                                          subject: item.subject,
                                          conceptTested: item.topicName,
                                          hint: item.flashcardAnswer,
                                          question: `Cherry Ma'am, please give me a quick 3-minute spaced-repetition memory booster on ${item.topicName} on the blackboard!`
                                        });
                                      } else if (onEnterClassroom) {
                                        onEnterClassroom();
                                      }
                                    }}
                                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-800 to-[#0a3641] hover:from-amber-700 hover:to-[#082d36] text-[#c4f500] text-[10px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Sparkles className="w-3 h-3 text-[#c4f500]" />
                                    <span>Reset Decay (Recap)</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                          <p className="text-xs text-zinc-500 font-medium">
                            No review topics found for this filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setRetentionActiveSubject("all");
                              setRetentionFilterUrgency("all");
                            }}
                            className="text-[10px] font-mono font-bold text-amber-800 underline cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interactive Chalkboard Flashcard Modal */}
                    {selectedRetentionFlashcard && (
                      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
                        <div className="bg-[#051e24] border border-teal-500/30 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-left text-white">
                          
                          {/* Modal Header */}
                          <div className="px-5 py-4 bg-[#031519] border-b border-teal-900 flex items-center justify-between shrink-0">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md">
                                  {selectedRetentionFlashcard.subject} ‚Ä¢ Flashcard
                                </span>
                                <span className="text-[9px] font-mono text-teal-300">
                                  Retention: <strong>{selectedRetentionFlashcard.currentRetention}%</strong>
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-white truncate">
                                {selectedRetentionFlashcard.topicName}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedRetentionFlashcard(null)}
                              className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Flashcard Body */}
                          <div className="p-6 flex flex-col items-center justify-center min-h-[220px] text-center space-y-4">
                            <div
                              onClick={() => setActiveFlashcardFlipped(!activeFlashcardFlipped)}
                              className="w-full bg-[#082a32] border border-teal-500/40 hover:border-amber-400/60 rounded-2xl p-6 transition-all cursor-pointer shadow-lg space-y-3 relative group"
                            >
                              <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <RotateCw className="w-3 h-3 animate-spin-slow" />
                                <span>{activeFlashcardFlipped ? "Answer / Derivation (Click to flip back)" : "Prompt (Click card to reveal solution)"}</span>
                              </div>

                              {!activeFlashcardFlipped ? (
                                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                                  {selectedRetentionFlashcard.flashcardPrompt}
                                </p>
                              ) : (
                                <div className="space-y-3 animate-fade-in text-left">
                                  <p className="text-sm sm:text-base text-teal-100 font-medium leading-relaxed">
                                    {selectedRetentionFlashcard.flashcardAnswer}
                                  </p>
                                  {selectedRetentionFlashcard.formulaKatex && (
                                    <div className="p-3 bg-slate-950 rounded-xl border border-teal-900 text-center">
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: renderKaTeXHtmlSafe(selectedRetentionFlashcard.formulaKatex)
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="text-[8.5px] font-mono text-teal-400/70 pt-2">
                                üí° Tip: Active recall strengthens neural pathways 3x faster than passive reading.
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="px-5 py-3 bg-[#031519] border-t border-teal-900 flex items-center justify-between shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedRetentionFlashcard(null)}
                              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-teal-300 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              Close
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const card = selectedRetentionFlashcard;
                                setSelectedRetentionFlashcard(null);
                                if (onDiscussWithCherry) {
                                  onDiscussWithCherry({
                                    topic: card.topicName,
                                    subject: card.subject,
                                    conceptTested: card.topicName,
                                    hint: card.flashcardAnswer,
                                    question: `Cherry Ma'am, please explain ${card.topicName} on the chalkboard with an intuitive example so I retain it long-term.`
                                  });
                                } else if (onEnterClassroom) {
                                  onEnterClassroom();
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-teal-700 hover:from-amber-500 text-white text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Practice on Blackboard with Cherry Ma'am üöÄ</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                ) : performanceWorkspaceTab === "agility" ? (
                  /* PHASE 3: COGNITIVE AGILITY, SPEED-ACCURACY QUADRANT & PREDICTIVE EXAM READINESS VIEW */
                  <div className="space-y-6 animate-fade-in text-left">
                    
                    {/* Hero Header for Agility & Stamina */}
                    <div className="bg-gradient-to-br from-[#062026] via-[#0a3641] to-[#041a1e] border border-teal-500/30 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full opacity-30 pointer-events-none" />
                      
                      <div className="space-y-1.5 min-w-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-400/20 text-indigo-300 font-mono px-2.5 py-0.5 rounded-full font-black border border-indigo-400/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            Speed-Accuracy & Cognitive Stamina Engine
                          </span>
                          <span className="text-[10px] font-mono text-indigo-200/80">
                            Time-Under-Pressure Analytics
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                          <span>Socratic Agility, Fatigue Curve & Exam Readiness</span>
                        </h3>
                        <p className="text-xs text-indigo-100/85 font-sans leading-relaxed max-w-2xl">
                          Surgically correlates response latency against conceptual precision to eliminate test anxiety, over-calculation, and cognitive fatigue.
                        </p>
                      </div>

                      {/* Summary Badges Bento */}
                      <div className="flex sm:grid sm:grid-cols-4 overflow-x-auto sm:overflow-visible gap-2 w-full md:w-auto shrink-0 z-10 pb-1 sm:pb-0 scrollbar-none snap-x">
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-200 block">Agility Score</span>
                          <span className="text-base sm:text-lg font-black text-white font-mono">{staminaAnalyticsData.agilityScore}/100</span>
                          <span className="text-[8.5px] text-indigo-300/80 block">Neural Speed</span>
                        </div>
                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">Flow State</span>
                          <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">{staminaAnalyticsData.flowCount}</span>
                          <span className="text-[8.5px] text-emerald-200/80 block">&lt;45s &amp; &gt;80%</span>
                        </div>
                        <div className="bg-sky-500/20 border border-sky-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-300 block">Overthink</span>
                          <span className="text-base sm:text-lg font-black text-sky-300 font-mono">{staminaAnalyticsData.overthinkCount}</span>
                          <span className="text-[8.5px] text-sky-200/80 block">Slow &amp; Acc</span>
                        </div>
                        <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl p-2.5 text-center">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 block">Projected</span>
                          <span className="text-base sm:text-lg font-black text-rose-300 font-mono">{staminaAnalyticsData.projectedRawScore}%</span>
                          <span className="text-[8.5px] text-rose-200/80 block">¬±{staminaAnalyticsData.confidenceMargin}% Exam Band</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: THE 4-QUADRANT SPEED VS ACCURACY COGNITIVE MATRIX */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-150 gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                              <Gauge className="w-4 h-4 text-indigo-600" />
                            </span>
                            <span>The Cognitive Agility 4-Quadrant Matrix (Latency vs Accuracy)</span>
                          </h4>
                          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                            Real exam success requires both high accuracy and low latency. Identify where you over-calculate or rush impulsively.
                          </p>
                        </div>
                        <span className="text-[9.5px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                          üéØ Threshold: 45s Benchmark
                        </span>
                      </div>

                      {/* Visual 4-Quadrant Layout - Horizontal Swipe Deck on Mobile */}
                      <div className="flex items-center justify-between md:hidden text-[10px] font-mono text-zinc-400 px-1 pb-1">
                        <span>‚Üê Swipe 4 Agility Quadrants ‚Üí</span>
                        <span>Tap to Filter</span>
                      </div>
                      <div className="flex md:grid md:grid-cols-2 overflow-x-auto md:overflow-visible gap-4 pt-1 pb-2 md:pb-0 snap-x snap-mandatory scrollbar-thin">
                        
                        {/* Quadrant 1: Flow State */}
                        <div
                          onClick={() => setStaminaQuadrantFilter(staminaQuadrantFilter === "flow" ? "all" : "flow")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] md:w-auto shrink-0 md:shrink snap-center  ${
                            staminaQuadrantFilter === "flow"
                              ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm"
                              : "bg-gradient-to-br from-emerald-50/40 to-white hover:bg-emerald-50/70 border-emerald-200"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-black">Q1</span>
                                <div>
                                  <h5 className="text-xs font-black text-emerald-950 tracking-tight">Flow State (Automaticity)</h5>
                                  <span className="text-[9px] font-mono text-emerald-700">Fast (&lt;45s) ‚Ä¢ High Accuracy (&gt;75%)</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {staminaAnalyticsData.flowCount} Topics
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-relaxed">
                              Concepts mastered to instantaneous intuition. Minimal mental friction during exam pressure.
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[9px] font-mono font-bold text-emerald-800">
                            <span>‚úÖ Action: Keep Warm with Weekly Spaced Recall</span>
                            <span>{staminaQuadrantFilter === "flow" ? "Active Filter" : "Filter Topics ‚Üí"}</span>
                          </div>
                        </div>

                        {/* Quadrant 2: Overthink / Deep Thinker */}
                        <div
                          onClick={() => setStaminaQuadrantFilter(staminaQuadrantFilter === "overthink" ? "all" : "overthink")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] md:w-auto shrink-0 md:shrink snap-center  ${
                            staminaQuadrantFilter === "overthink"
                              ? "bg-sky-50/90 border-sky-500 ring-2 ring-sky-400/40 shadow-sm"
                              : "bg-gradient-to-br from-sky-50/40 to-white hover:bg-sky-50/70 border-sky-200"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-sky-100 text-sky-800 font-mono text-xs font-black">Q2</span>
                                <div>
                                  <h5 className="text-xs font-black text-sky-950 tracking-tight">Over-Calculation / Hesitation</h5>
                                  <span className="text-[9px] font-mono text-sky-700">Slow (&gt;45s) ‚Ä¢ High Accuracy (&gt;75%)</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                                {staminaAnalyticsData.overthinkCount} Topics
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-relaxed">
                              You know the theory, but write out unnecessary steps. Risk running out of time on long-format board papers.
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-sky-200/60 flex items-center justify-between text-[9px] font-mono font-bold text-sky-800">
                            <span>‚ö° Remedy: Tabular Methods & Algebraic Shortcut Drills</span>
                            <span>{staminaQuadrantFilter === "overthink" ? "Active Filter" : "Filter Topics ‚Üí"}</span>
                          </div>
                        </div>

                        {/* Quadrant 3: Impulsive Rushing */}
                        <div
                          onClick={() => setStaminaQuadrantFilter(staminaQuadrantFilter === "rushing" ? "all" : "rushing")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] md:w-auto shrink-0 md:shrink snap-center  ${
                            staminaQuadrantFilter === "rushing"
                              ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/40 shadow-sm"
                              : "bg-gradient-to-br from-amber-50/40 to-white hover:bg-amber-50/70 border-amber-200"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-amber-100 text-amber-800 font-mono text-xs font-black">Q3</span>
                                <div>
                                  <h5 className="text-xs font-black text-amber-950 tracking-tight">Impulsive Rushing / Panic Trap</h5>
                                  <span className="text-[9px] font-mono text-amber-700">Fast (&lt;45s) ‚Ä¢ Low Accuracy (&lt;75%)</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                {staminaAnalyticsData.rushingCount} Topics
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-relaxed">
                              Answering too quickly before carefully checking boundary conditions, negative signs, or units.
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[9px] font-mono font-bold text-amber-800">
                            <span>üõë Remedy: Mandatory 5-Second Diagram & Sign Inspection</span>
                            <span>{staminaQuadrantFilter === "rushing" ? "Active Filter" : "Filter Topics ‚Üí"}</span>
                          </div>
                        </div>

                        {/* Quadrant 4: Cognitive Roadblock */}
                        <div
                          onClick={() => setStaminaQuadrantFilter(staminaQuadrantFilter === "roadblock" ? "all" : "roadblock")}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between w-[82vw] md:w-auto shrink-0 md:shrink snap-center  ${
                            staminaQuadrantFilter === "roadblock"
                              ? "bg-rose-50/90 border-rose-500 ring-2 ring-rose-400/40 shadow-sm"
                              : "bg-gradient-to-br from-rose-50/40 to-white hover:bg-rose-50/70 border-rose-200"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-rose-100 text-rose-800 font-mono text-xs font-black">Q4</span>
                                <div>
                                  <h5 className="text-xs font-black text-rose-950 tracking-tight">Cognitive Bottleneck / Roadblock</h5>
                                  <span className="text-[9px] font-mono text-rose-700">Slow (&gt;45s) ‚Ä¢ Low Accuracy (&lt;75%)</span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                {staminaAnalyticsData.roadblockCount} Topics
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-600 leading-relaxed">
                              Fundamental theoretical gaps causing both high hesitation time and incorrect final answers.
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-[9px] font-mono font-bold text-rose-800">
                            <span>üí° Remedy: Blackboard Socratic Derivation with Cherry Ma'am</span>
                            <span>{staminaQuadrantFilter === "roadblock" ? "Active Filter" : "Filter Topics ‚Üí"}</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* SECTION 2: SOCRATIC SESSION FATIGUE & EXAM PACING FORECAST */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                      
                      {/* Sub-Card 1: Mental Fatigue Degradation Curve (2 Cols) */}
                      <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-150 gap-2">
                          <div>
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-2">
                              <Activity className="w-4 h-4 text-teal-700" />
                              <span>Session Stamina & Cognitive Fatigue Timeline</span>
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              How mental endurance fluctuates across a 45-minute practice session
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                            üß† Optimal Focus: 25 Mins
                          </span>
                        </div>

                        {/* Fatigue Timeline Cards - Horizontal Swipe Rail on Mobile */}
                        <div className="flex items-center justify-between sm:hidden text-[9px] font-mono text-zinc-400 pb-0.5">
                          <span>‚Üê Swipe 45-Min Timeline ‚Üí</span>
                          <span>4 Intervals</span>
                        </div>
                        <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-visible gap-3 pt-1 pb-2 sm:pb-0 snap-x snap-mandatory scrollbar-thin">
                          {staminaAnalyticsData.sessionFatigueCurve.map((phase, pIdx) => {
                            const isZoneOfGenius = pIdx === 1;
                            const isDip = pIdx === 3;

                            return (
                              <div
                                key={pIdx}
                                className={`p-3.5 rounded-2xl border space-y-2 w-[76vw] sm:w-auto shrink-0 sm:shrink snap-center ${
                                  isZoneOfGenius
                                    ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30"
                                    : isDip
                                    ? "bg-rose-50/70 border-rose-300"
                                    : "bg-slate-50 border-zinc-200"
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs font-black">
                                  <span className="text-[#0a3641]">{phase.phase}</span>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    isZoneOfGenius
                                      ? "bg-emerald-200 text-emerald-900"
                                      : isDip
                                      ? "bg-rose-200 text-rose-900"
                                      : "bg-zinc-200 text-zinc-800"
                                  }`}>
                                    {phase.status}
                                  </span>
                                </div>

                                <div className="space-y-1 text-[10px] font-mono text-zinc-600">
                                  <div className="flex items-center justify-between">
                                    <span>Accuracy:</span>
                                    <strong className={phase.accuracy >= 80 ? "text-emerald-700" : "text-rose-700"}>
                                      {phase.accuracy}%
                                    </strong>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Avg Latency:</span>
                                    <strong className="text-zinc-800">{phase.latencySec}s / question</strong>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Cognitive Load:</span>
                                    <strong className="text-zinc-800">{phase.cognitiveLoad}%</strong>
                                  </div>
                                </div>

                                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isZoneOfGenius ? "bg-emerald-500" : isDip ? "bg-rose-500" : "bg-teal-500"
                                    }`}
                                    style={{ width: `${phase.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-[10.5px] text-amber-900">
                          <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <p>
                            <strong>Cognitive Pacing Recommendation:</strong> Take a 3-minute Socratic reflection break after 25 minutes of continuous problem-solving to reset working memory load and prevent the 40-minute error spike.
                          </p>
                        </div>
                      </div>

                      {/* Sub-Card 2: Predictive Board Exam Target Projector (1 Col) */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-1 pb-3 border-b border-zinc-150">
                          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641] flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-700" />
                            <span>Exam Target Projector</span>
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Based on current speed-accuracy calibration
                          </span>
                        </div>

                        {/* Projected Big Score Dial */}
                        <div className="bg-gradient-to-br from-[#071d24] to-[#041216] p-5 rounded-2xl text-center text-white border border-teal-500/30 space-y-2">
                          <span className="text-[9.5px] font-mono uppercase tracking-widest text-teal-300 font-bold block">
                            Projected Exam Mastery
                          </span>
                          <div className="text-3xl sm:text-4xl font-black text-[#c4f500] font-mono tracking-tight">
                            {staminaAnalyticsData.projectedRawScore}%
                          </div>
                          <span className="text-[10px] font-mono text-zinc-300 block">
                            Confidence Range: <strong className="text-white">{staminaAnalyticsData.projectedRawScore - staminaAnalyticsData.confidenceMargin}% ‚Äì {staminaAnalyticsData.projectedRawScore + staminaAnalyticsData.confidenceMargin}%</strong>
                          </span>
                        </div>

                        {/* Time Allocation Breakdown */}
                        <div className="space-y-2 text-[10px] font-mono">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8.5px] block">
                            Recommended 3-Hour Paper Budget:
                          </span>
                          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-zinc-200/80">
                            <div className="flex items-center justify-between text-zinc-700">
                              <span>Sec A (MCQ / Rapid):</span>
                              <strong>35 Mins (1.5m / Q)</strong>
                            </div>
                            <div className="flex items-center justify-between text-zinc-700">
                              <span>Sec B (Short Derivation):</span>
                              <strong>55 Mins (3.5m / Q)</strong>
                            </div>
                            <div className="flex items-center justify-between text-zinc-700">
                              <span>Sec C (Long Problems):</span>
                              <strong>60 Mins (7.5m / Q)</strong>
                            </div>
                            <div className="flex items-center justify-between text-emerald-800 font-bold border-t border-zinc-200 pt-1">
                              <span>Buffer / Step Verification:</span>
                              <strong>30 Mins (Golden Reserve)</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onDiscussWithCherry) {
                              onDiscussWithCherry({
                                topic: "Exam Time Management & Speed-Accuracy Optimization",
                                subject: subject || "Mathematics",
                                conceptTested: "Exam Pacing Strategy",
                                hint: "Learn 3-pass exam scanning: solve easy flow questions first, then overthink items, leaving roadblocks for last.",
                                question: "Cherry Ma'am, how should I manage my time and pacing during the final board exam to avoid silly mistakes and rushing?"
                              });
                            } else if (onEnterClassroom) {
                              onEnterClassroom();
                            }
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-800 to-teal-900 hover:from-indigo-700 hover:to-teal-800 text-[#c4f500] text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Discuss Exam Strategy with Cherry Ma'am</span>
                        </button>
                      </div>

                    </div>

                    {/* SECTION 3: TOPICS AGILITY QUEUE & RAPID-FIRE SPEED DRILL SIMULATOR */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-left">
                      
                      {/* Filter Bar with Mobile Carousel/Grid Mode Toggle */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-150">
                        <div className="flex items-center justify-between w-full lg:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/60 shrink-0">
                              <Zap className="w-4 h-4 text-indigo-600" />
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0a3641]">
                                Cognitive Agility & Latency Queue ({staminaAnalyticsData.topics.length})
                              </h4>
                              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                                Launch 60-second timed rapid-fire speed drills on blackboard to convert hesitations into flow state
                              </span>
                            </div>
                          </div>

                          {/* View Mode Toggle */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-zinc-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => setStaminaViewMode("carousel")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                staminaViewMode === "carousel"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Horizontal Swipe Deck"
                            >
                              üé¥ Swipe Deck
                            </button>
                            <button
                              type="button"
                              onClick={() => setStaminaViewMode("list")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                staminaViewMode === "list"
                                  ? "bg-[#0a3641] text-white shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                              title="Grid List"
                            >
                              üìã Grid
                            </button>
                          </div>
                        </div>

                        {/* Subject Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                          {["all", "Mathematics", "Physics", "Chemistry", "Biology"].map((subj) => (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => setStaminaActiveSubject(subj)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                                staminaActiveSubject === subj
                                  ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs font-black"
                                  : "bg-slate-50 text-zinc-600 border-zinc-200 hover:bg-slate-100 hover:text-zinc-900"
                              }`}
                            >
                              {subj === "all" ? "üåê All Subjects" : subj}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quadrant Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { key: "all", label: "All Quadrants", count: staminaAnalyticsData.allTopics.length },
                          { key: "flow", label: "‚ö° Flow State (Q1)", count: staminaAnalyticsData.flowCount },
                          { key: "overthink", label: "‚è±Ô∏è Overthinking (Q2)", count: staminaAnalyticsData.overthinkCount },
                          { key: "rushing", label: "‚ö†Ô∏è Impulsive Rushing (Q3)", count: staminaAnalyticsData.rushingCount },
                          { key: "roadblock", label: "üî¥ Roadblocks (Q4)", count: staminaAnalyticsData.roadblockCount },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStaminaQuadrantFilter(tab.key as any)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                              staminaQuadrantFilter === tab.key
                                ? "bg-indigo-900 text-[#c4f500] border-indigo-900 shadow-2xs font-black"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className="ml-1 text-[9px] opacity-80">({tab.count})</span>
                          </button>
                        ))}
                      </div>

                      {/* Topics Cards Grid (Swipe Deck vs Grid) */}
                      {staminaAnalyticsData.topics.length > 0 ? (
                        <>
                          {staminaViewMode === "carousel" && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pb-1">
                              <span>‚Üê Swipe Agility Drills ({staminaAnalyticsData.topics.length} topics) ‚Üí</span>
                              <span>Touch & Drag</span>
                            </div>
                          )}
                          <div className={
                            staminaViewMode === "carousel"
                              ? "flex overflow-x-auto gap-4 pb-3 pt-1 snap-x snap-mandatory scrollbar-thin"
                              : "grid grid-cols-1 md:grid-cols-2 gap-4"
                          }>
                          {staminaAnalyticsData.topics.map((item) => {
                            const isOverthink = item.quadrant === "overthink";
                            const isRushing = item.quadrant === "rushing";
                            const isRoadblock = item.quadrant === "roadblock";

                            return (
                              <div
                                key={item.id}
                                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                                  isRoadblock
                                    ? "bg-gradient-to-br from-white via-rose-50/20 to-rose-50/40 border-rose-200/90 shadow-2xs"
                                    : isOverthink
                                    ? "bg-gradient-to-br from-white via-sky-50/20 to-sky-50/40 border-sky-200/90 shadow-2xs"
                                    : isRushing
                                    ? "bg-gradient-to-br from-white via-amber-50/20 to-amber-50/40 border-amber-200/90 shadow-2xs"
                                    : "bg-white border-emerald-200/80 shadow-2xs"
                                }`}
                              >
                                {/* Header */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-slate-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                                        {item.subject}
                                      </span>
                                      <span className="text-[9px] font-mono text-zinc-400 font-bold">
                                        ‚Ä¢ {item.chapter}
                                      </span>
                                    </div>

                                    {/* Quadrant Badge */}
                                    <span className={`text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-lg border ${item.quadrantColor}`}>
                                      {item.quadrantBadge}
                                    </span>
                                  </div>

                                  <h5 className="text-xs sm:text-sm font-black text-[#0a3641] tracking-tight leading-snug">
                                    {item.topicName}
                                  </h5>
                                </div>

                                {/* Speed & Accuracy Benchmarks */}
                                <div className="bg-slate-50/80 p-3 rounded-xl border border-zinc-150 space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                                    <div className="bg-white p-2 rounded-lg border border-zinc-200">
                                      <span className="text-zinc-400 block text-[8px] uppercase font-bold">Your Speed:</span>
                                      <span className="text-xs font-black text-slate-800">{item.avgLatencySec}s</span>
                                      <span className="text-[8px] text-zinc-400"> (Goal: {item.benchmarkSec}s)</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-zinc-200">
                                      <span className="text-zinc-400 block text-[8px] uppercase font-bold">Precision:</span>
                                      <span className={`text-xs font-black ${item.accuracy >= 75 ? "text-emerald-700" : "text-rose-700"}`}>
                                        {item.accuracy}% Accuracy
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[9px] font-mono text-zinc-600 bg-white/70 p-2 rounded-lg border border-zinc-200/60">
                                    <strong className="text-[#0a3641]">‚ö° Speed Strategy:</strong> {item.speedStrategy}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAgilityDrillTopic(item);
                                      setActiveSprintSeconds(45);
                                      setIsSprintRunning(false);
                                      setSprintStepIndex(0);
                                      setSprintScore(0);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Gauge className="w-3 h-3 text-indigo-700" />
                                    <span>Rapid Speed Drill</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDiscussWithCherry) {
                                        onDiscussWithCherry({
                                          topic: item.topicName,
                                          subject: item.subject,
                                          conceptTested: item.topicName,
                                          hint: item.speedStrategy,
                                          question: `Cherry Ma'am, please show me the fastest intuitive shortcut and blackboard derivation for ${item.topicName} so I can solve it in under 30 seconds!`
                                        });
                                      } else if (onEnterClassroom) {
                                        onEnterClassroom();
                                      }
                                    }}
                                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-800 to-[#0a3641] hover:from-indigo-700 hover:to-[#082d36] text-[#c4f500] text-[10px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <Zap className="w-3 h-3 text-[#c4f500]" />
                                    <span>Learn Shortcut üöÄ</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        </>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                          <p className="text-xs text-zinc-500 font-medium">
                            No topics found for this agility quadrant.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStaminaActiveSubject("all");
                              setStaminaQuadrantFilter("all");
                            }}
                            className="text-[10px] font-mono font-bold text-indigo-800 underline cursor-pointer"
                          >
                            Reset Quadrant Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interactive Rapid-Fire Speed Drill Modal */}
                    {selectedAgilityDrillTopic && (
                      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
                        <div className="bg-[#05111d] border border-indigo-500/40 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-left text-white">
                          
                          {/* Modal Header */}
                          <div className="px-5 py-4 bg-[#030b14] border-b border-indigo-950 flex items-center justify-between shrink-0">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-400/30">
                                  {selectedAgilityDrillTopic.subject} ‚Ä¢ 45s Speed Drill
                                </span>
                                <span className="text-[9px] font-mono text-emerald-300">
                                  Benchmark: <strong>{selectedAgilityDrillTopic.benchmarkSec}s</strong>
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-white truncate">
                                {selectedAgilityDrillTopic.topicName}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedAgilityDrillTopic(null)}
                              className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Speed Drill Body */}
                          <div className="p-6 space-y-4">
                            
                            {/* Question Card */}
                            <div className="bg-[#0a1829] border border-indigo-500/30 rounded-2xl p-5 space-y-3">
                              <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                                <span className="font-bold flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-[#c4f500]" /> Rapid-Fire Question:
                                </span>
                                <span className="text-amber-400 font-bold">Target: &lt;30s</span>
                              </div>

                              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                                {selectedAgilityDrillTopic.rapidFireQuestion}
                              </p>

                              {/* Options Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                {selectedAgilityDrillTopic.rapidFireOptions.map((opt: string, optIdx: number) => {
                                  const isCorrect = optIdx === selectedAgilityDrillTopic.correctOptionIndex;
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => {
                                        setSprintScore(isCorrect ? 100 : 0);
                                        setSprintStepIndex(1);
                                      }}
                                      className={`p-3 rounded-xl border text-xs font-mono font-bold text-left transition-all cursor-pointer ${
                                        sprintStepIndex > 0
                                          ? isCorrect
                                            ? "bg-emerald-950/80 border-emerald-400 text-emerald-200"
                                            : "bg-rose-950/40 border-rose-800 text-zinc-400 opacity-60"
                                          : "bg-[#0f243a] hover:bg-[#153252] border-indigo-800 text-indigo-100 hover:border-indigo-400"
                                      }`}
                                    >
                                      <span className="text-indigo-400 mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Solution & Speed Strategy Reveal if answered */}
                            {sprintStepIndex > 0 && (
                              <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 space-y-2 animate-fade-in text-[11px] font-mono">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-emerald-400 font-black flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Correct Answer: Option {String.fromCharCode(65 + selectedAgilityDrillTopic.correctOptionIndex)}
                                  </span>
                                  <span className="text-[#c4f500] font-bold">Shortcut Verified</span>
                                </div>
                                <p className="text-slate-200 text-xs font-sans leading-relaxed">
                                  {selectedAgilityDrillTopic.explanation}
                                </p>
                                <div className="text-[10px] text-teal-300 bg-teal-950/60 p-2 rounded-lg border border-teal-800/80 mt-1">
                                  üí° <strong>Chalkboard Trick:</strong> {selectedAgilityDrillTopic.speedStrategy}
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Modal Footer */}
                          <div className="px-5 py-3 bg-[#030b14] border-t border-indigo-950 flex items-center justify-between shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedAgilityDrillTopic(null)}
                              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-indigo-300 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              Close
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const drill = selectedAgilityDrillTopic;
                                setSelectedAgilityDrillTopic(null);
                                if (onDiscussWithCherry) {
                                  onDiscussWithCherry({
                                    topic: drill.topicName,
                                    subject: drill.subject,
                                    conceptTested: drill.topicName,
                                    hint: drill.explanation,
                                    question: `Cherry Ma'am, let's do a fast 3-question speed sprint on ${drill.topicName} on the digital blackboard!`
                                  });
                                } else if (onEnterClassroom) {
                                  onEnterClassroom();
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-700 via-purple-800 to-teal-700 hover:from-indigo-600 text-white text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#c4f500]" />
                              <span>Sprint on Blackboard with Cherry Ma'am üöÄ</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* PHASE 4: OFFICIAL CURRICULUM & BLINDSPOT RADAR */
                  performanceWorkspaceTab === "curriculum" ? (
                    <CurriculumBlindspotTracker
                      studentName={studentName || "Student"}
                      studentGrade={typeof grade === "number" ? grade : 12}
                      pastSessions={pastSessions}
                      quizAttempts={quizAttempts}
                      snapshots={snapshots}
                      onDiscussWithCherry={onDiscussWithCherry}
                      onEnterClassroom={onEnterClassroom}
                    />
                  ) : performanceWorkspaceTab === "prerequisites" ? (
                    /* PHASE 5: PREREQUISITE DEPENDENCY GAP FINDER & KNOWLEDGE GRAPH */
                    <PrerequisiteGapFinder
                      studentName={studentName || "Student"}
                      studentGrade={typeof grade === "number" ? grade : 12}
                      pastSessions={pastSessions}
                      quizAttempts={quizAttempts}
                      snapshots={snapshots}
                      onDiscussWithCherry={onDiscussWithCherry}
                      onEnterClassroom={onEnterClassroom}
                    />
                  ) : (
                    /* PHASE 6: EXAM SPEED SPRINT & TIME-PACING SIMULATOR */
                    <ExamSpeedSprintSimulator
                      studentName={studentName || "Student"}
                      studentGrade={typeof grade === "number" ? grade : 12}
                      pastSessions={pastSessions}
                      quizAttempts={quizAttempts}
                      snapshots={snapshots}
                      onDiscussWithCherry={onDiscussWithCherry}
                      onEnterClassroom={onEnterClassroom}
                    />
                  )
                )}

                {/* Bottom Quick-Jump Navigation Dock for Seamless Exploration */}
                <div className="bg-slate-100/90 border border-zinc-200/90 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none shadow-2xs">
                  <div className="flex items-center gap-2 text-zinc-600 font-mono text-[11px]">
                    <span className="font-bold text-teal-900">‚ö° Quick Jump:</span>
                    <span className="text-zinc-400">Navigate to another analytical dimension:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("macro"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "macro" ? "bg-[#0a3641] text-white shadow-xs" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      üéØ Macro
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("micro"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "micro" ? "bg-teal-800 text-white shadow-xs" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      üî¨ Micro
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("retention"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "retention" ? "bg-amber-700 text-white shadow-xs" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      üß† Retention
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("agility"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "agility" ? "bg-indigo-800 text-white shadow-xs" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      ‚ö° Agility
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("curriculum"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "curriculum" ? "bg-[#0a3641] text-[#c4f500] shadow-xs font-black" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      üó∫Ô∏è Syllabus
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("prerequisites"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "prerequisites" ? "bg-[#0a3641] text-[#c4f500] shadow-xs font-black" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      üîó Prereq Graph
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPerformanceWorkspaceTab("sprint"); }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                        performanceWorkspaceTab === "sprint" ? "bg-[#121c24] text-[#c4f500] shadow-xs font-black" : "bg-white text-zinc-600 hover:bg-slate-200/80 border border-zinc-200"
                      }`}
                    >
                      ‚ö° Speed Sprint
                    </button>
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
                {/* PHASE 1: UNIFIED HEADER, SEGMENTED SWITCHER & CONSOLIDATED TOOLBAR */}
                <div className="bg-gradient-to-br from-[#062026] via-[#0a3641] to-[#041a1e] p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-teal-500/20 relative overflow-hidden flex flex-col gap-5">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Top Bar inside Hero */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-teal-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center text-2xl font-bold shrink-0 shadow-inner">
                        üìñ
                      </div>
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white truncate">
                            Classroom Books & Smart Handbooks
                          </h3>
                          <span className="text-[9.5px] font-mono font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full shadow-xs">
                            Live Sync
                          </span>
                        </div>
                        <p className="text-[11.5px] sm:text-xs text-teal-100/80 font-medium truncate mt-0.5">
                          Multi-page chalkboard lecture books, step-by-step derivations & AI flashcard decks.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10 shrink-0 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 text-teal-200 px-3.5 py-1.5 rounded-xl border border-teal-400/25 backdrop-blur-md shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{grade || "Class 10"} ‚Ä¢ {board || "CBSE"} ‚Ä¢ {mediumOfLearning || "Hinglish"}</span>
                      </span>
                    </div>
                  </div>

                  {/* 4 Interactive Metric Capsules (Act as quick tab switchers) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
                    <button
                      type="button"
                      onClick={() => setBookHubActiveTab("books")}
                      className={`text-left transition-all border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xs flex flex-col justify-between group cursor-pointer ${
                        bookHubActiveTab === "books"
                          ? "bg-white/20 border-white/40 ring-2 ring-emerald-400/40 shadow-md"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between text-teal-300 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Chapter Books</span>
                        <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-mono">
                        {allBooks.length}
                      </div>
                      <span className="text-[9.5px] text-teal-200/70 font-sans mt-0.5">
                        Interactive Handbooks
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookHubActiveTab("slates")}
                      className={`text-left transition-all border rounded-2xl p-3 sm:p-3.5 backdrop-blur-xs flex flex-col justify-between group cursor-pointer ${
                        bookHubActiveTab === "slates"
                          ? "bg-white/20 border-white/40 ring-2 ring-teal-400/40 shadow-md"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between text-teal-300 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Board Slates</span>
                        <Camera className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-mono">
                        {allSnapshots.length}
                      </div>
                      <span className="text-[9.5px] text-teal-200/70 font-sans mt-0.5">
                        HD Chalk Captures
                      </span>
                    </button>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-3.5 backdrop-blur-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-teal-300 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Smart Decks</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-mono">
                        {allBooks.length}
                      </div>
                      <span className="text-[9.5px] text-teal-200/70 font-sans mt-0.5">
                        Flashcards & Mind Maps
                      </span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-3.5 backdrop-blur-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-teal-300 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Disciplines</span>
                        <Layers className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-mono">
                        {Object.keys(bookSubjectCounts).filter(k => k !== "all" && bookSubjectCounts[k] > 0).length || 1}
                      </div>
                      <span className="text-[9.5px] text-teal-200/70 font-sans mt-0.5">
                        Active Subjects
                      </span>
                    </div>
                  </div>

                  {/* Clean 2-Way Segmented Switcher Bar */}
                  <div className="flex items-center justify-between gap-3 bg-black/40 p-1.5 rounded-2xl border border-teal-500/25 relative z-10">
                    <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setBookHubActiveTab("books")}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          bookHubActiveTab === "books"
                            ? "bg-white text-[#0a3641] shadow-md font-black"
                            : "text-teal-200 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Chapter Books</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-mono ${
                          bookHubActiveTab === "books" ? "bg-[#0a3641] text-[#c4f500]" : "bg-white/20 text-white"
                        }`}>
                          {allBooks.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookHubActiveTab("slates")}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          bookHubActiveTab === "slates"
                            ? "bg-white text-[#0a3641] shadow-md font-black"
                            : "text-teal-200 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>Board Slates</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-mono ${
                          bookHubActiveTab === "slates" ? "bg-[#0a3641] text-[#c4f500]" : "bg-white/20 text-white"
                        }`}>
                          {allSnapshots.length}
                        </span>
                      </button>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-teal-200/80 pr-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{bookHubActiveTab === "books" ? "Showing Interactive Handbooks & AI Decks" : "Showing HD Blackboard Vector & Chalk Captures"}</span>
                    </div>
                  </div>
                </div>

                {/* UNIFIED FLOATING SEARCH & FILTER TOOLBAR */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-xs space-y-3">
                  {/* Top Row: Search Input + View Controls */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                      <input
                        ref={bookSearchInputRef}
                        type="text"
                        value={bookHubActiveTab === "books" ? archiveSearchQuery : snapshotSearchQuery}
                        onChange={(e) => {
                          if (bookHubActiveTab === "books") {
                            setArchiveSearchQuery(e.target.value);
                            setCurrentBookHorizontalIndex(0);
                          } else {
                            setSnapshotSearchQuery(e.target.value);
                            setCurrentSnapshotHorizontalIndex(0);
                          }
                        }}
                        placeholder={
                          bookHubActiveTab === "books"
                            ? "Search chapter books, topics, or formulas... (Press / to search)"
                            : "Search blackboard slides by topic, formula, or concept... (Press / to search)"
                        }
                        className="w-full pl-10 pr-20 py-2.5 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 focus:border-teal-600 text-zinc-800 placeholder:text-zinc-400 rounded-xl text-xs font-mono transition-all focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {(bookHubActiveTab === "books" ? archiveSearchQuery : snapshotSearchQuery) ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (bookHubActiveTab === "books") {
                                setArchiveSearchQuery("");
                                setCurrentBookHorizontalIndex(0);
                              } else {
                                setSnapshotSearchQuery("");
                                setCurrentSnapshotHorizontalIndex(0);
                              }
                            }}
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 text-xs transition-colors cursor-pointer"
                            title="Clear search"
                          >
                            ‚úï
                          </button>
                        ) : (
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-200/60 border border-zinc-300 rounded-md">
                            /
                          </kbd>
                        )}
                      </div>
                    </div>

                    {/* Controls Dock: Sort + View Mode + Stepper + Export */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between md:justify-end">
                      {bookHubActiveTab === "books" ? (
                        <>
                          {/* Sort Dropdown */}
                          <div className="flex items-center gap-1 bg-zinc-50 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-mono">
                            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2.5]" />
                            <select
                              value={bookSortOrder}
                              onChange={(e) => setBookSortOrder(e.target.value as any)}
                              className="text-xs font-bold text-zinc-700 bg-transparent border-none focus:outline-none cursor-pointer"
                            >
                              <option value="newest">Newest First</option>
                              <option value="oldest">Oldest First</option>
                              <option value="title">By Title</option>
                              <option value="topics">Most Topics</option>
                            </select>
                          </div>

                          {/* View Switcher: Grid vs Carousel */}
                          <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                            <button
                              type="button"
                              onClick={() => setBooksViewMode("grid")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                booksViewMode === "grid"
                                  ? "bg-white text-[#0a3641] shadow-xs font-black border border-zinc-200/60"
                                  : "text-zinc-600 hover:text-zinc-900"
                              }`}
                              title="Grid View"
                            >
                              <Grid className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Grid</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBooksViewMode("carousel")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                booksViewMode === "carousel"
                                  ? "bg-white text-[#0a3641] shadow-xs font-black border border-zinc-200/60"
                                  : "text-zinc-600 hover:text-zinc-900"
                              }`}
                              title="Carousel View"
                            >
                              <Film className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Carousel</span>
                            </button>
                          </div>

                          {/* Stepper for Books Carousel */}
                          {booksViewMode === "carousel" && filteredBooks.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200">
                              <span className="text-[10px] font-mono font-black text-[#0a3641]">
                                {Math.min(currentBookHorizontalIndex + 1, filteredBooks.length)}/{filteredBooks.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleBooksHorizontalScroll("prev")}
                                disabled={currentBookHorizontalIndex === 0}
                                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBooksHorizontalScroll("next")}
                                disabled={currentBookHorizontalIndex >= filteredBooks.length - 1}
                                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Export Album Button for Slates */}
                          <button
                            type="button"
                            onClick={handleBatchExportSnapshotsMarkdown}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs"
                            title="Export all blackboard derivations into a consolidated Markdown revision album"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-700" />
                            <span>Export Album</span>
                          </button>

                          {/* View Switcher: Grid vs Carousel */}
                          <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                            <button
                              type="button"
                              onClick={() => setSnapshotsViewMode("grid")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                snapshotsViewMode === "grid"
                                  ? "bg-white text-[#0a3641] shadow-xs font-black border border-zinc-200/60"
                                  : "text-zinc-600 hover:text-zinc-900"
                              }`}
                              title="Grid View"
                            >
                              <Grid className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Grid</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSnapshotsViewMode("carousel")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                snapshotsViewMode === "carousel"
                                  ? "bg-white text-[#0a3641] shadow-xs font-black border border-zinc-200/60"
                                  : "text-zinc-600 hover:text-zinc-900"
                              }`}
                              title="Carousel View"
                            >
                              <Film className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Carousel</span>
                            </button>
                          </div>

                          {/* Stepper for Slates Carousel */}
                          {snapshotsViewMode === "carousel" && filteredSnapshots.length > 1 && (
                            <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200">
                              <span className="text-[10px] font-mono font-black text-[#0a3641]">
                                {currentSnapshotHorizontalIndex + 1}/{filteredSnapshots.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSnapshotHorizontalScroll("prev")}
                                disabled={currentSnapshotHorizontalIndex === 0}
                                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSnapshotHorizontalScroll("next")}
                                disabled={currentSnapshotHorizontalIndex >= filteredSnapshots.length - 1}
                                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Subject Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-zinc-100 pt-2">
                    {bookHubActiveTab === "books" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedBookSubjectFilter("all")}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                            selectedBookSubjectFilter === "all"
                              ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs font-black"
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          <span>üìö</span>
                          <span>All Books</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] ${
                            selectedBookSubjectFilter === "all" ? "bg-white/20 text-[#c4f500]" : "bg-zinc-200/60 text-zinc-600"
                          }`}>
                            {allBooks.length}
                          </span>
                        </button>

                        {/* Starred Books Pill */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookSubjectFilter(selectedBookSubjectFilter === "starred" ? "all" : "starred")}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                            selectedBookSubjectFilter === "starred"
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs font-black"
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${selectedBookSubjectFilter === "starred" ? "fill-white text-white" : "text-amber-500"}`} />
                          <span>Starred</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] ${
                            selectedBookSubjectFilter === "starred" ? "bg-white/20 text-white" : "bg-zinc-200/60 text-zinc-600"
                          }`}>
                            {Object.values(starredBookIds).filter(Boolean).length}
                          </span>
                        </button>

                        {[
                          { key: "Mathematics", label: "Math", icon: "üìê", count: bookSubjectCounts.Mathematics || 0 },
                          { key: "Physics", label: "Physics", icon: "‚ö°", count: bookSubjectCounts.Physics || 0 },
                          { key: "Chemistry", label: "Chemistry", icon: "üß™", count: bookSubjectCounts.Chemistry || 0 },
                          { key: "Biology", label: "Biology", icon: "üå±", count: bookSubjectCounts.Biology || 0 },
                          { key: "Science", label: "Science", icon: "üî¨", count: bookSubjectCounts.Science || 0 }
                        ]
                          .filter(s => s.count > 0 || s.key.toLowerCase() === (subject || "").toLowerCase())
                          .map((subj) => {
                            const isSelected = selectedBookSubjectFilter.toLowerCase() === subj.key.toLowerCase();
                            return (
                              <button
                                key={subj.key}
                                type="button"
                                onClick={() => setSelectedBookSubjectFilter(subj.key)}
                                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                                  isSelected
                                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs font-black"
                                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                                }`}
                              >
                                <span>{subj.icon}</span>
                                <span>{subj.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-md text-[9px] ${
                                  isSelected ? "bg-white/20 text-[#c4f500]" : "bg-zinc-200/60 text-zinc-600"
                                }`}>
                                  {subj.count}
                                </span>
                              </button>
                            );
                          })}
                      </>
                    ) : (
                      <>
                        {[
                          { key: "all", label: "All Slates", icon: "üì∏", count: snapshotSubjectCounts.all || 0 },
                          { key: "Mathematics", label: "Math", icon: "üìê", count: snapshotSubjectCounts.Mathematics || 0 },
                          { key: "Physics", label: "Physics", icon: "‚ö°", count: snapshotSubjectCounts.Physics || 0 },
                          { key: "Chemistry", label: "Chemistry", icon: "üß™", count: snapshotSubjectCounts.Chemistry || 0 },
                          { key: "Biology", label: "Biology", icon: "üå±", count: snapshotSubjectCounts.Biology || 0 },
                          { key: "Science", label: "Science", icon: "üî¨", count: snapshotSubjectCounts.Science || 0 },
                          { key: "General", label: "General", icon: "üìñ", count: snapshotSubjectCounts.General || 0 }
                        ]
                          .filter((tab) => tab.key === "all" || tab.count > 0 || tab.key.toLowerCase() === (subject || "").toLowerCase())
                          .map((tab) => {
                            const isSelected = selectedSnapshotSubjectFilter.toLowerCase() === tab.key.toLowerCase();
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setSelectedSnapshotSubjectFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                                  isSelected
                                    ? "bg-[#0a3641] text-white border-[#0a3641] shadow-xs font-black"
                                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                                }`}
                              >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-md text-[9px] ${
                                  isSelected ? "bg-white/20 text-[#c4f500]" : "bg-zinc-200/60 text-zinc-600"
                                }`}>
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                      </>
                    )}

                    {/* Reset Filters Quick Button */}
                    {((bookHubActiveTab === "books" && (selectedBookSubjectFilter !== "all" || archiveSearchQuery)) ||
                      (bookHubActiveTab === "slates" && (selectedSnapshotSubjectFilter !== "all" || snapshotSearchQuery))) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (bookHubActiveTab === "books") {
                            setSelectedBookSubjectFilter("all");
                            setArchiveSearchQuery("");
                          } else {
                            setSelectedSnapshotSubjectFilter("all");
                            setSnapshotSearchQuery("");
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl font-mono text-[10.5px] text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all shrink-0 cursor-pointer ml-auto"
                      >
                        ‚úï Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* ACTIVE VIEWPORT: CHAPTER BOOKS VS BOARD SLATES */}
                {bookHubActiveTab === "books" ? (
                  <div className="space-y-4 animate-fade-in">
                    {allBooks && allBooks.length > 0 ? (
                      filteredBooks.length === 0 ? (
                        <div className="border border-dashed border-zinc-200 rounded-3xl p-10 bg-zinc-50/60 text-center select-none space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center text-xl mx-auto shadow-2xs">
                            üìö
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-zinc-700">No matching lecture books found</p>
                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                              {archiveSearchQuery 
                                ? `No chapter books matched "${archiveSearchQuery}". Try clearing search or selecting a different subject filter.`
                                : "Try selecting a different subject tab to explore available board books."}
                            </p>
                          </div>
                          {(archiveSearchQuery || selectedBookSubjectFilter !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setArchiveSearchQuery("");
                                setSelectedBookSubjectFilter("all");
                              }}
                              className="mt-2 px-4 py-2 bg-[#0a3641] hover:bg-teal-800 text-white rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-xs"
                            >
                              Reset All Filters & Show All Books
                            </button>
                          )}
                        </div>
                      ) : booksViewMode === "grid" ? (
                        /* Modernized High-Craft Responsive Grid for Chapter Books */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pt-1">
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
                            const theme = getSubjectBookTheme(bookSubject);
                            const topicCount = sess.topics && sess.topics.length > 0 ? sess.topics.length : 1;
                            const isStarred = !!starredBookIds[sess.sessionId || sess.id || `book_${sess.index || idx}`];

                            // Extract preview topic snippets
                            const previewTopics = sess.topics && Array.isArray(sess.topics) && sess.topics.length > 0
                              ? sess.topics.slice(0, 2).map((t: string) => t.split("\n")[0]?.replace(/[#*_]/g, "").trim()).filter(Boolean)
                              : [];

                            return (
                              <div
                                key={sess.sessionId || sess.id || idx}
                                className="group relative border border-zinc-200/85 hover:border-teal-500/50 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                              >
                                {/* 3D Chalkboard Book Cover with Spine & Elevation Accent */}
                                <div
                                  onClick={() => setSelectedBookForReader(sess)}
                                  className={`relative aspect-[16/10] bg-gradient-to-br from-[#041d17] via-[#082e25] to-[#031713] p-4 pl-7 sm:pl-8 flex flex-col justify-between cursor-pointer overflow-hidden border-b border-zinc-100 group/cover select-none ${theme.pageEdge}`}
                                >
                                  {/* Left 3D Binder Spine & Ring Effect */}
                                  <div className="absolute left-0 top-0 bottom-0 w-5.5 sm:w-6 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col items-center justify-around py-3 z-20 border-r border-white/10 shadow-inner">
                                    <div className="w-2.5 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                    <div className="w-2.5 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                    <div className="w-2.5 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                    <div className="w-2.5 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                  </div>

                                  {/* Subject Accent Vertical Stripe on Spine */}
                                  <div className={`absolute left-5 sm:left-5.5 top-0 bottom-0 w-[2.5px] bg-gradient-to-b ${theme.gradientBar} opacity-90 z-20`} />

                                  {/* Subtle Grid & Radiant Glow */}
                                  <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_0.75px,transparent_0.75px)] [background-size:12px_12px] opacity-25 pointer-events-none" />
                                  <div 
                                    className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none blur-xl opacity-30 group-hover/cover:opacity-60 transition-opacity" 
                                    style={{ background: theme.glowColor }}
                                  />

                                  {/* Top Badges & Star Button */}
                                  <div className="relative z-10 flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-[#c4f500] text-[9px] font-mono font-black uppercase backdrop-blur-md border border-teal-500/40 shadow-xs">
                                        Book #{idx + 1}
                                      </span>
                                      {isYoutubeSess && (
                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-red-600/90 text-white font-mono flex items-center gap-1 shadow-2xs">
                                          <Youtube className="w-2.5 h-2.5" /> Video
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => toggleStarBook(sess.sessionId || sess.id || `book_${sess.index || idx}`, e)}
                                      className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-xs z-30 ${
                                        isStarred
                                          ? "bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105"
                                          : "bg-black/40 hover:bg-black/70 text-zinc-300 hover:text-white border-white/20"
                                      }`}
                                      title={isStarred ? "Starred in Book Hub" : "Mark as Favorite Book"}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-slate-950 text-slate-950" : ""}`} />
                                    </button>
                                  </div>

                                  {/* Title & Board Watermark in Chalk Cover */}
                                  <div className="relative z-10 space-y-1 my-auto">
                                    <div className="flex items-center gap-1.5 opacity-85">
                                      <span className="text-[8.5px] font-mono uppercase tracking-widest text-teal-300 font-bold">
                                        {theme.name} ‚Ä¢ Class Handbook
                                      </span>
                                    </div>
                                    <h4 className="text-xs sm:text-[13px] font-black text-white leading-snug line-clamp-2 drop-shadow-xs font-sans group-hover/cover:text-teal-200 transition-colors">
                                      {sess.processedTitle}
                                    </h4>
                                  </div>

                                  {/* Bottom slate meta */}
                                  <div className="relative z-10 flex items-center justify-between text-[8.5px] font-mono text-teal-200/80 pt-1.5 border-t border-white/10">
                                    <span className="truncate max-w-[120px]">{sess.formattedDateTime}</span>
                                    <span className="font-bold text-[#c4f500] px-1.5 py-0.5 rounded-md bg-white/10">
                                      {topicCount} {topicCount === 1 ? "Chapter" : "Chapters"}
                                    </span>
                                  </div>

                                  {/* Hover overlay with Quick Read button */}
                                  <div className="absolute inset-0 bg-[#061f19]/80 opacity-0 group-hover/cover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-[3px] z-30">
                                    <span className="px-3.5 py-2 bg-white text-[#0a3641] rounded-2xl shadow-xl text-xs font-black flex items-center gap-1.5 transform translate-y-2 group-hover/cover:translate-y-0 transition-transform">
                                      <BookOpen className="w-3.5 h-3.5 text-teal-700 stroke-[2.5]" /> Open Handbook
                                    </span>
                                  </div>
                                </div>

                                {/* Body with Topic Badges & Action Buttons */}
                                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-3 bg-gradient-to-b from-white to-zinc-50/50">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[9.5px] font-mono">
                                      <span className={`font-black px-2 py-0.5 rounded-lg border text-[8.5px] flex items-center gap-1 ${theme.badgeBg}`}>
                                        <span>{theme.icon}</span>
                                        <span>{bookSubject}</span>
                                      </span>
                                      <span className="text-zinc-600 font-bold bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/70">
                                        Lesson #{sess.index}
                                      </span>
                                    </div>

                                    <h5 
                                      onClick={() => setSelectedBookForReader(sess)}
                                      className="text-xs font-bold text-[#0a3641] line-clamp-1 cursor-pointer hover:text-teal-700 transition-colors pt-0.5"
                                      title={sess.processedTitle}
                                    >
                                      {sess.processedTitle}
                                    </h5>

                                    {/* Preview Topic Chips */}
                                    {previewTopics.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                        {previewTopics.map((top: string, tIdx: number) => (
                                          <span 
                                            key={tIdx} 
                                            className="text-[9px] font-mono text-zinc-500 bg-zinc-100/90 border border-zinc-200/70 px-1.5 py-0.5 rounded-md truncate max-w-[130px]"
                                            title={top}
                                          >
                                            ‚Ä¢ {top}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Dual Action Buttons */}
                                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-zinc-150">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBookForReader(sess)}
                                      className="py-2 px-2 rounded-xl text-[10.5px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 bg-[#0a3641] hover:bg-teal-900 text-white cursor-pointer active:scale-95 shadow-2xs font-mono"
                                      title="Open Full Chalkboard Handbook"
                                    >
                                      <BookOpen className="w-3.5 h-3.5 text-teal-300 shrink-0 stroke-[2.5]" />
                                      <span className="truncate">Read Book</span>
                                    </button>

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
                                      className={`py-2 px-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-mono ${
                                        hasContent
                                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white active:scale-95 shadow-amber-500/20"
                                          : "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                                      }`}
                                      title={hasContent ? "Launch AI Flashcards & Mind Map" : "No notes available"}
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                                      <span className="truncate">Revise</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Modern Carousel View Mode */
                        <div className="space-y-3">
                          {/* Horizontal Scrolling Book Shelf */}
                          <div 
                            ref={booksScrollContainerRef}
                            className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-teal-700/30 scrollbar-track-zinc-100/60 px-1"
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
                              const theme = getSubjectBookTheme(bookSubject);
                              const topicCount = sess.topics && sess.topics.length > 0 ? sess.topics.length : 1;
                              const isStarred = !!starredBookIds[sess.sessionId || sess.id || `book_${sess.index || idx}`];

                              return (
                                <div
                                  key={sess.sessionId || sess.id || idx}
                                  className="w-[92vw] sm:w-[540px] md:w-[620px] lg:w-[680px] shrink-0 snap-center rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col md:flex-row group"
                                >
                                  {/* Left: 3D Chalkboard Book Cover */}
                                  <div 
                                    onClick={() => setSelectedBookForReader(sess)}
                                    className={`relative w-full md:w-5/12 aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-gradient-to-br from-[#041d17] via-[#082e25] to-[#031713] p-5 pl-8 sm:pl-9 flex flex-col justify-between cursor-pointer overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100 group/cover shrink-0 select-none ${theme.pageEdge}`}
                                  >
                                    {/* Left 3D Binder Spine & Ring Effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-7 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col items-center justify-around py-4 z-20 border-r border-white/10 shadow-inner">
                                      <div className="w-3 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                      <div className="w-3 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                      <div className="w-3 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                      <div className="w-3 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                      <div className="w-3 h-0.5 bg-white/40 rounded-full shadow-2xs" />
                                    </div>

                                    {/* Subject Accent Vertical Stripe */}
                                    <div className={`absolute left-5.5 sm:left-6.5 top-0 bottom-0 w-[3px] bg-gradient-to-b ${theme.gradientBar} opacity-90 z-20`} />

                                    {/* Dot Grid Pattern & Radial Glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_0.75px,transparent_0.75px)] [background-size:12px_12px] opacity-25 pointer-events-none" />
                                    <div 
                                      className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none blur-2xl opacity-30 group-hover/cover:opacity-60 transition-opacity" 
                                      style={{ background: theme.glowColor }}
                                    />

                                    {/* Top Badges */}
                                    <div className="relative z-10 flex items-center justify-between gap-2">
                                      <span className="px-2.5 py-1 rounded-lg bg-black/60 text-[#c4f500] text-[9.5px] font-mono font-black uppercase backdrop-blur-md border border-teal-500/40 shadow-xs">
                                        Book #{idx + 1}
                                      </span>
                                      {isYoutubeSess && (
                                        <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600/90 text-white font-mono flex items-center gap-1 shadow-2xs">
                                          <Youtube className="w-2.5 h-2.5" /> Video
                                        </span>
                                      )}
                                    </div>

                                    {/* Cover Title */}
                                    <div className="relative z-10 space-y-1.5 my-auto">
                                      <span className="text-[9px] font-mono uppercase tracking-widest text-teal-300 font-bold">
                                        {theme.name} ‚Ä¢ Class Handbook
                                      </span>
                                      <h4 className="text-sm sm:text-base font-black text-white leading-snug line-clamp-3 drop-shadow-xs font-sans group-hover/cover:text-teal-200 transition-colors">
                                        {sess.processedTitle}
                                      </h4>
                                    </div>

                                    {/* Bottom meta */}
                                    <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-teal-200/80 pt-2 border-t border-white/10">
                                      <span className="truncate max-w-[130px]">{sess.formattedDateTime}</span>
                                      <span className="font-bold text-[#c4f500] px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
                                        {topicCount} Chapters
                                      </span>
                                    </div>

                                    {/* Hover overlay with Quick Read button */}
                                    <div className="absolute inset-0 bg-[#061f19]/80 opacity-0 group-hover/cover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-[3px] z-30">
                                      <span className="px-4 py-2 bg-white text-[#0a3641] rounded-2xl shadow-xl text-xs font-black flex items-center gap-2 transform translate-y-2 group-hover/cover:translate-y-0 transition-transform">
                                        <BookOpen className="w-4 h-4 text-teal-700 stroke-[2.5]" /> Open Handbook
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Book Meta, Topic Directory & Direct Action Drawer */}
                                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-white via-[#fcfdfe] to-zinc-50/50">
                                    <div className="space-y-2.5">
                                      {/* Header: Subject, Grade & Star Button */}
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${theme.badgeBg}`}>
                                            <span>{theme.icon}</span>
                                            <span>{bookSubject}</span>
                                          </span>
                                          <span className="text-[9px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs">
                                            Lesson #{sess.index}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={(e) => toggleStarBook(sess.sessionId || sess.id || `book_${sess.index || idx}`, e)}
                                          className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                                            isStarred
                                              ? "bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105"
                                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 border-zinc-200"
                                          }`}
                                          title={isStarred ? "Starred Book" : "Star this Book"}
                                        >
                                          <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-slate-950 text-slate-950" : ""}`} />
                                        </button>
                                      </div>

                                      {/* Book Title */}
                                      <h5 
                                        onClick={() => setSelectedBookForReader(sess)}
                                        className="text-sm sm:text-base font-black text-[#0a3641] font-sans leading-snug cursor-pointer hover:text-teal-700 transition-colors"
                                        title={sess.processedTitle}
                                      >
                                        {sess.processedTitle}
                                      </h5>

                                      {/* Chapters Directory Preview */}
                                      <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                          <span className="font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1">
                                            <ListOrdered className="w-3 h-3 text-teal-700" />
                                            <span>Chapter Index ({topicCount})</span>
                                          </span>
                                          <span>{sess.formattedDateTime}</span>
                                        </div>

                                        {sess.topics && Array.isArray(sess.topics) && sess.topics.length > 0 ? (
                                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200">
                                            {sess.topics.slice(0, 4).map((top: string, tIdx: number) => {
                                              const cleanTitle = top.split("\n")[0]?.replace(/[#*_]/g, "").trim() || `Chapter ${tIdx + 1}`;
                                              return (
                                                <div 
                                                  key={tIdx}
                                                  className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 bg-zinc-50 hover:bg-teal-50/50 p-1.5 rounded-lg border border-zinc-200/60 transition-colors"
                                                >
                                                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                                                    {tIdx + 1}
                                                  </span>
                                                  <span className="truncate">{cleanTitle}</span>
                                                </div>
                                              );
                                            })}
                                            {sess.topics.length > 4 && (
                                              <p className="text-[9.5px] font-mono text-teal-700 font-bold pl-1 pt-0.5">
                                                +{sess.topics.length - 4} more chapters in handbook...
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-[11px] text-zinc-400 italic">
                                            Full interactive chalkboard notes & step-by-step whiteboard derivations.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons: Read Book & AI Smart Revision */}
                                    <div className="pt-3 border-t border-zinc-150 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedBookForReader(sess)}
                                        className="flex-1 py-2.5 px-4 bg-[#0a3641] hover:bg-teal-900 active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                        title="Open Full Chalkboard Handbook"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 text-teal-300 stroke-[2.5]" />
                                        <span>Read Handbook</span>
                                      </button>

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
                                        className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                                          hasContent
                                            ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white active:scale-[0.98] shadow-amber-500/20"
                                            : "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                                        }`}
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                        <span>AI Revision</span>
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
                                      const cardWidth = booksScrollContainerRef.current.firstElementChild?.clientWidth || 500;
                                      booksScrollContainerRef.current.scrollTo({
                                        left: dotIdx * (cardWidth + 24),
                                        behavior: "smooth",
                                      });
                                    }
                                  }}
                                  className={`rounded-full transition-all cursor-pointer ${
                                    Math.round(currentBookHorizontalIndex) === dotIdx
                                      ? "w-7 h-2 bg-[#0a3641]"
                                      : "w-2 h-2 bg-zinc-300 hover:bg-zinc-400"
                                  }`}
                                  title={`Jump to Book ${dotIdx + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                  ) : (
                    <div className="border border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 text-center select-none space-y-2">
                      <p className="text-xs font-black text-zinc-500">Archive Locker Empty</p>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Once you conduct or complete live classrooms with Cherry Ma'am, your completed board-books will compile and archive here automatically under secure token sync.
                      </p>
                    </div>
                  )}
                </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {allSnapshots && allSnapshots.length > 0 ? (
                  filteredSnapshots.length === 0 ? (
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
                      ) : snapshotsViewMode === "grid" ? (
                        /* Modern Responsive Grid View for Board Slates */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                          {filteredSnapshots.map((snap, idx) => {
                            const snapSubject = snap.subject || inferSnapshotSubject(snap);
                            return (
                              <div
                                key={snap.id || snap.snapshotId || idx}
                                className="group border border-zinc-200/90 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5"
                              >
                                {/* Thumbnail Frame */}
                                <div
                                  onClick={() => setSelectedSnapshotForModal(snap)}
                                  className="relative aspect-[16/10] bg-[#071f18] overflow-hidden cursor-pointer flex items-center justify-center border-b border-zinc-100 group/slate select-none"
                                >
                                  {snap.imgData ? (
                                    <img 
                                      src={snap.imgData} 
                                      alt={snap.topicTitle} 
                                      className="w-full h-full object-cover group-hover/slate:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="text-center p-3 text-zinc-400 font-mono text-xs">
                                      Blackboard Slate
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-[#0a3641]/50 opacity-0 group-hover/slate:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                                    <span className="px-3 py-1.5 bg-white text-[#0a3641] rounded-xl shadow-md text-xs font-black flex items-center gap-1.5">
                                      <ZoomIn className="w-3.5 h-3.5 text-teal-700" /> Inspect
                                    </span>
                                  </div>
                                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-[#07242b]/90 text-[#c4f500] text-[9px] font-mono font-black uppercase backdrop-blur-xs border border-teal-500/30 shadow-xs">
                                    Slate #{idx + 1}
                                  </span>
                                </div>

                                {/* Body */}
                                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-3 bg-gradient-to-b from-white to-zinc-50/50">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/70">
                                        {snapSubject}
                                      </span>
                                      <span className="text-[8.5px] font-mono text-zinc-400">
                                        {formatDate(snap.timestamp)}
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-black text-[#0a3641] font-sans leading-snug line-clamp-1 pt-0.5">
                                      {snap.topicTitle || "Classroom Board Snapshot"}
                                    </h5>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                      {snap.description || "Auto-saved blackboard derivation, formulas & step-by-step calculations."}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="pt-2 border-t border-zinc-150 flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadImage(snap)}
                                      className="flex-1 py-1.5 px-2.5 bg-[#0a3641] hover:bg-teal-900 text-white rounded-xl text-[10.5px] font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                                      title="Download high-definition blackboard JPG"
                                    >
                                      <Download className="w-3 h-3 stroke-[2.5] text-teal-300" />
                                      <span>Download</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSnapshotForModal(snap)}
                                      className="p-1.5 bg-zinc-50 hover:bg-teal-50 text-zinc-600 hover:text-teal-800 rounded-xl border border-zinc-200 cursor-pointer shadow-2xs"
                                      title="Zoom in Fullscreen"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSnapshot(snap.id || snap.snapshotId)}
                                      className="p-1.5 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl border border-zinc-200 cursor-pointer shadow-2xs"
                                      title="Delete snapshot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Carousel View for Board Slates */
                        <div className="space-y-3">
                          <div 
                            ref={snapshotScrollContainerRef}
                            className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-teal-700/30 scrollbar-track-zinc-100/60 px-1"
                          >
                            {filteredSnapshots.map((snap, idx) => {
                              const snapSubject = snap.subject || inferSnapshotSubject(snap);
                              return (
                                <div
                                  key={snap.id || snap.snapshotId || idx}
                                  className="w-[92vw] sm:w-[560px] md:w-[640px] lg:w-[720px] shrink-0 snap-center rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col md:flex-row group"
                                >
                                  {/* Left: High-Definition Widescreen Blackboard Slate */}
                                  <div 
                                    onClick={() => setSelectedSnapshotForModal(snap)}
                                    className="relative w-full md:w-3/5 lg:w-2/3 h-56 sm:h-64 md:h-76 bg-[#071f18] overflow-hidden cursor-pointer flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-100 shrink-0 group/slate select-none"
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

                                  {/* Right: Topic Details, Subject & Direct Actions */}
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
                                          <span>{snapSubject === "Mathematics" ? "üìê" : snapSubject === "Physics" ? "‚ö°" : snapSubject === "Chemistry" ? "üß™" : snapSubject === "Biology" ? "üå±" : "üî¨"}</span>
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

                                    {/* Action Buttons */}
                                    <div className="pt-3.5 border-t border-zinc-150 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadImage(snap)}
                                        className="flex-1 py-2.5 px-3.5 bg-[#0a3641] hover:bg-teal-900 active:scale-[0.98] text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                        title="Download high-definition blackboard image"
                                      >
                                        <Download className="w-3.5 h-3.5 stroke-[2.5] text-teal-300" />
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
                                        <Trash2 className="w-4 h-4 stroke-[2]" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick Jump Slide Dots */}
                          {filteredSnapshots.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                              {filteredSnapshots.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={() => {
                                    if (snapshotScrollContainerRef.current) {
                                      const cardWidth = snapshotScrollContainerRef.current.clientWidth;
                                      snapshotScrollContainerRef.current.scrollTo({
                                        left: dotIdx * cardWidth,
                                        behavior: "smooth",
                                      });
                                      setCurrentSnapshotHorizontalIndex(dotIdx);
                                    }
                                  }}
                                  className={`rounded-full transition-all cursor-pointer ${
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
                      )
                  ) : (
                    <div className="border border-dashed border-teal-200/80 rounded-2xl p-8 bg-teal-50/25 text-center select-none space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100/70 text-teal-800 flex items-center justify-center mx-auto text-xl font-bold shadow-inner">
                        üì∏
                      </div>
                      <p className="text-xs font-black text-[#0a3641]">Automatic Blackboard Capture is Active</p>
                      <p className="text-[10.5px] text-[#486a73] max-w-md mx-auto leading-relaxed">
               xúÏ=]o‹»ëÔ˜+⁄ìΩÕ(ÎiF´ùX2dŸ^ÎbŸZçwìúaƒ≤gÜ1á‰í}ÏD¿=ÂÈê≤@9lÓÄCrOy∏√!ø«‡ˆ'\UwÛ£…&ŸçlØ≥v≠!˚≥∫™∫™∫™öÒ¸tJ]zFr8•ApIéç3rÿ…ÿfs«oÀ6&Å1ÉøºÄòS√ù¿ÁëcòØFûX$Ú|€â5lwB.Ωy@˚åjá™MÌ…¥c—±Ì⁄ëÌπ$t?úzQHŒm«!∆<ÚfFdõÜ„\íT4¸hPã.¸Á˚‘åê‚òàÌÜë·FƒÚŒ]«3¨.y‚ëô·ŒáåÊQ‰π!q)µ®uÎÔàÚπ≥ÓÔ+?›Y∑Ï3’ßµ´¬KEY©TÓ{Ú-Û^¸ôîY¨ˇàúLçêí≠y:€¶sFsã¬|O©Ô9Dà{|˘—z⁄·Qåó¬B¨Lf@v¯‘ßÓﬁ¬seuv‰û{Ëx!›[¥◊»ﬁ>	it§™“NH•9[FdÏ-PB>Æ'∆å≤?»Ø~EZCsÍ9F–∫-Ud≥†0˚á;DD"Ωçhö+ŒGø§f4àˇ`•èçhJ>Öπ‚]¸ﬁΩ·É\ôµÏ˘ÏÈ¯1 ù¯<(ºa5¡éÊyë·iöááﬁ‹Ö±˘F≈ØÓvÍN¢)∂Q,ão7T∆Ù"ZLË'€\;‰MU7÷Õ~6∑ø˙ä∆ç~	ø¢àŒ¸\’|`64∏ö^ kÑ∞Ó–Ä’ŒQH€2¬)ÉÙ02¢∞kzÆI˝ñÿÀ%˘®@PπÚ∞Ü–c
áG}(høBsP”FX‘◊\Óî"Û©/zfÄòøf∂k¨ëu≤-Û ZÚ¨Ö1KüsK$†P7˜=◊Ø≈ﬁÖ‰f$ËÍK_sÑ)√©P5˜=W9
ˆÖ≈jÒDÃÁ/Úl√;WUÔUU`÷¿éêLsÊ•L‰√•ﬂ1YÏìç¶‹ÕíÇTˆ±πI€m√4oì/KÖ?…G§˝e◊Ω
Öˇ °ÆÂzê›Ì<ÃÊ÷Â¿cº∫o\ÜÇ2g∆Eªwõ¥ÀXPo∆—_À%†@—C@Jé^åA$Ô∏€•˜ÅŸﬂÌöŸ2
vëT:f|ÉZUçÕ≤e
ç]…õ‘};4Áa¯S;örÒeo°xô÷YWÓ¥€Ú€rpD£–ÚÖgõ6]@O:π$LHê<ª.´ãıXµÚ-óïKÀËlπä*ä-7≥£Ó- ∂◊l∂´Ó-äõ´Täëœﬁ"∑SJÛ:-Ÿz≥ÖÔúÜ—1ç€‹[daµqôt–äâ∞uõÑ|ŸŸæMlyWÎ€o~Ûóñå>ê¿DÔ+DèÔôÔ;Õ|≥2à∂¯!täCoÊ;¿B¨rÒ*W1ëôÜ∆VS Pπ:YDHøJ¯íö«l»#‘Äcë#∑s‡˚‰Ë6#œ{Öfj8Bï:•@ñJNs‰B≠{PÅ)c5∑nØr§ñ}Ëº∏L€ﬁ+ €∫bEû4TUiªs«Yì+‚PNÈ√È˚‘Ñﬁòp ⁄)êh¡òSjaI≤`åF^`Lhwúp¢˝2Õ˝¬ÇRø¯`ÅÌuÖƒ{ƒX{cªΩ∏zπˆc©{L⁄ikπ1 &ÇÓõèÕ7Ç4—=Ú√ßO∫ÏW∂≠óTÉÖˇ¬plÎFtl¯P_4ˇ´;ü‡ÕAó];dˇ∂ÂÔ]◊≥(¿ÆPë»à$≈±‡ƒs#)ŒPÍ-áÊ◊ç≠⁄m—≠b™l{ünÒK^_æÇ5éÃ)iˇ˙ó? ø¯@>•.≈∏0i+Ü3#@5õwI:π êfÑí¡”38∆•Ç8ºD\Up#\±¨Vt¥}Œøÿn›€Ä6QgÉå&ùÁ?ÿÿÈÌˆF/÷?Ÿ&cá^p?Ï†å
L·óÛ0≤«óÒœØ:€ƒáö3k‡w∂à·⁄∞Û“Œ®≤cªÑx«ı\⁄íÌ4õÄ˛öLı.…ko˘±Ú—ç˙ª}Î0ê ø”èˇà®·¿`6÷77Ä©’Ÿºp`p=ùq—9ÔÃ,rﬁß Ωà‚)ÑS√ÚŒ;}(˙ÜI;óù>q¸_«Ù≥ãŒV´hü…6†∏ØûÂß≠.|ﬁÈÌê)˛/:¶ò⁄Vaé˝ç‰πµ±ë¿>Ùm∑Öà•ËwdÙ °°‹9ˆΩ√ÅbÃFÿ#67
=g—9f¥ë%›¯sï˝îX∞Úìé°Ω©—t3[òÓÇn‘ôyÆ¸“0_uŒm‡@ˇ¬ÇdÓÉPf‚Æ'œIŸÜ«Ü)Ÿ=6F™!≠O7’C›*uÑΩ≥!¡Ø¿yé≈s>l*»“ô.¥øB⁄“–
8gÉƒ›Ìv’C⁄“A0÷µCaÁÁD¥›˚∏gƒD$°◊'å†∑DÃêEüœ‡yØÁ_º»Ææeï7Ka|«ó∏NÅØLø”/©µana>1Ê∑ˆ_ˇ·Î;ÎXfü	/>V8ºW#:(pîÿ[À±oj»Æ·\≤5M“1®$±Â˚≥ÿq–@3hˆöZˇÌè9√∆$vµˇ˙õˇéßÄ‚ªÌ‡∆P{j¢Ëp wM&Qj≥óÁ3±¨=`Ê;ƒ·H€¡M˜cF[°·ÜbÁÇ:∞Ì ˚≠da‚ÏƒâP‡Ùå`√"∞32D2›êùmàÖ√5D°ÜËë)u|<H÷VPG°a!Ì˛0.j¶§ íD™ÛÇvôT‚BùZW6Ôéç±ô»L*ëY\Ë .ÙÍªÏkVR≤á¯«b*^XÉiÁ˘'[g”9π¿alYgj[u≥¢Dº˝„6ÂÜÏƒ©ò•Xæ¬qÃß{“!ßÜ¨»ó‘h∑j∏&zÛ¿§˜kBA Öfòæ8r«^[)<VH€Ö)]4Ú WÎD^' „¿õ·dı≠>l@g∂øzΩMcÛ„ÄR¯…Ï”~∫à£¯:v¨Œ.ó“Õî¯ ë˜ßp6Ä;Ï_,∫UÏàFÁî-–…´NŸ∆Uµó∆c	êfÉ£FØ¥)Ö¸≠fwº°Û¿+⁄R0?Äw ˙ÿ@9∆„ÆŒ7Ô›Óv≤{si)/H•“¿p` Ì'Ú —	öáïÉ#‰€o˛ÙG2<>8}FN|q4<z˙§j2ú/Wî®¯ÑDssÇ9é€Ñcªä^Ú ¨úD
›≈K¬O2 d&äx*Ñ\fÇ©óªeS†írÌé&Ã8zı≤jÑDv‰†ı5SV”lyOU›Í5d⁄ó⁄E[ËU˝j)Î:∆à:ï„Mêøvu$A~Óö@$Êﬁ≥ÅÌÇ<P&ù«èZ—ÓfL–‚œ+Ú˙ü˛Ép”6∑uW¢bLJeÒY≠/¡§8ò·>ñSMb˙pHd®îhÃPKºw2€.gó ÚœÑ?©ıëµeäV-49xŒúˇ∆ªô9¬'Á;˜ÖàPŸN®O<t_©b>w∏üH—¯i£·í€£\†˚Îª®¬%yG`ª‰zoÉLQ`$o+Bº≈&Ø324R
Ø'Ô∏Òf+ÿ]/√ÓbLyﬁ€@JåQP“ﬁÀˆüR/v$ÀT ‚°t|œŒt†;éÖÉdz‹[„Ï≥ï,Â±ºBÁû‚öû€—4—Œ∏ ç¢ty„ïl.ÈP2»†‰2≈ˇóÿqíÍy(XmÃ 8÷±◊≥éìló( iDdù‡!ú‹∏*LÁr,«˜4¬f‹n˘÷∏•pÇJüï†=„o˝ø)¨ÁÍ|Eq9≠c8•4Z∑Y≥0¥õBm÷˛:wEx=ºtMÚvBÇcÛ˘:Ä¢3'‰kÊ&ê]yÿ†V ™(¿≤Cc‰Pk/o^ˇûlíM ÅZû]¢ÃSOJÄ-!¢ë√—(±BÆ[û9ü°•Àv‹7Çf°≈iI2;•„ÄÜ”√sIU…P(≈√ññ|\0 ≠®À—dFrFZ9
*™“Ãr“;'ŒRœJ0>ã∆⁄Úc§J‘‚≠^ƒtMfûL§J¨ı(≈f&	.â)?ìYÒ†«.ﬁyáIæ”N5SN◊≠Ï{©h^Ó‘¨8∂]kèSö≈≤'°B0º	`HÜÛh6.êó–6;ëã¬¬Æ;B◊4&÷-gF„F”ΩÇÅÚn7cSe^&*ÀoÉyú@¨∞88//-{£ÌëßL≥ÏûŒúÜÌ‰+∂µ÷€¸lﬂÛ<áÓZm„S®¶nw Ã˚i≥¬˛∑∑GZX≥Uﬂ˜Z^Æ^W£jÑóÀuÅ55:MlöØ€>Ÿê›,€Ú
≠Ûrk‰G§∑±Å∆Ïç´ÿ\S+™0„ml‡±|ﬁ4 ?Ó[IL°\óe∆PŸfÚ˚;Œ´Ì¢∏n¶zpÜñÍßìßÄ$#cDûgˆÑ±æ
…I_GOL£ygòp¸&å–ç‚<1‡üWû∞Ók≈∂Ë“«•`≈™∏vNºit âqœåQªï≤]çfÒsS!=ÂŒac¡âº‰™¶•R—*fò>F~jú∞2”´¨é.Àï6k1êôïïπà÷€®Tmêîtv˘ôO¶˝‘≤ë˙ò*à∞™C$([’ïΩ∂V∆⁄ˇˆõﬂ¸èÜëîxòn=Ì„>Wk´¡ﬁE‡—„ÃﬂKràÁ¶Eâ?œ˜§ H·O‘%ÖC·ÉÄ&#ÿ§˝ÔÑÛŸÃ.ﬂK2àÁ¶E∞Çˆƒ˚ûâ	·ÎﬂÎ¬êÉö|∏2√Ô¶Ùƒ/âÄMLãbááÔIÄdƒ¢øËíÄà¶<aˆìÍì@Ÿw9NZ~P›˘lXMxàY∆0Ò!ÛK<ßÍ8PO˚Ÿ,h4≠æƒØ®këÇ-µÍ(≥^òœ{ì/7ç™ÛT÷äÚ`ˇ+€5SZ‡N®≠}ÓÅñ;B¡Î∫/Ã_õ}í•Ÿ 7ÌÙû^%òœÿHÕÏ¯8jä‰Mî
'™ò=l#HºTlú*mìâÒq;7Ω:fÅ¡XóËY≤ Á∂M‰ÂﬂåÆ˛˛•˚†z*≠…µ.¨Hrﬁ9Õ1F>B7ì ®ÏêIU]ÉEOâeàÜRãqµõ7t∑p˛‰,√È|@H’—:Ïêêúù·.Sbq'")7P˙&ƒ»ÌLJ©4>pûB%gHπç?Á»YKnΩP!µM"uãâa¢Q˘dO{jNUE}çsﬁÉ[≠ﬂ;ìroO)Hîb[¯Ÿë$ $NôA∏”˛*êPuÓ∏j4dc_%ﬁ©WÖ¬QπS‹¸…◊±aªwÊ‰ÍF‰õû3œïP©⁄õ ü)ÊíèÈπÇ˙¡#É¬âÅdSWnfäW8Êg˜Ho@>>>:<8Ω?,ÄØµÊß ù≥˛¸<p¢*§Ø D€ng⁄yæµÀ\êUbáÜ¸Y≈—a∂%›D˛`Ù≠®0›PGﬁ∆OÂ©T¸TùN)^V¢Ó≥êÃ])SÔSœSÅ•’qÇ“»‘·çª¿ëvÛ‚bOSœ®rÒI≤¸)¬˘ûxôû ©≤`\„“∞ß≤Ñ ÷⁄óÛ°aé≤ƒ[$¡≤S‰" 3ÃS Wn’v^+Å+C@¯S!îü¨0K&–ıπxó ÎcÂ_ ‚ÛÔµËœj±”Êª6ãæFÚ‘VˆQ1ﬁÆ∆Ÿa†Ì[∑§£ıÁº”˙±Òû˘ô≥ò≥8Ä÷m3IPáÈú∞øüMA’+ùTis¥\Tà«¨‡î’ºê?,◊ìoÃC≤Œ≤◊`Ì{Ü:~IwLïL[!,ÒÔÍ9Hç∫ôhŸÒAÏú¿óÒm+ˇX4∏’xœÛè 9 µ'ëﬁFàâ3øZÒHGà“∞\\ﬂæÉœB&ïZWÙü[f˘Ì+¬m≤.ÖÈ¶ëM5∂€¯…—s‚3í≥–&—UÒãÕ¬NAÛ(,€πâëNÕìŒS}πk˛æA«ÿv‡Öô®1ˆ´ÿ2{]cçü´óWıXÅüÔ á!ıöú.äWJ˘ÒSØªh™≤MïŸ¬ÒH‰M&eI/π◊Êâ∆$rg$“ÈH ú™ùÀT”B& F`ödïŸjµ ‹D1*≤oq&´€zˆ@‰IøﬂJ[Nï˜º¬Øâ˛:∏¬É¯2πã˘ÃÇWòÜ6$Ò[ÊÆãØ•óıË‡ÿµ	qdObylcKÛ6ÿ4›ÜûWq“3èÃO>?Âtæ∫ÙÆmû“0GWûÒÂüÕ˚†ÿ>ﬂøQeıΩ$x[j˜◊öQèOè¬D2¿N}jµ}P3ÒÎ-¸£ñU≈-°oˆcß¸¯≈{°P˘“L<ä3√qÓ‰ìÙòmP”‘∂áX»´¥àÂ=¨ã¡¯˘cú	¬ó¸+!Uá@∏Ú˜Û’ÑÕ√@Åú	›Ä˙ç˘ß¯Om±ë<êñ-I÷”â<èµ:vÖùwv–—{g+ó[»ôˆqx∞T÷=V2Ä46:&ßE£áû„°Ÿ`?Ô’:;“ 7#0ë-AÆïÚ´ 6¡lï√ÌH√.±J¡Y+f=~r÷ÌºÜ¢îÛ7ô\JrËM‚°≥˝i‡≈„√ÔMnÉ\x˝√˙k1=sëµ`ÏÛƒX˛€Ï{ñ‡ÑÁEõä-”ÿfı%—“ veä•X"—¬ò§]ÿpGE7"r‡ÜÁ∞ÜÎdàlàõÌØØˇÌkÚŸúÜè|;	ºëCg+ù±ŒZóç
∏pvﬁ…àg©xòacø¬2…VèOYTœÚGâ√"nÂÑYßÌZo≈ÜzÁ!:êNxË=œ∫\ÇÉ∆FZ‡+[Y£Æé	‡ñAµÏ %©‰ÍLSeı”ºq¸!ËGqæÑÿë,gÙÕ'm“Ï:«ËëS
8¿‡X~û≥'±§q‡Ò‹”Ÿó_∆î…Y˜tΩü\h—“≥µ‰‹¯iŒMEdºÆEáç'∑¸ˆh#kh˚8oÄ`_>ñÂI'ìÑ@πå"F ?ƒ&fc‹òˆÍ-!áÉˆ¢4Zñ*øîÏ#çhäAﬁ∞,·‘;OËÓëxπÏZeÕP∏
*””nqÅÄUft?^õ¢˘ñÂY em∞Pﬂ~ÛªV"ß;Ÿ«π¢£ˇUéŒ>«`–h°V÷ì]ã9¶Ωõ˙âô‰(I±…∂‡ﬁF!ì›*ô"
éyûhp99‚}
J∂[H(Dö|rªÄ°áwßt≥ Êƒˆä^>º>'åìuö=™L÷…4†•|0}åﬂƒˇ≥n0jõ∫|,R™-ÃF(Z˝Ñ^ñDƒSè)»ﬂ!¶Ø®qn\Ü≈€ b,≈∂ÚK&«ˆ5Q*ı¸.l®©ë3áVi™;)âeÏu3hïÀ
Û€3Ú,RC¨R/Uwf¯Ì6^qƒŒìo€∫wé£a67]ÿ'”‘‹[@+W%6 Æ™„/™Ë@;ikÛf˜ë∂ï5SµŸ"¨imí^È∆[∂⁄H’zËySæ„√O¬§0ç0Å§√<Qã=AaüäÄéuÕ\i“…‘ L·i7å<ˇ$|Ér∑◊4NÛﬁÿ^ëjö¿Ò—≥¬§LIih–ÛÂ¨ü§ñ·1yGsg¥\é•§ëß±†‹≈;Ê, ìYàûP<âbøAS¥∂Ã!LΩa@a–uXâS~2MÕP≥ ÷[·Àäû[‚"ù&LUüåiJJ¯(3R·pë]âÛÊ€q“]f]b{N|∏RòxW≥óªYáÉ~©√Aˆª,]J◊t†∆Gw˚ˆõo˛ì<BˆﬁÓÂoJS?∫«í¢ÙªÇq^ñÎ„Å0‰!±‰-%^-Ô&.¸ô38ëvˇΩ∆ûBÁ˙∏ê∏RÂ∞!ìı[v±*bD∆≈Í›ƒâˇ" Z§ΩπzåX±$´Q§÷"Ÿ¬…=/¬+2iÄn‘îG Ç‡´·Óy≥IuëÈ√.SzyÓ◊˘Ïßè⁄Ñ_◊XÓvúk°(H7l‡P5çDgˇvHO´Ωz∂¢q&ú¶ƒTòÖE4«uÅbÖíõR"-ÕTU¡∆Z9Ún2Ò®D1◊ãΩwN-˝S}âˇpJœœ}å&¸b‚A˝±˝öÒÊµi,D]M„çPˇ*¸≥Úÿ∑ù`_^M^•«]IÄó∂1èèe—*MJ— 1>:±ÜÍÛˆFzn‚_®Úä@∂ó¯>0U˜îûQ√â=%⁄C4ÄjÎªÔ^o∫#"Œêkøo;—GÔ⁄NîÄ˙˚Èv$F∫O`:⁄V+±áù2«Õ•61›∏d=©˙'Ùí_“NΩ 2ÁQ»ÓÈ“ı-n`…⁄.]O&\◊;Jqhø˛Á?ˇﬂ_KÜÒp5M_ºr|rˇ¸ıØˇÖ¨ì◊ø˛›ãÙ¸^Ë∫9
‰;á&‡¨2ç>‘ˆ√ 5¯(”2´•È≠˜◊73ùjNØVm´ÀsR∆yDz£’«§q<x@ü>9|pÚå=πOéNFÖ«…ıC¬•ã›v.“êz∑1z/í	ígûÁå*5◊•B£≥'≠Ë≠~≠|ΩM¸ﬂE÷$°Æ~,e”z˝ô—AXÉ;ËHL˙“RQZ◊ç∞·¥[‹πŒ¬ïèH,≠é∂™çüöe«…A0õ<T‹Ç,{Ç‰ÆnÂ≥¿’=UC±:∫©öwÒ gÚhÆ∫r7~t6—7ã2Ô0^Ò}w—bà]ê˚F†æàï?ıhQ'W±<Â‘Ã)˘ê<d)‚´Øw—‰ô•â˙®[ÌWvè∏∏Zí∑∏µ[óBOÃI≠.Á5	B◊@Ü§,àHC≠æcª˛<™¡MNsÿeùœ“ˆÔ-bdfS®”ÉÄNßÜ;°¬S!Cß¨zõv##òPq'@≠©≈w@$ò¬EÉΩVDÓCàWp◊Õ†(uHƒT¶7e¯ÅÔtvA7Õ^ï#y\âÀH“af§uœúáo1˜iΩ≈_eâ|ã◊WOß˙.òZÖÂF˘q…a·ŸDü'∑≤icc.)ÈÕ±πJEVßwÿâ¡+kŒç≥ÀV#[›ãO1µ™f5_Ô2∫XõÅ¡Ë$^‘0êΩÚ›k`êHZ-·êxßãE¢¯€¡£Gˆd⁄9•!9yÚÈ[«#C<*/Qü∏MG˚{‚Y òO€"Î‰Y@´Æ÷M
Ê≤6UI¡ƒx∑Àã‘$C„-+;	7r}’õê|Ã¨%ˆ_-„Ã∞¥‚%ú“•Ù›∑õÓä_0D≠'bQ%1¶ˆ¨]uóœ/æß®Ìà·^24™ÅR€Ì2Bfa≠µn‰=ˆŒiphÑ¥Ω÷X;s/ãí«ì-¥UÎ;1ΩÄä∏3Åëk›–õ—v€å}•ŸpÕeFPÌQıu¿∑⁄TX§s¸aB.wß?˚ƒôd~nÍÂ≈íÑ;ô„»Ÿ:ùÃÎTæÍta–ZÌ¡o!úèépG·m≈/6≤™Ùb¸—b"¯hÂº&©£ºFŸ“≤ 9ìîç"Qä∑Û,k;Õ9Xº@2ﬁZ—ZögbENΩ7ë£†ØÔÒ∫¬L¨=‹¡5ÀÊÙ'N-g≠–π6Q~Vñè"~ÙCã¶[uâ#ìà‘¯ˆ±§–îÒøå#ÇOl«1–ddƒrƒieb^ün≠<Ç∏âµ2ªﬁ.œÆßHÚVí]oG?	91I •9uÌ‘⁄±É|)ó	TnıÃﬁ∏,`*Ö‚ˆcCy‘‡rq“Í«ODŒkEV>	
!ÉÉFÅE%É9PØ>h^/L∞,H∑≠¯∫EºôsÈŸˆmÅ,–$l-Y√™W çVƒtó¥
·ﬁÏ> 8Ñ∞I∞†˜P∆2∞-]–®”8íMâølE˙ç"Kqëç[m∞⁄0ºÆI»‹*cÊ¥ä’H®Wïzgé¥7‰¡œ~˛ÏËãd¯˘ÒÒ¡Èœûi«7£-y¶Ω•8”.ó˜tçbPJÛD¸è≈Um¬Ú$z/n9p¥´óˆ\$‘»6"^ßîFöπ”m?€ Ω0fœï®ºJ≤~!¯ÉhÙâ3õûÛ¯–¶û<KevR'Uh¥..“9¸ ≈IVyíïv◊≥u∂˜¶Œ≈áS√«°«k–(ªR3x%“~v#Y"eF…vcµc`µÃpÜ¬PfÇÈÕÓyÏ˛o~üO*4Û:•†ÓûQb
¿$Õa>çhJ= €42åÇyπë·Ñ$ºt·[hE-v?f•yD~2ﬂbÓ∫Ê‚ïÑZI8VéÇrd qÍHl±l⁄Ö∑Fõ©S>\=qr◊IÛ’°ò˘ãäÙ)4°QL¿wB-c‚MÍe>4 ;◊Üuf@Êt•é≈™”Kî'ñ–MÒëK»§ÃG—œü?7ñ´ÛS§ÿ÷⁄ˇA¢â7ì‘’∑›\?ùW±ºâED[ì‘»ıˆ°˙BuZ+ãË÷	 l#"\Í™e§±ÿˆûÚ—Ã5≈7«Iü1ñÎ2Q≈Ú}w∏gÇFåyéKŒLV¿9Yæ-£giõœ6S√FÉ‹=%ﬁ¯Ω≤‰Z‹ò1Ó∫Pöô{„’Ã⁄yõYT#êΩåñ ¶Ê•„$1$~|3å—T:ﬂ1\f‹ MVy|7WÊŒ≠Âéö^3Z˛;ªMå\®UHNÏhl89ç®ôøß{ÀZr≥;ƒÅCÉËY`Ó‰˙“6Û˙πMaTŸµÌ∆û,ÈÔâA\S∫FÙ·ÇµÌﬂ®hﬂåÉæ‘äÏ4ü» ï≤µ,Y«9oÆ)YÀÿ∆%Î◊ˇ˙«ˇ˚Îoﬂ©⁄ˆˇ∂‰Í•Îø9ˆ÷Äúú›'ß?&ü}~ÙèMÿ_ŒÌØñµ_o6ã…zÉ7n≤®ËÃ=õÔócù‡böîs&ïgù∞æ5œ∫kÿ›Î‹±ñå’€*∆Í-}-°Œ¡n£(∫øêFù"ÕRg‹av∏&·®œ(P3ﬂŒË/∆0LÿTB‹	Ä√>cBoòÕØ¨%ËòjÀV≥^M\p:e2Äπ§O]ÒéQ˘fQØ∫f˜â÷6¶ÌaßÌc◊ÃÀNbSI©Ô\ﬁsNÛv8È~8å_+§˜bû“ıãÎ=∫ñ#X=?1=©U˘œ)›˜Æ)Ùï‰7À›«¶/ª%∑¿¸†ôwTˇ(V∫QªÂ2Ÿ≠ˆJE˛hvV≠ÀjÇ>≥OJ2*ë‹=¶€ôõãWôfãÈ√üf1•K›Ø»}_«~ñ27z˝áØ…Á®”ÑëÁ…71f^ÎSK£¨èn#(;{Vﬂ_Æ;‹í,¸ôk‰kjnÊ¶Ö;ªÎ!îmÕﬁ‹o¿EÖK%#ïO™2hô‹(ìªJoÃ öqÜÎ\7èôÂS˘˝ˇëöÍA÷‘ôﬁ´–àˇÆ@,k¿4ãjóE¢Î+¯q¡Z2√FõÄƒË 3π;${cà>r‚≠,w©á
l2Â0Nh%Ÿ…u#«§≥q&ôR»,ukÎ´añˇHÚE9#h‡é]W¨VæØˆJ‘ËÁ-[}îÖ/Ò∫!wÓHÀÁä%√…ºO˛Ñy\Å~C/|/à@os'EjnÊò&ê|Ùh>˙Òˇ  ˇˇ >4êí