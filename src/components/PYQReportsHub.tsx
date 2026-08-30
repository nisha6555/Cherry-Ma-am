import React from "react";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, Target, TrendingUp, Flame, Sparkles, Database, FileText, 
  CheckCircle2, RefreshCw, Layers, Clock, Award, ShieldAlert, BookOpen,
  ArrowRight, Download, Printer, X, FileCheck, Check
} from "lucide-react";
import { PYQ8020AnalysisReport, PYQWeightageHeatmapReport, AIPredictedPaperReport } from "../types";

interface PYQReportsHubProps {
  studentDetails: {
    name: string;
    grade: string;
    subject: string;
    board: string;
  };
  uploadedPYQName: string;
  onBackToDesk: () => void;
  onOpenReport1_8020: () => void;
  onOpenReport2_Heatmap: () => void;
  onOpenReport3_PredictedPaper: () => void;
  onUploadNewPaper: () => void;
  onResetToNationalDB: () => void;
  loading8020: boolean;
  loadingHeatmap: boolean;
  loadingPredictedPaper: boolean;
  pyq8020Report: PYQ8020AnalysisReport | null;
  heatmapReport: PYQWeightageHeatmapReport | null;
  predictedPaperReport: AIPredictedPaperReport | null;
}

export const PYQReportsHub: React.FC<PYQReportsHubProps> = ({
  studentDetails,
  uploadedPYQName,
  onBackToDesk,
  onOpenReport1_8020,
  onOpenReport2_Heatmap,
  onOpenReport3_PredictedPaper,
  onUploadNewPaper,
  onResetToNationalDB,
  loading8020,
  loadingHeatmap,
  loadingPredictedPaper,
  pyq8020Report,
  heatmapReport,
  predictedPaperReport
}) => {
  const content = (
    <div className="fixed inset-0 z-[99999] w-screen w-full h-[100dvh] h-screen max-w-none max-h-none rounded-none shadow-none border-0 overflow-hidden flex flex-col bg-[#f8fafc] text-slate-800 font-sans animate-fadeIn select-none">
      {/* ================= FULL SCREEN TOP HEADER BAR ================= */}
      <div className="bg-[#0a3641] text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0 shadow-md z-30 border-b border-teal-800/80">
        {/* Left Section: Back Button & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToDesk}
            className="p-2 -ml-1 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold shrink-0 active:scale-95"
            title="Return to Syllabus Desk"
          >
            <ArrowLeft className="w-4 h-4 text-[#c4f500]" />
            <span className="hidden xs:inline">Back to Desk</span>
          </button>

          <div className="h-5 w-px bg-teal-700/60 shrink-0 hidden xs:block" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#c4f500] animate-pulse shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-white uppercase truncate font-mono flex items-center gap-2">
                <span>PYQ Intelligence & Reports Hub</span>
                <span className="hidden md:inline-flex text-[9px] bg-teal-900/90 text-teal-200 px-2 py-0.5 rounded-md font-mono border border-teal-700/50">
                  {studentDetails.grade} • {studentDetails.board || "CBSE"}
                </span>
              </h2>
              <p className="text-[10px] text-teal-200/80 font-medium hidden sm:block truncate">
                Targeting <strong>{studentDetails.subject}</strong> 10-Year Recurring Patterns & 2026 Predictions
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Source PDF Badge & Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          {uploadedPYQName ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-teal-950/80 border border-teal-600/50 px-2.5 py-1 rounded-xl">
              <FileCheck className="w-3.5 h-3.5 text-[#c4f500] shrink-0" />
              <span className="text-[10.5px] font-bold text-teal-100 font-mono truncate max-w-[130px] md:max-w-[200px]">
                {uploadedPYQName}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-xl">
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10.5px] font-bold text-amber-200 font-mono">
                10-Yr National DB
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onUploadNewPaper}
            className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-teal-500/30 text-[11px] shrink-0"
            title="Upload Different Paper PDF"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#c4f500]" />
            <span className="hidden sm:inline">Change PDF</span>
          </button>

          <button
            type="button"
            onClick={onBackToDesk}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
            title="Close Hub"
          >
            <X className="w-5 h-5 text-rose-300" />
          </button>
        </div>
      </div>

      {/* ================= SCROLLABLE FULL SCREEN BODY ================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-100/60">
        <div className="max-w-5xl mx-auto space-y-6 pb-12 select-text">
          {/* Active File Banner on Mobile */}
          {uploadedPYQName && (
            <div className="sm:hidden flex items-center justify-between bg-white border border-teal-200 rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="text-xs font-bold text-teal-950 font-mono truncate">
                  {uploadedPYQName}
                </span>
              </div>
              <button
                type="button"
                onClick={onUploadNewPaper}
                className="text-[11px] text-teal-700 hover:text-teal-950 font-bold underline shrink-0 cursor-pointer ml-2"
              >
                Change
              </button>
            </div>
          )}

          {/* Overview Intelligence Banner */}
          <div className="bg-gradient-to-r from-[#0a3641] via-teal-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-teal-800/40">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#c4f500] px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                  ⚡ 3-Tier Predictive Exam Engine
                </span>
                <span className="text-[9.5px] font-mono text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-md">
                  Evaluation Scope: 2016 – 2026
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                Question Paper Analyzed • Generate, View & Download Reports
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Aapka question paper analyze ho chuka hai. Neeche diye gaye teeno reports me se kisi bhi report ko tap karke <strong>full-screen detailed analysis view, print ya PDF download</strong> karein.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              <div className="text-center px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex-1 sm:flex-none">
                <p className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">Subject</p>
                <p className="text-sm font-black text-[#c4f500]">{studentDetails.subject}</p>
              </div>
              <div className="text-center px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex-1 sm:flex-none">
                <p className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">Target Board</p>
                <p className="text-sm font-black text-teal-300">{studentDetails.board || "CBSE"}</p>
              </div>
            </div>
          </div>

          {/* 3 Main Action Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ================= REPORT 1: 80/20 REPEAT TOPICS ================= */}
            <div className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-xs hover:shadow-md transition-all text-left group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono border border-amber-300/60">
                    Report 1 • 80/20 Rule
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    Guaranteed Repeat Topics
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Extracts the top 20% high-yield concepts that historically yield ~80% of total exam marks with recurrence probabilities.
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap gap-1.5">
                  <span className="text-[9.5px] bg-amber-50 text-amber-800 font-mono font-bold px-2 py-0.5 rounded-md border border-amber-200">
                    🎯 Recurrence Radar
                  </span>
                  <span className="text-[9.5px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-md">
                    📥 PDF Downloadable
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenReport1_8020}
                disabled={loading8020}
                className="w-full py-3 rounded-2xl bg-[#0a3641] hover:bg-[#124e5d] text-[#c4f500] text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading8020 ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#c4f500]" />
                    <span>Analyzing 80/20 Radar...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#c4f500]" />
                    <span>{pyq8020Report ? "View 80/20 Report" : "Generate 80/20 Report"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* ================= REPORT 2: MARKING HEATMAP & BLUEPRINT ================= */}
            <div className="bg-white border-2 border-cyan-200 hover:border-cyan-400 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-xs hover:shadow-md transition-all text-left group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-900 font-mono border border-cyan-300/60">
                    Report 2 • Blueprint
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    Marking Weightage Heatmap
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Chapter-wise distribution across Section A (1M), B (2M), C (3M), D (5M), & E (Case Studies) with 3-Hour Exam Time Strategy.
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap gap-1.5">
                  <span className="text-[9.5px] bg-cyan-50 text-cyan-800 font-mono font-bold px-2 py-0.5 rounded-md border border-cyan-200">
                    📊 Section Marks Map
                  </span>
                  <span className="text-[9.5px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-md">
                    ⏱️ 3-Hr Time Plan
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenReport2_Heatmap}
                disabled={loadingHeatmap}
                className="w-full py-3 rounded-2xl bg-[#0a3641] hover:bg-[#124e5d] text-cyan-300 text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loadingHeatmap ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Computing Heatmap...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>{heatmapReport ? "View Heatmap Report" : "Generate Heatmap"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* ================= REPORT 3: 2026 AI PREDICTED PAPER ================= */}
            <div className="bg-white border-2 border-rose-200 hover:border-rose-400 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-xs hover:shadow-md transition-all text-left group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 font-mono border border-rose-300/60">
                    Report 3 • 2026 Paper
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    2026 AI Predicted Board Paper
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full-length predicted board question paper with official step-wise marking (+0.5M, +1M) and evaluator common pitfall alerts.
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap gap-1.5">
                  <span className="text-[9.5px] bg-rose-50 text-rose-800 font-mono font-bold px-2 py-0.5 rounded-md border border-rose-200">
                    ✍️ Step Marking (+0.5M)
                  </span>
                  <span className="text-[9.5px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-md">
                    ⚠️ Evaluator Traps
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenReport3_PredictedPaper}
                disabled={loadingPredictedPaper}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-950 to-[#0a3641] hover:from-rose-900 hover:to-[#124e5d] text-amber-300 text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loadingPredictedPaper ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Synthesizing 2026 Paper...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-amber-300" />
                    <span>{predictedPaperReport ? "View 2026 Paper" : "Generate 2026 Paper"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Bar Options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
              <span>All 3 reports can be individually downloaded as print-ready PDF documents.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onUploadNewPaper}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold transition-all cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload Another PDF</span>
              </button>

              <button
                type="button"
                onClick={onBackToDesk}
                className="px-4 py-2 rounded-xl bg-[#0a3641] hover:bg-[#124e5d] text-[#c4f500] text-xs font-mono font-bold transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#c4f500]" />
                <span>Exit Hub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
};
