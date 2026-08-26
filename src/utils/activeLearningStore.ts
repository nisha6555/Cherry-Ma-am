/**
 * Universal Active Learning Store
 * Captures, unifies, and persists learning content across all classroom modes:
 * - Explainer Mode (Uploaded PDF/Word/Image Document or YouTube Video)
 * - Live Blackboard Mode (Teacher Chalkboard Notes, Formulas, Derivations)
 * - Doubt Solver Mode (Sawal-Jawab & Question Resolutions)
 * - Mistake Vault Mode (Student Calculation Diagnostics & Corrections)
 * 
 * Provides instantaneous context for Smart Revision (Flashcards & Mind Map).
 */

import { safeGetItem, safeSetItem } from "./safeStorage";

export type LearningSourceMode = 
  | "explainer_doc" 
  | "explainer_youtube" 
  | "live_blackboard" 
  | "doubt_solver" 
  | "mistake_vault" 
  | "direct_study";

export interface ActiveLearningContext {
  sourceMode: LearningSourceMode;
  title: string;
  subject: string;
  grade?: string;
  board?: string;
  mediumOfLearning?: string;
  documentMarkdown?: string;
  blackboardContent?: string;
  topics?: string[];
  topicBoardsContent?: Record<string | number, string>;
  lastUpdated: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = "cherry_active_learning_context";
const LISTENERS = new Set<(ctx: ActiveLearningContext | null) => void>();

/**
 * Save or merge active learning context into durable local storage
 */
export function saveActiveLearningContext(updates: Partial<ActiveLearningContext>): ActiveLearningContext {
  const existing = getActiveLearningContext();
  const now = new Date().toISOString();

  const merged: ActiveLearningContext = {
    sourceMode: updates.sourceMode || existing?.sourceMode || "direct_study",
    title: updates.title || existing?.title || "Classroom Study Session",
    subject: updates.subject || existing?.subject || "General Science",
    grade: updates.grade || existing?.grade || "Class 10",
    board: updates.board || existing?.board || "CBSE",
    mediumOfLearning: updates.mediumOfLearning || existing?.mediumOfLearning || "Hinglish",
    documentMarkdown: updates.documentMarkdown !== undefined ? updates.documentMarkdown : existing?.documentMarkdown || "",
    blackboardContent: updates.blackboardContent !== undefined ? updates.blackboardContent : existing?.blackboardContent || "",
    topics: updates.topics || existing?.topics || [],
    topicBoardsContent: updates.topicBoardsContent || existing?.topicBoardsContent || {},
    sessionId: updates.sessionId || existing?.sessionId,
    lastUpdated: now,
    metadata: {
      ...(existing?.metadata || {}),
      ...(updates.metadata || {})
    }
  };

  // Persist safely
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("[ActiveLearningStore] Failed to persist active context:", err);
  }

  // Notify active listeners
  LISTENERS.forEach((listener) => {
    try {
      listener(merged);
    } catch (err) {
      console.warn("[ActiveLearningStore] Listener error:", err);
    }
  });

  return merged;
}

/**
 * Retrieve the current active learning context with safe fallbacks
 */
export function getActiveLearningContext(): ActiveLearningContext | null {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[ActiveLearningStore] Error reading active context:", err);
    return null;
  }
}

/**
 * Subscribe to real-time learning context updates
 */
export function subscribeToActiveLearningContext(callback: (ctx: ActiveLearningContext | null) => void): () => void {
  LISTENERS.add(callback);
  return () => {
    LISTENERS.delete(callback);
  };
}

/**
 * Extract unified revision text payload from session or active context
 * Prioritizes:
 * 1. Uploaded document extracted text (Explainer mode / Notes)
 * 2. Blackboard notes (Chalkboard diagrams, LaTeX equations)
 * 3. Structured subtopics list
 */
export function getUnifiedRevisionPayload(sessionOrContext: any): {
  sessionTitle: string;
  subject: string;
  sourceMode: LearningSourceMode;
  topics: string[];
  combinedContent: string;
  hasRichContent: boolean;
} {
  if (!sessionOrContext) {
    const activeCtx = getActiveLearningContext();
    if (activeCtx) {
      return getUnifiedRevisionPayload(activeCtx);
    }
    return {
      sessionTitle: "Classroom Concept Overview",
      subject: "Science",
      sourceMode: "direct_study",
      topics: [],
      combinedContent: "",
      hasRichContent: false,
    };
  }

  const title = sessionOrContext.processedTitle || 
                sessionOrContext.activeDocumentName || 
                sessionOrContext.title || 
                sessionOrContext.filename || 
                "Class Lecture";

  const subject = sessionOrContext.inferredSubject || 
                  sessionOrContext.subject || 
                  "Science";

  const sourceMode: LearningSourceMode = 
    sessionOrContext.sourceMode || 
    (sessionOrContext.mimeType === "video/youtube" || title.includes("YouTube") ? "explainer_youtube" :
     sessionOrContext.activeDocumentMarkdown || sessionOrContext.documentMarkdown ? "explainer_doc" :
     sessionOrContext.mode === "doubt" ? "doubt_solver" :
     sessionOrContext.mode === "mistake" ? "mistake_vault" :
     "live_blackboard");

  const docMarkdown = sessionOrContext.documentMarkdown || 
                      sessionOrContext.activeDocumentMarkdown || 
                      sessionOrContext.markdown || "";

  const customChalk = sessionOrContext.customBoardContent || "";
  const topicBoards = sessionOrContext.topicBoardsContent ? Object.values(sessionOrContext.topicBoardsContent).join("\n\n") : "";
  const blackboardText = [customChalk, topicBoards].filter(Boolean).join("\n\n");

  const topics: string[] = Array.isArray(sessionOrContext.topics) ? sessionOrContext.topics : [];

  // Merge full extracted content intelligently
  const contentParts: string[] = [];
  if (docMarkdown.trim()) {
    contentParts.push(`### 📄 Extracted Document & Explainer Content:\n${docMarkdown.trim()}`);
  }
  if (blackboardText.trim()) {
    contentParts.push(`### 🏫 Classroom Blackboard Notes & Derivations:\n${blackboardText.trim()}`);
  }
  if (topics.length > 0 && contentParts.length === 0) {
    contentParts.push(`### 📌 Core Subtopics:\n${topics.map((t, idx) => `${idx + 1}. ${t}`).join("\n")}`);
  }

  const combinedContent = contentParts.join("\n\n---\n\n");
  const hasRichContent = combinedContent.trim().length > 15 || topics.length > 0;

  return {
    sessionTitle: title,
    subject,
    sourceMode,
    topics,
    combinedContent,
    hasRichContent,
  };
}
