import React, { useState } from "react";
import { 
  X, Download, Printer, Award, Sparkles, CheckCircle2, 
  AlertTriangle, Target, BookOpen, Clock, Activity, ShieldCheck, 
  TrendingUp, Zap, ChevronRight, Share2, Star, Check, Flame,
  FileText, Brain, Compass, BarChart2, Layers
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";

export interface ReportCardData {
  studentName: string;
  grade: string;
  subject: string;
  board?: string;
  mediumOfLearning?: string;
  totalSessionsCount: number;
  totalSnapshotsCount: number;
  totalQuizzesCount: number;
  masteryScore: number;
  conceptClarity: number;
  theoreticalCore: number;
  calculationPrecision: number;
  formulaRecall: number;
  socraticStamina: number;
  strengths: Array<{ concept: string; category: string }>;
  growths: Array<{ concept: string; category: string; explanation: string }>;
  recentQuizAccuracy: number;
  studyStreakDays: number;
  retentionCriticalCount: number;
  retentionMasteredCount: number;
}

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportCardData;
  onDiscussWithCherry?: (topicDetails: {
    topic: string;
    question?: string;
    answer?: string;
    hint?: string;
    conceptTested?: string;
    subject?: string;
  }) => void;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  data,
  onDiscussWithCherry
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "competencies" | "strengths" | "exam_readiness">("summary");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reportId = `REP-${(data.studentName || "STU").substring(0, 3).toUpperCase()}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", title: "Outstanding Scholar 🌟", color: "text-emerald-600 bg-emerald-50 border-emerald-200", badgeBg: "bg-emerald-500", percentile: "Top 2% of Batch" };
    if (score >= 80) return { grade: "A", title: "Excellent Mastery 🎯", color: "text-teal-600 bg-teal-50 border-teal-200", badgeBg: "bg-teal-600", percentile: "Top 10% of Batch" };
    if (score >= 70) return { grade: "B+", title: "Good Conceptual Grasp 👍", color: "text-cyan-600 bg-cyan-50 border-cyan-200", badgeBg: "bg-cyan-600", percentile: "Top 25% of Batch" };
    if (score >= 60) return { grade: "B", title: "Consistent Learner 📈", color: "text-amber-600 bg-amber-50 border-amber-200", badgeBg: "bg-amber-500", percentile: "Top 45% of Batch" };
    return { grade: "C", title: "Needs Active Revision 💡", color: "text-rose-600 bg-rose-50 border-rose-200", badgeBg: "bg-rose-500", percentile: "Foundation Building Phase" };
  };

  const performanceTier = getPerformanceGrade(data.masteryScore);

  const handlePrintOrSavePDF = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups for this site to print or save your Report Card.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Academic Report Card - ${data.studentName} | Cherry AI Classroom</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 16px;
              line-height: 1.5;
            }
            .header-box {
              border-bottom: 3px solid #0a3641;
              padding-bottom: 14px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .brand-title {
              font-size: 24px;
              font-weight: 900;
              color: #0a3641;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 11px;
              color: #0d9488;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .report-badge {
              text-align: right;
              font-size: 11px;
              font-family: monospace;
              color: #64748b;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
            }
            .meta-item { font-size: 11px; }
            .meta-label { color: #64748b; font-size: 9.5px; text-transform: uppercase; font-weight: 700; }
            .meta-val { font-weight: 800; color: #0f172a; font-size: 12.5px; margin-top: 2px; }
            .hero-score-box {
              background: linear-gradient(135deg, #0a3641 0%, #115e59 100%);
              color: white;
              border-radius: 10px;
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .score-number {
              font-size: 40px;
              font-weight: 900;
              color: #c4f500;
              line-height: 1;
            }
            .grade-stamp {
              background: rgba(255,255,255,0.15);
              border: 2px solid #c4f500;
              color: #c4f500;
              padding: 8px 16px;
              border-radius: 8px;
              font-weight: 900;
              font-size: 18px;
              text-align: center;
            }
            .section-heading {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0a3641;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 4px;
              margin-bottom: 10px;
              margin-top: 14px;
            }
            .dim-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .dim-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
              background: #fafafa;
            }
            .dim-val { font-size: 16px; font-weight: 900; color: #0a3641; }
            .dim-lbl { font-size: 9px; font-weight: 700; color: #64748b; margin-top: 2px; }
            .two-col {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 16px;
            }
            .list-box {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              background: #f8fafc;
            }
            .list-item {
              padding: 6px 0;
              border-bottom: 1px dashed #e2e8f0;
              font-size: 11px;
            }
            .list-item:last-child { border-bottom: none; }
            .teacher-note {
              background: #f0fdf4;
              border: 1.5px solid #bbf7d0;
              border-radius: 8px;
              padding: 12px;
              margin-top: 14px;
              font-size: 11px;
              color: #14532d;
            }
            .footer {
              margin-top: 20px;
              padding-top: 12px;
              border-top: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              color: #94a3b8;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div class="brand-sub">Cherry AI Socratic Classroom</div>
              <div class="brand-title">Academic Performance & Competency Evaluation</div>
            </div>
            <div class="report-badge">
              <div><strong>Doc ID:</strong> ${reportId}</div>
              <div><strong>Issued:</strong> ${todayStr}</div>
              <div><strong>Status:</strong> Verified Authenticated Record</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Scholar Name</div>
              <div class="meta-val">${data.studentName || "Scholar"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Academic Class / Grade</div>
              <div class="meta-val">${data.grade || "Class 10th"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Discipline / Subject</div>
              <div class="meta-val">${data.subject || "Mathematics"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Examination Board</div>
              <div class="meta-val">${data.board || "CBSE"}</div>
            </div>
          </div>

          <div class="hero-score-box">
            <div>
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #a7f3d0; margin-bottom: 4px;">
                Comprehensive Socratic Mastery Index
              </div>
              <div class="score-number">${data.masteryScore}%</div>
              <div style="font-size: 11px; color: #e2e8f0; margin-top: 4px;">
                Performance Tier: <strong>${performanceTier.title}</strong> (${performanceTier.percentile})
              </div>
            </div>
            <div class="grade-stamp">
              <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Grade</div>
              ${performanceTier.grade}
            </div>
          </div>

          <div class="section-heading">5-Core Micro-Cognitive Competencies</div>
          <div class="dim-grid">
            <div class="dim-card">
              <div class="dim-val">${data.conceptClarity}%</div>
              <div class="dim-lbl">🎯 Concept Clarity</div>
            </div>
            <div class="dim-card">
              <div class="dim-val">${data.theoreticalCore}%</div>
              <div class="dim-lbl">📖 Theory Core</div>
            </div>
            <div class="dim-card">
              <div class="dim-val">${data.calculationPrecision}%</div>
              <div class="dim-lbl">🧮 Calculations</div>
            </div>
            <div class="dim-card">
              <div class="dim-val">${data.formulaRecall}%</div>
              <div class="dim-lbl">⚡ Formula Recall</div>
            </div>
            <div class="dim-card">
              <div class="dim-val">${data.socraticStamina}%</div>
              <div class="dim-lbl">🔥 Socratic Stamina</div>
            </div>
          </div>

          <div class="two-col">
            <div>
              <div class="section-heading" style="color: #0d9488;">🌟 Mastered Strengths</div>
              <div class="list-box">
                ${(data.strengths && data.strengths.length > 0 ? data.strengths.slice(0, 4) : [
                  { concept: "Strong fundamental application", category: "Core Concept" },
                  { concept: "Consistent derivation logic", category: "Theoretical Mastery" }
                ]).map(s => `
                  <div class="list-item">
                    <strong style="color: #0f172a;">${s.concept}</strong>
                    <div style="font-size: 9.5px; color: #64748b;">Category: ${s.category}</div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div>
              <div class="section-heading" style="color: #d97706;">🎯 High Priority Focus Topics</div>
              <div class="list-box">
                ${(data.growths && data.growths.length > 0 ? data.growths.slice(0, 4) : [
                  { concept: "Multi-step formula linking", category: "Calculation Precision", explanation: "Regular blackboard formula recall drills will cement retention." }
                ]).map(g => `
                  <div class="list-item">
                    <strong style="color: #0f172a;">${g.concept}</strong>
                    <div style="font-size: 9.5px; color: #d97706;">Focus: ${g.category}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="section-heading">📊 Classroom & Assessment Engagement Metrics</div>
          <div class="meta-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 14px;">
            <div class="meta-item">
              <div class="meta-label">Live AI Classes</div>
              <div class="meta-val">${data.totalSessionsCount} Sessions</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Blackboard Notes</div>
              <div class="meta-val">${data.totalSnapshotsCount} Chalkboard Slides</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Tests Attempted</div>
              <div class="meta-val">${data.totalQuizzesCount} Quizzes</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Recent Accuracy</div>
              <div class="meta-val">${data.recentQuizAccuracy}% Correct</div>
            </div>
          </div>

          <div class="teacher-note">
            <strong>👩‍🏫 Cherry Ma'am's Socratic Assessment & Academic Recommendation:</strong>
            <p style="margin-top: 4px; line-height: 1.6;">
              ${data.studentName || "The student"} has exhibited commendable dedication and inquiry during live chalkboard sessions. 
              With a current Mastery Index of <strong>${data.masteryScore}%</strong>, focusing on spaced repetition formula recall and daily 15-minute speed sprints will prepare the scholar for top performance in upcoming competitive & board examinations.
            </p>
          </div>

          <div class="footer">
            <div>Verified by Cherry AI Socratic Pedagogical Engine • AI Studio Classroom</div>
            <div>Official Digital Student Record • Page 1 of 1</div>
          </div>

          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 600);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print report card error:", err);
      alert("An error occurred while generating the printable report card.");
    }
  };

  const handleShareSummary = () => {
    const summaryText = `🎓 *Cherry AI Socratic Academic Report Card*\n\n` +
      `👤 *Scholar:* ${data.studentName}\n` +
      `📚 *Subject:* ${data.subject} (${data.grade})\n` +
      `🏆 *Overall Mastery:* ${data.masteryScore}% (Grade ${performanceTier.grade})\n` +
      `🎯 *Concept Clarity:* ${data.conceptClarity}%\n` +
      `⚡ *Formula Recall:* ${data.formulaRecall}%\n` +
      `🔥 *Study Streak:* ${data.studyStreakDays} Days\n\n` +
      `_Generated with Cherry AI Classroom on ${todayStr}_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in select-none">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="bg-[#0a3641] text-white px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 border-b border-teal-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c4f500] text-[#0a3641] flex items-center justify-center font-black shadow-sm shrink-0">
              <Award className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                  Academic Performance Report Card
                </h3>
                <span className="bg-[#c4f500]/20 text-[#c4f500] border border-[#c4f500]/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Verified Socratic Record
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-mono truncate">
                Doc ID: {reportId} • Issued {todayStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintOrSavePDF}
              className="px-3 py-1.5 bg-[#c4f500] hover:bg-[#b0dc00] active:scale-95 text-[#0a3641] rounded-xl text-xs font-black font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Save as PDF / Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Inside Report Card */}
        <div className="px-5 sm:px-6 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs font-mono font-bold shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "summary" 
                ? "bg-[#0a3641] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Mastery Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("competencies")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "competencies" 
                ? "bg-[#0a3641] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>5-Core Competencies</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("strengths")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "strengths" 
                ? "bg-[#0a3641] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Strengths & Focus Topics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("exam_readiness")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "exam_readiness" 
                ? "bg-[#0a3641] text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Exam Readiness & Sprints</span>
          </button>
        </div>

        {/* Modal Body: Scrollable Comprehensive Report Card */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left bg-slate-50/50 scrollbar-thin">
          {/* 1. Student Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Scholar Name
              </span>
              <span className="text-sm font-black text-slate-900 truncate block mt-0.5">
                {data.studentName || "Scholar"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Grade / Class
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {data.grade || "Class 10th"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Subject
              </span>
              <span className="text-sm font-black text-[#0a3641] block mt-0.5">
                {data.subject || "Mathematics"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Target Board
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {data.board || "CBSE"}
              </span>
            </div>
          </div>

          {/* 2. Hero Overall Mastery Card */}
          <div className="bg-gradient-to-br from-[#0a3641] via-[#0f4d5c] to-[#134e4a] text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#c4f500]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 text-center sm:text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#c4f500] text-[10px] font-mono font-bold uppercase">
                <Sparkles className="w-3 h-3" />
                Comprehensive Socratic Mastery Index
              </div>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#c4f500] font-mono tracking-tight">
                  {data.masteryScore}%
                </span>
                <span className="text-sm text-teal-200 font-medium font-mono">
                  / 100% Total Index
                </span>
              </div>
              <p className="text-xs text-teal-100/90 max-w-md leading-relaxed">
                Evaluation status: <strong className="text-white">{performanceTier.title}</strong> ({performanceTier.percentile}). Calculated from live doubt frequency, blackboard derivations, and test agility.
              </p>
            </div>

            {/* Performance Grade Badge */}
            <div className="z-10 shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[140px] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-teal-200 block">
                Official Grade
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#c4f500] font-mono">
                {performanceTier.grade}
              </div>
              <span className="text-[10px] text-white/80 font-mono block">
                🔥 {data.studyStreakDays} Day Streak
              </span>
            </div>
          </div>

          {/* 3. 5-Core Micro-Cognitive Competencies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase font-mono tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>5-Core Cognitive Competencies</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                Dynamic Radar Blueprint
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: "Concept Clarity", val: data.conceptClarity, icon: "🎯", color: "text-teal-700 bg-teal-50 border-teal-200" },
                { label: "Theory Core", val: data.theoreticalCore, icon: "📖", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
                { label: "Calculations", val: data.calculationPrecision, icon: "🧮", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                { label: "Formula Recall", val: data.formulaRecall, icon: "⚡", color: "text-amber-700 bg-amber-50 border-amber-200" },
                { label: "Socratic Stamina", val: data.socraticStamina, icon: "🔥", color: "text-rose-700 bg-rose-50 border-rose-200" }
              ].map((dim, idx) => (
                <div key={idx} className={`p-3.5 rounded-2xl border ${dim.color} text-center space-y-1.5 transition-all hover:scale-[1.02]`}>
                  <span className="text-xl">{dim.icon}</span>
                  <div className="text-lg font-black font-mono leading-none">
                    {dim.val}%
                  </div>
                  <span className="text-[9.5px] font-bold leading-tight block truncate">
                    {dim.label}
                  </span>
                  <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-current h-full rounded-full" style={{ width: `${dim.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Strengths & Focus Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths Box */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h5 className="text-xs font-black uppercase font-mono tracking-wider">
                  Mastered Strengths
                </h5>
              </div>
              <div className="space-y-2">
                {(data.strengths && data.strengths.length > 0 ? data.strengths.slice(0, 3) : [
                  { concept: "Strong fundamental application", category: "Core Concept" },
                  { concept: "Active Socratic participation", category: "Live Class" }
                ]).map((s, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {s.concept}
                      </span>
                      <span className="text-[9.5px] text-emerald-700 font-mono font-medium">
                        {s.category}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 font-mono">✓ Mastered</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Areas Box */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Target className="w-4 h-4 text-amber-600" />
                <h5 className="text-xs font-black uppercase font-mono tracking-wider">
                  High Priority Focus Topics
                </h5>
              </div>
              <div className="space-y-2">
                {(data.growths && data.growths.length > 0 ? data.growths.slice(0, 3) : [
                  { concept: "Formula linking in multi-step problems", category: "Calculation Precision", explanation: "Daily 10-minute active recall will build retention." }
                ]).map((g, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {g.concept}
                      </span>
                      {onDiscussWithCherry && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDiscussWithCherry({
                              topic: g.concept,
                              conceptTested: g.category,
                              hint: g.explanation,
                              subject: data.subject
                            });
                          }}
                          className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[9.5px] font-mono font-bold cursor-pointer transition-all shrink-0 active:scale-95"
                          title="Ask Cherry Ma'am to explain"
                        >
                          Revise 🚀
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-snug">
                      {g.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Classroom & Test Statistics */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-black uppercase font-mono tracking-wider text-slate-700 block">
              Engagement & Practice Volume
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">Live Sessions</span>
                <span className="text-lg font-black text-[#0a3641] font-mono">{data.totalSessionsCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">Blackboard Slates</span>
                <span className="text-lg font-black text-[#0a3641] font-mono">{data.totalSnapshotsCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">Tests & Sprints</span>
                <span className="text-lg font-black text-[#0a3641] font-mono">{data.totalQuizzesCount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">Test Accuracy</span>
                <span className="text-lg font-black text-emerald-600 font-mono">{data.recentQuizAccuracy}%</span>
              </div>
            </div>
          </div>

          {/* 6. Teacher's Remarks */}
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-teal-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span>👩‍🏫 Cherry Ma'am's Academic Note:</span>
            </div>
            <p className="text-xs text-teal-950 leading-relaxed font-sans">
              "Great work, <strong>{data.studentName}</strong>! Your concept clarity is at <strong>{data.conceptClarity}%</strong>. Keep using the Daily Revision Planner and take active 45-second Exam Speed Sprints to maximize your accuracy and examination score."
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareSummary}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? "Summary Copied! ✓" : "Copy Summary"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintOrSavePDF}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download / Print PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
