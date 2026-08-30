import React from "react";
import { createPortal } from "react-dom";
import { 
  AlertTriangle, Sparkles, Database, FileText, RefreshCw, 
  ArrowRight, X, BookOpen, Layers, ShieldCheck, CheckCircle2 
} from "lucide-react";

interface PYQValidationAlertModalProps {
  isOpen: boolean;
  fileName: string;
  reason?: string;
  detectedDocType?: string;
  detectedSubject?: string;
  currentSubject: string;
  currentGrade: string;
  onUseNationalDB: () => void;
  onUploadAnother: () => void;
  onSwitchToMode?: (mode: "explain" | "cheatsheet" | "doubt") => void;
  onProceedAnyway: () => void;
  onClose: () => void;
}

export const PYQValidationAlertModal: React.FC<PYQValidationAlertModalProps> = ({
  isOpen,
  fileName,
  reason,
  detectedDocType = "non_question_paper",
  detectedSubject,
  currentSubject,
  currentGrade,
  onUseNationalDB,
  onUploadAnother,
  onSwitchToMode,
  onProceedAnyway,
  onClose,
}) => {
  if (!isOpen) return null;

  const isNotes = detectedDocType.includes("notes") || detectedDocType.includes("textbook") || detectedDocType.includes("chapter");

  const modalNode = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fadeIn select-none">
      <div 
        className="bg-white border-2 border-amber-300 rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-left animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warm Amber theme */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white font-mono uppercase">
                Question Paper Validation Alert
              </h3>
              <p className="text-[10.5px] text-amber-100/90 font-medium truncate max-w-[280px] sm:max-w-none">
                Uploaded: <span className="font-bold underline">{fileName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer shrink-0"
            title="Close Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Friendly Explanation Banner */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="space-y-1 text-left">
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  Yeh file Question Paper nahi lag rahi hai
                </h4>
                <p className="text-[11.5px] text-amber-900/90 leading-relaxed">
                  {reason || "AI analysis ke mutabik is document me exam question paper, numerical problems ya marking schemes (+1M, +3M, +5M) detect nahi hue hain."}
                </p>
              </div>
            </div>
          </div>

          {/* User-Friendly Action Options */}
          <div className="space-y-2.5 pt-1">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Recommended Best Options / उपयुक्त विकल्प:
            </p>

            {/* OPTION 1 (RECOMMENDED): Tap 10-Yr National DB */}
            <button
              type="button"
              onClick={onUseNationalDB}
              className="w-full bg-gradient-to-r from-[#0a3641] to-teal-900 hover:from-[#124e5d] hover:to-teal-800 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left transition-all shadow-sm group cursor-pointer border border-teal-700/60 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#c4f500] text-[#041a14] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white group-hover:text-[#c4f500] transition-colors">
                      Use 10-Yr National Question Bank
                    </span>
                    <span className="text-[9px] bg-[#c4f500]/20 text-[#c4f500] px-1.5 py-0.2 rounded font-mono font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[10.5px] text-teal-200/90 leading-tight mt-0.5">
                    <strong>{currentSubject} ({currentGrade})</strong> ke verified 10-year board questions ke sath 100% accurate 80/20 & 2026 reports generate karein.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#c4f500] shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* OPTION 2: Switch to Notes / Cheat Sheet if file is study notes */}
            {isNotes && onSwitchToMode && (
              <button
                type="button"
                onClick={() => onSwitchToMode("cheatsheet")}
                className="w-full bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950">
                      Convert to 1-Page Visual Cheat Sheet
                    </span>
                    <p className="text-[10px] text-amber-800/90 leading-tight">
                      Aapne study notes upload kiye hain — Iska visual high-yield summary chart banayein.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-700 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* OPTION 3: Upload Another PDF */}
            <button
              type="button"
              onClick={onUploadAnother}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-200 text-slate-700 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Upload Another Question Paper PDF
                  </span>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Doosra Board Exam, Pre-Board ya Sample Paper PDF select karein.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Option 4: Proceed Anyway (Small Link at bottom for flexibility) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onProceedAnyway}
              className="text-[11px] font-mono text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
            >
              Proceed with uploaded file anyway →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
};
