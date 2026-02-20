import { FileText, Link } from 'lucide-react';
import { UploadedFile, LinkPoolEntry } from '../types';

interface FileSummaryProps {
  files: UploadedFile[];
  linkPool: LinkPoolEntry[];
  onClear: () => void;
}

export function FileSummary({ files, linkPool, onClear }: FileSummaryProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{files.length}</span>{' '}
            file{files.length !== 1 ? 's' : ''} loaded
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{linkPool.length}</span>{' '}
            unique URL{linkPool.length !== 1 ? 's' : ''} in link pool
          </span>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
