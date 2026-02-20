import { useState, useCallback } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { ProcessedFile } from '../types';

interface FileResultProps {
  file: ProcessedFile;
  onMarkdownChange: (name: string, newMarkdown: string) => void;
}

function getOutputName(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  return `${base}.md`;
}

export function FileResult({ file, onMarkdownChange }: FileResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(file.finalMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [file.finalMarkdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([file.finalMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getOutputName(file.name);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [file.finalMarkdown, file.name]);

  const charCount = file.finalMarkdown.length;

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="text-xs text-gray-400">{charCount.toLocaleString()} chars</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-all"
            title="Copy markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            title="Download .md file"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Editable textarea */}
      <textarea
        value={file.finalMarkdown}
        onChange={(e) => onMarkdownChange(file.name, e.target.value)}
        className="flex-1 w-full px-4 py-3 text-sm font-mono text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
