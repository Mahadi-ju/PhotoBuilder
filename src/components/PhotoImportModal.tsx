import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Clipboard,
  Check,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';

interface PhotoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (url: string, title?: string, presetId?: string) => void;
  currentPhotoUrl: string;
}

export const PhotoImportModal: React.FC<PhotoImportModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  currentPhotoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples' | 'camera' | 'url'>('upload');
  const [inputUrl, setInputUrl] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file directly
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        onSelectPhoto(reader.result, cleanName || 'Uploaded Old Photo', 'crystal-clear');
        stopCamera();
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop inside modal
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Clipboard Paste handler
  const handlePasteFromClipboard = async () => {
    setPasteError(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Clipboard API not supported in this browser. Use Ctrl+V instead.');
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              onSelectPhoto(reader.result, 'Pasted Clipboard Photo', 'crystal-clear');
              onClose();
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      setPasteError('No image found in clipboard. Please copy an image or screenshot first, or press Ctrl+V / Cmd+V.');
    } catch (err: unknown) {
      const error = err as Error;
      setPasteError(error.message || 'Unable to read clipboard. You can press Ctrl+V directly to paste an image.');
    }
  };

  // Camera capture handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access denied or unavailable', err);
      alert('Unable to access device camera. Please upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    onSelectPhoto(dataUrl, 'Captured Camera Photo', 'crystal-clear');
    onClose();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSelectPhoto(inputUrl.trim(), 'Web Photo', 'crystal-clear');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div 
        className="bg-[#181a20] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[88vh]"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#14161c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Upload &amp; Import Photo</h2>
              <p className="text-xs text-white/50">Rebuild blurry, faded, or scratched old photos</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 p-2 bg-[#101217] border-b border-white/5 gap-1 text-xs">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`py-2 px-1 text-center font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-sky-500 text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('samples');
            }}
            className={`py-2 px-1 text-center font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'samples' ? 'bg-sky-500 text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Samples</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`py-2 px-1 text-center font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera' ? 'bg-sky-500 text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('url');
            }}
            className={`py-2 px-1 text-center font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url' ? 'bg-sky-500 text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link URL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* UPLOAD / GALLERY TAB (Default) */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag & Drop Hero Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-7 sm:p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center group ${
                  isDraggingOver
                    ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                    : 'border-white/20 bg-white/5 hover:border-sky-400/60 hover:bg-white/8'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/heic,image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                <div className="w-16 h-16 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Choose Photo or Drop Image Here
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-xs">
                  Tap to browse your device gallery or drag &amp; drop any old picture, scan, or blurry portrait.
                </p>

                <button
                  type="button"
                  className="mt-4 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition-all group-hover:shadow-sky-500/20"
                >
                  Browse Device Gallery
                </button>
              </div>

              {/* Quick Actions: Paste from Clipboard */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold transition-all active:scale-98"
                >
                  <Clipboard className="w-4 h-4 text-sky-400" />
                  <span>Paste from Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    startCamera();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold transition-all active:scale-98"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Take Live Snapshot</span>
                </button>
              </div>

              {pasteError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              {/* Supported Formats & Tips */}
              <div className="p-3 rounded-xl bg-[#121418] border border-white/5 text-[11px] text-white/50 space-y-1">
                <div className="flex items-center justify-between text-white/70">
                  <span className="font-semibold text-white/80">Formats:</span>
                  <span>JPEG, PNG, WEBP, BMP, HEIC (up to 30MB)</span>
                </div>
                <p className="text-white/40 pt-1">
                  💡 Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Cmd+V</kbd> anywhere on the page to paste an image.
                </p>
              </div>
            </div>
          )}

          {/* SAMPLES TAB */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Select an authentic vintage test photograph to experience instant clarity rebuilding:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_PHOTOS.map((photo) => {
                  const isSelected = currentPhotoUrl === photo.url;
                  return (
                    <button
                      key={photo.id}
                      onClick={() => {
                        onSelectPhoto(photo.url, photo.title, photo.initialPresetId);
                        onClose();
                      }}
                      className={`relative flex flex-col text-left rounded-2xl overflow-hidden border transition-all active:scale-98 group ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-500/30'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden relative bg-black">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-sky-500 text-black p-1 rounded-full shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-sky-300">
                          {photo.era}
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#1b1e26]">
                        <span className="text-xs font-semibold text-white block line-clamp-1">{photo.title}</span>
                        <span className="text-[10px] text-white/50 block line-clamp-2 mt-0.5">{photo.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isCameraActive && (
                  <button
                    onClick={startCamera}
                    className="absolute px-5 py-2.5 rounded-full bg-sky-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Device Camera</span>
                  </button>
                )}
              </div>

              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap &amp; Clear Photo</span>
                </button>
              )}
            </div>
          )}

          {/* URL TAB */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/80 block mb-1.5">
                  Paste Direct Image URL:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://example.com/vintage-photo.jpg"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputUrl.trim()}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl disabled:opacity-40 transition-all shadow-md"
                  >
                    Load Photo
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
