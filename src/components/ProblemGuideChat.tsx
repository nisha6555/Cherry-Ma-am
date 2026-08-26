import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, Send, Upload, Copy, Check, FileText, Image as ImageIcon, 
  RefreshCw, Calculator, Atom, TestTube, Leaf, Globe, 
  Code, Download, Volume2, VolumeX, Trash2, ArrowRight, ArrowLeft, HelpCircle, 
  CheckCircle, FileCode, Edit3, ShieldAlert,
  Paperclip, Smile, CheckCheck, MoreVertical, Camera, X, Crop, Sparkles,
  ChevronRight, Lightbulb, AlertTriangle, Target, BookOpen
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import { VectorDisplay } from "./VectorDisplay";
import { ImageCropRotateModal } from "./ImageCropRotateModal";

interface ProblemGuideChatProps {
  studentName: string;
  grade: string;
  subject?: string;
  board?: string;
  mediumOfLearning?: string;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  imagePreview?: string;
  timestamp: string;
}

export const ProblemGuideChat: React.FC<ProblemGuideChatProps> = ({
  studentName,
  grade,
  subject = "Mathematics",
  board = "CBSE",
  mediumOfLearning = "Hinglish",
  addToast,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Initial greeting message
  useEffect(() => {
    const firstName = studentName ? studentName.split(" ")[0] : "Student";
    const greetingMsg: ChatMessage = {
      id: "init-guide-1",
      sender: "ai",
      text: `Namaste ${firstName}! 🧭 Welcome to **Problem Guide (गाइड)**!\n\n` +
        `I am your interactive Socratic Guide for **Maths, Physics (Numericals), & Chemistry (Numericals)** for **${grade} (${board})**.\n\n` +
        `### 🎯 How this Guide works:\n` +
        `1. 📸 **Upload photo** or ✍️ **Type** your numerical / analytical question.\n` +
        `2. 🔍 **Problem Breakdown**: I will first deconstruct the question (**Given Values**, **To Find**, & **Core Concept**) so you understand the problem 100%!\n` +
        `3. 🚀 **Try Solving**: Then you attempt to solve it.\n` +
        `4. 🔄 **Update Me**:\n` +
        `   - Agar solve ho gaya: Mujhe batao, main useful **Pro-Tips & Exam Instructions** dungi! 🎉\n` +
        `   - Agar nahi hua: Main direct answer nahi balki **Step-by-Step Guidance & Micro-hints** dungi jisse aap khud solve kar sako! 💡\n\n` +
        `Aapka numerical / question kya hai? Photo upload karein ya niche type karein! ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([greetingMsg]);
  }, [studentName, grade, board]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        addToast("Please select an image smaller than 10MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setSelectedImage(file);
        addToast("Problem photo attached from gallery! 🖼️", "success");
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        addToast("Please capture an image smaller than 10MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageForCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedDataUrl: string, croppedFile: File) => {
    setImagePreview(croppedDataUrl);
    setSelectedImage(croppedFile);
    setRawImageForCrop(null);
    addToast("Problem photo cropped & attached! 📸", "success");
  };

  const handleCropCancel = () => {
    setRawImageForCrop(null);
  };

  const removeAttachedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend !== undefined ? textToSend : inputText).trim();
    if ((!queryText && !selectedImage) || isLoading) return;

    let base64Data: string | undefined = undefined;
    let mimeType: string | undefined = undefined;

    if (imagePreview) {
      base64Data = imagePreview.split(",")[1];
      mimeType = selectedImage?.type || "image/jpeg";
    }

    const userMsg: ChatMessage = {
      id: `user-guide-${Date.now()}`,
      sender: "user",
      text: queryText || "Please guide me on the attached numerical question.",
      imagePreview: imagePreview || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch("/api/problem-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: queryText,
          imageBase64: base64Data,
          mimeType,
          studentName,
          grade,
          subject,
          board,
          mediumOfLearning,
          chatHistory: history,
        }),
      });

      if (!res.ok) {
        throw new Error("Problem guide service error");
      }

      const data = await res.json();
      if (data.success && data.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-guide-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        addToast("Problem guide updated! 🧭", "success");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Problem Guide error:", err);
      const errorMsg: ChatMessage = {
        id: `err-guide-${Date.now()}`,
        sender: "ai",
        text: `Network issue aa gaya hai! 😅 Please ek baar try-again karein ya question dobara bhein. Problem Guide is ready! 🧭`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      addToast("Failed to get response from Problem Guide", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (_) {}
  };

  const copyToClipboard = (text: string, msgId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedId(msgId);
          addToast("Text copied to clipboard! 📋", "success");
          setTimeout(() => setCopiedId(null), 2500);
        }).catch(() => {
          fallbackCopyText(text);
          setCopiedId(msgId);
          addToast("Text copied to clipboard! 📋", "success");
          setTimeout(() => setCopiedId(null), 2500);
        });
      } else {
        fallbackCopyText(text);
        setCopiedId(msgId);
        addToast("Text copied to clipboard! 📋", "success");
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch (e) {
      fallbackCopyText(text);
      setCopiedId(msgId);
      addToast("Text copied to clipboard! 📋", "success");
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const speakText = (text: string, msgId: string) => {
    if (!("speechSynthesis" in window)) {
      addToast("Text-to-speech is not supported on this browser.", "error");
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanAudioText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*#_`~]/g, "")
      .replace(/https?:\/\/\S+/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanAudioText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes("en-IN") || v.lang.includes("hi-IN") || v.name.toLowerCase().includes("india")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
    const firstName = studentName ? studentName.split(" ")[0] : "Student";
    setMessages([
      {
        id: `init-guide-${Date.now()}`,
        sender: "ai",
        text: `Chat cleared! Ready for your next numerical problem, ${firstName}! 🧭\n\nUpload a new question photo or type it below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowMenu(false);
    addToast("Chat history reset", "info");
  };

  // Helper function to render text containing inline SVG or LaTeX
  const renderFormattedMessageText = (rawText: string) => {
    const svgRegex = /```(?:xml|svg)?\s*(<svg[\s\S]*?<\/svg>)\s*```/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = svgRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: rawText.substring(lastIndex, match.index) });
      }
      parts.push({ type: "svg", content: match[1] });
      lastIndex = svgRegex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      parts.push({ type: "text", content: rawText.substring(lastIndex) });
    }

    return (
      <div className="space-y-3 text-slate-800">
        {parts.map((part, pIdx) => {
          if (part.type === "svg") {
            return (
              <VectorDisplay 
                key={pIdx} 
                rawSvg={part.content} 
                index={pIdx} 
                isLightBg={true} 
              />
            );
          }

          return (
            <div key={pIdx} className="leading-relaxed font-sans text-xs sm:text-sm whitespace-pre-wrap text-slate-900">
              <MathRenderer text={part.content} isLightBg={true} />
            </div>
          );
        })}
      </div>
    );
  };

  const chatContent = (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[999999] w-screen w-full h-[100dvh] h-screen max-w-none max-h-none rounded-none shadow-none border-0 overflow-hidden flex flex-col bg-[#f0f4f8] text-slate-800 font-sans"
    >
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-[#0a3641] via-[#0f4654] to-[#125363] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 shrink-0 shadow-md z-20 relative">
        
        {/* Contact Info & Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title="Back to Study Desk"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#c4f500]/20 flex items-center justify-center text-xl shadow-inner border-2 border-[#c4f500]/40">
              🧭
            </div>
            {/* Online Green Badge */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#c4f500] border-2 border-[#0a3641] rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#0a3641] rounded-full animate-pulse" />
            </span>
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                <span>Problem Guide AI</span>
                <span className="text-[#c4f500] font-mono text-xs">(गाइड)</span>
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.2 rounded-full bg-[#c4f500]/20 text-[#c4f500] uppercase tracking-wider shrink-0 border border-[#c4f500]/30">
                SOCRATIC
              </span>
            </div>
            <p className="text-[11px] text-teal-100/90 truncate flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>online • Maths, Physics & Chem Numericals • {grade}</span>
            </p>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* More Menu Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-full text-teal-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 text-xs">
                <button
                  type="button"
                  onClick={clearChat}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Conversation</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <div className="px-4 py-1.5 text-[10px] text-slate-400 font-mono">
                  Socratic Guide v2.0
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= SUBJECT PILLS BAR ================= */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#0a3641]" /> Focus:
        </span>
        <button
          type="button"
          onClick={() => handleSendMessage("Let's guide a Mathematics numerical problem.")}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-all"
        >
          <span>📐</span> Maths
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("Let's guide a Physics numerical problem.")}
          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-[11px] font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-all"
        >
          <span>⚛️</span> Physics
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("Let's guide a Chemistry numerical/reaction problem.")}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-[11px] font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-all"
        >
          <span>🧪</span> Chemistry
        </button>
      </div>

      {/* ================= CHAT MESSAGES BODY ================= */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 relative"
        style={{
          backgroundImage: `radial-gradient(#0a3641 0.4px, transparent 0.4px)`,
          backgroundSize: "20px 20px",
          backgroundOpacity: 0.05
        }}
      >
        <AnimatePresence>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[82%] md:max-w-[75%] rounded-2xl p-3.5 sm:p-4 shadow-sm relative group text-left ${
                    isUser
                      ? "bg-[#0a3641] text-white rounded-tr-none shadow-md"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-sm"
                  }`}
                >
                  {/* Sender Header for AI */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#0a3641] text-[#c4f500] flex items-center justify-center text-xs font-bold">
                          🧭
                        </span>
                        <span className="text-[11px] font-bold text-[#0a3641]">
                          Problem Guide (Cherry Ma'am)
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}

                  {/* Attached Image Preview */}
                  {msg.imagePreview && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex items-center justify-center">
                      <img
                        src={msg.imagePreview}
                        alt="Problem uploaded"
                        className="max-h-56 w-auto object-contain"
                      />
                    </div>
                  )}

                  {/* Formatted Message Content */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </p>
                  ) : (
                    renderFormattedMessageText(msg.text)
                  )}

                  {/* Footer & Actions */}
                  <div className={`mt-2.5 pt-2 flex items-center justify-between text-[10px] ${
                    isUser ? "text-teal-200/80 border-t border-white/10" : "text-slate-400 border-t border-slate-100"
                  }`}>
                    {isUser ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <span>{msg.timestamp}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#c4f500]" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-[9px]">Socratic Guidance</span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Audio TTS */}
                          <button
                            type="button"
                            onClick={() => speakText(msg.text, msg.id)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              speakingMessageId === msg.id 
                                ? "bg-[#0a3641] text-[#c4f500]" 
                                : "hover:bg-slate-100 text-slate-600"
                            }`}
                            title="Listen with Audio Voice"
                          >
                            {speakingMessageId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Copy Text */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading Bubble */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start"
          >
            <div className="bg-white rounded-2xl rounded-tl-none p-3.5 border border-slate-200/90 shadow-sm flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#0a3641] text-[#c4f500] flex items-center justify-center text-xs animate-spin">
                🧭
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#0a3641] flex items-center gap-1.5">
                  Analyzing & Breaking Down Problem...
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-[#0a3641] rounded-full animate-ping" />
                    <span className="w-1 h-1 bg-[#0a3641] rounded-full animate-ping delay-75" />
                    <span className="w-1 h-1 bg-[#0a3641] rounded-full animate-ping delay-150" />
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Extracting Given, To Find & Core Concept...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ================= QUICK RESPONSE CHIPS ================= */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Quick Reply:
        </span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage("हाँ, मैंने प्रश्न को हल कर लिया है! (Yes, I solved it!)")}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
          <span>✅ हाँ, Solve हो गया!</span>
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage("नहीं, मुझसे हल नहीं हो पाया। कृपया step-by-step guideline दीजिए। (No, I'm stuck, need guidance)")}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
          <span>❌ नहीं, अटक गया / Help chahiye</span>
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage("Step 1 का hint या formula बताइए")}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium shrink-0 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Step 1 Hint</span>
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage("Is there any unit conversion needed in this problem?")}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium shrink-0 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-50"
        >
          <Target className="w-3 h-3 text-blue-500" />
          <span>Unit Check</span>
        </button>
      </div>

      {/* ================= IMAGE ATTACHMENT TRAY ================= */}
      {imagePreview && (
        <div className="bg-slate-100 border-t border-slate-200 p-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-900">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {selectedImage?.name || "Problem Image Attached"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Ready to deconstruct</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeAttachedImage}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= INPUT FOOTER BAR ================= */}
      <div className="bg-white border-t border-slate-200/90 p-2.5 sm:p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {/* Gallery Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleGallerySelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 hover:bg-slate-100 text-slate-600 rounded-2xl transition-colors cursor-pointer shrink-0 border border-slate-200"
            title="Upload photo from Gallery"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a3641]" />
          </button>

          {/* Camera Trigger */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleCameraSelect}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 sm:p-2.5 hover:bg-slate-100 text-slate-600 rounded-2xl transition-colors cursor-pointer shrink-0 border border-slate-200"
            title="Capture photo from Camera"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a3641]" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your Maths, Physics, Chem problem or answer..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a3641]/20 focus:border-[#0a3641] transition-all font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className={`p-2.5 sm:p-3 rounded-2xl font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md ${
              isLoading || (!inputText.trim() && !selectedImage)
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-[#0a3641] hover:bg-[#0d4756] text-[#c4f500] active:scale-95"
            }`}
          >
            <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </form>
      </div>

      {/* Crop & Rotate Modal */}
      {rawImageForCrop && (
        <ImageCropRotateModal
          rawImageSrc={rawImageForCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          addToast={addToast}
        />
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(chatContent, document.body);
  }
  return chatContent;
};
