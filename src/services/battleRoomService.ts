import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";

export interface BattleRoomQuestion {
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
  timeLimit?: number;
}

export interface BattleParticipant {
  uid: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  correctCount?: number;
  currentQuestionIndex?: number;
  accuracy?: number;
  speedBonusTotal?: number;
  joinedAt?: string;
  avatar?: string;
}

export interface BattleRoomData {
  id: string;
  roomId: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  chapterOrFileName: string;
  numQuestions: number;
  timePerQuestion: number;
  scheduledTime: string;
  scheduledTimestamp: number;
  isInstant: boolean;
  hostUid: string;
  hostName: string;
  status: "waiting" | "live" | "completed";
  questions: BattleRoomQuestion[];
  participantsCount: number;
  chapterSummary?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateBattleRoomParams {
  title: string;
  subject: string;
  grade: string;
  chapterOrFileName: string;
  numQuestions: number;
  timePerQuestion: number;
  isInstant: boolean;
  scheduledDateTime?: string;
  file?: File | null;
  selectedChapter?: string;
  hostName: string;
}

/**
 * Converts a browser File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 1. AI Syllabus Extractor: Calls backend to parse PDF/chapter and generate structured MCQs
 */
export async function extractBattleSyllabusAndQuestions(params: {
  title: string;
  subject: string;
  grade: string;
  chapter?: string;
  file?: File | null;
  numQuestions: number;
  timePerQuestion: number;
  difficulty?: string;
}): Promise<{
  roomTitle: string;
  detectedSubject: string;
  chapterSummary: string;
  questions: BattleRoomQuestion[];
}> {
  let base64Data: string | undefined = undefined;
  let mimeType: string | undefined = undefined;
  let filename: string | undefined = undefined;

  if (params.file) {
    base64Data = await fileToBase64(params.file);
    mimeType = params.file.type || "application/pdf";
    filename = params.file.name;
  }

  const response = await fetch("/api/battle-room/extract-syllabus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: params.title,
      subject: params.subject,
      grade: params.grade,
      chapter: params.chapter,
      filename,
      mimeType,
      base64Data,
      numQuestions: params.numQuestions,
      timePerQuestion: params.timePerQuestion,
      difficulty: params.difficulty || "Medium"
    })
  });

  if (!response.ok) {
    throw new Error(`Syllabus parser failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to generate battle questions.");
  }

  return {
    roomTitle: data.roomTitle || params.title,
    detectedSubject: data.detectedSubject || params.subject,
    chapterSummary: data.chapterSummary || "",
    questions: data.questions || []
  };
}

/**
 * 2. Creates a new Battle Room in Firestore with generated code (e.g. CHERRY-4821)
 */
export async function createBattleRoom(params: CreateBattleRoomParams): Promise<BattleRoomData> {
  const currentUid = auth.currentUser?.uid || `guest_${Date.now()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const roomCode = `CHERRY-${randomSuffix}`;
  const roomId = `room_${Date.now()}_${randomSuffix}`;

  // 1. Generate questions from syllabus
  const aiExtraction = await extractBattleSyllabusAndQuestions({
    title: params.title,
    subject: params.subject,
    grade: params.grade,
    chapter: params.selectedChapter,
    file: params.file,
    numQuestions: params.numQuestions,
    timePerQuestion: params.timePerQuestion
  });

  // Calculate scheduled timestamp
  let scheduledTimestamp = Date.now();
  let scheduledTimeFormatted = "Instant (Ready Now)";

  if (!params.isInstant && params.scheduledDateTime) {
    const scheduledDate = new Date(params.scheduledDateTime);
    scheduledTimestamp = scheduledDate.getTime();
    scheduledTimeFormatted = `${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} (${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  }

  const roomData: BattleRoomData = {
    id: roomId,
    roomId: roomId,
    code: roomCode,
    title: aiExtraction.roomTitle || params.title,
    subject: aiExtraction.detectedSubject || params.subject,
    grade: params.grade,
    chapterOrFileName: params.file ? params.file.name : (params.selectedChapter || "Curriculum Syllabus"),
    numQuestions: aiExtraction.questions.length || params.numQuestions,
    timePerQuestion: params.timePerQuestion,
    scheduledTime: scheduledTimeFormatted,
    scheduledTimestamp: scheduledTimestamp,
    isInstant: params.isInstant,
    hostUid: currentUid,
    hostName: params.hostName || "Host",
    status: "waiting",
    questions: aiExtraction.questions,
    participantsCount: 1,
    chapterSummary: aiExtraction.chapterSummary,
  };

  // Try storing to Firestore
  try {
    const roomRef = doc(db, "battleRooms", roomId);
    await setDoc(roomRef, {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Add host as first participant
    const hostParticipantRef = doc(db, "battleRooms", roomId, "participants", currentUid);
    await setDoc(hostParticipantRef, {
      uid: currentUid,
      name: params.hostName || "Host (You)",
      isHost: true,
      isReady: true,
      score: 0,
      correctCount: 0,
      joinedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.warn("[BattleRoomService] Firestore write failed or running offline, using local memory state:", err);
    // Cache to localStorage for resilience
    try {
      const cached = JSON.parse(localStorage.getItem("cherry_battle_rooms") || "[]");
      localStorage.setItem("cherry_battle_rooms", JSON.stringify([roomData, ...cached]));
    } catch (e) {
      console.error("Local storage caching failed:", e);
    }
  }

  return roomData;
}

/**
 * 3. Joins an existing Battle Room via 6-Digit Code (e.g. CHERRY-4821)
 */
export async function joinBattleRoomByCode(
  code: string, 
  studentName: string
): Promise<BattleRoomData | null> {
  const normalizedCode = code.trim().toUpperCase();
  const currentUid = auth.currentUser?.uid || `guest_${Date.now()}`;

  try {
    const q = query(
      collection(db, "battleRooms"), 
      where("code", "==", normalizedCode), 
      limit(1)
    );
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const docSnap = querySnap.docs[0];
      const room = { id: docSnap.id, ...docSnap.data() } as BattleRoomData;

      // Add student to participants subcollection
      const participantRef = doc(db, "battleRooms", room.roomId, "participants", currentUid);
      await setDoc(participantRef, {
        uid: currentUid,
        name: studentName || "Player",
        isHost: room.hostUid === currentUid,
        isReady: true,
        score: 0,
        correctCount: 0,
        joinedAt: new Date().toISOString(),
      }, { merge: true });

      // Update room participant count
      try {
        await updateDoc(doc(db, "battleRooms", room.roomId), {
          participantsCount: (room.participantsCount || 1) + 1,
          updatedAt: serverTimestamp()
        });
      } catch (countErr) {
        console.warn("Could not increment participants count:", countErr);
      }

      return room;
    }
  } catch (err) {
    console.warn("[BattleRoomService] Firestore lookup notice:", err);
  }

  // Fallback: check local storage
  try {
    const cached = JSON.parse(localStorage.getItem("cherry_battle_rooms") || "[]") as BattleRoomData[];
    const match = cached.find(r => r.code.toUpperCase() === normalizedCode);
    if (match) return match;
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * 4. Subscribe to Realtime Updates of a Battle Room
 */
export function subscribeToBattleRoom(
  roomId: string,
  onUpdate: (room: BattleRoomData | null) => void
): () => void {
  try {
    const roomRef = doc(db, "battleRooms", roomId);
    return onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as BattleRoomData);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.warn("[BattleRoomService] Room subscription notice:", err);
    });
  } catch (e) {
    console.warn("[BattleRoomService] Realtime subscription init notice:", e);
    return () => {};
  }
}

/**
 * 5. Subscribe to Joined Participants in a Battle Room
 */
export function subscribeToBattleParticipants(
  roomId: string,
  onUpdate: (participants: BattleParticipant[]) => void
): () => void {
  try {
    const participantsRef = collection(db, "battleRooms", roomId, "participants");
    return onSnapshot(participantsRef, (snapshot) => {
      const list: BattleParticipant[] = [];
      snapshot.forEach(docSnap => {
        list.push({ uid: docSnap.id, ...docSnap.data() } as BattleParticipant);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("[BattleRoomService] Participants subscription notice:", err);
    });
  } catch (e) {
    console.warn("[BattleRoomService] Participants subscription init notice:", e);
    return () => {};
  }
}

/**
 * 6. Toggle Player Ready Status in Lobby
 */
export async function toggleParticipantReady(
  roomId: string,
  uid: string,
  isReady: boolean
): Promise<void> {
  try {
    const participantRef = doc(db, "battleRooms", roomId, "participants", uid);
    await updateDoc(participantRef, {
      isReady: isReady
    });
  } catch (err) {
    console.warn("[BattleRoomService] Error updating player ready status in Firestore:", err);
  }
}

/**
 * 6B. Update Player Real-time Question Progress & Battle Score (Syncs Race Bar & Live Standings)
 */
export async function updateParticipantBattleProgress(
  roomId: string,
  uid: string,
  progress: {
    score: number;
    correctCount: number;
    currentQuestionIndex: number;
    accuracy?: number;
    speedBonusTotal?: number;
  }
): Promise<void> {
  try {
    const participantRef = doc(db, "battleRooms", roomId, "participants", uid);
    await updateDoc(participantRef, {
      score: progress.score,
      correctCount: progress.correctCount,
      currentQuestionIndex: progress.currentQuestionIndex,
      accuracy: progress.accuracy ?? 0,
      speedBonusTotal: progress.speedBonusTotal ?? 0,
      lastActiveAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[BattleRoomService] Error updating player battle progress in Firestore:", err);
  }
}

/**
 * 7. Host Starts the Battle Room (Triggers instant live transition for all players)
 */
export async function startBattleRoomLive(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, "battleRooms", roomId);
    await updateDoc(roomRef, {
      status: "live",
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[BattleRoomService] Error marking room as live in Firestore:", err);
    // Update local cache if offline
    try {
      const cached = JSON.parse(localStorage.getItem("cherry_battle_rooms") || "[]") as BattleRoomData[];
      const updated = cached.map(r => r.roomId === roomId ? { ...r, status: "live" as const } : r);
      localStorage.setItem("cherry_battle_rooms", JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }
}

/**
 * 8. Fetches Active & Upcoming Battle Rooms
 */
export async function getUpcomingBattleRooms(subject?: string): Promise<BattleRoomData[]> {
  try {
    const roomsQuery = query(
      collection(db, "battleRooms"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(roomsQuery);
    const rooms: BattleRoomData[] = [];
    snap.forEach(d => {
      rooms.push({ id: d.id, ...d.data() } as BattleRoomData);
    });
    if (rooms.length > 0) return rooms;
  } catch (err) {
    console.warn("[BattleRoomService] Fetch upcoming rooms notice:", err);
  }

  // Fallback to local storage
  try {
    const cached = JSON.parse(localStorage.getItem("cherry_battle_rooms") || "[]") as BattleRoomData[];
    if (cached.length > 0) return cached;
  } catch (e) {
    // ignore
  }

  // Seed sample rooms if none found
  return [
    {
      id: "room_seed_1",
      roomId: "room_seed_1",
      code: "CHERRY-4092",
      title: "Science Ch-4 Carbon Compounds Mega Quiz",
      subject: subject || "Science",
      grade: "Class 10",
      chapterOrFileName: "Carbon & its Compounds (NCERT PDF)",
      numQuestions: 10,
      timePerQuestion: 30,
      scheduledTime: "Today at 07:00 PM",
      scheduledTimestamp: Date.now() + 3600000,
      isInstant: false,
      hostUid: "host_aarav",
      hostName: "Aarav Sharma",
      status: "waiting",
      questions: [],
      participantsCount: 4
    },
    {
      id: "room_seed_2",
      roomId: "room_seed_2",
      code: "MATH-8821",
      title: "Maths Trigonometry Speed Sprint Battle",
      subject: "Mathematics",
      grade: "Class 10",
      chapterOrFileName: "Trigonometric Identities & Heights",
      numQuestions: 15,
      timePerQuestion: 45,
      scheduledTime: "Live in 15 mins",
      scheduledTimestamp: Date.now() + 900000,
      isInstant: false,
      hostUid: "host_ananya",
      hostName: "Ananya Patel",
      status: "waiting",
      questions: [],
      participantsCount: 6
    }
  ];
}

/**
 * 7. Shareable Invite Message Helper
 */
export function buildBattleInviteMessage(room: {
  code: string;
  title: string;
  subject: string;
  grade: string;
  chapterOrFileName: string;
  scheduledTime: string;
}): string {
  return `⚔️ *Hey! Join my ${room.grade} ${room.subject} Quiz Battle on Cherry AI!* 🚀\n\n` +
         `🏆 *Room:* ${room.title}\n` +
         `📖 *Syllabus:* ${room.chapterOrFileName}\n` +
         `⏰ *Time:* ${room.scheduledTime}\n` +
         `🔑 *Room Code:* \`${room.code}\`\n\n` +
         `Tap to join lobby and let's compete live for the top rank! 🥇`;
}
