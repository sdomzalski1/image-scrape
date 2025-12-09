import { ImageItem } from '../types';
import ImageCard from './ImageCard';

interface Props {
  images: ImageItem[];
  onToggle: (id: string) => void;
}

const ImageGrid = ({ images, onToggle }: Props) => {
  return (
    <div className="image-grid">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} onToggle={() => onToggle(image.id)} />
      ))}
    </div>
  );
};

export default ImageGrid;
