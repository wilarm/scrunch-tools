import { X, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { parseVariationInput, expandTemplatePrompt, ALL_VARIABLES_TOKEN } from '../utils/variableExpansion';

interface VariationSidebarProps {
  templatePrompt: string;
  variations: string[];
  onVariationsChange: (variations: string[]) => void;
  onClose: () => void;
}

export function VariationSidebar({
  templatePrompt,
  variations,
  onVariationsChange,
  onClose,
}: VariationSidebarProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (variations.length > 0) {
      setInputValue(variations.join('\n'));
    }
  }, []);

  const handleAddVariations = () => {
    const newVariations = parseVariationInput(inputValue);
    onVariationsChange(newVariations);
  };

  const handleRemoveVariation = (index: number) => {
    const updated = variations.filter((_, i) => i !== index);
    onVariationsChange(updated);
    setInputValue(updated.join('\n'));
  };

  const expandedPrompts = expandTemplatePrompt(templatePrompt, variations);

  return (
    <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prompt Variations</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage variations for this template
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Prompt
          </label>
          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <code className="text-sm text-gray-900 font-mono break-words">
              {templatePrompt}
            </code>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Each value below will replace <code className="px-1 py-0.5 bg-gray-100 rounded">{ALL_VARIABLES_TOKEN}</code> in this template
          </p>
        </div>

        <div>
          <label htmlFor="variation-input" className="block text-sm font-medium text-gray-700 mb-2">
            Variation Values
          </label>
          <textarea
            id="variation-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter values (one per line or comma-separated)&#10;Example:&#10;technology&#10;healthcare&#10;finance"
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate values with commas or line breaks
          </p>
        </div>

        <button
          onClick={handleAddVariations}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Update Variations ({parseVariationInput(inputValue).length})
        </button>

        {expandedPrompts.length > 0 && variations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Generated Prompts ({expandedPrompts.length})
              </label>
            </div>
            <div className="space-y-2">
              {variations.map((variation, index) => {
                const expandedPrompt = templatePrompt.replace(ALL_VARIABLES_TOKEN, variation);
                return (
                  <div
                    key={index}
                    className="group flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600">
                          {variation}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-mono break-words">
                        {expandedPrompt}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveVariation(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove variation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {variations.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No variations yet. Add values above to generate prompt variations.
          </div>
        )}
      </div>
    </div>
  );
}
