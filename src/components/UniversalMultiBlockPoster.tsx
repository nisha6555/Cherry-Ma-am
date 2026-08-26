import React from "react";
import {
  FlaskConical, Thermometer, Gauge, Zap, RotateCcw, AlertTriangle, CheckCircle2,
  Wind, ShieldAlert, Cpu, Sparkles, Atom, Droplets, RefreshCw
} from "lucide-react";

interface Props {
  occurrenceCardData: {
    cardTitle?: string;
    bullets: { label: string; text: string; iconKey?: string }[];
  };
  formsCardData: {
    cardTitle?: string;
    items: { id?: number; name: string; description: string; badge?: string; iconKey?: string }[];
  };
  labPrepSectionData: {
    sectionNumber?: number;
    sectionTitle?: string;
    reactantsOrInputs?: string;
    reactionEquationLatex?: string;
    precautionsAndDrying?: string;
    collectionMethod?: string;
    unsuitableAlert?: {
      title?: string;
      warningText?: string;
      reagentsOrExceptions?: string[];
      balancedEquations?: string[];
    };
  };
  manufactureSectionData: {
    sectionNumber?: number;
    sectionTitle?: string;
    reactantsRatio?: string;
    reactionEquationLatex?: string;
    favourableConditions?: { parameter: string; value: string; iconKey?: string; badge?: string }[];
    flowStages?: { stepNumber?: number; label: string; subtext?: string }[];
    recoveryAndRecycle?: string;
  };
  examTrapsData: {
    trapTitle: string;
    wrongConcept: string;
    correctConcept: string;
    examTip: string;
  }[];
  renderTextWithKatex: (text: string) => string;
  renderKatex: (formula: string, displayMode?: boolean) => string;
}

export const UniversalMultiBlockPoster: React.FC<Props> = ({
  occurrenceCardData,
  formsCardData,
  labPrepSectionData,
  manufactureSectionData,
  examTrapsData,
  renderTextWithKatex,
  renderKatex,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full font-sans text-slate-800">
      {/* 1 & 2. Top Dual Cards: Section 1 (Occurrence) & Section 2 (Forms of Ammonia) */}
      <div className="grid grid-cols-12 gap-3 items-stretch">
        {/* Left: Section 1 (OCCURRENCE) */}
        <div className="col-span-6 rounded-2xl border border-emerald-300 bg-white p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
          {/* Green Pill Title */}
          <div className="flex items-center gap-2 bg-[#0a6640] text-white px-3 py-1.5 rounded-xl shadow-xs">
            <span className="w-5 h-5 rounded-full bg-white text-[#0a6640] text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider">
              {occurrenceCardData.cardTitle || "OCCURRENCE"}
            </h2>
          </div>

          {/* 3 Bullets with Round Badges */}
          <div className="flex flex-col gap-2.5 pt-0.5 text-xs">
            {(occurrenceCardData.bullets || []).map((bullet, bIdx) => (
              <div key={bIdx} className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {bullet.iconKey === "cloud" || bIdx === 0 ? (
                    <Wind className="w-5 h-5 text-sky-500" />
                  ) : bullet.iconKey === "flask" || bIdx === 1 ? (
                    <FlaskConical className="w-5 h-5 text-teal-600" />
                  ) : (
                    <Droplets className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 leading-snug">
                  <span className="text-[11.5px] font-bold text-slate-900">
                    <span className="text-[#0a6640] mr-1">•</span>
                    <span>{bullet.label}:</span>
                  </span>
                  <span
                    className="text-[10.5px] text-slate-700 font-normal leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderTextWithKatex(bullet.text) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Section 2 (FORMS OF AMMONIA) */}
        <div className="col-span-6 rounded-2xl border border-purple-300 bg-white p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
          {/* Purple Pill Title */}
          <div className="flex items-center gap-2 bg-[#5b248a] text-white px-3 py-1.5 rounded-xl shadow-xs">
            <span className="w-5 h-5 rounded-full bg-white text-[#5b248a] text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider">
              {formsCardData.cardTitle || "FORMS OF AMMONIA"}
            </h2>
          </div>

          {/* 4 Form Rows with Illustrated Badges on Right */}
          <div className="flex flex-col gap-2 pt-0.5">
            {(formsCardData.items || []).map((formItem, fIdx) => (
              <div
                key={fIdx}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-purple-50/40 border border-purple-100 hover:bg-purple-50/70 transition-colors"
              >
                <div className="flex items-start gap-2 text-left">
                  <span className="w-4 h-4 rounded-full bg-[#5b248a] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {fIdx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10.5px] font-bold text-purple-950">
                      {formItem.name}:
                    </span>
                    <span
                      className="text-[9.5px] text-slate-600 leading-tight"
                      dangerouslySetInnerHTML={{ __html: renderTextWithKatex(formItem.description) }}
                    />
                  </div>
                </div>

                {/* Right Illustrated Badge */}
                <div className="shrink-0 flex items-center justify-center min-w-[50px] px-1.5 py-0.5 rounded-lg bg-white border border-purple-200 shadow-2xs">
                  {fIdx === 0 ? (
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      ☁️ NH₃
                    </span>
                  ) : fIdx === 1 ? (
                    <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      🛢️ Liquid
                    </span>
                  ) : fIdx === 2 ? (
                    <span className="text-[8.5px] font-bold text-teal-800 bg-teal-50 px-1 py-0.5 rounded">
                      .880 NH₃
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-bold text-indigo-800 bg-indigo-50 px-1 py-0.5 rounded">
                      NH₃(aq)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Section 3: Laboratory Preparation from Ammonium Chloride */}
      <div className="rounded-2xl border border-blue-300 bg-white p-3.5 flex flex-col gap-2.5 shadow-2xs">
        {/* Blue Pill Title Bar */}
        <div className="flex items-center gap-2 bg-[#004e92] text-white px-3 py-1.5 rounded-xl shadow-xs">
          <span className="w-5 h-5 rounded-full bg-white text-[#004e92] text-xs font-black flex items-center justify-center">
            {labPrepSectionData.sectionNumber || 3}
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider">
            {labPrepSectionData.sectionTitle || "LABORATORY PREPARATION FROM AMMONIUM CHLORIDE"}
          </h2>
        </div>

        {/* 3-Column Layout: Left Details, Center Apparatus Schematic SVG, Right Collection */}
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Left Column (5 Cols) */}
          <div className="col-span-5 flex flex-col gap-2 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <span className="text-[#004e92]">•</span>
                <span>Reactants:</span>
              </span>
              <p
                className="text-[10px] text-slate-700 leading-snug pl-2.5 font-normal"
                dangerouslySetInnerHTML={{ __html: renderTextWithKatex(labPrepSectionData.reactantsOrInputs || "") }}
              />
            </div>

            {/* Reaction Pill Box */}
            <div className="pl-2.5">
              <span className="text-[10px] font-bold text-slate-900 block mb-0.5">• Reaction:</span>
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-300 text-center shadow-2xs">
                <span
                  className="text-[10.5px] font-serif font-bold text-[#004e92]"
                  dangerouslySetInnerHTML={{
                    __html: renderKatex(
                      labPrepSectionData.reactionEquationLatex || "2NH_4Cl + Ca(OH)_2 \\xrightarrow{\\Delta} 2NH_3 + CaCl_2 + 2H_2O",
                      false
                    ),
                  }}
                />
              </div>
            </div>

            {/* Precautions & Drying */}
            <div>
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <span className="text-[#004e92]">•</span>
                <span>Precautions & Drying:</span>
              </span>
              <p
                className="text-[9.5px] text-slate-700 leading-snug pl-2.5 font-normal"
                dangerouslySetInnerHTML={{ __html: renderTextWithKatex(labPrepSectionData.precautionsAndDrying || "") }}
              />
            </div>

            {/* Red Warning Alert Box */}
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-1.5 shadow-2xs">
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                ✕
              </span>
              <p
                className="text-[9px] text-rose-950 leading-tight font-medium"
                dangerouslySetInnerHTML={{
                  __html: renderTextWithKatex(
                    labPrepSectionData.unsuitableAlert?.warningText ||
                    "Other common drying agents like conc. H2SO4, P2O5, and anhydrous CaCl2 are unsuitable because they react chemically with basic ammonia."
                  ),
                }}
              />
            </div>
          </div>

          {/* Center Column: Laboratory Apparatus Schematic SVG (4.5 Cols) */}
          <div className="col-span-4 flex flex-col items-center justify-center p-1 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="w-full text-center">
              <span className="text-[9px] font-bold text-slate-600 block">
                NH₄Cl + Ca(OH)₂ (mixture)
              </span>
            </div>
            
            {/* SVG Apparatus */}
            <svg viewBox="0 0 280 135" className="w-full h-28">
              {/* Clamp Stand */}
              <rect x="18" y="115" width="40" height="6" rx="2" fill="#475569" />
              <rect x="36" y="20" width="4" height="98" fill="#64748b" />
              <rect x="36" y="55" width="22" height="4" fill="#64748b" />

              {/* Bunsen Burner */}
              <rect x="42" y="105" width="14" height="12" fill="#334155" rx="1" />
              <path d="M 45 105 Q 49 85 49 80 Q 49 85 53 105 Z" fill="url(#flameGrad)" />

              {/* Slanted Round Bottom Flask */}
              <g transform="translate(68, 65) rotate(22)">
                <ellipse cx="0" cy="0" rx="19" ry="17" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x="-6" y="-30" width="12" height="20" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                {/* Powder Mixture */}
                <path d="M -14 6 Q 0 14 14 6 Q 0 16 -14 6 Z" fill="#94a3b8" />
                {/* Cork */}
                <rect x="-5" y="-33" width="10" height="6" fill="#b45309" rx="1" />
              </g>

              {/* Delivery Tube connecting to Drying Tower */}
              <path
                d="M 86 52 L 125 52 L 125 45 L 140 45"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Horizontal Drying Tube with Quicklime (CaO) Lumps */}
              <rect x="138" y="36" width="48" height="18" rx="4" fill="#f8fafc" stroke="#0ea5e9" strokeWidth="1.5" />
              {/* CaO Lumps */}
              <circle cx="145" cy="42" r="2.5" fill="#cbd5e1" />
              <circle cx="153" cy="47" r="3" fill="#cbd5e1" />
              <circle cx="162" cy="41" r="2.5" fill="#cbd5e1" />
              <circle cx="172" cy="46" r="3" fill="#cbd5e1" />
              <text x="162" y="30" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                Drying tube (Quicklime, CaO)
              </text>

              {/* Tube from Drying Tube to Gas Jar */}
              <path
                d="M 186 45 L 205 45 L 205 85 L 235 85 L 235 60"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Inverted Gas Jar */}
              <rect x="220" y="42" width="30" height="52" rx="3" fill="url(#gasJarGrad)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="235" y="80" textAnchor="middle" fill="#0369a1" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                NH₃
              </text>
              <path d="M 235 65 L 235 73" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Gradients */}
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="gasJarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.7" />
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
                </marker>
              </defs>
            </svg>

            {/* CaO Callout */}
            <div className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[8px] font-medium text-emerald-900 text-center">
              CaO removes moisture without reacting with NH₃
            </div>
          </div>

          {/* Right Column: Collection Box (2.5 Cols) */}
          <div className="col-span-3 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col gap-1 text-left shadow-2xs">
            <span className="text-[10.5px] font-bold text-sky-950 flex items-center gap-1">
              <span className="text-sky-600">•</span>
              <span>Collection:</span>
            </span>
            <p
              className="text-[9.5px] text-slate-700 leading-snug font-normal"
              dangerouslySetInnerHTML={{ __html: renderTextWithKatex(labPrepSectionData.collectionMethod || "Collected by downward displacement of air because it is lighter than air and highly soluble in water.") }}
            />
          </div>
        </div>
      </div>

      {/* 4. Section 4: Manufacture by Haber's Process */}
      <div className="rounded-2xl border border-amber-300 bg-white p-3.5 flex flex-col gap-2.5 shadow-2xs">
        {/* Rust-Orange Pill Title Bar */}
        <div className="flex items-center gap-2 bg-[#c2410c] text-white px-3 py-1.5 rounded-xl shadow-xs">
          <span className="w-5 h-5 rounded-full bg-white text-[#c2410c] text-xs font-black flex items-center justify-center">
            {manufactureSectionData.sectionNumber || 4}
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider">
            {manufactureSectionData.sectionTitle || "MANUFACTURE BY HABER'S PROCESS"}
          </h2>
        </div>

        {/* 2-Subpanel Layout: Left Reaction & Conditions, Right Complete Flowchart */}
        <div className="grid grid-cols-12 gap-3 items-start">
          {/* Left Column (5 Cols) */}
          <div className="col-span-5 flex flex-col gap-2 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <span className="text-[#c2410c]">•</span>
                <span>Reactants:</span>
              </span>
              <p
                className="text-[10px] text-slate-700 leading-snug pl-2.5 font-normal"
                dangerouslySetInnerHTML={{ __html: renderTextWithKatex(manufactureSectionData.reactantsRatio || "Nitrogen (from liquid air) and hydrogen mixed in ratio of 1:3 by volume.") }}
              />
            </div>

            {/* Reaction Box */}
            <div className="pl-2.5">
              <span className="text-[10px] font-bold text-slate-900 block mb-0.5">• Reaction:</span>
              <div className="p-1.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center shadow-2xs">
                <span
                  className="text-[10px] font-serif font-bold text-amber-950"
                  dangerouslySetInnerHTML={{
                    __html: renderKatex(
                      manufactureSectionData.reactionEquationLatex || "N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g) + \\text{Heat (Exothermic)}",
                      false
                    ),
                  }}
                />
              </div>
            </div>

            {/* 4 Favourable Conditions Table */}
            <div>
              <span className="text-[10.5px] font-bold text-slate-900 flex items-center gap-1 mb-1">
                <span className="text-[#c2410c]">•</span>
                <span>Favourable Conditions:</span>
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 text-[9.5px]">
                {(manufactureSectionData.favourableConditions || [
                  { parameter: "Temperature", value: "Optimum range of 450°C to 500°C", iconKey: "temperature" },
                  { parameter: "Pressure", value: "Above 200 atm (about 250 atm)", iconKey: "pressure" },
                  { parameter: "Catalyst", value: "Finely divided iron", iconKey: "catalyst" },
                  { parameter: "Promoter", value: "Traces of molybdenum or Al2O3", iconKey: "promoter" },
                ]).map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1 px-2 bg-white hover:bg-slate-50">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {c.iconKey === "temperature" || idx === 0 ? "🌡️" : c.iconKey === "pressure" || idx === 1 ? "⏱️" : c.iconKey === "catalyst" || idx === 2 ? "⚙️" : "💎"}
                      <span>{c.parameter}:</span>
                    </span>
                    <span className="text-slate-600 text-right">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Complete Industrial Flowchart (7 Cols) */}
          <div className="col-span-7 p-2 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-1.5 items-center text-center text-[9px] font-bold">
              {/* Inputs */}
              <div className="col-span-3 flex flex-col gap-1">
                <div className="p-1 rounded bg-sky-100 border border-sky-200 text-sky-900">
                  <span className="block font-black">N₂</span>
                  <span className="text-[7.5px] font-normal text-sky-700">(from liquid air)</span>
                </div>
                <div className="p-1 rounded bg-emerald-100 border border-emerald-200 text-emerald-900">
                  <span className="block font-black">H₂</span>
                  <span className="text-[7.5px] font-normal text-emerald-700">(Bosch process)</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-slate-400 font-black">➔</div>

              {/* Purification & Compression */}
              <div className="col-span-3 p-1.5 rounded bg-amber-100/70 border border-amber-200 text-amber-950">
                Purification & Compression
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-slate-400 font-black">➔</div>

              {/* Mixing Box */}
              <div className="col-span-4 p-1.5 rounded bg-rose-100/70 border border-rose-200 text-rose-950">
                Mixing <br/>
                <span className="text-[8px] font-normal text-rose-800">(1 vol N₂ : 3 vol H₂)</span>
              </div>
            </div>

            {/* Downward step to Reactor & Condenser */}
            <div className="grid grid-cols-12 gap-1.5 items-center text-center text-[9px] font-bold">
              {/* Catalytic Reactor */}
              <div className="col-span-5 p-2 rounded-xl bg-slate-200 border border-slate-300 text-slate-900 flex flex-col">
                <span className="font-black text-[10px]">Reactor</span>
                <span className="text-[8px] text-slate-700">450–500°C • &gt;200 atm</span>
                <span className="text-[7.5px] text-slate-600 font-normal">Finely divided Fe + Mo</span>
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-slate-400 font-black">➔</div>

              {/* Cooling Condenser */}
              <div className="col-span-3 p-1.5 rounded bg-sky-100 border border-sky-200 text-sky-950">
                Cooling <br/>
                <span className="text-[8px] font-normal text-sky-800">(Condenser)</span>
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-slate-400 font-black">➔</div>

              {/* Liquefied NH3 */}
              <div className="col-span-2 p-1.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-950">
                NH₃ <br/>
                <span className="text-[7.5px] font-normal text-emerald-800">(Liquefied)</span>
              </div>
            </div>

            {/* Recirculation Loop Row */}
            <div className="p-1.5 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between text-[8.5px] text-orange-950">
              <span className="flex items-center gap-1 font-bold">
                <RotateCcw className="w-3 h-3 text-orange-600" />
                <span>Recycle of unreacted N₂ and H₂ to the plant</span>
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ~98% High Yield
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 5: RECOVERY (Teal Pill Title) */}
      <div className="rounded-2xl border border-teal-300 bg-white p-3 flex flex-col gap-2 shadow-2xs">
        <div className="flex items-center gap-2 bg-[#007a87] text-white px-3 py-1.5 rounded-xl shadow-xs">
          <span className="w-5 h-5 rounded-full bg-white text-[#007a87] text-xs font-black flex items-center justify-center">
            5
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider">
            RECOVERY
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs px-2">
          <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
          </div>

          <p
            className="text-[10px] text-slate-700 leading-snug font-normal flex-1"
            dangerouslySetInnerHTML={{
              __html: renderTextWithKatex(
                manufactureSectionData.recoveryAndRecycle ||
                "Unreacted nitrogen and hydrogen gases are separated from ammonia via liquefaction or water absorption and are recirculated back into the plant to achieve a high eventual yield."
              ),
            }}
          />

          <div className="flex items-center gap-1 bg-sky-50 border border-sky-200 px-2 py-1 rounded-xl text-[9px] font-bold text-sky-900 shrink-0">
            <span>💧 H₂O</span>
            <span>/</span>
            <span>🛢️ Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

