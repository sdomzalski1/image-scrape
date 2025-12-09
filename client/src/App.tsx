import { useMemo, useState } from 'react';
import ImageGrid from './components/ImageGrid';
import Toolbar from './components/Toolbar';
import UrlForm from './components/UrlForm';
import { ImageItem } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const buildFilename = (url: string | undefined) => {
  try {
    if (!url) throw new Error('no url');
    const host = new URL(url).hostname.replace(/\./g, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `images-from-${host}-${timestamp}.zip`;
  } catch {
    return `images-${Date.now()}.zip`;
  }
};

function App() {
  const [urlInput, setUrlInput] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const selectedCount = useMemo(
    () => images.filter((img) => img.isSelected).length,
    [images],
  );

  const fetchImages = async () => {
    if (!urlInput.trim()) {
      setError('Please paste a URL to scrape.');
      return;
    }

    try {
      const parsed = new URL(urlInput); // validate shape in browser before hitting server
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http and https are allowed.');
      }
    } catch {
      setError('Enter a valid http or https URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasFetched(false);
    setImages([]);

    try {
      const response = await fetch(`${API_BASE}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch images.');
      }

      const data = await response.json();
      const mapped: ImageItem[] = (data.images || []).map((img: ImageItem) => ({
        ...img,
        isSelected: true,
      }));
      setImages(mapped);
      setHasFetched(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isSelected: !img.isSelected } : img)),
    );
  };

  const setAllSelection = (value: boolean) => {
    setImages((prev) => prev.map((img) => ({ ...img, isSelected: value })));
  };

  const downloadImages = async (mode: 'all' | 'selected') => {
    const targets = mode === 'all' ? images : images.filter((img) => img.isSelected);
    if (targets.length === 0) return;

    setError(null);
    setDownloading(true);

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrls: targets.map((img) => img.src) }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to download images.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = buildFilename(targets[0]?.src);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">Image Grabber</p>
        <h1>Extract every image on a page in seconds</h1>
        <p className="subtitle">
          Paste a URL, inspect the images, and download the ones you need as a tidy zip.
        </p>
      </header>

      <UrlForm
        url={urlInput}
        onChange={setUrlInput}
        onSubmit={fetchImages}
        loading={loading}
      />

      {error && <div className="alert">{error}</div>}

      {loading && <div className="status">Fetching images...</div>}

      {!loading && hasFetched && images.length === 0 && (
        <div className="status">No images detected on that page.</div>
      )}

      {images.length > 0 && (
        <>
          <Toolbar
            totalCount={images.length}
            selectedCount={selectedCount}
            onSelectAll={() => setAllSelection(true)}
            onDeselectAll={() => setAllSelection(false)}
            onDownloadAll={() => downloadImages('all')}
            onDownloadSelected={() => downloadImages('selected')}
            downloading={downloading}
          />

          <ImageGrid images={images} onToggle={toggleSelection} />
        </>
      )}
    </div>
  );
}

export default App;
