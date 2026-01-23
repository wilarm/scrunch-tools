import { X } from 'lucide-react';

interface AdvancedOptionsSidebarProps {
  promptCount: number;
  perPromptTags: string;
  perPromptStages: string;
  onPerPromptTagsChange: (value: string) => void;
  onPerPromptStagesChange: (value: string) => void;
  onClose: () => void;
}

export function AdvancedOptionsSidebar({
  promptCount,
  perPromptTags,
  perPromptStages,
  onPerPromptTagsChange,
  onPerPromptStagesChange,
  onClose,
}: AdvancedOptionsSidebarProps) {
  const tagsLines = perPromptTags.split('\n').filter(line => line.trim()).length;
  const stagesLines = perPromptStages.split('\n').filter(line => line.trim()).length;

  return (
    <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advanced Options</h2>
          <p className="text-sm text-gray-600 mt-1">Configure tags and stages per prompt</p>
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
            <li>Both fields are optional - leave blank to use global defaults</li>
            <li>Enter one value per line (newline-separated)</li>
            <li>Number of lines must match the number of prompts ({promptCount})</li>
            <li>For tags, use comma-separated values on each line</li>
            <li>For stages, use: Awareness, Evaluation, Comparison, Advice, or Other</li>
          </ul>
        </div>

        <div>
          <label htmlFor="per-prompt-tags" className="block text-sm font-medium text-gray-900 mb-2">
            Per-Prompt Tags
            <span className="ml-2 text-xs text-gray-500">
              ({tagsLines} of {promptCount} prompts configured)
            </span>
          </label>
          <textarea
            id="per-prompt-tags"
            value={perPromptTags}
            onChange={(e) => onPerPromptTagsChange(e.target.value)}
            placeholder={`One line per prompt (${promptCount} total):\nindustry, campaign1\nproduct, campaign2\ncategory, campaign3`}
            rows={10}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm ${
              tagsLines > 0 && tagsLines !== promptCount
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {tagsLines > 0 && tagsLines !== promptCount && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Line count ({tagsLines}) must match prompt count ({promptCount})
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Each line should contain comma-separated tags for the corresponding prompt. Leave blank to use global tags.
          </p>
        </div>

        <div>
          <label htmlFor="per-prompt-stages" className="block text-sm font-medium text-gray-900 mb-2">
            Per-Prompt Stages
            <span className="ml-2 text-xs text-gray-500">
              ({stagesLines} of {promptCount} prompts configured)
            </span>
          </label>
          <textarea
            id="per-prompt-stages"
            value={perPromptStages}
            onChange={(e) => onPerPromptStagesChange(e.target.value)}
            placeholder={`One line per prompt (${promptCount} total):\nAwareness\nEvaluation\nComparison`}
            rows={10}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm ${
              stagesLines > 0 && stagesLines !== promptCount
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {stagesLines > 0 && stagesLines !== promptCount && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Line count ({stagesLines}) must match prompt count ({promptCount})
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Valid values: Awareness, Evaluation, Comparison, Advice, Other. Leave blank to use global stage.
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
