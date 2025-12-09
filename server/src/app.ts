import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import archiver from 'archiver';
import {
  MAX_IMAGES,
  buildArchiveFilename,
  buildImageFilename,
  extractImagesFromHtml,
  isBlockedHost,
  isValidHttpUrl,
} from './helpers';

const app = express();
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
];
const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS];
const MAX_HTML_BYTES = 1_500_000; // ~1.5 MB cap to avoid oversized pages

app.disable('x-powered-by');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, origin);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.post('/api/scrape', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!isValidHttpUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid http or https URL.' });
  }

  const targetUrl = url as string;
  const targetHost = new URL(targetUrl).hostname;
  if (isBlockedHost(targetHost)) {
    return res
      .status(400)
      .json({ error: 'This host is not allowed. Please use a public website URL.' });
  }

  try {
    const response = await axios.get<string>(targetUrl, {
      timeout: 10000,
      responseType: 'text',
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'image-scraper/1.0 (+https://localhost)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    const images = extractImagesFromHtml(response.data, targetUrl);
    return res.json({ images });
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 500;
    const message =
      axiosError.code === 'ECONNABORTED'
        ? 'Timed out fetching the provided URL.'
        : axiosError.message || 'Failed to fetch the URL.';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

app.post('/api/download', async (req: Request, res: Response) => {
  const { imageUrls } = req.body as { imageUrls?: string[] };

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'imageUrls must be a non-empty array.' });
  }

  if (imageUrls.length > MAX_IMAGES) {
    return res.status(400).json({ error: `You can request up to ${MAX_IMAGES} images at once.` });
  }

  const invalidUrl = imageUrls.find((url) => !isValidHttpUrl(url));
  if (invalidUrl) {
    return res.status(400).json({ error: `Invalid image URL provided: ${invalidUrl}` });
  }

  const blockedUrl = imageUrls.find((url) => {
    try {
      return isBlockedHost(new URL(url).hostname);
    } catch {
      return true;
    }
  });
  if (blockedUrl) {
    return res.status(400).json({ error: `Image host is not allowed: ${blockedUrl}` });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const failed: string[] = [];
  let successCount = 0;
  let archiveStarted = false;

  archive.on('error', (err) => {
    console.error('Archive error', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to build archive.' });
    } else {
      res.end();
    }
  });

  const archiveFilename = (() => {
    try {
      const host = new URL(imageUrls[0]).hostname;
      return buildArchiveFilename(host);
    } catch {
      return buildArchiveFilename();
    }
  })();

  const startArchive = () => {
    if (archiveStarted) return;
    archiveStarted = true;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveFilename}"`);
    archive.pipe(res);
  };

  for (const [index, url] of imageUrls.entries()) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 12000,
        maxRedirects: 2,
        headers: {
          Accept: 'image/*',
        },
      });

      startArchive();
      const name = buildImageFilename(
        url,
        successCount,
        response.headers['content-type'] as string | undefined,
      );
      archive.append(response.data, { name });
      successCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to download image ${url}: ${message}`);
      failed.push(url);
      continue;
    }
  }

  if (!archiveStarted || successCount === 0) {
    return res
      .status(502)
      .json({ error: 'Failed to download any of the provided images.', failedUrls: failed });
  }

  archive.finalize();
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unexpected error', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
