import { Globe } from 'lucide-react';

interface WebsiteInputProps {
  value: string;
  onChange: (value: string) => void;
  websiteCount: number;
}

export function WebsiteInput({ value, onChange, websiteCount }: WebsiteInputProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Website Input</h2>
        {websiteCount > 0 && (
          <span className="ml-auto text-sm font-medium text-blue-600">
            {websiteCount} website{websiteCount !== 1 ? 's' : ''} detected
          </span>
        )}
      </div>
      <div>
        <label htmlFor="websites" className="block text-sm font-medium text-gray-700 mb-2">
          Websites (comma or newline separated)
        </label>
        <textarea
          id="websites"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com, https://another.com&#10;https://thirdsite.com"
          rows={8}
          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
        />
        <p className="mt-2 text-sm text-gray-500">
          Enter one website per line or separate multiple websites with commas
        </p>
      </div>
    </div>
  );
}
