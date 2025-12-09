export type SourceType = 'imgTag' | 'background' | 'css' | 'other';

export interface ImageItem {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  sourceType: SourceType;
  isSelected: boolean;
}
