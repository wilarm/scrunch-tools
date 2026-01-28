import { useState } from 'react';
import { ChevronDown, GripVertical, X, Layers } from 'lucide-react';

// Many-to-many fields that can cause row explosion
const MANY_TO_MANY_FIELDS = {
  responses: ['tags', 'key_topics'],
  query: ['ai_platform', 'tag', 'prompt_topic', 'competitor_id'],
};

interface FieldGroup {
  name: string;
  fields: string[];
  subgroups?: { name: string; fields: string[] }[];
}

interface FieldSelectorProps {
  selectedFields: string[];
  onSelectionChange: (fields: string[]) => void;
  groups: FieldGroup[];
  allFields: string[];
  manyToManyFields: string[];
  emptyMessage?: string;
}

export function FieldSelector({
  selectedFields,
  onSelectionChange,
  groups,
  allFields,
  manyToManyFields,
  emptyMessage = 'No fields selected',
}: FieldSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      onSelectionChange(selectedFields.filter(f => f !== field));
    } else {
      onSelectionChange([...selectedFields, field]);
    }
  };

  const removeField = (field: string) => {
    onSelectionChange(selectedFields.filter(f => f !== field));
  };

  const selectAll = () => {
    onSelectionChange(allFields);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const toggleGroupSelection = (groupFields: string[]) => {
    const allSelected = groupFields.every(f => selectedFields.includes(f));
    if (allSelected) {
      onSelectionChange(selectedFields.filter(f => !groupFields.includes(f)));
    } else {
      const newSelection = Array.from(new Set([...selectedFields, ...groupFields]));
      onSelectionChange(newSelection);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newFields = [...selectedFields];
      const [removed] = newFields.splice(draggedIndex, 1);
      newFields.splice(dragOverIndex, 0, removed);
      onSelectionChange(newFields);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const isManyToMany = (field: string) => manyToManyFields.includes(field);

  return (
    <div className="space-y-4">
      {/* Selected Fields Preview */}
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Selected fields ({selectedFields.length})
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {selectedFields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedFields.map((field, index) => (
              <div
                key={field}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-move transition-all ${
                  dragOverIndex === index
                    ? 'bg-blue-200 border-blue-400'
                    : isManyToMany(field)
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-white text-gray-700 border border-gray-300'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-3 h-3 text-gray-400" />
                {isManyToMany(field) && (
                  <Layers className="w-3 h-3 text-amber-600" />
                )}
                <span>{field}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(field);
                  }}
                  className="ml-0.5 hover:text-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedFields.some(f => isManyToMany(f)) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            <Layers className="w-3 h-3" />
            <span>= many-to-many field (can cause row explosion)</span>
          </div>
        )}
      </div>

      {/* Field Groups */}
      <div className="space-y-2">
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.name] ?? false;
          const groupFields = group.subgroups
            ? group.subgroups.flatMap(sg => sg.fields)
            : group.fields;
          const allSelected = groupFields.every(f => selectedFields.includes(f));
          const someSelected = groupFields.some(f => selectedFields.includes(f));

          return (
            <div key={group.name} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleGroup(group.name)}
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
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleGroupSelection(groupFields);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900">{group.name}</span>
                  <span className="text-xs text-gray-500">({groupFields.length})</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  {group.subgroups ? (
                    <div className="space-y-4">
                      {group.subgroups.map((subgroup) => (
                        <div key={subgroup.name}>
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            {subgroup.name}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {subgroup.fields.map((field) => (
                              <FieldCheckbox
                                key={field}
                                field={field}
                                checked={selectedFields.includes(field)}
                                onChange={() => toggleField(field)}
                                isManyToMany={isManyToMany(field)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {group.fields.map((field) => (
                        <FieldCheckbox
                          key={field}
                          field={field}
                          checked={selectedFields.includes(field)}
                          onChange={() => toggleField(field)}
                          isManyToMany={isManyToMany(field)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FieldCheckboxProps {
  field: string;
  checked: boolean;
  onChange: () => void;
  isManyToMany: boolean;
}

function FieldCheckbox({ field, checked, onChange, isManyToMany }: FieldCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded"
      />
      <span className="text-sm text-gray-700 flex items-center gap-1">
        {field}
        {isManyToMany && (
          <span title="Many-to-many field (can cause row explosion)">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
      </span>
    </label>
  );
}

// Configuration for Responses tab
export const RESPONSES_FIELD_GROUPS: FieldGroup[] = [
  { name: 'Identity & Timing', fields: ['id', 'created_at'] },
  { name: 'Context', fields: ['platform', 'country', 'prompt_id', 'prompt'] },
  { name: 'Response', fields: ['response_text', 'stage', 'branded'] },
  { name: 'Persona', fields: ['persona_id', 'persona_name', 'tags', 'key_topics'] },
  { name: 'Brand Metrics', fields: ['brand_present', 'brand_sentiment', 'brand_position'] },
  {
    name: 'Competitors',
    fields: [
      'competitors_present',
      'competitor_1_id', 'competitor_1_name', 'competitor_1_present', 'competitor_1_position', 'competitor_1_sentiment',
      'competitor_2_id', 'competitor_2_name', 'competitor_2_present', 'competitor_2_position', 'competitor_2_sentiment',
      'competitor_3_id', 'competitor_3_name', 'competitor_3_present', 'competitor_3_position', 'competitor_3_sentiment',
      'competitor_4_id', 'competitor_4_name', 'competitor_4_present', 'competitor_4_position', 'competitor_4_sentiment',
      'competitor_5_id', 'competitor_5_name', 'competitor_5_present', 'competitor_5_position', 'competitor_5_sentiment',
    ],
  },
  {
    name: 'Citations',
    fields: [
      'citation_1_domain', 'citation_1_source_type', 'citation_1_title', 'citation_1_url',
      'citation_2_domain', 'citation_2_source_type', 'citation_2_title', 'citation_2_url',
      'citation_3_domain', 'citation_3_source_type', 'citation_3_title', 'citation_3_url',
      'citation_4_domain', 'citation_4_source_type', 'citation_4_title', 'citation_4_url',
      'citation_5_domain', 'citation_5_source_type', 'citation_5_title', 'citation_5_url',
    ],
  },
];

export const RESPONSES_ALL_FIELDS = RESPONSES_FIELD_GROUPS.flatMap(g => g.fields);
export const RESPONSES_MANY_TO_MANY = MANY_TO_MANY_FIELDS.responses;

// Configuration for Query tab
export const QUERY_FIELD_GROUPS: FieldGroup[] = [
  {
    name: 'Dimensions',
    fields: [],
    subgroups: [
      { name: 'Prompt & Taxonomy', fields: ['prompt_id', 'prompt', 'prompt_topic', 'stage', 'tag', 'branded'] },
      { name: 'Time', fields: ['date', 'date_week', 'date_month'] },
      { name: 'Platform & Geography', fields: ['ai_platform', 'country'] },
      { name: 'Personas', fields: ['persona_id', 'persona_name'] },
      { name: 'Competitors', fields: ['competitor_id', 'competitor_name'] },
      { name: 'Sources', fields: ['source_url', 'source_type'] },
    ],
  },
  {
    name: 'Metrics',
    fields: [
      'responses',
      'brand_presence_percentage',
      'brand_position_score',
      'brand_sentiment_score',
      'competitor_presence_percentage',
      'competitor_position_score',
      'competitor_sentiment_score',
    ],
  },
];

export const QUERY_ALL_FIELDS = QUERY_FIELD_GROUPS.flatMap(g =>
  g.subgroups ? g.subgroups.flatMap(sg => sg.fields) : g.fields
);
export const QUERY_MANY_TO_MANY = MANY_TO_MANY_FIELDS.query;
