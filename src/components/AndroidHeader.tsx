import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Sparkles, 
  Download, 
  Smartphone, 
  Maximize2, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { ComparisonMode } from '../types';

interface AndroidHeaderProps {
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean) => void;
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenAiDiagnostic: () => void;
  isAiAnalyzing: boolean;
  hasAiResult: boolean;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  isPhoneFrame,
  setIsPhoneFrame,
  comparisonMode,
  setComparisonMode,
  onOpenExport,
  onOpenImport,
  onOpenAiDiagnostic,
  isAiAnalyzing,
  hasAiResult,
}) => {
  const [timeStr, setTimeStr] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col bg-[#111318] border-b border-white/8 select-none">
      {/* Android System Status Bar (Material 3 style) */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs text-white/70 font-medium tracking-tight">
        <div className="flex items-center gap-1.5 font-semibold text-white/90">
          <span>{timeStr}</span>
        </div>

        {/* Center Punch Hole Camera simulation when in phone mode */}
        {isPhoneFrame && (
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-sky-400">5G</span>
          <Wifi className="w-3.5 h-3.5 text-white/80" />
          <div className="flex items-center gap-1">
            <span className="text-[10px]">98%</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Android Material 3 Top App Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenImport}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors active:scale-95"
            title="Import or Switch Photo"
          >
            <FolderOpen className="w-5 h-5 text-sky-400" />
          </button>
          
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                ClearPhoto <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-mono uppercase font-bold">Rebuild</span>
              </h1>
            </div>
            <p className="text-[11px] text-white/50 hidden sm:block">AI Old Photo Clarity & Restoration</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Diagnostic Trigger Pill */}
          <button
            onClick={onOpenAiDiagnostic}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 border ${
              isAiAnalyzing
                ? 'bg-purple-950/70 border-purple-500 text-purple-200 animate-pulse'
                : hasAiResult
                ? 'bg-purple-900/40 border-purple-500/50 text-purple-200 hover:bg-purple-900/60'
                : 'bg-gradient-to-r from-purple-600/30 to-sky-600/30 border-purple-400/40 text-purple-100 hover:brightness-110'
            }`}
            title="AI Photographic Scan & Recipe"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden xs:inline">{isAiAnalyzing ? 'Scanning...' : 'AI Inspector'}</span>
          </button>

          {/* Toggle Phone Frame vs Expanded View */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
            title={isPhoneFrame ? 'Switch to Fullscreen Studio' : 'Switch to Android Phone View'}
          >
            {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Save / Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save HD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
