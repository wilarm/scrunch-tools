import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Download, Loader2 } from 'lucide-react';
import { ProcessedFile } from '../types';

interface DownloadAllButtonProps {
  files: ProcessedFile[];
}

function getOutputName(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  return `${base}.md`;
}

export function DownloadAllButton({ files }: DownloadAllButtonProps) {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const file of files) {
        zip.file(getOutputName(file.name), file.finalMarkdown);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axp-content-${Date.now()}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }, [files]);

  if (files.length === 0) return null;

  return (
    <button
      onClick={handleDownloadAll}
      disabled={isZipping}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
    >
      {isZipping ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparing zip...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download All ({files.length}) as .zip
        </>
      )}
    </button>
  );
}
