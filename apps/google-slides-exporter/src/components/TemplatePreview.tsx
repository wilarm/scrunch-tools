import { FileText, CheckCircle2 } from 'lucide-react';
import type { TemplateInfo } from '../types';

interface TemplatePreviewProps {
  templateInfo: TemplateInfo | null;
  isValidating: boolean;
}

export default function TemplatePreview({ templateInfo, isValidating }: TemplatePreviewProps) {
  if (isValidating) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Validating template...
        </div>
      </div>
    );
  }

  if (!templateInfo) {
    return null;
  }

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-green-900 mb-2">
            Template Validated Successfully
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <div>
              <FileText className="w-3 h-3 inline mr-1" />
              {templateInfo.slideCount} slide{templateInfo.slideCount !== 1 ? 's' : ''} found
            </div>
            {templateInfo.placeholders.length > 0 && (
              <div className="mt-3">
                <div className="font-medium mb-1">Detected Placeholders:</div>
                <div className="flex flex-wrap gap-1">
                  {templateInfo.placeholders.map(placeholder => (
                    <code
                      key={placeholder}
                      className="px-2 py-0.5 bg-white border border-green-300 rounded text-xs font-mono"
                    >
                      {placeholder}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
