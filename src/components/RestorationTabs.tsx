import React from 'react';
import { 
  Sparkles, 
  Sliders, 
  Wand2, 
  Palette, 
  BrainCircuit, 
  RotateCcw, 
  Zap, 
  UserCheck, 
  Film, 
  SunMedium, 
  Check,
  ShieldCheck
} from 'lucide-react';
import { EnhancementSettings, AndroidTab, AiDiagnosticResult } from '../types';
import { PRESETS, DEFAULT_SETTINGS } from '../utils/imageProcessing';

interface RestorationTabsProps {
  activeTab: AndroidTab;
  setActiveTab: (tab: AndroidTab) => void;
  settings: EnhancementSettings;
  updateSettings: (newSettings: Partial<EnhancementSettings>) => void;
  resetSettings: () => void;
  aiResult: AiDiagnosticResult | null;
  onApplyAiRecipe: () => void;
  onRunAiDiagnostic: () => void;
  isAiAnalyzing: boolean;
}

export const RestorationTabs: React.FC<RestorationTabsProps> = ({
  activeTab,
  setActiveTab,
  settings,
  updateSettings,
  resetSettings,
  aiResult,
  onApplyAiRecipe,
  onRunAiDiagnostic,
  isAiAnalyzing,
}) => {
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-sky-400" />;
      case 'UserCheck':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'Wand2':
        return <Wand2 className="w-4 h-4 text-amber-400" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-rose-400" />;
      case 'Film':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'SunMedium':
        return <SunMedium className="w-4 h-4 text-yellow-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="bg-[#14161c] border-t border-white/10 flex flex-col z-20">
      {/* Sub-panel content area */}
      <div className="p-3 sm:p-4 max-h-[30vh] sm:max-h-[34vh] overflow-y-auto">
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                1-Tap Rebuild Presets
              </span>
              <button
                onClick={resetSettings}
                className="text-[11px] text-white/40 hover:text-white/80 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => updateSettings(preset.settings)}
                  className="flex flex-col text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all hover:border-sky-500/40 active:scale-98 group"
                >
                  <div className="flex items-center justify-between mb-1.5 w-full">
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10">
                      {getPresetIcon(preset.icon)}
                    </div>
                    {preset.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-white group-hover:text-sky-300 transition-colors">
                    {preset.title}
                  </span>
                  <span className="text-[10px] text-white/45 line-clamp-1 mt-0.5">
                    {preset.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CLARITY TAB */}
        {activeTab === 'clarity' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Deblur Sharpen Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Deblur & High-Pass Sharpness
                </span>
                <span className="font-mono text-sky-400">{settings.deblurSharpen}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.deblurSharpen}
                onChange={(e) => updateSettings({ deblurSharpen: Number(e.target.value) })}
                className="w-full accent-sky-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Convolves Laplacian edge high-pass to restore sharp outlines from motion or optical blur.
              </p>
            </div>

            {/* Face & Eyes Detail Boost */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Face & Micro-texture Boost
                </span>
                <span className="font-mono text-emerald-400">{settings.faceDetailBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.faceDetailBoost}
                onChange={(e) => updateSettings({ faceDetailBoost: Number(e.target.value) })}
                className="w-full accent-emerald-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Pinpoints iris definition, eyelashes, lips, hair strands, and textile weave.
              </p>
            </div>

            {/* Super Resolution Factor */}
            <div>
              <span className="text-xs font-medium text-white/80 block mb-2">
                Super Resolution Rebuild Scale:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 4] as const).map((factor) => (
                  <button
                    key={factor}
                    onClick={() => updateSettings({ upscaleFactor: factor })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all border ${
                      settings.upscaleFactor === factor
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                        : 'bg-white/5 border-white/8 text-white/60 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span>{factor}x {factor === 1 ? 'Native' : factor === 2 ? 'HD' : 'Ultra HD'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESTORE & CLEAN TAB */}
        {activeTab === 'restore' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Denoise & Film Grain Reduction */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Film Grain & Noise Smoothing (Bilateral)
                </span>
                <span className="font-mono text-purple-400">{settings.denoiseGrain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.denoiseGrain}
                onChange={(e) => updateSettings({ denoiseGrain: Number(e.target.value) })}
                className="w-full accent-purple-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Removes vintage salt-and-pepper grain and sensor noise without softening edges.
              </p>
            </div>

            {/* Scratch & Crease Suppression */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Auto Scratch & Crease Suppression
                </span>
                <span className="font-mono text-amber-400">{settings.scratchSuppression}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.scratchSuppression}
                onChange={(e) => updateSettings({ scratchSuppression: Number(e.target.value) })}
                className="w-full accent-amber-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Morphological outlier filter that identifies white/black tear lines and in-fills them.
              </p>
            </div>
          </div>
        )}

        {/* TONE & COLOR TAB */}
        {activeTab === 'color' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Dynamic Range / CLAHE */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80 flex items-center gap-1.5">
                  <SunMedium className="w-3.5 h-3.5 text-yellow-400" />
                  CLAHE Adaptive Local Contrast
                </span>
                <span className="font-mono text-yellow-400">{settings.claheContrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.claheContrast}
                onChange={(e) => updateSettings({ claheContrast: Number(e.target.value) })}
                className="w-full accent-yellow-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Lifts faded shadows and balances dynamic range without washing out highlights.
              </p>
            </div>

            {/* Exposure Compensation */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80">Exposure Offset</span>
                <span className="font-mono text-sky-400">
                  {settings.exposure > 0 ? `+${settings.exposure}` : settings.exposure}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={settings.exposure}
                onChange={(e) => updateSettings({ exposure: Number(e.target.value) })}
                className="w-full accent-sky-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Color Vibrance */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-white/80">Color Vibrance & Rejuvenation</span>
                <span className="font-mono text-rose-400">{settings.colorVibrance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.colorVibrance}
                onChange={(e) => updateSettings({ colorVibrance: Number(e.target.value) })}
                className="w-full accent-rose-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Sepia Neutralize Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
              <div>
                <span className="text-xs font-medium text-white block">
                  Neutralize Sepia / Yellow Acid Patina
                </span>
                <span className="text-[10px] text-white/45">
                  Recalibrates oxidized brown-yellow paper cast to authentic tones.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ sepiaNeutralize: !settings.sepiaNeutralize })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.sepiaNeutralize ? 'bg-sky-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.sepiaNeutralize ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* AI DIAGNOSTIC TAB */}
        {activeTab === 'ai-diagnostic' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {aiResult ? (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">{aiResult.era}</span>
                      <p className="text-[10px] text-purple-300/70">{aiResult.estimatedYear} • {aiResult.photoType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Sharpness</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{aiResult.sharpnessScore}/100</span>
                  </div>
                </div>

                <div className="text-[11px] text-white/80 bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <span className="font-semibold text-purple-200 block mb-1">Conservator Diagnosis:</span>
                  <p>{aiResult.restorationAdvice}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={onRunAiDiagnostic}
                    disabled={isAiAnalyzing}
                    className="text-xs text-white/50 hover:text-white/90 disabled:opacity-50"
                  >
                    {isAiAnalyzing ? 'Rescanning...' : 'Re-scan with Gemini'}
                  </button>
                  <button
                    onClick={onApplyAiRecipe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-sky-500 text-white font-semibold text-xs shadow-md active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply AI Recipe</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto">
                  <BrainCircuit className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">AI Photographic Degradation Scan</h4>
                  <p className="text-[11px] text-white/50 max-w-sm mx-auto mt-0.5">
                    Analyzes vintage paper degradation, blur type, optical focus loss, and builds a custom clarity recipe.
                  </p>
                </div>
                <button
                  onClick={onRunAiDiagnostic}
                  disabled={isAiAnalyzing}
                  className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiAnalyzing ? 'Scanning Photo...' : 'Start AI Analysis'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Android Material 3 Segmented Bottom Navigation Bar */}
      <div className="grid grid-cols-5 border-t border-white/10 bg-[#101217] px-2 py-1 select-none">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
            activeTab === 'presets'
              ? 'text-sky-400 font-semibold'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Presets</span>
        </button>

        <button
          onClick={() => setActiveTab('clarity')}
          className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
            activeTab === 'clarity'
              ? 'text-sky-400 font-semibold'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Clarity</span>
        </button>

        <button
          onClick={() => setActiveTab('restore')}
          className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
            activeTab === 'restore'
              ? 'text-sky-400 font-semibold'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Wand2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Repair</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
            activeTab === 'color'
              ? 'text-sky-400 font-semibold'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Tone</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-diagnostic')}
          className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
            activeTab === 'ai-diagnostic'
              ? 'text-purple-400 font-semibold'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <BrainCircuit className="w-4 h-4 mb-0.5 text-purple-400" />
          <span className="text-[10px]">AI Scan</span>
        </button>
      </div>

      {/* Android System Gesture Navigation Pill Bar */}
      <div className="flex justify-center py-1.5 bg-[#101217]">
        <div className="w-28 h-1 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
      </div>
    </div>
  );
};
