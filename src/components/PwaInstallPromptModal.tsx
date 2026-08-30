import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Zap, 
  WifiOff, 
  ShieldCheck, 
  Share, 
  PlusSquare, 
  ChevronRight,
  GraduationCap,
  Swords
} from "lucide-react";

interface PwaInstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstalledSuccess?: () => void;
}

export function PwaInstallPromptModal({
  isOpen,
  onClose,
  onInstalledSuccess
}: PwaInstallPromptModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode
    const isRunningStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for browser's beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      if (onInstalledSuccess) onInstalledSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onClose, onInstalledSuccess]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalled(true);
          if (onInstalledSuccess) onInstalledSuccess();
          setTimeout(() => {
            onClose();
          }, 1800);
        }
      } catch (err) {
        console.warn("[PWA] Install prompt error:", err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // For iOS, the guide steps are already displayed in the modal
    } else {
      // Fallback for browsers that don't emit beforeinstallprompt (e.g. desktop safari/firefox)
      alert("To install, click on your browser's menu (⋮ or ⚙️) and select 'Install Cherry AI' or 'Add to Desktop'.");
    }
  };

  if (!isOpen || isStandalone) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-gradient-to-b from-[#0a3641] via-[#092c34] to-[#041a1f] border-2 border-teal-500/40 rounded-3xl shadow-2xl overflow-hidden text-white relative"
        >
          {/* Subtle Ambient Light FX */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#c4f500]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Install Prompt"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-20 cursor-pointer border border-teal-500/20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header with App Icon */}
          <div className="p-6 pb-4 text-center space-y-3 relative z-10 border-b border-teal-800/40">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#06221c] to-[#0a3641] border-2 border-[#c4f500] p-1.5 shadow-xl flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-[#041a14] flex flex-col items-center justify-center text-center">
                    <GraduationCap className="w-7 h-7 text-[#c4f500]" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow border-2 border-[#0a3641]">
                  <Sparkles className="w-3 h-3 text-[#c4f500]" />
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c4f500]/15 border border-[#c4f500]/30 text-[#c4f500] text-[10px] font-mono font-black uppercase tracking-wider">
                <Download className="w-3 h-3" />
                <span>OFFICIAL WEB APP (PWA)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Install Cherry AI App 📱
              </h3>
              <p className="text-xs text-teal-200/80 max-w-sm mx-auto leading-relaxed">
                Experience full-screen blackboard classes, instant voice tutor responses, and 0-lag study quiz battles right on your Home Screen!
              </p>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="p-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/60 border border-teal-500/20 p-2.5 rounded-2xl flex items-start gap-2.5">
                <div className="p-1.5 bg-[#c4f500]/10 text-[#c4f500] rounded-xl shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-white leading-tight">Instant Launch</h4>
                  <p className="text-[9.5px] text-teal-200/70 leading-tight">0-second load time with local smart caching.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-teal-500/20 p-2.5 rounded-2xl flex items-start gap-2.5">
                <div className="p-1.5 bg-sky-400/10 text-sky-400 rounded-xl shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-white leading-tight">Full-Screen Mode</h4>
                  <p className="text-[9.5px] text-teal-200/70 leading-tight">No browser address bar or distraction tabs.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-teal-500/20 p-2.5 rounded-2xl flex items-start gap-2.5">
                <div className="p-1.5 bg-emerald-400/10 text-emerald-400 rounded-xl shrink-0">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-white leading-tight">Offline Resilience</h4>
                  <p className="text-[9.5px] text-teal-200/70 leading-tight">Access saved formulas and syllabus offline.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-teal-500/20 p-2.5 rounded-2xl flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-xl shrink-0">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-white leading-tight">Battle Arena</h4>
                  <p className="text-[9.5px] text-teal-200/70 leading-tight">Play synchronized live study matches safely.</p>
                </div>
              </div>
            </div>

            {/* iOS Safari Custom Instructions Banner */}
            {isIOS && (
              <div className="bg-slate-900/90 border border-amber-400/40 p-3 rounded-2xl space-y-2 text-left">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>How to install on iPhone / iPad (Safari):</span>
                </div>
                <ol className="text-[10.5px] text-slate-300 space-y-1.5 list-decimal list-inside font-medium">
                  <li className="flex items-center gap-1.5">
                    <span>1. Tap the</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-teal-300 font-bold inline-flex items-center gap-1">
                      <Share className="w-3 h-3 text-sky-400" /> Share
                    </span>
                    <span>button at bottom of Safari.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>2. Scroll down and tap</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-amber-300 font-bold inline-flex items-center gap-1">
                      <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
                    </span>.
                  </li>
                  <li>
                    <span>3. Tap <strong className="text-white">"Add"</strong> in the top right corner.</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 pt-2 pb-6 space-y-2.5">
            {installed ? (
              <div className="w-full py-3.5 bg-emerald-600/90 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>App Installed Successfully! 🎉</span>
              </div>
            ) : isIOS ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#c4f500] hover:bg-[#b5e200] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
              >
                <span>Got It! (Add to Home Screen)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3.5 bg-gradient-to-r from-[#c4f500] via-[#d4ff33] to-[#c4f500] hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Installing App...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>INSTALL APP NOW (1-TAP) 📱</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-teal-300/60 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Safe & 100% Free (No App Store needed)</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-white underline cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
