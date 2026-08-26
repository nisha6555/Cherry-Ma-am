/**
 * Safe LocalStorage Utility with automatic QuotaExceededError protection and pruning.
 */

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[safeStorage] localStorage.setItem failed for key "${key}":`, err);
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch (err: any) {
    console.warn(`[safeStorage] localStorage.getItem failed for key "${key}":`, err);
    return null;
  }
}

export function safeSavePastSessions(uid: string, sessions: any[]): void {
  if (typeof window === "undefined" || !window.localStorage || !uid || !Array.isArray(sessions)) return;
  const key = `pastSessions_${uid}`;
  
  try {
    // 1. Keep at most 25 most recent sessions with capped board size
    const cappedSessions = sessions.slice(0, 25).map((sess) => {
      let customBoardContent = sess.customBoardContent;
      if (typeof customBoardContent === "string" && customBoardContent.length > 80000) {
        customBoardContent = customBoardContent.slice(0, 80000);
      }
      return {
        ...sess,
        customBoardContent,
      };
    });

    try {
      localStorage.setItem(key, JSON.stringify(cappedSessions));
      return;
    } catch (quotaErr: any) {
      console.warn(`[safeStorage] Quota exceeded saving ${key}. Pruning sessions cache...`, quotaErr);
    }

    // 2. Retry with 10 sessions and reduced board content
    try {
      const lightweightSessions = sessions.slice(0, 10).map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        grade: s.grade,
        subject: s.subject,
        activeDocumentName: s.activeDocumentName,
        topics: s.topics,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        customBoardContent: typeof s.customBoardContent === "string" ? s.customBoardContent.slice(0, 15000) : "",
      }));
      localStorage.setItem(key, JSON.stringify(lightweightSessions));
      return;
    } catch (quotaErr2: any) {
      console.warn(`[safeStorage] Quota exceeded on stage 2 for ${key}. Pruning to metadata only...`, quotaErr2);
    }

    // 3. Last resort fallback: save top 5 sessions with essential metadata only
    try {
      const metadataOnly = sessions.slice(0, 5).map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        grade: s.grade,
        subject: s.subject,
        activeDocumentName: s.activeDocumentName,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      localStorage.setItem(key, JSON.stringify(metadataOnly));
    } catch (finalErr) {
      console.warn(`[safeStorage] Unable to save ${key} to localStorage even after pruning:`, finalErr);
    }
  } catch (err) {
    console.warn(`[safeStorage] Error in safeSavePastSessions:`, err);
  }
}
