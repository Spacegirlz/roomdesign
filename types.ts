
export enum DesignMode {
  CLEAN = 'Deep Clean',
  REDESIGN = 'Re-Imagine',
  CHRISTMAS = 'Seasonal',
  STYLE_TRANSFER = 'Style Transfer'
}

export type ReferenceType = 'style' | 'element';
export type GenerationFormat = 'single' | 'grid_angles' | 'grid_variants';

export interface ReferenceImage {
  id: string;
  url: string;
  type: ReferenceType;
}

export interface LinkItem {
  id: string;
  url: string;
  analysis: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface DesignState {
  projectID: string;
  spaceImages: string[]; // Array of base images (angles)
  activeSpaceIndex: number; // Currently selected view
  referenceImages: ReferenceImage[];
  generatedImage: string | null;
  mode: DesignMode;
  prompt: string;
  isGenerating: boolean;
  budgetIndex: number; // 0-8 slider index
  location: string;
  externalLinks: LinkItem[];
  reportContent?: string;
  format: GenerationFormat;
  structureLocked: boolean;
  showGuide: boolean;
}
