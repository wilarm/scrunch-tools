import { AlertTriangle, X } from 'lucide-react';

interface RowExplosionWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  selectedFields: string[];
}

export function RowExplosionWarningModal({
  isOpen,
  onConfirm,
  onCancel,
  selectedFields,
}: RowExplosionWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-semibold text-amber-900">Row Explosion Warning</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-amber-600 hover:text-amber-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-gray-700 mb-4">
            You've selected multiple many-to-many fields:
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedFields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm font-medium"
              >
                {field}
              </span>
            ))}
          </div>

          <p className="text-gray-700 mb-4">
            Each of these fields can have multiple values per response. When flattened together,
            this may significantly multiply the number of rows in your export (row explosion).
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Best Practice</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Only explode one array at a time</li>
              <li>Create separate bridge tables for each many-to-many field</li>
              <li>Use <code className="bg-blue-100 px-1 rounded">COUNT(DISTINCT response_id)</code> when joining</li>
            </ul>
          </div>

          <a
            href="https://helpcenter.scrunchai.com/en/articles/13133378-modeling-tags-from-the-responses-api-and-avoiding-row-explosion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Learn how to model these safely in your warehouse →
          </a>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 font-medium transition"
          >
            Export Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
