import { Hash } from 'lucide-react';

interface BrandIdInputProps {
  value: string;
  onChange: (value: string) => void;
  brandIdCount: number;
}

export function BrandIdInput({ value, onChange, brandIdCount }: BrandIdInputProps) {
  return (
    <div>
      <label htmlFor="brand-id-input" className="block text-sm font-medium text-gray-700 mb-2">
        Brand IDs
      </label>
      <div className="relative">
        <textarea
          id="brand-id-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter brand IDs (comma-separated or one per line)&#10;Example: 123, 456, 789"
          rows={4}
          className="w-full px-4 py-3 pr-24 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
          <Hash className="w-4 h-4" />
          {brandIdCount} brand{brandIdCount !== 1 ? 's' : ''}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        Separate IDs with commas or line breaks. Each prompt will be added to all brands listed.
      </p>
    </div>
  );
}
