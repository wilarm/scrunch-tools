import { Eye } from 'lucide-react';
import { getExcerptAroundPhrase, segmentByPhrase } from '../utils/highlightText';
import type { ResponseRow } from '../types';

interface InlineResponsePreviewProps {
  phrase: string;
  responses: ResponseRow[];
  maxPreviews?: number;
  onViewAll?: () => void;
}

export function InlineResponsePreview({
  phrase,
  responses,
  maxPreviews = 3,
  onViewAll,
}: InlineResponsePreviewProps) {
  const matching = responses.filter(r =>
    r.response_text?.toLowerCase().includes(phrase.toLowerCase())
  );

  if (matching.length === 0) return null;

  const previews = matching.slice(0, maxPreviews);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Sample responses</p>
      {previews.map((r, i) => {
        const excerpt = getExcerptAroundPhrase(r.response_text || '', phrase, 120);
        const segments = segmentByPhrase(excerpt, phrase);
        return (
          <div key={i} className="bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700">
            <p className="leading-relaxed">
              {segments.map((seg, si) =>
                seg.highlight ? (
                  <mark key={si} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{seg.text}</mark>
                ) : (
                  <span key={si}>{seg.text}</span>
                )
              )}
            </p>
            {(r.platform || r.stage) && (
              <p className="mt-1 text-gray-400 text-xs">{[r.platform, r.stage].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        );
      })}
      {onViewAll && matching.length > 0 && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          View all {matching.length} responses
        </button>
      )}
    </div>
  );
}
