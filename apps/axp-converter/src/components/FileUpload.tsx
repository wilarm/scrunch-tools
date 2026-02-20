import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { UploadedFile } from '../types';

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.text', '.markdown'];

function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadProps {
  onFilesLoaded: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export function FileUpload({ onFilesLoaded, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => isAcceptedFile(f.name));
    if (files.length === 0) return;

    setLoading(true);
    const results: UploadedFile[] = await Promise.all(
      files.map(
        (file) =>
          new Promise<UploadedFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({ name: file.name, rawText: (e.target?.result as string) ?? '' });
            };
            reader.readAsText(file);
          })
      )
    );

    // Merge with existing, dedup by name
    setPendingFiles((prev) => {
      const existing = new Map(prev.map((f) => [f.name, f]));
      for (const r of results) existing.set(r.name, r);
      return Array.from(existing.values());
    });
    setLoading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) readFiles(e.dataTransfer.files);
    },
    [disabled, readFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((name: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.name !== name));
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingFiles.length > 0) onFilesLoaded(pendingFiles);
  }, [pendingFiles, onFilesLoaded]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : isDragging
            ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.text,.markdown"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) readFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 ${
            isDragging ? 'text-indigo-500' : 'text-gray-400'
          }`}
        />
        <p className="text-base font-medium text-gray-700 mb-1">
          Drop text files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Accepts .txt, .md, .text, .markdown — multiple files supported
        </p>
        {loading && (
          <p className="text-sm text-indigo-600 mt-2 animate-pulse">Reading files...</p>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready
          </p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {pendingFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between px-4 py-2.5 bg-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatBytes(new Blob([file.rawText]).size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
          >
            Load {pendingFiles.length} File{pendingFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
