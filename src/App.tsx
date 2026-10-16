import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AndroidHeader } from './components/AndroidHeader';
import { PhotoViewer } from './components/PhotoViewer';
import { RestorationTabs } from './components/RestorationTabs';
import { PhotoImportModal } from './components/PhotoImportModal';
import { ExportModal } from './components/ExportModal';
import { AiDiagnosticModal } from './components/AiDiagnosticModal';
import { SAMPLE_PHOTOS } from './data/samplePhotos';
import { 
  EnhancementSettings, 
  ComparisonMode, 
  AndroidTab, 
  AiDiagnosticResult 
} from './types';
import { DEFAULT_SETTINGS, PRESETS, enhancePhoto } from './utils/imageProcessing';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  Camera, 
  CheckCircle2,
  FileUp
} from 'lucide-react';

export default function App() {
  // Current photo state
  const [currentPhoto, setCurrentPhoto] = useState<{
    url: string;
    title: string;
  }>({
    url: SAMPLE_PHOTOS[0].url,
    title: SAMPLE_PHOTOS[0].title,
  });

  // Rebuilt clear photo URL
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<EnhancementSettings>(() => {
    // Initial preset for the 1940s portrait: Portrait HD
    return PRESETS[1].settings;
  });

  // UI state
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider-horizontal');
  const [activeTab, setActiveTab] = useState<AndroidTab>('presets');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Drag & drop on window state
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gemini AI Analysis state
  const [aiResult, setAiResult] = useState<AiDiagnosticResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // File input ref for 1-click native picker
  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Manual inpaint mask storage
  const inpaintMaskRef = useRef<HTMLCanvasElement | null>(null);

  // Debounced processing ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load and cache source image element
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      triggerEnhancement(settings, inpaintMaskRef.current);
    };
    img.src = currentPhoto.url;
  }, [currentPhoto.url]);

  // Execute photographic restoration pipeline
  const triggerEnhancement = useCallback(
    (currentSettings: EnhancementSettings, maskCanvas?: HTMLCanvasElement | null) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setIsProcessing(true);

      debounceTimerRef.current = setTimeout(async () => {
        if (!loadedImageRef.current) return;
        try {
          const result = await enhancePhoto(
            loadedImageRef.current,
            currentSettings,
            maskCanvas
          );
          setEnhancedUrl(result);
        } catch (err) {
          console.error('Enhancement pipeline error:', err);
        } finally {
          setIsProcessing(false);
        }
      }, 75); // 75ms debounce for silky smooth slider feedback
    },
    []
  );

  // Global Clipboard Paste (Ctrl+V / Cmd+V) Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                handleSelectPhoto(reader.result, 'Pasted Clipboard Photo', 'crystal-clear');
                showToast('Image pasted from clipboard successfully!');
              }
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Global Drag & Drop Listeners
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingFile(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingFile(false);

      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const cleanName = file.name.replace(/\.[^/.]+$/, '');
            handleSelectPhoto(reader.result, cleanName || 'Uploaded Old Photo', 'crystal-clear');
            showToast(`Imported ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Direct file input change
  const handleDirectFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          handleSelectPhoto(reader.result, cleanName || 'Uploaded Old Photo', 'crystal-clear');
          showToast(`Imported ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update settings handler
  const updateSettings = (newSettings: Partial<EnhancementSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      triggerEnhancement(updated, inpaintMaskRef.current);
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    triggerEnhancement(DEFAULT_SETTINGS, inpaintMaskRef.current);
  };

  // Manual Inpaint brush handler
  const handleApplyManualInpaint = (maskCanvas: HTMLCanvasElement) => {
    inpaintMaskRef.current = maskCanvas;
    triggerEnhancement(settings, maskCanvas);
  };

  // Switch photo handler
  const handleSelectPhoto = (url: string, title?: string, presetId?: string) => {
    inpaintMaskRef.current = null;
    setAiResult(null);
    setCurrentPhoto({
      url,
      title: title || 'Restored Photograph',
    });

    if (presetId) {
      const found = PRESETS.find((p) => p.id === presetId);
      if (found) {
        setSettings(found.settings);
      }
    }
  };

  // Run Gemini AI Diagnostic scan
  const handleRunAiDiagnostic = async () => {
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentPhoto.url,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AiDiagnosticResult = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('Failed to run AI diagnostic:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Apply AI Recommended Recipe
  const handleApplyAiRecipe = () => {
    if (!aiResult) return;
    const s = aiResult.suggestedSettings;
    const newSettings: EnhancementSettings = {
      ...settings,
      deblurSharpen: s.deblurSharpen,
      faceDetailBoost: s.faceEnhanceStrength,
      denoiseGrain: s.denoise,
      claheContrast: s.claheStrength,
      scratchSuppression: s.scratchSuppression,
      colorVibrance: s.colorVibrance,
      sepiaNeutralize: s.sepiaCorrection,
      exposure: 5,
      upscaleFactor: 2,
    };
    setSettings(newSettings);
    triggerEnhancement(newSettings, inpaintMaskRef.current);
    setActiveTab('clarity');
    showToast('AI clarity recipe applied!');
  };

  return (
    <div className="min-h-screen w-full bg-[#08090c] text-white flex flex-col items-center justify-center p-0 sm:p-4 select-none overflow-x-hidden font-sans relative">
      {/* Hidden file input for 1-click native browsing */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/heic,image/*"
        onChange={handleDirectFileInput}
        className="hidden"
      />

      {/* Global Drag-and-Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-sky-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-sky-400 pointer-events-none animate-in fade-in duration-150">
          <div className="w-24 h-24 rounded-3xl bg-sky-500/30 text-sky-300 flex items-center justify-center mb-4 shadow-2xl animate-bounce">
            <Upload className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Drop Old Photo Here</h2>
          <p className="text-sm text-sky-200 mt-2 max-w-sm text-center">
            Release to instantly upload and begin the clarity rebuild &amp; unblur process.
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e222b] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-sky-500/40 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Outer Shell: either centered Android phone frame or full-screen studio */}
      <div
        className={`w-full transition-all duration-300 flex flex-col overflow-hidden relative ${
          isPhoneFrame
            ? 'max-w-[480px] h-[100dvh] sm:h-[94vh] sm:max-h-[920px] rounded-none sm:rounded-[44px] sm:border-[8px] sm:border-[#202229] sm:shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] bg-[#101217]'
            : 'max-w-7xl h-[100dvh] sm:h-[96vh] rounded-none sm:rounded-2xl border border-white/10 shadow-2xl bg-[#101217]'
        }`}
      >
        {/* Android Header with Status Bar and Top Bar */}
        <AndroidHeader
          isPhoneFrame={isPhoneFrame}
          setIsPhoneFrame={setIsPhoneFrame}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenAiDiagnostic={() => setIsAiModalOpen(true)}
          isAiAnalyzing={isAiAnalyzing}
          hasAiResult={Boolean(aiResult)}
        />

        {/* Quick Sample Selector & Import Action Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#14161c] border-b border-white/5 overflow-x-auto no-scrollbar text-xs">
          {/* Prominent Direct Upload Button */}
          <button
            onClick={() => directFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-bold text-[11px] shrink-0 shadow-md active:scale-95 transition-all"
            title="Upload old photo from your computer or phone"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium shrink-0 border border-white/10 transition-colors"
            title="Open full import dialog (Gallery, Camera, Paste, Link)"
          >
            <FileUp className="w-3.5 h-3.5 text-sky-400" />
            <span>More Options</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 shrink-0 mx-0.5" />

          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider flex items-center gap-1 shrink-0">
            <ImageIcon className="w-3 h-3 text-sky-400" />
            Samples:
          </span>

          {SAMPLE_PHOTOS.map((sp) => {
            const isCurrent = currentPhoto.url === sp.url;
            return (
              <button
                key={sp.id}
                onClick={() => handleSelectPhoto(sp.url, sp.title, sp.initialPresetId)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all border ${
                  isCurrent
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-sm'
                    : 'bg-white/5 text-white/60 hover:text-white border-white/8 hover:bg-white/10'
                }`}
              >
                {sp.title}
              </button>
            );
          })}
        </div>

        {/* Main Photo Interactive Viewer (Split slider, Loupe, Magic Eraser) */}
        <PhotoViewer
          originalUrl={currentPhoto.url}
          enhancedUrl={enhancedUrl}
          isProcessing={isProcessing}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          onApplyManualInpaint={handleApplyManualInpaint}
        />

        {/* Bottom Material Restoration Tabs & Controls */}
        <RestorationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          settings={settings}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
          aiResult={aiResult}
          onApplyAiRecipe={handleApplyAiRecipe}
          onRunAiDiagnostic={handleRunAiDiagnostic}
          isAiAnalyzing={isAiAnalyzing}
        />
      </div>

      {/* Modals */}
      <PhotoImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelectPhoto={handleSelectPhoto}
        currentPhotoUrl={currentPhoto.url}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        originalUrl={currentPhoto.url}
        enhancedUrl={enhancedUrl || currentPhoto.url}
        photoTitle={currentPhoto.title}
      />

      <AiDiagnosticModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        result={aiResult}
        isLoading={isAiAnalyzing}
        onRunAnalysis={handleRunAiDiagnostic}
        onApplyRecipe={handleApplyAiRecipe}
      />
    </div>
  );
}
