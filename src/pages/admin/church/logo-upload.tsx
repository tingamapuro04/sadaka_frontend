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
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Logo</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
          {preview || logoUrl ? (
            <img src={preview ?? logoUrl} alt="Church logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500">No logo</span>
          )}
        </div>
        {!disabled ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Upload PNG or JPG</span>
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
              className="block w-full text-sm"
            />
            {isUploading ? <span className="mt-2 block text-slate-500">Uploading...</span> : null}
          </label>
        ) : null}
      </div>
    </div>
  );
};

