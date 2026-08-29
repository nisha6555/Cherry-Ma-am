import re

# 1. Update StudentReportCardModal.tsx
with open("src/components/StudentReportCardModal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add createPortal import
if "import { createPortal } from \"react-dom\";" not in text:
    text = "import { createPortal } from \"react-dom\";\n" + text

old_return_start = """  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in select-none">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden text-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >"""

new_return_start = """  if (!isOpen) return null;

  const modalNode = (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[88dvh] sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >"""

old_return_end = """        {/* Modal Bottom Actions */}
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
  );"""

new_return_end = """        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareSummary}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{isCopied ? "Summary Copied! ✓" : "Copy Summary"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintOrSavePDF}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white rounded-xl text-xs font-black font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
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

  if (typeof document !== "undefined") {
    return createPortal(modalNode, document.body);
  }
  return modalNode;"""

if old_return_start in text and old_return_end in text:
    text = text.replace(old_return_start, new_return_start, 1)
    text = text.replace(old_return_end, new_return_end, 1)
    with open("src/components/StudentReportCardModal.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS: Updated StudentReportCardModal.tsx with portal and safe max-h")
else:
    print("FAILED TO MATCH in StudentReportCardModal.tsx")
