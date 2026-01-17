import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_COLUMNS } from '../utils/api';

interface ColumnSelectorProps {
  selectedColumns: string[];
  onSelectionChange: (columns: string[]) => void;
}

const COLUMN_GROUPS = {
  'Identity & Timing': ['id', 'created_at'],
  'Context': ['platform', 'country', 'prompt_id', 'prompt'],
  'Response': ['response_text', 'stage', 'branded'],
  'Persona': ['persona_id', 'persona_name', 'tags', 'key_topics'],
  'Brand Metrics': ['brand_present', 'brand_sentiment', 'brand_position'],
  'Competitors': [
    'competitors_present',
    'competitor_1_id', 'competitor_1_name', 'competitor_1_present', 'competitor_1_position', 'competitor_1_sentiment',
    'competitor_2_id', 'competitor_2_name', 'competitor_2_present', 'competitor_2_position', 'competitor_2_sentiment',
    'competitor_3_id', 'competitor_3_name', 'competitor_3_present', 'competitor_3_position', 'competitor_3_sentiment',
    'competitor_4_id', 'competitor_4_name', 'competitor_4_present', 'competitor_4_position', 'competitor_4_sentiment',
    'competitor_5_id', 'competitor_5_name', 'competitor_5_present', 'competitor_5_position', 'competitor_5_sentiment',
  ],
  'Citations': [
    'citation_1_domain', 'citation_1_source_type', 'citation_1_title', 'citation_1_url',
    'citation_2_domain', 'citation_2_source_type', 'citation_2_title', 'citation_2_url',
    'citation_3_domain', 'citation_3_source_type', 'citation_3_title', 'citation_3_url',
    'citation_4_domain', 'citation_4_source_type', 'citation_4_title', 'citation_4_url',
    'citation_5_domain', 'citation_5_source_type', 'citation_5_title', 'citation_5_url',
  ],
};

export function ColumnSelector({ selectedColumns, onSelectionChange }: ColumnSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const toggleColumn = (column: string) => {
    const newSelection = selectedColumns.includes(column)
      ? selectedColumns.filter(c => c !== column)
      : [...selectedColumns, column];
    onSelectionChange(newSelection);
  };

  const toggleGroupSelection = (group: string) => {
    const groupColumns = COLUMN_GROUPS[group as keyof typeof COLUMN_GROUPS] || [];
    const allSelected = groupColumns.every(col => selectedColumns.includes(col));

    if (allSelected) {
      const newSelection = selectedColumns.filter(col => !groupColumns.includes(col));
      onSelectionChange(newSelection);
    } else {
      const newSelection = Array.from(new Set([...selectedColumns, ...groupColumns]));
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    onSelectionChange(AVAILABLE_COLUMNS);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
        >
          Select All
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition"
        >
          Clear All
        </button>
        <div className="ml-auto text-xs text-gray-600">
          {selectedColumns.length} of {AVAILABLE_COLUMNS.length} columns
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(COLUMN_GROUPS).map(([group, columns]) => {
          const isExpanded = expandedGroups[group] ?? false;
          const allSelected = columns.every(col => selectedColumns.includes(col));
          const someSelected = columns.some(col => selectedColumns.includes(col));

          return (
            <div key={group} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) {
                        el.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={() => toggleGroupSelection(group)}
                    onClick={e => e.stopPropagation()}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900">{group}</span>
                  <span className="text-xs text-gray-500">({columns.length})</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
                  {columns.map(column => (
                    <label key={column} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{column}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
