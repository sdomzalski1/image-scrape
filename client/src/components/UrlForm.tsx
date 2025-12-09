import { FormEvent } from 'react';

interface Props {
  url: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const UrlForm = ({ url, onChange, onSubmit, loading }: Props) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="card url-form" onSubmit={handleSubmit}>
      <label htmlFor="url-input" className="input-label">
        Page URL
      </label>
      <div className="input-row">
        <input
          id="url-input"
          name="url"
          type="url"
          placeholder="https://example.com"
          value={url}
        onChange={(e) => onChange(e.target.value)}
          required
        />
        <button type="submit" className="primary" disabled={!url || loading}>
          {loading ? 'Fetching...' : 'Fetch images'}
        </button>
      </div>
    </form>
  );
};

export default UrlForm;
