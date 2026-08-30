import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, Sparkles, Download, Clock, TrendingUp, BarChart3, 
  Layers, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp,
  FileText, ShieldCheck, RefreshCw, Copy, Check, Info, Target, AlertCircle
} from "lucide-react";
import { PYQWeightageHeatmapReport, ChapterWeightageBreakdown } from "../types";

interface PYQWeightageHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PYQWeightageHeatmapReport | null;
  isLoading: boolean;
  onRefreshOrReanalyze?: () => void;
  studentName?: string;
  addToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const PYQWeightageHeatmapModal: React.FC<PYQWeightageHeatmapModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRefreshOrReanalyze,
  studentName = "Student",
  addToast
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<"all" | "tier1" | "tier2" | "tier3">("all");
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("all");

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!report) return;
    const tier1Chaps = report.chapterBreakdowns.filter(c => c.weightageTier === "tier1_critical");
    const summaryText = `🗺️ ${report.subject} (${report.grade} ${report.board}) Marking Weightage Heatmap (10-Yr PYQ Analysis)
Generated for: ${studentName} | Total Exam Marks: ${report.totalExamMarks}

📊 Executive Blueprint:
${report.executiveHeatmapSummary}

🔥 Tier 1 Critical Chapters (Max Scoring Priority):
${tier1Chaps.map(c => `- ${c.chapterName} (~${c.totalAvgMarks} Marks / ${c.marksPercentage}%): ${c.topScoringSubTopics.join(", ")}`).join("\n")}

⏱️ 3-Hour Smart Exam Time Allocation:
- Section A (1-Mark MCQs): ${report.sectionWiseDistribution.sectionA_1Mark.targetTimeMinutes} mins
- Section B (2-Mark VSA): ${report.sectionWiseDistribution.sectionB_2Mark.targetTimeMinutes} mins
- Section C (3-Mark SA): ${report.sectionWiseDistribution.sectionC_3Mark.targetTimeMinutes} mins
- Section D (5-Mark LA): ${report.sectionWiseDistribution.sectionD_5Mark.targetTimeMinutes} mins
- Section E (Case Studies): ${report.sectionWiseDistribution.sectionE_4Mark_CaseStudy.targetTimeMinutes} mins
- 🛡️ Buffer Reserve: ${report.smartExamDayTimeStrategy.bufferReserveMins} mins`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    if (addToast) addToast("Marking Blueprint Summary copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredChapters = (report?.chapterBreakdowns || []).filter(ch => {
    if (selectedTierFilter === "tier1" && ch.weightageTier !== "tier1_critical") return false;
    if (selectedTierFilter === "tier2" && ch.weightageTier !== "tier2_important") return false;
    if (selectedTierFilter === "tier3" && ch.weightageTier !== "tier3_foundational") return false;
    if (selectedUnitFilter !== "all" && ch.unitName !== selectedUnitFilter) return false;
    return true;
  });

  const availableUnits = Array.from(new Set((report?.chapterBreakdowns || []).map(c => c.unitName).filter(Boolean)));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl border border-slate-200/80 flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* =========================================
            HEADER BAR
            ========================================= */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-[#0a3641] to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-[#0a3641] rounded-[14px] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-mono tracking-wider">
                  Report 2: Weightage Heatmap
                </span>
                <span className="text-[10px] font-bold text-cyan-200/90 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                  10-Year Trend Analysis (2016–2026)
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight flex items-center gap-2 mt-0.5">
                <span>{report?.subject || "Subject"} Marking Weightage & Section Heatmap</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshOrReanalyze && (
              <button
                type="button"
                onClick={onRefreshOrReanalyze}
                disabled={isLoading}
                title="Re-analyze 10-Yr Blueprint"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-300' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopySummary}
              title="Copy Summary"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Print or Save PDF"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================
            MODAL BODY (SCROLLABLE)
            ========================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                <BarChart3 className="w-8 h-8 text-cyan-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 font-mono">
                  Synthesizing 10-Year Marking Weightage Heatmap...
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Analyzing chapter-wise mark distributions, section typology (1M, 2M, 3M, 5M, 4M Case Studies), and exam-day time strategy.
                </p>
              </div>
            </div>
          ) : !report ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No weightage data generated yet. Click refresh to scan 10-year exam papers!
            </div>
          ) : (
            <>
              {/* Top Banner: Overview & Executive Summary */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">STUDENT:</span>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {studentName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg">
                      {report.grade} ({report.board})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {report.totalExamMarks} Marks Theory Exam
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 font-medium">
                    Analysis Span: {report.analyzedYearsSpan} (10 Years Verified)
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gradient-to-r from-cyan-50/80 to-emerald-50/80 border border-cyan-200/60 rounded-xl p-4">
                  <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                      Executive Heatmap & Priority Strategy
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {report.executiveHeatmapSummary}
                    </p>
                  </div>
                </div>

                {/* Units Horizontal Quick Metrics */}
                {report.unitSummaries && report.unitSummaries.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      Unit-Wise Weightage Breakdown
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {report.unitSummaries.map((unit, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedUnitFilter(selectedUnitFilter === unit.unitName ? "all" : unit.unitName)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                            selectedUnitFilter === unit.unitName 
                              ? 'bg-cyan-50 border-cyan-500 shadow-xs' 
                              : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 font-medium truncate" title={unit.unitName}>
                            {unit.unitName}
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-base font-black text-slate-900 font-mono">{unit.totalMarks}M</span>
                            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100/70 px-1.5 py-0.5 rounded font-mono">
                              {unit.percentageOfExam}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section-Wise Blueprint & Target Time Grid */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-sm font-black text-slate-900 uppercase font-mono tracking-wide">
                      Section-Wise Exam Blueprint & Target Times
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Total Time: 180 Mins (3 Hours)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Section A */}
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white font-mono">
                        Sec A (1M)
                      </span>
                      <span className="text-xs font-black text-blue-950 font-mono">
                        {report.sectionWiseDistribution.sectionA_1Mark.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {report.sectionWiseDistribution.sectionA_1Mark.questionCount} Questions
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {report.sectionWiseDistribution.sectionA_1Mark.description}
                    </p>
                    <div className="text-[11px] font-bold text-blue-800 font-mono bg-blue-100/80 px-2 py-1 rounded-md text-center">
                      ⏱️ Target: {report.sectionWiseDistribution.sectionA_1Mark.targetTimeMinutes} Mins
                    </div>
                  </div>

                  {/* Section B */}
                  <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-600 text-white font-mono">
                        Sec B (2M)
                      </span>
                      <span className="text-xs font-black text-teal-950 font-mono">
                        {report.sectionWiseDistribution.sectionB_2Mark.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {report.sectionWiseDistribution.sectionB_2Mark.questionCount} Questions
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {report.sectionWiseDistribution.sectionB_2Mark.description}
                    </p>
                    <div className="text-[11px] font-bold text-teal-800 font-mono bg-teal-100/80 px-2 py-1 rounded-md text-center">
                      ⏱️ Target: {report.sectionWiseDistribution.sectionB_2Mark.targetTimeMinutes} Mins
                    </div>
                  </div>

                  {/* Section C */}
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-600 text-white font-mono">
                        Sec C (3M)
                      </span>
                      <span className="text-xs font-black text-amber-950 font-mono">
                        {report.sectionWiseDistribution.sectionC_3Mark.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {report.sectionWiseDistribution.sectionC_3Mark.questionCount} Questions
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {report.sectionWiseDistribution.sectionC_3Mark.description}
                    </p>
                    <div className="text-[11px] font-bold text-amber-800 font-mono bg-amber-100/80 px-2 py-1 rounded-md text-center">
                      ⏱️ Target: {report.sectionWiseDistribution.sectionC_3Mark.targetTimeMinutes} Mins
                    </div>
                  </div>

                  {/* Section D */}
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-600 text-white font-mono">
                        Sec D (5M)
                      </span>
                      <span className="text-xs font-black text-purple-950 font-mono">
                        {report.sectionWiseDistribution.sectionD_5Mark.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {report.sectionWiseDistribution.sectionD_5Mark.questionCount} Questions
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {report.sectionWiseDistribution.sectionD_5Mark.description}
                    </p>
                    <div className="text-[11px] font-bold text-purple-800 font-mono bg-purple-100/80 px-2 py-1 rounded-md text-center">
                      ⏱️ Target: {report.sectionWiseDistribution.sectionD_5Mark.targetTimeMinutes} Mins
                    </div>
                  </div>

                  {/* Section E */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                        Sec E (Case)
                      </span>
                      <span className="text-xs font-black text-emerald-950 font-mono">
                        {report.sectionWiseDistribution.sectionE_4Mark_CaseStudy.totalMarks} Marks
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {report.sectionWiseDistribution.sectionE_4Mark_CaseStudy.questionCount} Case Studies
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                      {report.sectionWiseDistribution.sectionE_4Mark_CaseStudy.description}
                    </p>
                    <div className="text-[11px] font-bold text-emerald-800 font-mono bg-emerald-100/80 px-2 py-1 rounded-md text-center">
                      ⏱️ Target: {report.sectionWiseDistribution.sectionE_4Mark_CaseStudy.targetTimeMinutes} Mins
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Chapter-Wise Interactive Heatmap */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Chapter-Wise Marking Heatmap ({filteredChapters.length} Chapters)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sorted by average marks contribution in 10-year board examination history.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedTierFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedTierFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({report.chapterBreakdowns.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTierFilter("tier1")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedTierFilter === "tier1" ? "bg-rose-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🔥 Tier 1 Critical (10+M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTierFilter("tier2")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedTierFilter === "tier2" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ⚡ Tier 2 (6-9M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTierFilter("tier3")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedTierFilter === "tier3" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📚 Tier 3 (2-5M)
                    </button>
                  </div>
                </div>

                {/* Chapter Heatmap Cards */}
                <div className="space-y-3">
                  {filteredChapters.map((chapter) => {
                    const isExpanded = expandedChapterId === chapter.id;
                    const isTier1 = chapter.weightageTier === "tier1_critical";
                    const isTier2 = chapter.weightageTier === "tier2_important";

                    return (
                      <div
                        key={chapter.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isTier1 
                            ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300' 
                            : isTier2 
                            ? 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300' 
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Score Box */}
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-mono shadow-xs border ${
                              isTier1 
                                ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white border-rose-400' 
                                : isTier2 
                                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-300 font-bold' 
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                              <span className="text-lg font-black leading-none">{chapter.totalAvgMarks}</span>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-90 mt-0.5">Marks</span>
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                                  isTier1 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : isTier2 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isTier1 ? '🔥 Critical Priority' : isTier2 ? '⚡ High Yield' : '📚 Foundational'}
                                </span>
                                {chapter.unitName && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Unit: {chapter.unitName}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded font-mono">
                                  {chapter.marksPercentage}% of Exam
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                                {chapter.chapterName}
                              </h4>
                              <p className="text-xs text-slate-600 truncate max-w-xl">
                                {chapter.topScoringSubTopics.join(" • ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Trend Indicator */}
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 text-xs font-mono">
                              <TrendingUp className={`w-3.5 h-3.5 ${
                                chapter.tenYearTrend.trendDirection === "rising" ? "text-emerald-600" : "text-cyan-600"
                              }`} />
                              <span className="capitalize font-bold">{chapter.tenYearTrend.trendDirection} Trend</span>
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Chapter Section Details */}
                        {isExpanded && (
                          <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-100 space-y-4 bg-white/70">
                            {/* Sections breakdown pills */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                                Expected Section Distribution:
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/60 font-bold">
                                  1M MCQs: {chapter.sectionsBreakdown.sectionA_MCQ} Qs
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 font-bold">
                                  2M VSA: {chapter.sectionsBreakdown.sectionB_VSA} Qs
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 font-bold">
                                  3M SA: {chapter.sectionsBreakdown.sectionC_SA} Qs
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60 font-bold">
                                  5M LA: {chapter.sectionsBreakdown.sectionD_LA} Qs
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold">
                                  4M Case: {chapter.sectionsBreakdown.sectionE_CaseStudy} Qs
                                </span>
                              </div>
                            </div>

                            {/* 10-Year Trend Commentary */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                                <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
                                <span>10-Year Historical Trend Analysis & Insights:</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">
                                {chapter.tenYearTrend.trendCommentary}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                                <span>Avg: {chapter.tenYearTrend.avgHistoricalMarks} Marks</span>
                                <span>•</span>
                                <span>Max in Single Year: {chapter.tenYearTrend.highestEverMarksInSingleYear} Marks</span>
                                <span>•</span>
                                <span>Recommended Revision: {chapter.timeAllocationRecommendedMins} Mins</span>
                              </div>
                            </div>

                            {/* High-Scoring Sub Topics */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                                Top Repeat Sub-Topics in Past 10 Years:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {chapter.topScoringSubTopics.map((sub, sIdx) => (
                                  <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-800 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{sub}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Smart Exam Day 3-Hour Time Allocation Strategy */}
              {report.smartExamDayTimeStrategy && (
                <div className="bg-gradient-to-br from-[#0a3641] to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-cyan-300" />
                      <h3 className="text-sm sm:text-base font-black uppercase font-mono tracking-wider text-cyan-200">
                        Smart Exam Day 3-Hour Time Execution Strategy
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-cyan-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                      100/100 Protocol
                    </span>
                  </div>

                  {/* 15 Mins Reading Strategy */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider">
                      📖 15-Minute Reading Time Checklist (Before Writing):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {report.smartExamDayTimeStrategy.readingTime15MinsPlan.map((plan, pIdx) => (
                        <div key={pIdx} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-slate-200 leading-relaxed">
                          <span className="font-bold text-cyan-400 mr-1 font-mono">0{pIdx + 1}.</span> {plan}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5-Phase Section Order Roadmap */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider">
                      🚀 Recommended Writing Phase Order:
                    </div>
                    <div className="space-y-2">
                      {report.smartExamDayTimeStrategy.sectionOrderSuggestion.map((order, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-mono text-slate-200">
                          <span className="w-6 h-6 rounded-lg bg-cyan-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                            {oIdx + 1}
                          </span>
                          <span className="leading-snug">{order}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* =========================================
            FOOTER ACTIONS
            ========================================= */}
        <div className="px-5 py-4 sm:px-8 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-500 font-medium hidden sm:block font-mono">
            Maestry AI Board Blueprint Engine • Report 2/3
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span>Close Blueprint</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
