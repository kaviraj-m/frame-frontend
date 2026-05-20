import { useId, useRef, type ReactNode } from "react";

export const IMAGE_FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/*,.jpg,.jpeg,.png,.webp";

type Props = {
  label: ReactNode;
  hint?: ReactNode;
  multiple?: boolean;
  accept?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  chooseLabel?: string;
};

function fileKey(f: File): string {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

export function FilePickField({
  label,
  hint,
  multiple = false,
  accept = IMAGE_FILE_ACCEPT,
  files,
  onFilesChange,
  disabled = false,
  chooseLabel,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    if (multiple) {
      const seen = new Set(files.map(fileKey));
      const next = [...files];
      for (const f of picked) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      onFilesChange(next);
    } else {
      onFilesChange([picked[0]]);
    }
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearAll() {
    onFilesChange([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const pickLabel = chooseLabel ?? (multiple ? "Choose images" : "Choose file");

  return (
    <div className="file-pick">
      <span className="file-pick__label">{label}</span>
      {hint ? <p className="muted small file-pick__hint">{hint}</p> : null}
      <input
        ref={inputRef}
        id={id}
        className="file-pick__input"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
      <div className="file-pick__actions">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {pickLabel}
        </button>
        {files.length > 0 && !disabled && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>
            Clear
          </button>
        )}
      </div>
      {files.length > 0 ? (
        <>
          <p className="file-pick__status" role="status">
            {files.length} {multiple ? "image" : "file"}
            {files.length === 1 ? "" : "s"} selected
          </p>
          <ul className="file-pick-list">
            {files.map((f, i) => (
              <li key={`${fileKey(f)}-${i}`}>
                <span className="small">{f.name}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={disabled}
                  onClick={() => removeAt(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted small file-pick__empty">No files selected yet.</p>
      )}
    </div>
  );
}
