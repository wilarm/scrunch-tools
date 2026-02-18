import { useState, useMemo, Fragment } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { extractNgrams } from '../utils/textAnalysis';
import { searchPhrases } from '../utils/phraseSearch';
import type { ResponseRow } from '../types';

interface TopPhrasesProps {
  data: ResponseRow[];
}

export function TopPhrases({ data }: TopPhrasesProps) {
  const [ngramSize, setNgramSize] = useState<2 | 3>(2);
  const [topN, setTopN] = useState(25);
  const [expandedPhrase, setExpandedPhrase] = useState<string | null>(null);

  const ngrams = useMemo(
    () => extractNgrams(data, ngramSize, topN),
    [data, ngramSize, topN]
  );

  const expandedDetail = useMemo(() => {
    if (!expandedPhrase) return null;
    return searchPhrases(data, [expandedPhrase])[0];
  }, [data, expandedPhrase]);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No data to analyze. Adjust your filters or upload a CSV.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Phrase length:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setNgramSize(2)}
              className={`px-3 py-1 text-sm font-medium ${
                ngramSize === 2 ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              2-word
            </button>
            <button
              onClick={() => setNgramSize(3)}
              className={`px-3 py-1 text-sm font-medium border-l border-gray-300 ${
                ngramSize === 3 ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              3-word
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show top:</span>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            {[10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {ngrams.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No phrases found. Try adjusting the phrase length.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium w-10">#</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Phrase</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Occurrences</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Responses</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">% of Responses</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {ngrams.map((ngram, i) => (
                <Fragment key={ngram.phrase}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedPhrase(expandedPhrase === ngram.phrase ? null : ngram.phrase)}
                  >
                    <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-gray-900">{ngram.phrase}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{ngram.count.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{ngram.responseCount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-flex items-center">
                        <span className="w-16 h-1.5 bg-gray-200 rounded-full mr-2 inline-block">
                          <span
                            className="h-full bg-teal-500 rounded-full block"
                            style={{ width: `${Math.min(ngram.responsePercent, 100)}%` }}
                          />
                        </span>
                        <span className="font-medium text-gray-900">{ngram.responsePercent.toFixed(1)}%</span>
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {expandedPhrase === ngram.phrase ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  {expandedPhrase === ngram.phrase && expandedDetail && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-6 py-3">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Per-prompt breakdown:</p>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left py-1 pr-3">Prompt</th>
                                <th className="text-right py-1 px-2">Matches</th>
                                <th className="text-right py-1 px-2">Total</th>
                                <th className="text-right py-1 pl-2">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedDetail.perPrompt.map(p => (
                                <tr key={p.promptKey} className="border-t border-gray-200">
                                  <td className="py-1 pr-3 text-gray-700 max-w-md truncate" title={p.promptText}>
                                    {p.promptText.length > 80 ? p.promptText.slice(0, 80) + '...' : p.promptText}
                                  </td>
                                  <td className="py-1 px-2 text-right text-gray-600">{p.containsCount}</td>
                                  <td className="py-1 px-2 text-right text-gray-600">{p.totalResponses}</td>
                                  <td className="py-1 pl-2 text-right font-medium text-gray-900">{p.percent.toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
