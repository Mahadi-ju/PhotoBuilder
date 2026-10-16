export interface EnhancementSettings {
  deblurSharpen: number;      // 0 - 100
  faceDetailBoost: number;    // 0 - 100
  denoiseGrain: number;       // 0 - 100
  claheContrast: number;      // 0 - 100
  scratchSuppression: number; // 0 - 100
  colorVibrance: number;      // 0 - 100
  sepiaNeutralize: boolean;   // true/false
  whiteBalance: number;       // -50 to +50
  exposure: number;           // -50 to +50
  upscaleFactor: 1 | 2 | 4;   // 1x, 2x, 4x super-resolution
}

export interface Preset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  settings: EnhancementSettings;
}

export interface AiDiagnosticResult {
  era: string;
  photoType: string;
  estimatedYear: string;
  sharpnessScore: number;
  degradationLevel: string;
  detectedIssues: string[];
  restorationAdvice: string;
  suggestedSettings: {
    deblurSharpen: number;
    denoise: number;
    contrastBoost: number;
    scratchSuppression: number;
    faceEnhanceStrength: number;
    colorVibrance: number;
    sepiaCorrection: boolean;
    claheStrength: number;
    clarityRecovery: number;
  };
}

export interface SamplePhoto {
  id: string;
  title: string;
  era: string;
  description: string;
  url: string;
  initialPresetId: string;
}

export type ComparisonMode = 'slider-horizontal' | 'slider-vertical' | 'side-by-side' | 'loupe' | 'magic-eraser';

export type AndroidTab = 'clarity' | 'restore' | 'color' | 'presets' | 'ai-diagnostic';
