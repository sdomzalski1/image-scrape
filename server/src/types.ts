export type SourceType = 'imgTag' | 'background' | 'css' | 'other';

export interface ImageInfo {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  sourceType: SourceType;
}
