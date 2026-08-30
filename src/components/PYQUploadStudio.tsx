import React, { useRef } from "react";
import { 
  Upload, FileText, Sparkles, RefreshCw, Layers, CheckCircle2, ShieldCheck, Target, TrendingUp, Flame
} from "lucide-react";

interface PYQUploadStudioProps {
  studentDetails: {
    name: string;
    grade: string;
    subject: string;
    board: string;
  };
  uploadedPYQName: string;
  isUploading: boolean;
  onUploadFile: (file: File) => void;
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const PYQUploadStudio: React.FC<PYQUploadStudioProps> = ({
  studentDetails,
  uploadedPYQName,
  isUploading,
  onUploadFile,
  addToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border border-slate-200/80 rounded-[28px] p-4 shadow-xs text-left space-y-3 animate-fadeIn">
      {/* Studio Header (Matches Explainer / Doubt / Mistake Header style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <h4 className="text-xs font-mono font-bold uppercase text-[#0a3641] tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#008069] animate-pulse" />
          <span>PYQ Intelligence Studio / प्रश्न पत्र विश्लेषण</span>
        </h4>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2.5 py-0.5 rounded-lg border border-teal-200/60 font-mono">
            {studentDetails.grade} • {studentDetails.board || "CBSE"}
          </span>
          <span className="hidden sm:inline-block text-[9.5px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
            {studentDetails.subject}
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadFile(file);
        }}
      />

      {/* Upload Drop Container (Matches Explainer / Doubt / Mistake Upload Box) */}
      <div className="space-y-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              onUploadFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          className="border-2 border-dashed border-teal-200/90 hover:border-[#0a3641]/60 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl flex flex-col items-center justify-center text-center p-5 space-y-2.5 transition-all duration-300 cursor-pointer group min-h-[140px] active:scale-[0.99] relative overflow-hidden shadow-2xs"
        >
          {isUploading ? (
            <div className="space-y-2.5 flex flex-col items-center z-10 py-1">
              <RefreshCw className="w-6 h-6 text-[#0a3641] animate-spin" />
              <p className="text-[11px] font-mono font-bold text-[#0a3641] uppercase tracking-wider animate-pulse leading-none">
                Analyzing Question Paper...
              </p>
              <p className="text-[9px] text-slate-500 leading-normal max-w-[240px]">
                Extracting questions, weightage patterns & preparing Reports Hub...
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-white border border-teal-150 group-hover:scale-105 transition-transform shadow-3xs">
                <Upload className="w-5 h-5 text-teal-600 group-hover:text-[#0a3641] transition-colors" />
              </div>
              <div className="space-y-1 z-10">
                <p className="text-[11px] font-black text-slate-800 leading-snug">
                  Upload Question Paper, Sample Paper or 10-Yr PYQ PDF
                </p>
                <p className="text-[8.5px] text-slate-400 max-w-[260px] mx-auto leading-normal font-medium">
                  Drag PDF, PNG, JPG files here or tap to select. Auto-generates 80/20 & 2026 Predictions.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Feature Highlights Footer Badges */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-center">
            <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-amber-900 font-mono truncate">80/20 High-Yield</span>
          </div>

          <div className="bg-cyan-50/60 border border-cyan-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-center">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-cyan-900 font-mono truncate">Weightage Map</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-center">
            <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-rose-900 font-mono truncate">2026 Prediction</span>
          </div>
        </div>
      </div>
    </div>
  );
};
