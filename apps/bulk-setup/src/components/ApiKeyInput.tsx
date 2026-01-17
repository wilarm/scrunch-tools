import { Key } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ apiKey, onChange }: ApiKeyInputProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
      </div>
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your API key"
          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );
}
