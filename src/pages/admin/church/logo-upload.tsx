import { useState } from 'react';

interface LogoUploadProps {
  disabled: boolean;
  isUploading: boolean;
  logoUrl?: string;
  onUpload: (file: File) => void;
}

export const LogoUpload = ({ disabled, isUploading, logoUrl, onUpload }: LogoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="card card-pad">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-semibold text-ink sm:text-base">Logo</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Shown on the public payment page. PNG or JPG, max 2MB.</p>
      </div>
      <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:flex-row sm:items-center">
        <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:mx-0">
          {preview || logoUrl ? (
            <img src={preview ?? logoUrl} alt="Church logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-ink-muted">No logo</span>
          )}
        </div>
        {!disabled ? (
          <label className="block min-w-0 flex-1 text-sm">
            <span className="mb-1.5 block field-label">Upload image</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPreview(URL.createObjectURL(file));
                onUpload(file);
              }}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
            />
            {isUploading ? (
              <span className="mt-2 block text-xs text-ink-muted" role="status">
                Uploading…
              </span>
            ) : null}
          </label>
        ) : null}
      </div>
    </div>
  );
};
