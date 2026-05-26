import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
  const filesRef = useRef<File[]>(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  function mergePicked(current: File[], picked: File[]): File[] {
    const seen = new Set(current.map(fileKey));
    const next = [...current];
    for (const f of picked) {
      const k = fileKey(f);
      if (!seen.has(k)) {
        seen.add(k);
        next.push(f);
      }
    }
    return next;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    if (multiple) {
      onFilesChange(mergePicked(filesRef.current, picked));
    } else {
      onFilesChange([picked[0]]);
    }
  }

  function removeAt(index: number) {
    onFilesChange(filesRef.current.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearAll() {
    onFilesChange([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const pickLabel = chooseLabel ?? (multiple ? "Choose images" : "Choose file");

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <input
        ref={inputRef}
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {pickLabel}
        </Button>
        {files.length > 0 && !disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        )}
      </div>
      {files.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground" role="status">
            {files.length} {multiple ? "image" : "file"}
            {files.length === 1 ? "" : "s"} selected
          </p>
          <ul className="space-y-1.5">
            {files.map((f, i) => (
              <li key={`${fileKey(f)}-${i}`} className="flex items-center justify-between gap-2">
                <span className="text-xs truncate">{f.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => removeAt(i)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No files selected yet.</p>
      )}
    </div>
  );
}
