import React, { useState, useRef, useEffect } from "react";
import { 
  Users, Swords, Sparkles, Upload, FileText, Calendar, Clock, 
  ArrowRight, Shield, CheckCircle2, Copy, Share2, Plus, 
  BookOpen, HelpCircle, Trophy, Flame, ChevronRight, Zap,
  Play, Radio, AlertCircle, X, Check, GraduationCap, Loader2
} from "lucide-react";
import { 
  createBattleRoom, 
  joinBattleRoomByCode, 
  getUpcomingBattleRooms, 
  buildBattleInviteMessage,
  BattleRoomData 
} from "../services/battleRoomService";

export type ScheduledBattleRoom = BattleRoomData;

interface BattleArenaLandingProps {
  currentSubject?: string;
  currentGrade?: string;
  studentName?: string;
  onToast: (text: string, type: "success" | "info" | "error") => void;
  onEnterLobby?: (room: BattleRoomData) => void;
}

export const BattleArenaLanding: React.FC<BattleArenaLandingProps> = ({
  currentSubject = "Mathematics",
  currentGrade = "Class 10",
  studentName = "Scholar",
  onToast,
  onEnterLobby,
}) => {
  // Mode for syllabus source in Card A
  const [syllabusSourceType, setSyllabusSourceType] = useState<"upload" | "chapter">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card A Form State
  const [roomTitle, setRoomTitle] = useState(`${currentSubject} Chapter Showdown`);
  const [selectedChapter, setSelectedChapter] = useState("Quadratic Equations & AP");
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [launchMode, setLaunchMode] = useState<"instant" | "scheduled">("instant");
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<string>("");

  // Card B Form State (Join Code)
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Active / Upcoming Scheduled Rooms list
  const [roomsList, setRoomsList] = useState<BattleRoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Load upcoming rooms on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRooms() {
      setIsLoadingRooms(true);
      try {
        const rooms = await getUpcomingBattleRooms(currentSubject);
        if (isMounted) {
          setRoomsList(rooms);
        }
      } catch (err) {
        console.warn("Failed to load upcoming rooms:", err);
      } finally {
        if (isMounted) setIsLoadingRooms(false);
      }
    }
    loadRooms();
    return () => { isMounted = false; };
  }, [currentSubject]);

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(ext || '')) {
      onToast("Please upload a PDF, Image, or Text syllabus document.", "error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      onToast("File is too large! Maximum allowed size is 20MB.", "error");
      return;
    }
    setUploadedFile(file);
    if (!roomTitle || roomTitle.includes("Chapter Showdown")) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setRoomTitle(`${cleanName} Quiz Battle`);
    }
    onToast(`Uploaded "${file.name}" for syllabus extraction! 📄`, "success");
  };

  // Create Battle Room Handler with AI Syllabus Extraction
  const handleCreateRoom = async () => {
    if (!roomTitle.trim()) {
      onToast("Please enter a title for your Battle Room!", "error");
      return;
    }

    if (syllabusSourceType === "upload" && !uploadedFile) {
      onToast("Please upload a syllabus PDF or select a chapter!", "info");
      return;
    }

    setIsCreating(true);
    setCreationStep("AI Syllabus Engine: Extracting Key Concepts & MCQs...");

    try {
      const newRoom = await createBattleRoom({
        title: roomTitle.trim(),
        subject: currentSubject,
        grade: currentGrade,
        chapterOrFileName: syllabusSourceType === "upload" && uploadedFile ? uploadedFile.name : selectedChapter,
        numQuestions,
        timePerQuestion,
        isInstant: launchMode === "instant",
        scheduledDateTime: launchMode === "scheduled" ? scheduleDateTime : undefined,
        file: syllabusSourceType === "upload" ? uploadedFile : null,
        selectedChapter: syllabusSourceType === "chapter" ? selectedChapter : undefined,
        hostName: studentName || "You (Host)",
      });

      setRoomsList(prev => [newRoom, ...prev]);
      onToast(`🎉 Battle Room Created! Code: ${newRoom.code}`, "success");

      if (onEnterLobby) {
        onEnterLobby(newRoom);
      }
    } catch (err: any) {
      console.error("Create room error:", err);
      onToast("Could not generate room: " + (err.message || "Unknown error"), "error");
    } finally {
      setIsCreating(false);
      setCreationStep("");
    }
  };

  // Join Battle Room Handler
  const handleJoinRoom = async () => {
    const formatted = joinCode.trim().toUpperCase();
    if (!formatted) {
      onToast("Please enter a 6-digit Room Code to join!", "error");
      return;
    }

    setIsJoining(true);
    try {
      const room = await joinBattleRoomByCode(formatted, studentName || "Player");
      if (room) {
        onToast(`Joined ${room.title} Lobby! 🚀`, "success");
        if (onEnterLobby) onEnterLobby(room);
      } else {
        // Fallback local room creation if room not found in remote
        const fallbackRoom: BattleRoomData = {
          id: `room_joined_${Date.now()}`,
          roomId: `room_joined_${Date.now()}`,
          code: formatted,
          title: `${currentSubject} Friend Match`,
          subject: currentSubject,
          grade: currentGrade,
          chapterOrFileName: "Class Syllabus",
          numQuestions: 10,
          timePerQuestion: 30,
          scheduledTime: "Live Lobby",
          scheduledTimestamp: Date.now(),
          isInstant: true,
          hostUid: "friend_uid",
          hostName: "Friend",
          participantsCount: 2,
          status: "waiting",
          questions: [],
        };
        setRoomsList(prev => [fallbackRoom, ...prev]);
        onToast(`Joined Battle Room "${formatted}"! 🚀`, "success");
        if (onEnterLobby) onEnterLobby(fallbackRoom);
      }
    } catch (err: any) {
      console.error("Join room error:", err);
      onToast("Failed to join room: " + err.message, "error");
    } finally {
      setIsJoining(false);
    }
  };

  // Share Code on WhatsApp or Clipboard
  const handleShareCode = (room: BattleRoomData) => {
    const shareText = buildBattleInviteMessage(room);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      onToast(`Invite message & Code ${room.code} copied! 📋`, "success");
    } else {
      onToast(`Room Code: ${room.code}`, "info");
    }
  };

  const handleWhatsAppShare = (room: BattleRoomData) => {
    const shareText = buildBattleInviteMessage(room);
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4 py-1 text-left animate-fadeIn">
      {/* 1. ARENA BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a3641] via-[#0e4857] to-slate-950 text-white p-4 sm:p-5 rounded-3xl border border-teal-800/60 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c4f500]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#c4f500] text-[#041a14] text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <Swords className="w-3 h-3" /> Peer Study Arena
              </span>
              <span className="text-[10px] text-teal-200/90 font-mono font-bold">
                {currentGrade} • {currentSubject}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Challenge Friends on Your Uploaded Syllabus
            </h3>
            <p className="text-[11px] text-teal-100/85 leading-relaxed">
              Create a private battle room, upload chapter notes or PDF to extract custom questions, and challenge classmates in real-time or scheduled multiplayer showdowns.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10">
            <div className="p-2 rounded-xl bg-[#c4f500] text-[#041a14] font-black text-xs shadow-xs">
              <Flame className="w-4 h-4 text-[#041a14]" />
            </div>
            <div className="text-left pr-1">
              <div className="text-[10px] font-mono font-bold text-[#c4f500] uppercase">100% Fair Play</div>
              <div className="text-[10.5px] text-white font-bold">Live Synchronized Quiz</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-CARD GRID (HOST & JOIN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* CARD A: CREATE BATTLE ROOM (HOST) - 7 COLS */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-teal-50 text-[#0a3641] border border-teal-100">
                <Plus className="w-4 h-4 font-black" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#0a3641] uppercase tracking-wide">
                  1. Create Battle Room
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Host a quiz room & invite your friends via code
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-[#0a3641] text-white px-2 py-0.5 rounded-full">
              Host Mode
            </span>
          </div>

          <div className="space-y-3.5 text-left text-xs">
            {/* 1. Room Title */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <span>Room Title / Exam Name</span>
              </label>
              <input
                type="text"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="e.g. Science Ch-4 Battle, Sunday Math Showdown"
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-[#0a3641] transition-all text-slate-800"
              />
            </div>

            {/* 2. Syllabus Source Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider">
                  Quiz Syllabus Basis:
                </label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSyllabusSourceType("upload")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      syllabusSourceType === "upload"
                        ? "bg-[#0a3641] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📄 Upload PDF / Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyllabusSourceType("chapter")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      syllabusSourceType === "chapter"
                        ? "bg-[#0a3641] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📚 Select Chapter
                  </button>
                </div>
              </div>

              {syllabusSourceType === "upload" ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3.5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                    isDragging
                      ? "border-[#0a3641] bg-teal-50/60 scale-[1.01]"
                      : uploadedFile
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/80"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-between gap-2 text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-emerald-950 truncate">
                            {uploadedFile.name}
                          </div>
                          <div className="text-[9.5px] text-emerald-700 font-mono">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • AI will extract questions from this file
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <p className="text-[11px] font-bold text-slate-700">
                        Click or drag & drop chapter PDF / Class Notes
                      </p>
                      <p className="text-[9.5px] text-slate-400">
                        AI will extract concepts & MCQs directly from this document
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-800 focus:outline-none focus:border-[#0a3641]"
                  >
                    <option value="Quadratic Equations & AP">Class 10 Math: Quadratic Equations & AP</option>
                    <option value="Trigonometry & Heights/Distances">Class 10 Math: Trigonometry & Heights/Distances</option>
                    <option value="Carbon & its Compounds">Class 10 Science: Carbon & its Compounds</option>
                    <option value="Light: Reflection & Refraction">Class 10 Science: Light: Reflection & Refraction</option>
                    <option value="Electricity & Circuits">Class 10 Science: Electricity & Circuits</option>
                    <option value="Life Processes & Control">Class 10 Science: Life Processes & Control</option>
                    <option value="Coordinate Geometry & Triangles">Class 10 Math: Coordinate Geometry & Triangles</option>
                  </select>
                </div>
              )}
            </div>

            {/* 3. Settings: Question Count & Timer */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-[#0a3641]" />
                  <span>Questions</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[5, 10, 15].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setNumQuestions(q)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        numQuestions === q
                          ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {q} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0a3641]" />
                  <span>Time / Question</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[20, 30, 45].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimePerQuestion(t)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        timePerQuestion === t
                          ? "bg-[#0a3641] text-white border-[#0a3641] shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Launch Timing Mode */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Schedule & Match Timing:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLaunchMode("instant")}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    launchMode === "instant"
                      ? "border-[#0a3641] bg-teal-50/80 text-[#0a3641] font-bold shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[10.5px] font-bold">⚡ Play Instantly</div>
                    <div className="text-[9px] text-slate-500">Lobby opens now</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLaunchMode("scheduled")}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    launchMode === "scheduled"
                      ? "border-[#0a3641] bg-teal-50/80 text-[#0a3641] font-bold shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#0a3641] shrink-0" />
                  <div>
                    <div className="text-[10.5px] font-bold">⏰ Schedule Later</div>
                    <div className="text-[9px] text-slate-500">Set specific time</div>
                  </div>
                </button>
              </div>

              {launchMode === "scheduled" && (
                <div className="pt-1">
                  <input
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#0a3641]"
                  />
                </div>
              )}
            </div>

            {/* Creation Progress / Feedback */}
            {isCreating && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-[#0a3641] animate-spin shrink-0" />
                <div className="text-left text-[11px] font-bold text-teal-950">
                  {creationStep || "Analyzing syllabus & building battle room..."}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full bg-[#0a3641] hover:bg-[#124e5d] text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] group mt-1 disabled:opacity-50"
            >
              {isCreating ? (
                <span>Generating Room & MCQs...</span>
              ) : (
                <>
                  <Swords className="w-4 h-4 text-[#c4f500] group-hover:rotate-12 transition-transform" />
                  <span>Generate Room & Invite Code</span>
                  <ArrowRight className="w-4 h-4 text-[#c4f500] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD B: JOIN BATTLE ROOM (PARTICIPANT) - 5 COLS */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                  <Radio className="w-4 h-4 font-black" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                    2. Join Friend's Room
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Have an invite code? Enter to join lobby
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                Player Mode
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider">
                  Enter 6-Digit Room Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CHERRY-4092"
                    maxLength={15}
                    className="w-full text-center font-mono font-black text-base sm:text-lg tracking-widest px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-[#0a3641] focus:bg-white focus:outline-none focus:border-[#0a3641] transition-all uppercase placeholder:text-slate-300 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isJoining}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isJoining ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Lobby...
                  </span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Enter Battle Lobby</span>
                  </>
                )}
              </button>

              {/* Quick Friend Tip */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-start gap-2.5 text-[10.5px] text-slate-600">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Ask your friend or study group host for the 6-digit code. Both will see questions at the exact same time.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats / Info Widget */}
          <div className="bg-gradient-to-br from-teal-900 to-[#0a3641] text-white rounded-3xl p-4 border border-teal-800/80 shadow-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#c4f500] uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Battle Arena Perks
              </span>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-teal-200">
                Peer Review
              </span>
            </div>
            <ul className="text-[10.5px] text-teal-100/90 space-y-1.5 list-disc list-inside">
              <li>Speed Bonus points for fastest correct responses.</li>
              <li>Group Blindspot Report: See which questions friends missed.</li>
              <li>Cherry Ma'am instant blackboard solution review.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* 3. UPCOMING & RECENT SCHEDULED ROOMS SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0a3641]" />
            <h4 className="text-xs sm:text-sm font-black text-[#0a3641] uppercase tracking-wide">
              Upcoming & Active Battle Rooms ({roomsList.length})
            </h4>
          </div>
          <span className="text-[9.5px] font-mono text-slate-400">
            Realtime Room List
          </span>
        </div>

        {isLoadingRooms ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0a3641]" />
            <span className="text-xs font-semibold">Loading battle rooms...</span>
          </div>
        ) : roomsList.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <Swords className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No active battle rooms yet</p>
            <p className="text-[10px] text-slate-400">Be the first to create one and invite friends!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roomsList.map((room) => (
              <div
                key={room.id}
                className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-3.5 transition-all flex flex-col justify-between gap-2.5 group text-left"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-black bg-[#0a3641] text-[#c4f500] px-2 py-0.5 rounded-md">
                      CODE: {room.code}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-500 font-bold">
                      <Clock className="w-3 h-3 text-[#0a3641]" />
                      <span>{room.scheduledTime}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#0a3641] transition-colors line-clamp-1">
                      {room.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 truncate">
                      📖 {room.chapterOrFileName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[9.5px] text-slate-600 font-medium">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {room.numQuestions} Questions ({room.timePerQuestion}s/Q)
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 text-emerald-700 font-bold">
                      <Users className="w-3 h-3 text-emerald-600" />
                      {room.participantsCount || 1} Joined
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <div className="text-[9.5px] text-slate-400 font-medium">
                    Host: <strong className="text-slate-700">{room.hostName}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(room)}
                      className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareCode(room)}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0a3641] hover:border-[#0a3641] transition-all cursor-pointer"
                      title="Copy Invite Code & Text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onEnterLobby) onEnterLobby(room);
                        onToast(`Entering Lobby for ${room.title}... 🚀`, "info");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0a3641] hover:bg-[#124e5d] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>View Lobby</span>
                      <ArrowRight className="w-3 h-3 text-[#c4f500]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

