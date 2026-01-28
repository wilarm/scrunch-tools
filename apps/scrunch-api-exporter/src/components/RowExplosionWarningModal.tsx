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
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
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
            You've selected multiple many-to-many fields that can create extra rows in your export:
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
            Each of these fields can have multiple values per response. When combined,
            this may significantly multiply the number of rows in your export (row explosion).
          </p>

          <a
            href="https://helpcenter.scrunchai.com/en/articles/13133378-modeling-tags-from-the-responses-api-and-avoiding-row-explosion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm mb-2"
          >
            Learn how to model these safely →
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
