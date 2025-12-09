import { useState } from 'react';
import { ImageItem } from '../types';

interface Props {
  image: ImageItem;
  onToggle: () => void;
}

const formatHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown host';
  }
};

const formatDimensions = (width?: number, height?: number) => {
  if (!width || !height) return 'Size unknown';
  return `${width} x ${height}`;
};

const ImageCard = ({ image, onToggle }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const frameClass = [
    'image-frame',
    loaded ? 'is-loaded' : 'is-loading',
    failed ? 'is-failed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`image-card ${image.isSelected ? 'is-selected' : ''}`}>
      <label className="checkbox">
        <input type="checkbox" checked={image.isSelected} onChange={onToggle} />
      </label>
      <div className={frameClass}>
        {!loaded && !failed && <div className="placeholder">Loading preview…</div>}
        {failed && <div className="error-pill">Could not load image</div>}
        <img
          src={image.src}
          alt={image.alt || 'Scraped image'}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          title={image.src}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ opacity: loaded && !failed ? 1 : 0 }}
        />
      </div>
      <div className="meta">
        <div className="meta-row">
          <span className="meta-label">Host</span>
          <span className="meta-value">{formatHost(image.src)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Size</span>
          <span className="meta-value">{formatDimensions(image.width, image.height)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Source</span>
          <span className="meta-value">{image.sourceType}</span>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
