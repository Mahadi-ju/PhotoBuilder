import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  History,
  Check
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import { SamplePhoto } from '../types';

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
  const [activeTab, setActiveTab] = useState<'samples' | 'upload' | 'camera' | 'url'>('samples');
  const [inputUrl, setInputUrl] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSelectPhoto(reader.result, file.name.replace(/\.[^/.]+$/, ''));
          onClose();
        }
      };
      reader.readAsDataURL(file);
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
    onSelectPhoto(dataUrl, 'Camera Photo');
    onClose();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSelectPhoto(inputUrl.trim(), 'Web Photo');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#181a20] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm sm:text-base font-semibold text-white">Choose Old Photo to Clear</h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 p-2 bg-[#121418] border-b border-white/5 gap-1">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('samples');
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'samples' ? 'bg-sky-500 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            Samples
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'upload' ? 'bg-sky-500 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'camera' ? 'bg-sky-500 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            Camera
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('url');
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'url' ? 'bg-sky-500 text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            Link URL
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* SAMPLES TAB */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Select an authentic historical photograph to test the rebuilding and deblurring engine:
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
                      className={`relative flex flex-col text-left rounded-xl overflow-hidden border transition-all active:scale-98 group ${
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
                        <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-sky-300">
                          {photo.era}
                        </div>
                      </div>
                      <div className="p-2 bg-[#1b1e26]">
                        <span className="text-xs font-semibold text-white block line-clamp-1">{photo.title}</span>
                        <span className="text-[10px] text-white/50 block line-clamp-2 mt-0.5">{photo.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:border-sky-400/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-white">Click or Drag your photo here</h3>
              <p className="text-xs text-white/50 mt-1 text-center max-w-xs">
                Supports old camera scans, vintage portraits, faded prints, JPG, PNG, and WebP (up to 25MB)
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs shadow-md"
              >
                Browse Files
              </button>
            </div>
          )}

          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden relative border border-white/10 flex items-center justify-center">
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
                    className="absolute px-4 py-2 rounded-full bg-sky-500 text-black font-semibold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Enable Camera</span>
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
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputUrl.trim()}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs rounded-xl disabled:opacity-40 transition-all"
                  >
                    Load
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
