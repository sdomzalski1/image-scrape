interface Props {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  downloading: boolean;
}

const Toolbar = ({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDownloadSelected,
  onDownloadAll,
  downloading,
}: Props) => {
  const nothingSelected = selectedCount === 0;
  const nothingToDownload = totalCount === 0;

  return (
    <div className="card toolbar">
      <div className="toolbar-left">
        <div className="selection">
          <span className="count">
            {selectedCount} / {totalCount} selected
          </span>
          <div className="controls">
            <button type="button" className="ghost" onClick={onSelectAll}>
              Select all
            </button>
            <button type="button" className="ghost" onClick={onDeselectAll}>
              Deselect all
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar-actions">
        <button
          type="button"
          className="secondary"
          disabled={nothingSelected || downloading}
          onClick={onDownloadSelected}
        >
          {downloading ? 'Preparing...' : 'Download selected'}
        </button>
        <button
          type="button"
          className="primary"
          disabled={nothingToDownload || downloading}
          onClick={onDownloadAll}
        >
          {downloading ? 'Preparing...' : 'Download all'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
