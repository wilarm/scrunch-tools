import { X } from 'lucide-react';

interface AdvancedVariablesSidebarProps {
  brandCount: number;
  perBrandNames: string;
  perBrandLocations: string;
  onPerBrandNamesChange: (value: string) => void;
  onPerBrandLocationsChange: (value: string) => void;
  onClose: () => void;
}

export function AdvancedVariablesSidebar({
  brandCount,
  perBrandNames,
  perBrandLocations,
  onPerBrandNamesChange,
  onPerBrandLocationsChange,
  onClose,
}: AdvancedVariablesSidebarProps) {
  const nameLines = perBrandNames.split('\n').filter(line => line.trim()).length;
  const locationLines = perBrandLocations.split('\n').filter(line => line.trim()).length;

  return (
    <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advanced Variables</h2>
          <p className="text-sm text-gray-600 mt-1">Configure variables per brand</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close sidebar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Instructions</p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>These values will override any enriched data or defaults</li>
            <li>Enter one value per line (newline-separated)</li>
            <li>Number of lines must match the number of brands ({brandCount})</li>
            <li>The order matches the brands in your preview table</li>
          </ul>
        </div>

        <div>
          <label htmlFor="per-brand-names" className="block text-sm font-medium text-gray-900 mb-2">
            Manual Names {'{{name}}'}
            <span className="ml-2 text-xs text-gray-500">
              ({nameLines} of {brandCount} brands configured)
            </span>
          </label>
          <textarea
            id="per-brand-names"
            value={perBrandNames}
            onChange={(e) => onPerBrandNamesChange(e.target.value)}
            placeholder={`One line per brand (${brandCount} total):\nBrand A\nBrand B\nBrand C`}
            rows={10}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm ${
              nameLines > 0 && nameLines !== brandCount
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {nameLines > 0 && nameLines !== brandCount && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Line count ({nameLines}) must match brand count ({brandCount})
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Leave blank to use enriched brand names.
          </p>
        </div>

        <div>
          <label htmlFor="per-brand-locations" className="block text-sm font-medium text-gray-900 mb-2">
            Manual Locations {'{{primary_location}}'}
            <span className="ml-2 text-xs text-gray-500">
              ({locationLines} of {brandCount} brands configured)
            </span>
          </label>
          <textarea
            id="per-brand-locations"
            value={perBrandLocations}
            onChange={(e) => onPerBrandLocationsChange(e.target.value)}
            placeholder={`One line per brand (${brandCount} total):\nNew York, NY\nSan Francisco, CA\nLondon, UK`}
            rows={10}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm ${
              locationLines > 0 && locationLines !== brandCount
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {locationLines > 0 && locationLines !== brandCount && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Line count ({locationLines}) must match brand count ({brandCount})
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Leave blank to use enriched locations.
          </p>
        </div>

      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            All fields are optional. Close sidebar to continue.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
