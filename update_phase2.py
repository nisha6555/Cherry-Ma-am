import re

with open("src/components/StudentAccountHub.tsx", "r", encoding="utf-8") as f:
    text = f.read()

old_progress_block = """              {/* Milestones & Progress scorecard */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-[11px] uppercase font-mono font-black tracking-widest text-[#0a3641] flex items-center gap-1.5 pb-2 border-b border-zinc-200">
                  <Award className="w-3.5 h-3.5 text-teal-800" /> Academic Progress
                </h3>

                <div className="space-y-2">
                  <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-semibold">Total Classes Attended</span>
                      <span className="text-xl font-black text-[#0a3641] block mt-0.5">{totalSessionsCount}</span>
                    </div>
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">📈</span>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-semibold">Total Slides Saved</span>
                      <span className="text-xl font-black text-[#0a3641] block mt-0.5">{allSnapshots.length}</span>
                    </div>
                    <span className="text-2xl bg-teal-50 p-1.5 rounded-lg">📸</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🏆</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0a3641]">Active Scholar Badge</span>
                  </div>
                  <p className="text-[10px] text-[#486a73] font-medium mt-1 leading-relaxed">
                    Automatically unlocked for participating in live lectures and compiling direct board-books!
                  </p>
                </div>"""

new_progress_block = """              {/* Milestones & Academic Progress - Bento Grid & Sleek Badge */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <h3 className="text-[10.5px] uppercase font-mono font-black tracking-widest text-[#0a3641] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-teal-700" /> Academic Progress
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-slate-400">Live Stats</span>
                </div>

                {/* 2-Column Bento Grid */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {/* Card 1: Classes Attended */}
                  <div className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-2xl p-3 shadow-xs transition-all duration-200 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Classes</span>
                      <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                        📈
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0a3641]">{totalSessionsCount}</span>
                      <span className="text-[10px] font-bold text-slate-400">sessions</span>
                    </div>
                  </div>

                  {/* Card 2: Blackboard Slates */}
                  <div className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-2xl p-3 shadow-xs transition-all duration-200 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Board Slates</span>
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                        📸
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0a3641]">{allSnapshots.length}</span>
                      <span className="text-[10px] font-bold text-slate-400">saved</span>
                    </div>
                  </div>
                </div>

                {/* Sleek Active Scholar Achievement Chip */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-2.5 text-left flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-amber-400/30">
                    🏆
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-black uppercase tracking-wide text-amber-950 font-mono">Active Scholar</span>
                      <span className="text-[8px] bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">Level 1</span>
                    </div>
                    <p className="text-[9.5px] text-amber-900/80 font-medium truncate mt-0.5">
                      Live lecture participation & board-book compilation unlocked
                    </p>
                  </div>
                </div>"""

if old_progress_block in text:
    text = text.replace(old_progress_block, new_progress_block, 1)
    with open("src/components/StudentAccountHub.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS")
else:
    print("MATCH FAILED")
