import { FileText, Layers } from 'lucide-react';
import { useMemo } from 'react';
import { containsAllVariablesToken, validatePromptVariables, ALL_VARIABLES_TOKEN } from '../utils/variableExpansion';
import { parsePrompts } from '../utils/promptParser';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  promptCount: number;
  platformCount: number;
  customVariables?: Record<string, string>;
  promptVariations?: Record<string, string[]>;
  onOpenVariationSidebar?: (prompt: string) => void;
  allowCommaSeparation?: boolean;
  onAllowCommaSeparationChange?: (value: boolean) => void;
}

export function PromptInput({
  value,
  onChange,
  promptCount,
  platformCount,
  customVariables,
  promptVariations = {},
  onOpenVariationSidebar,
  allowCommaSeparation = false,
  onAllowCommaSeparationChange
}: PromptInputProps) {
  const promptVariants = promptCount * platformCount;
  const customVarEntries = customVariables ? Object.entries(customVariables) : [];
  const prompts = useMemo(() => parsePrompts(value, allowCommaSeparation), [value, allowCommaSeparation]);

  const promptsWithValidation = useMemo(() => {
    return prompts
      .filter(prompt => containsAllVariablesToken(prompt))
      .map(prompt => ({
        prompt,
        hasAllVariables: containsAllVariablesToken(prompt),
        validation: validatePromptVariables(prompt),
        variationCount: promptVariations[prompt]?.length || 0
      }));
  }, [prompts, promptVariations]);

  const hasValidationErrors = promptsWithValidation.some(p => !p.validation.valid);

  return (
    <div>
      <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 mb-2">
        Seed Prompts
      </label>
      <div className="relative">
        <textarea
          id="prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter prompts (one per line)&#10;Example: What are the best {{name}} alternatives in {{primary_location}}?&#10;&#10;For multiple variations from one template:&#10;What is the best tax software for {{multiple}}?"
          rows={8}
          className="w-full px-4 py-3 pr-24 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {promptCount} seed prompt{promptCount !== 1 ? 's' : ''}
          </div>
          <div className="text-right text-blue-600">
            {promptVariants} variant{promptVariants !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {promptsWithValidation.length > 0 && (
        <div className="mt-3 space-y-2">
          {promptsWithValidation.map((item, index) => (
            <div key={index}>
              <div className={`flex items-start gap-2 p-2 rounded-lg border ${
                !item.validation.valid
                  ? 'bg-red-50 border-red-200'
                  : item.hasAllVariables
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-700 break-words line-clamp-2">
                    {item.prompt}
                  </p>
                </div>
                {item.hasAllVariables && item.validation.valid && onOpenVariationSidebar && (
                  <button
                    onClick={() => onOpenVariationSidebar(item.prompt)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs font-medium"
                    title="Manage variations"
                  >
                    <Layers className="w-3 h-3" />
                    {item.variationCount}
                  </button>
                )}
                {!item.validation.valid && (
                  <span className="flex-shrink-0 text-red-600 text-xs font-medium">
                    Error
                  </span>
                )}
              </div>
              {!item.validation.valid && item.validation.error && (
                <p className="mt-1 ml-2 text-xs text-red-600">
                  {item.validation.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasValidationErrors && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 font-medium">
            Please fix validation errors above before generating prompts.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {onAllowCommaSeparationChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowCommaSeparation}
              onChange={(e) => onAllowCommaSeparationChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Allow comma-separated prompts</span>
          </label>
        )}
        <p className="text-xs text-gray-600">
          Separate prompts with {allowCommaSeparation ? 'commas or line breaks' : 'line breaks'}. Use variables:
        </p>
        <div className="flex flex-wrap gap-2">
          <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
            {'{{name}}'} - Brand name
          </code>
          <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
            {'{{primary_location}}'} - Location
          </code>
          <code className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
            {ALL_VARIABLES_TOKEN} - Multiple variations
          </code>
          {customVarEntries.map(([key, val]) => (
            <code key={key} className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs">
              {`{{${key}}}`} - {val || '(empty)'}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
