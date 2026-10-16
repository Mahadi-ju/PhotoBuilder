import React from 'react';
import { 
  X, 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  Gauge, 
  Wand2 
} from 'lucide-react';
import { AiDiagnosticResult } from '../types';

interface AiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AiDiagnosticResult | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onApplyRecipe: () => void;
}

export const AiDiagnosticModal: React.FC<AiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onRunAnalysis,
  onApplyRecipe,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a20] border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-purple-950/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                Gemini AI Vision Inspector
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                  v3.8
                </span>
              </h2>
              <p className="text-[11px] text-white/50">Historical degradation &amp; clarity profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-300 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-white">Inspecting Photographic Substrate...</h3>
              <p className="text-xs text-white/50 max-w-xs">
                Analyzing optical blur, paper grain, silvering patina, and facial edge gradients with Gemini multimodal vision.
              </p>
            </div>
          ) : result ? (
            <>
              {/* Scorecard Hero */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <History className="w-4 h-4 text-sky-400" />
                    <span>Era &amp; Medium</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-white block">{result.era}</span>
                    <span className="text-[11px] text-sky-300 font-mono">{result.estimatedYear}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span>Clarity Score</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold text-amber-400">
                        {result.sharpnessScore}
                      </span>
                      <span className="text-xs text-white/40">/100 (Unblurred: ~96)</span>
                    </div>
                    {/* Progress track */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.sharpnessScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Degradation Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Detected Degradations:
                </h4>
                <div className="space-y-1.5">
                  {result.detectedIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conservator Notes */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                <span className="font-semibold text-white block mb-1 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  Archival Restoration Recommendation:
                </span>
                <p className="leading-relaxed text-purple-200/90">{result.restorationAdvice}</p>
              </div>

              {/* Suggested parameter previews */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white/40 block">Deblur Boost</span>
                  <span className="text-xs font-bold text-sky-400 font-mono">
                    {result.suggestedSettings.deblurSharpen}%
                  </span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white/40 block">Face Detail</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {result.suggestedSettings.faceEnhanceStrength}%
                  </span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white/40 block">Denoise</span>
                  <span className="text-xs font-bold text-purple-400 font-mono">
                    {result.suggestedSettings.denoise}%
                  </span>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => {
                  onApplyRecipe();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-400 hover:to-sky-400 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply AI Recommended Clarity Recipe</span>
              </button>
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-white/60">
                Click below to send this photograph to Gemini AI for automated defect detection and restoration tuning.
              </p>
              <button
                onClick={onRunAnalysis}
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg"
              >
                Run AI Diagnostic
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
