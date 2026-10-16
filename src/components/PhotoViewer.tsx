import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Columns, 
  Rows, 
  Search, 
  Wand2, 
  RotateCcw, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Eraser, 
  Undo2, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ComparisonMode } from '../types';

interface PhotoViewerProps {
  originalUrl: string;
  enhancedUrl: string | null;
  isProcessing: boolean;
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  onApplyManualInpaint: (maskCanvas: HTMLCanvasElement) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  originalUrl,
  enhancedUrl,
  isProcessing,
  comparisonMode,
  setComparisonMode,
  onApplyManualInpaint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Loupe magnifier state
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 }); // percentage
  const [isHoveringLoupe, setIsHoveringLoupe] = useState(false);

  // Magic eraser brush state
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(18);
  const [isPainting, setIsPainting] = useState(false);
  const [hasMaskDrawn, setHasMaskDrawn] = useState(false);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    clearMask();
  }, [originalUrl]);

  // Handle slider drag
  const handleSliderMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (comparisonMode === 'slider-horizontal') {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      setSliderPos(Math.round((x / rect.width) * 100));
    } else if (comparisonMode === 'slider-vertical') {
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      setSliderPos(Math.round((y / rect.height) * 100));
    }

    // Also update loupe position
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setLoupePos({ x: xPct, y: yPct });
  }, [comparisonMode]);

  // Mouse / Touch listeners for slider
  const handleMouseDown = (e: React.MouseEvent) => {
    if (comparisonMode === 'magic-eraser') return;
    setIsDraggingSlider(true);
    handleSliderMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (comparisonMode === 'magic-eraser') return;
    if (e.touches.length === 1) {
      setIsDraggingSlider(true);
      handleSliderMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX, e.clientY);
      }
    };
    const handleGlobalTouch = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length === 1) {
        handleSliderMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleGlobalUp = () => {
      setIsDraggingSlider(false);
      setIsPainting(false);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalTouch);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalTouch);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  // Handle Magic Eraser Drawing
  const startPainting = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (comparisonMode !== 'magic-eraser') return;
    setIsPainting(true);
    paintBrush(e);
  };

  const paintBrush = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)'; // Red highlight for mask
    ctx.beginPath();
    ctx.arc(x, y, brushSize * (scaleX || 1), 0, Math.PI * 2);
    ctx.fill();

    setHasMaskDrawn(true);
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMaskDrawn(false);
  };

  const applyMaskInpaint = () => {
    if (!maskCanvasRef.current || !hasMaskDrawn) return;
    onApplyManualInpaint(maskCanvasRef.current);
    clearMask();
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.8, Math.min(3.5, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Active displayed enhanced URL or fallback
  const activeEnhanced = enhancedUrl || originalUrl;

  return (
    <div className="flex-1 flex flex-col relative bg-[#0b0d11] overflow-hidden select-none">
      {/* Top Floating Mini-Toolbar for Comparison Views */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#1a1d24]/90 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xl">
        <button
          onClick={() => setComparisonMode('slider-horizontal')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            comparisonMode === 'slider-horizontal'
              ? 'bg-sky-500 text-black shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title="Horizontal Split Slider"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="text-[11px]">Split</span>
        </button>

        <button
          onClick={() => setComparisonMode('slider-vertical')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            comparisonMode === 'slider-vertical'
              ? 'bg-sky-500 text-black shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title="Vertical Split Slider"
        >
          <Rows className="w-3.5 h-3.5" />
          <span className="text-[11px]">Vertical</span>
        </button>

        <button
          onClick={() => setComparisonMode('loupe')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            comparisonMode === 'loupe'
              ? 'bg-sky-500 text-black shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title="HD Magnifier Loupe"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px]">Loupe</span>
        </button>

        <button
          onClick={() => setComparisonMode('magic-eraser')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            comparisonMode === 'magic-eraser'
              ? 'bg-amber-500 text-black font-semibold shadow-sm'
              : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/10'
          }`}
          title="Manual Scratch & Tear Inpaint Brush"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">Eraser</span>
        </button>
      </div>

      {/* Main Image Stage */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full relative flex items-center justify-center p-3 sm:p-5 overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={(e) => {
          if (comparisonMode === 'loupe') {
            setIsHoveringLoupe(true);
            handleSliderMove(e.clientX, e.clientY);
          }
        }}
        onMouseLeave={() => setIsHoveringLoupe(false)}
      >
        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <div className="bg-[#181a20]/95 border border-sky-500/30 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Rebuilding Clarity & Micro-details...
              </span>
            </div>
          </div>
        )}

        {/* View container with scale & pan */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {/* Base Layer: Original Image (or Enhanced when user toggles) */}
          <img
            src={isHoldingOriginal ? originalUrl : (comparisonMode === 'loupe' ? originalUrl : activeEnhanced)}
            alt="Source photograph"
            referrerPolicy="no-referrer"
            className="max-w-[88vw] sm:max-w-[70vw] max-h-[58vh] sm:max-h-[64vh] object-contain rounded-xl shadow-2xl pointer-events-none select-none border border-white/5"
            draggable={false}
          />

          {/* Slider Horizontal Overlay */}
          {comparisonMode === 'slider-horizontal' && !isHoldingOriginal && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={originalUrl}
                alt="Original blurry photograph"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </div>
          )}

          {/* Slider Vertical Overlay */}
          {comparisonMode === 'slider-vertical' && !isHoldingOriginal && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl"
              style={{ clipPath: `inset(0 0 ${100 - sliderPos}% 0)` }}
            >
              <img
                src={originalUrl}
                alt="Original blurry photograph"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </div>
          )}

          {/* Slider Dividing Bar & Knob */}
          {comparisonMode === 'slider-horizontal' && !isHoldingOriginal && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Vertical line with glow */}
              <div className="w-[2px] h-full bg-white shadow-[0_0_12px_rgba(56,189,248,0.9)] -translate-x-1/2" />
              {/* Circular Android thumb button */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-2xl border-2 border-sky-500 flex items-center justify-center cursor-ew-resize">
                <Columns className="w-3.5 h-3.5 text-sky-600" />
              </div>
              {/* Before / After Badges */}
              <div className="absolute -top-6 -translate-x-[110%] bg-black/80 text-[10px] uppercase font-bold tracking-widest text-white/90 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                Old / Blurry
              </div>
              <div className="absolute -top-6 translate-x-[10%] bg-sky-950/90 text-[10px] uppercase font-bold tracking-widest text-sky-300 px-2 py-0.5 rounded backdrop-blur-sm border border-sky-400/40">
                Cleared HD
              </div>
            </div>
          )}

          {/* Slider Vertical Dividing Bar & Knob */}
          {comparisonMode === 'slider-vertical' && !isHoldingOriginal && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${sliderPos}%` }}
            >
              <div className="h-[2px] w-full bg-white shadow-[0_0_12px_rgba(56,189,248,0.9)] -translate-y-1/2" />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-2xl border-2 border-sky-500 flex items-center justify-center cursor-ns-resize">
                <Rows className="w-3.5 h-3.5 text-sky-600" />
              </div>
            </div>
          )}

          {/* Loupe Magnifier Circle */}
          {comparisonMode === 'loupe' && !isHoldingOriginal && (
            <div
              className="absolute z-30 pointer-events-none rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_0_24px_rgba(0,0,0,0.8)]"
              style={{
                width: 170,
                height: 170,
                left: `${loupePos.x}%`,
                top: `${loupePos.y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.4), 0 16px 36px rgba(0,0,0,0.8)',
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage: `url(${activeEnhanced})`,
                  backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
                  backgroundSize: `${320}%`, // 3.2x magnification inside loupe
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-[9px] uppercase tracking-wider text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                3.2x HD Loupe
              </div>
            </div>
          )}

          {/* Magic Eraser Drawing Canvas */}
          {comparisonMode === 'magic-eraser' && (
            <canvas
              ref={maskCanvasRef}
              width={900}
              height={700}
              className="absolute inset-0 w-full h-full z-20 cursor-crosshair rounded-xl touch-none"
              onMouseDown={startPainting}
              onMouseMove={paintBrush}
              onTouchStart={startPainting}
              onTouchMove={paintBrush}
            />
          )}
        </div>
      </div>

      {/* Magic Eraser Floating Tool Palette */}
      {comparisonMode === 'magic-eraser' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-[#1e2129]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Eraser className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-100">Brush Size:</span>
            <input
              type="range"
              min="6"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          <button
            onClick={clearMask}
            disabled={!hasMaskDrawn}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white/70 hover:text-white disabled:opacity-40 hover:bg-white/10"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={applyMaskInpaint}
            disabled={!hasMaskDrawn}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 transition-all shadow-md active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Clean Scratches</span>
          </button>
        </div>
      )}

      {/* Bottom Floating Bar: Zoom & Hold to Compare */}
      <div className="absolute bottom-3 right-4 z-30 flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="bg-[#181a20]/90 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-0.5 shadow-lg">
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium px-1.5 text-white/80">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 1 && (
            <button
              onClick={resetView}
              className="p-1.5 rounded-full hover:bg-white/10 text-sky-400"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Google Photos / Remini style "Press & Hold to Compare Original" */}
        <button
          onMouseDown={() => setIsHoldingOriginal(true)}
          onMouseUp={() => setIsHoldingOriginal(false)}
          onMouseLeave={() => setIsHoldingOriginal(false)}
          onTouchStart={() => setIsHoldingOriginal(true)}
          onTouchEnd={() => setIsHoldingOriginal(false)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold select-none transition-all shadow-lg border active:scale-95 ${
            isHoldingOriginal
              ? 'bg-amber-500 text-black border-amber-400 scale-105'
              : 'bg-[#181a20]/90 backdrop-blur-md text-white/90 border-white/10 hover:bg-white/15'
          }`}
          title="Press and hold to see old blurry original"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-medium">{isHoldingOriginal ? 'ORIGINAL' : 'HOLD TO COMPARE'}</span>
        </button>
      </div>
    </div>
  );
};
