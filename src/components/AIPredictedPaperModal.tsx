import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, Sparkles, Download, Clock, Award, FileText, CheckCircle2, 
  ChevronDown, ChevronUp, Eye, EyeOff, AlertTriangle, BookOpen, 
  Copy, Check, RefreshCw, HelpCircle, Flame, Layers, Hash
} from "lucide-react";
import { AIPredictedPaperReport, PredictedQuestionItem } from "../types";

interface AIPredictedPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AIPredictedPaperReport | null;
  isLoading: boolean;
  onRefreshOrReanalyze?: () => void;
  studentName?: string;
  addToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const AIPredictedPaperModal: React.FC<AIPredictedPaperModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRefreshOrReanalyze,
  studentName = "Student",
  addToast
}) => {
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<"all" | "A" | "B" | "C" | "D" | "E">("all");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});
  const [showAllSolutions, setShowAllSolutions] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "instructions" | "tips">("questions");

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestionIds(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleToggleAllSolutions = () => {
    const nextState = !showAllSolutions;
    setShowAllSolutions(nextState);
    if (report?.questions) {
      const newMap: Record<string, boolean> = {};
      report.questions.forEach(q => {
        newMap[q.id] = nextState;
      });
      setExpandedQuestionIds(newMap);
    }
  };

  const handleCopyPaper = () => {
    if (!report) return;
    const paperText = `🎲 ${report.paperCode} - AI PREDICTED BOARD EXAMINATION PAPER 2026
Subject: ${report.subject} | Grade: ${report.grade} (${report.board}) | Total Marks: ${report.totalMarks} | Time: ${report.totalTimeMinutes} mins

GENERAL INSTRUCTIONS:
${report.generalInstructions.map((ins, i) => `${i + 1}. ${ins}`).join("\n")}

QUESTIONS & STEP-WISE SOLUTIONS:
${report.questions.map((q) => {
  return `\n[Q${q.questionNumber}] (${q.section}) [${q.marks} Mark${q.marks > 1 ? 's' : ''}] - Chapter: ${q.chapter} (Confidence: ${q.predictionConfidence}% | PYQ: ${q.pyqReferenceYears.join(", ")})
${q.questionText}
${q.options ? q.options.join("\n") : ""}
${q.hasInternalChoice ? `\n[OR]\n${q.orAlternativeQuestionText}` : ""}
Official Solution / Marking Scheme:
${q.officialMarkingScheme.stepWiseMarks.map(s => `• ${s.step} [${s.marksAwarded}M]`).join("\n")}
Final Answer: ${q.officialMarkingScheme.finalAnswer}
Trap / Warning: ${q.officialMarkingScheme.commonMistakesWarning}`;
}).join("\n\n------------------------------\n")}`;

    navigator.clipboard.writeText(paperText);
    setCopied(true);
    if (addToast) addToast("Predicted Question Paper & Marking Scheme copied!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredQuestions = (report?.questions || []).filter(q => {
    if (selectedSectionFilter === "all") return true;
    return q.section === selectedSectionFilter;
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl border border-slate-200/80 flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* =========================================
            HEADER BAR
            ========================================= */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-[#182830] to-slate-950 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#0d2129] rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-mono tracking-wider">
                  Report 3: AI Predicted Paper 2026
                </span>
                <span className="text-[10px] font-bold text-amber-200/90 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                  Official Blueprint & Step Marking
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight flex items-center gap-2 mt-0.5">
                <span>{report?.paperCode || "Predicted Board Examination Paper 2026"}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshOrReanalyze && (
              <button
                type="button"
                onClick={onRefreshOrReanalyze}
                disabled={isLoading}
                title="Re-predict Exam Paper"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyPaper}
              title="Copy Question Paper"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              title="Print or Save PDF"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-sm"
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
            SUB-NAVIGATION BAR
            ========================================= */}
        <div className="px-5 py-2.5 sm:px-8 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                activeTab === "questions" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 bg-white"
              }`}
            >
              📄 Predicted Paper ({report?.questions?.length || 0} Qs)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("instructions")}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                activeTab === "instructions" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 bg-white"
              }`}
            >
              📋 General Instructions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tips")}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all cursor-pointer ${
                activeTab === "tips" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 bg-white"
              }`}
            >
              💡 High-Score Pro-Tips
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAllSolutions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300/80 text-slate-800 font-bold text-xs font-mono hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              {showAllSolutions ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{showAllSolutions ? "Hide Solutions (Practice Mode)" : "Reveal All Solutions & Marking"}</span>
            </button>
          </div>
        </div>

        {/* =========================================
            MODAL BODY (SCROLLABLE)
            ========================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
                <Flame className="w-8 h-8 text-amber-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 font-mono">
                  Synthesizing 2026 AI Predicted Board Paper...
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Analyzing 10 years of pattern shifts, syllabus weightage matrices, and question blueprints to generate exact prediction sets.
                </p>
              </div>
            </div>
          ) : !report ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No predicted exam paper available. Click refresh to generate the 2026 predicted paper!
            </div>
          ) : (
            <>
              {/* Top Meta Summary Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 font-mono">CANDIDATE:</span>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {studentName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {report.subject} ({report.grade} - {report.board})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                      Max Marks: {report.totalMarks} | Time: 3 Hours
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Academic Year: {report.academicYear} Verified</span>
                  </div>
                </div>

                {/* Section Quick Summary Pills */}
                {report.sectionsSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    <div 
                      onClick={() => setSelectedSectionFilter("A")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSectionFilter === "A" ? "bg-blue-50 border-blue-500 shadow-xs" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-blue-700">
                        <span>SEC A (1M)</span>
                        <span>{report.sectionsSummary.sectionA.totalMarks}M</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                        {report.sectionsSummary.sectionA.questionCount} Questions
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedSectionFilter("B")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSectionFilter === "B" ? "bg-teal-50 border-teal-500 shadow-xs" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-teal-700">
                        <span>SEC B (2M)</span>
                        <span>{report.sectionsSummary.sectionB.totalMarks}M</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                        {report.sectionsSummary.sectionB.questionCount} Questions
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedSectionFilter("C")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSectionFilter === "C" ? "bg-amber-50 border-amber-500 shadow-xs" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-amber-700">
                        <span>SEC C (3M)</span>
                        <span>{report.sectionsSummary.sectionC.totalMarks}M</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                        {report.sectionsSummary.sectionC.questionCount} Questions
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedSectionFilter("D")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSectionFilter === "D" ? "bg-purple-50 border-purple-500 shadow-xs" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-purple-700">
                        <span>SEC D (5M)</span>
                        <span>{report.sectionsSummary.sectionD.totalMarks}M</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                        {report.sectionsSummary.sectionD.questionCount} Questions
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedSectionFilter("E")}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedSectionFilter === "E" ? "bg-emerald-50 border-emerald-500 shadow-xs" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-emerald-700">
                        <span>SEC E (Case)</span>
                        <span>{report.sectionsSummary.sectionE.totalMarks}M</span>
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                        {report.sectionsSummary.sectionE.questionCount} Cases
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tab 1: Questions & Step Marking View */}
              {activeTab === "questions" && (
                <div className="space-y-4">
                  {/* Section Filters */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Predicted Question Set ({filteredQuestions.length} Questions Shown)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click on any question to inspect step-wise marking scheme & danger warnings.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("all")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        All Sections
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("A")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "A" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sec A (1M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("B")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "B" ? "bg-teal-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sec B (2M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("C")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "C" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sec C (3M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("D")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "D" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sec D (5M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionFilter("E")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSectionFilter === "E" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sec E (4M)
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  <div className="space-y-3.5">
                    {filteredQuestions.map((q) => {
                      const isExpanded = expandedQuestionIds[q.id] || showAllSolutions;

                      return (
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                        >
                          {/* Question Header & Body */}
                          <div className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs font-mono flex items-center justify-center shadow-xs">
                                  Q{q.questionNumber}
                                </span>
                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono ${
                                  q.section === "A" ? "bg-blue-100 text-blue-800" :
                                  q.section === "B" ? "bg-teal-100 text-teal-800" :
                                  q.section === "C" ? "bg-amber-100 text-amber-800" :
                                  q.section === "D" ? "bg-purple-100 text-purple-800" :
                                  "bg-emerald-100 text-emerald-800"
                                }`}>
                                  Section {q.section} • {q.marks} Mark{q.marks > 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono font-medium">
                                  {q.chapter} ({q.topic})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-amber-600" />
                                  <span>{q.predictionConfidence}% Prediction Score</span>
                                </span>
                                {q.pyqReferenceYears && q.pyqReferenceYears.length > 0 && (
                                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                    PYQ: {q.pyqReferenceYears.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Question Content */}
                            <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line pl-1">
                              {q.questionText}
                            </div>

                            {/* Options if MCQ */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 font-mono">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Internal Choice Alternative */}
                            {q.hasInternalChoice && q.orAlternativeQuestionText && (
                              <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                                <div className="text-[10px] font-extrabold text-amber-800 uppercase font-mono tracking-wider">
                                  [OR ALTERNATIVE CHOICE QUESTION]:
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                                  {q.orAlternativeQuestionText}
                                </p>
                              </div>
                            )}

                            {/* Toggle Solution Button */}
                            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => toggleQuestionExpand(q.id)}
                                className="flex items-center gap-1.5 text-xs font-bold font-mono text-indigo-600 hover:text-indigo-800 cursor-pointer py-1"
                              >
                                {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{isExpanded ? "Hide Marking Scheme" : "View Official Step-Wise Marking Scheme"}</span>
                              </button>

                              <span className="text-[11px] font-mono text-slate-400">
                                {isExpanded ? "Solution Expanded" : "Answer Hidden"}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Marking Scheme & Solution Details */}
                          {isExpanded && (
                            <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-3 bg-slate-50 border-t border-slate-100 space-y-3.5 text-xs">
                              {/* Step-Wise Marks Breakdown */}
                              <div className="space-y-2">
                                <div className="font-extrabold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Official CBSE Step-Wise Marking Scheme:</span>
                                </div>
                                <div className="space-y-1.5">
                                  {q.officialMarkingScheme.stepWiseMarks.map((stepItem, sIdx) => (
                                    <div key={sIdx} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80">
                                      <div className="flex items-start gap-2">
                                        <span className="text-slate-400 font-mono font-bold shrink-0">{sIdx + 1}.</span>
                                        <span className="text-slate-800 leading-snug font-medium">{stepItem.step}</span>
                                      </div>
                                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                                        +{stepItem.marksAwarded} M
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Final Answer Highlight Box */}
                              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="font-bold text-emerald-950 font-mono">Final Required Answer:</span>
                                  <span className="text-emerald-900 font-extrabold font-mono">{q.officialMarkingScheme.finalAnswer}</span>
                                </div>
                                {q.officialMarkingScheme.keyConceptOrFormula && (
                                  <div className="text-[11px] font-mono text-emerald-800 bg-white/70 px-2 py-0.5 rounded border border-emerald-200/60">
                                    Concept: {q.officialMarkingScheme.keyConceptOrFormula}
                                  </div>
                                )}
                              </div>

                              {/* Common Trap Warning */}
                              {q.officialMarkingScheme.commonMistakesWarning && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-900">
                                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <span className="font-extrabold font-mono uppercase text-[10px] tracking-wider text-rose-800">
                                      ⚠️ Danger Trap & Student Pitfall:
                                    </span>
                                    <p className="text-[11px] leading-relaxed">
                                      {q.officialMarkingScheme.commonMistakesWarning}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: General Instructions */}
              {activeTab === "instructions" && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-black text-slate-900 font-mono uppercase tracking-wide">
                      Standard Board Examination Instructions & Protocol
                    </h3>
                  </div>
                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    {report.generalInstructions.map((ins, iIdx) => (
                      <div key={iIdx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold font-mono flex items-center justify-center shrink-0">
                          {iIdx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: High Score Pro-Tips */}
              {activeTab === "tips" && (
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <h3 className="text-base font-black uppercase font-mono tracking-wider text-amber-200">
                      Top Examiner Insights for 100/100 Marks
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {report.highProbabilityScoreTips.map((tip, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-3 bg-white/5 border border-white/10 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed">
                        <span className="text-amber-400 font-bold font-mono text-sm shrink-0">#{tIdx + 1}</span>
                        <span className="font-mono text-slate-100">{tip}</span>
                      </div>
                    ))}
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
            Maestry AI 2026 Predicted Examination Engine • Report 3/3
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
              <span>Close Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
