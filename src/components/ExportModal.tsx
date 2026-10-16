import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  Columns, 
  FileCheck, 
  CheckCircle2 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  enhancedUrl: string;
  photoTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  originalUrl,
  enhancedUrl,
  photoTitle,
}) => {
  const [exportType, setExportType] = useState<'enhanced-only' | 'split-card'>('enhanced-only');
  const [fileFormat, setFileFormat] = useState<'jpg' | 'png'>('jpg');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      if (exportType === 'enhanced-only') {
        // Direct download of enhanced photo
        const a = document.createElement('a');
        a.href = enhancedUrl;
        a.download = `${photoTitle.toLowerCase().replace(/\s+/g, '_')}_cleared_hd.${fileFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Compose Side-by-Side Before & After Graphic Card
        const imgOrig = new Image();
        const imgEnh = new Image();
        imgOrig.crossOrigin = 'anonymous';
        imgEnh.crossOrigin = 'anonymous';

        await Promise.all([
          new Promise((resolve) => {
            imgOrig.onload = resolve;
            imgOrig.src = originalUrl;
          }),
          new Promise((resolve) => {
            imgEnh.onload = resolve;
            imgEnh.src = enhancedUrl;
          }),
        ]);

        const cardCanvas = document.createElement('canvas');
        const h = Math.max(imgOrig.naturalHeight, imgEnh.naturalHeight);
        const w1 = Math.round(imgOrig.naturalWidth * (h / imgOrig.naturalHeight));
        const w2 = Math.round(imgEnh.naturalWidth * (h / imgEnh.naturalHeight));
        
        cardCanvas.width = w1 + w2 + 8; // 8px center divider
        cardCanvas.height = h + 90; // 90px bottom branding bar

        const ctx = cardCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f1115';
          ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

          // Draw Original
          ctx.drawImage(imgOrig, 0, 0, w1, h);

          // Draw Divider line
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(w1, 0, 8, h);

          // Draw Enhanced
          ctx.drawImage(imgEnh, w1 + 8, 0, w2, h);

          // Top Badges
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(20, 20, 160, 40);
          ctx.fillRect(w1 + 28, 20, 180, 40);

          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('BEFORE (OLD BLURRY)', 30, 46);

          ctx.fillStyle = '#38bdf8';
          ctx.fillText('AFTER (CLEARED HD)', w1 + 38, 46);

          // Bottom Bar
          ctx.font = '500 20px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(`ClearPhoto Rebuild • ${photoTitle}`, 25, h + 55);

          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('AI RESTORATION & CLARITY ENGINE', cardCanvas.width - 290, h + 55);

          const mime = fileFormat === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = cardCanvas.toDataURL(mime, 0.95);

          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${photoTitle.toLowerCase().replace(/\s+/g, '_')}_before_after.${fileFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a20] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm sm:text-base font-semibold text-white">Export &amp; Save Photograph</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Export Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 block mb-2">
              Export Composition:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportType('enhanced-only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'enhanced-only'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1.5 text-sky-400" />
                <span className="text-xs font-semibold block">Cleared Photo Only</span>
                <span className="text-[10px] text-white/45 block mt-0.5">Full Super-Res Ultra HD output</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('split-card')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'split-card'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Columns className="w-4 h-4 mb-1.5 text-sky-400" />
                <span className="text-xs font-semibold block">Before / After Split</span>
                <span className="text-[10px] text-white/45 block mt-0.5">Side-by-side showcase card</span>
              </button>
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 block mb-2">
              Image Format:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFileFormat('jpg')}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                  fileFormat === 'jpg'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                JPEG (High Quality 95%)
              </button>
              <button
                type="button"
                onClick={() => setFileFormat('png')}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                  fileFormat === 'png'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                PNG (Lossless Master)
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
              downloadSuccess
                ? 'bg-emerald-500 text-black'
                : 'bg-sky-500 hover:bg-sky-400 text-black'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloaded Successfully!</span>
              </>
            ) : isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating High-Res Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Saved Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
