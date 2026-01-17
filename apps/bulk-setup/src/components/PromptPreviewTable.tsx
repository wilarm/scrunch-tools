import { useState } from 'react';
import { Check, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { PromptPlatform, PromptStage, SubmissionStatus } from '../types/brand';

export interface PromptVariant {
  id: string;
  brandId: number;
  brandName: string;
  brandWebsite: string;
  seedPrompt: string;
  processedPrompt: string;
  platform: PromptPlatform;
  stage?: PromptStage;
  tags: string[];
  status: SubmissionStatus;
  errorMessage?: string;
}

interface PromptPreviewTableProps {
  variants: PromptVariant[];
}

interface GroupedVariants {
  seedPrompt: string;
  variants: PromptVariant[];
}

const platformNames: Record<PromptPlatform, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  google_ai_overviews: 'Google AI Overviews',
  perplexity: 'Perplexity',
  meta: 'Meta AI',
  google_ai_mode: 'Google AI Mode',
  google_gemini: 'Google Gemini',
  copilot: 'Copilot',
};

const platformColors: Record<PromptPlatform, { bg: string; text: string }> = {
  chatgpt: { bg: 'bg-gray-200', text: 'text-gray-900' },
  claude: { bg: 'bg-orange-200', text: 'text-orange-900' },
  google_ai_overviews: { bg: 'bg-yellow-200', text: 'text-yellow-900' },
  perplexity: { bg: 'bg-green-200', text: 'text-green-900' },
  meta: { bg: 'bg-purple-100', text: 'text-purple-800' },
  google_ai_mode: { bg: 'bg-gradient-to-r from-red-200 via-yellow-200 to-green-200', text: 'text-gray-900' },
  google_gemini: { bg: 'bg-blue-100', text: 'text-blue-800' },
  copilot: { bg: 'bg-pink-200', text: 'text-pink-900' },
};

export function PromptPreviewTable({ variants }: PromptPreviewTableProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const groupedVariants: GroupedVariants[] = variants.reduce((acc, variant) => {
    const existing = acc.find(g => g.seedPrompt === variant.seedPrompt);
    if (existing) {
      existing.variants.push(variant);
    } else {
      acc.push({ seedPrompt: variant.seedPrompt, variants: [variant] });
    }
    return acc;
  }, [] as GroupedVariants[]);

  const togglePrompt = (seedPrompt: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(seedPrompt)) {
        next.delete(seedPrompt);
      } else {
        next.add(seedPrompt);
      }
      return next;
    });
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getGroupStatusSummary = (groupVariants: PromptVariant[]) => {
    const successCount = groupVariants.filter(v => v.status === 'success').length;
    const errorCount = groupVariants.filter(v => v.status === 'error').length;
    const loadingCount = groupVariants.filter(v => v.status === 'loading').length;
    const totalCount = groupVariants.length;

    return { successCount, errorCount, loadingCount, totalCount };
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {groupedVariants.map((group, groupIdx) => {
          const isExpanded = expandedPrompts.has(group.seedPrompt);
          const summary = getGroupStatusSummary(group.variants);
          const uniqueBrands = new Set(group.variants.map(v => v.brandName)).size;
          const uniquePlatforms = new Set(group.variants.map(v => v.platform)).size;

          return (
            <div key={groupIdx} className="bg-white">
              <button
                onClick={() => togglePrompt(group.seedPrompt)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-gray-900 truncate">
                    {group.seedPrompt}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{uniqueBrands} brand{uniqueBrands !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{uniquePlatforms} platform{uniquePlatforms !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{summary.totalCount} variant{summary.totalCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {summary.successCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      <Check className="w-3 h-3" />
                      {summary.successCount}
                    </span>
                  )}
                  {summary.loadingCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {summary.loadingCount}
                    </span>
                  )}
                  {summary.errorCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      <X className="w-3 h-3" />
                      {summary.errorCount}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Brand
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Processed Prompt
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Platform
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stage
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.variants.map((variant) => (
                          <tr key={variant.id} className={getStatusColor(variant.status)}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                {getStatusIcon(variant.status)}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{variant.brandName}</div>
                                <div className="text-gray-500 text-xs">{variant.brandWebsite}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-gray-900 font-mono max-w-md">
                                {variant.processedPrompt}
                              </div>
                              {variant.errorMessage && (
                                <div className="text-xs text-red-600 mt-1">{variant.errorMessage}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${platformColors[variant.platform].bg} ${platformColors[variant.platform].text}`}>
                                {platformNames[variant.platform]}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {variant.stage || <span className="text-gray-400">-</span>}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {variant.tags.length > 0 ? (
                                  variant.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded bg-gray-100 text-gray-700"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
