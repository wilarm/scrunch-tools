import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const DIMENSIONS = [
  { group: 'Prompt & Taxonomy', fields: ['prompt_id', 'prompt', 'prompt_topic', 'stage', 'tag', 'branded'] },
  { group: 'Time', fields: ['date', 'date_week', 'date_month'] },
  { group: 'Platform & Geography', fields: ['ai_platform', 'country'] },
  { group: 'Personas', fields: ['persona_id', 'persona_name'] },
  { group: 'Competitors', fields: ['competitor_id', 'competitor_name'] },
  { group: 'Sources', fields: ['source_url', 'source_type'] },
];

const METRICS = [
  'responses',
  'brand_presence_percentage',
  'brand_position_score',
  'brand_sentiment_score',
  'competitor_presence_percentage',
  'competitor_position_score',
  'competitor_sentiment_score',
];

interface QueryFieldSelectorProps {
  selectedFields: string[];
  onSelectionChange: (fields: string[]) => void;
}

export function QueryFieldSelector({ selectedFields, onSelectionChange }: QueryFieldSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Dimensions': true,
    'Metrics': true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      onSelectionChange(selectedFields.filter(f => f !== field));
    } else {
      onSelectionChange([...selectedFields, field]);
    }
  };

  const selectAll = () => {
    const allFields = DIMENSIONS.flatMap(d => d.fields).concat(METRICS);
    onSelectionChange(allFields);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
        >
          Select All
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        <div className="border rounded-lg divide-y">
          <div>
            <button
              onClick={() => toggleGroup('Dimensions')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-900">Dimensions</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  expandedGroups['Dimensions'] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedGroups['Dimensions'] && (
              <div className="px-4 py-3 bg-gray-50 space-y-3">
                {DIMENSIONS.map((group) => (
                  <div key={group.group}>
                    <div className="text-xs font-semibold text-gray-600 mb-2">{group.group}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {group.fields.map((field) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => toggleField(field)}
                            className="w-4 h-4 rounded"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">{field}</span>
                            <span className="text-xs text-gray-500">dimension</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleGroup('Metrics')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-900">Metrics</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  expandedGroups['Metrics'] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedGroups['Metrics'] && (
              <div className="px-4 py-3 bg-gray-50 space-y-2">
                {METRICS.map((field) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => toggleField(field)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">{field}</span>
                      <span className="text-xs text-gray-500">metric</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFields.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-900">
            <div className="font-semibold mb-2">Selected fields ({selectedFields.length}):</div>
            <div className="flex flex-wrap gap-2">
              {selectedFields.map(field => (
                <span key={field} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
