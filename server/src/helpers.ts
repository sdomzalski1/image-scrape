import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';
import net from 'net';
import path from 'path';
import { ImageInfo } from './types';

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:']);
export const MAX_IMAGES = 200;

export const isValidHttpUrl = (value: string | undefined): boolean => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) return false;
    if (isBlockedHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
};

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 0) return true; // invalid/unspecified
  return false;
};

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' || // loopback
    normalized.startsWith('fc') || // unique local
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80') // link-local
  );
};

const isIpBlocked = (ip: string): boolean => {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return false;
};

export const isBlockedHost = (hostname: string | undefined): boolean => {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === 'ip6-localhost') return true;
  if (lower.endsWith('.local')) return true;
  if (net.isIP(hostname)) return isIpBlocked(hostname);
  return false;
};

export const normalizeImageUrl = (
  src: string | undefined,
  pageUrl: string,
): string | null => {
  if (!src) return null;
  try {
    const absolute = new URL(src, pageUrl);
    if (!SUPPORTED_PROTOCOLS.has(absolute.protocol)) return null;
    if (isBlockedHost(absolute.hostname)) return null;
    return absolute.toString();
  } catch {
    return null;
  }
};

export const isTrackingPixel = (width?: number, height?: number): boolean => {
  if (width === undefined || height === undefined) return false;
  return width <= 5 && height <= 5;
};

const parseDimension = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractBackgroundUrlsFromStyle = (style: string): string[] => {
  const matches: string[] = [];
  const regex = /url\((['"]?)([^'")]+)\1\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(style)) !== null) {
    matches.push(match[2]);
  }
  return matches;
};

export const extractImagesFromHtml = (
  html: string,
  pageUrl: string,
): ImageInfo[] => {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const results: ImageInfo[] = [];

  const addImage = (image: Omit<ImageInfo, 'id'>) => {
    if (seen.has(image.src) || results.length >= MAX_IMAGES) return;
    seen.add(image.src);
    results.push({ ...image, id: randomUUID() });
  };

  $('img').each((_i, el) => {
    const src = $(el).attr('src');
    const absoluteSrc = normalizeImageUrl(src, pageUrl);
    if (!absoluteSrc) return;
    const width = parseDimension($(el).attr('width'));
    const height = parseDimension($(el).attr('height'));
    if (isTrackingPixel(width, height)) return;

    addImage({
      src: absoluteSrc,
      width,
      height,
      alt: $(el).attr('alt') || undefined,
      sourceType: 'imgTag',
    });
  });

  $('[style*="url("]').each((_i, el) => {
    const style = $(el).attr('style');
    if (!style) return;
    const urls = extractBackgroundUrlsFromStyle(style);
    urls.forEach((url) => {
      const absoluteSrc = normalizeImageUrl(url, pageUrl);
      if (!absoluteSrc) return;
      addImage({
        src: absoluteSrc,
        sourceType: 'background',
      });
    });
  });

  return results;
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

export const getExtensionFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).split('?')[0];
    if (ext && ext.length <= 6) {
      return ext;
    }
    return null;
  } catch {
    return null;
  }
};

export const getExtensionFromContentType = (contentType?: string): string | null => {
  if (!contentType) return null;
  const lower = contentType.toLowerCase().split(';')[0];
  return EXTENSION_BY_MIME[lower] || null;
};

const sanitize = (value: string): string =>
  value
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export const buildArchiveFilename = (imageHost?: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const hostPart = sanitize(imageHost || 'images');
  return `images-from-${hostPart || 'site'}-${timestamp}.zip`;
};

export const buildImageFilename = (
  url: string,
  index: number,
  contentType?: string,
): string => {
  const paddedIndex = String(index + 1).padStart(3, '0');
  const fromUrl = getExtensionFromUrl(url);
  const fromContent = getExtensionFromContentType(contentType || undefined);
  const ext = fromUrl || fromContent || '.jpg';
  return `image-${paddedIndex}${ext}`;
};
