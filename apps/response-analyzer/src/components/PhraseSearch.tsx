import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { Search, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { searchPhrases, aggregateByDimension, generateSearchCSV } from '../utils/phraseSearch';
import type { ResponseRow, PhraseSearchResult } from '../types';

interface PhraseSearchProps {
  data: ResponseRow[];
  initialPhrase: string;
  onInitialPhraseConsumed: () => void;
}

export function PhraseSearch({ data, initialPhrase, onInitialPhraseConsumed }: PhraseSearchProps) {
  const [input, setInput] = useState('');
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [expandedPhrase, setExpandedPhrase] = useState<string | null>(null);
  const [pivotDimension, setPivotDimension] = useState<string>('');

  useEffect(() => {
    if (initialPhrase) {
      setInput(initialPhrase);
      setSearchTerms([initialPhrase]);
      onInitialPhraseConsumed();
    }
  }, [initialPhrase, onInitialPhraseConsumed]);

  const results = useMemo<PhraseSearchResult[]>(
    () => searchTerms.length > 0 ? searchPhrases(data, searchTerms) : [],
    [data, searchTerms]
  );

  const pivotData = useMemo(() => {
    if (!expandedPhrase || !pivotDimension) return null;
    return aggregateByDimension(data, expandedPhrase, pivotDimension);
  }, [data, expandedPhrase, pivotDimension]);

  const handleSearch = useCallback(() => {
    const terms = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    setSearchTerms(terms);
    setExpandedPhrase(null);
  }, [input]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSearch();
    }
  }, [handleSearch]);

  const handleExport = useCallback(() => {
    if (results.length === 0) return;
    const csv = generateSearchCSV(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `phrase-search-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results]);

  const availableDimensions = useMemo(() => {
    const dims: { key: string; label: string }[] = [];
    if (data.some(r => r.platform)) dims.push({ key: 'platform', label: 'Platform' });
    if (data.some(r => r.stage)) dims.push({ key: 'stage', label: 'Stage' });
    if (data.some(r => r.country)) dims.push({ key: 'country', label: 'Country' });
    return dims;
  }, [data]);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No data to analyze. Adjust your filters or upload a CSV.</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter phrases to search for (one per line)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"best refrigerator provider\naffordable pricing\nhigh quality service\n..."}
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            {input.split('\n').filter(l => l.trim()).length} phrase{input.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''} entered.
            Press Cmd+Enter to search.
          </p>
          <div className="flex gap-2">
            {results.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => { setInput(''); setSearchTerms([]); setExpandedPhrase(null); }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              disabled={!input.trim()}
              className="flex items-center gap-1 px-4 py-1.5 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Phrase</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Overall %</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Matches</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Prompts</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => {
                const promptsMatched = result.perPrompt.filter(p => p.containsCount > 0).length;
                const isExpanded = expandedPhrase === result.phrase;

                return (
                  <Fragment key={result.phrase}>
                    <tr
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        result.overallPercent === 0 ? 'opacity-50' : ''
                      }`}
                      onClick={() => setExpandedPhrase(isExpanded ? null : result.phrase)}
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">{result.phrase}</td>
                      <td className="py-2 px-3 text-right">
                        <span className="inline-flex items-center">
                          <span className="w-16 h-1.5 bg-gray-200 rounded-full mr-2 inline-block">
                            <span
                              className="h-full bg-teal-500 rounded-full block"
                              style={{ width: `${Math.min(result.overallPercent, 100)}%` }}
                            />
                          </span>
                          <span className="font-medium text-gray-900">{result.overallPercent.toFixed(1)}%</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">{result.overallCount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{result.overallTotal.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{promptsMatched}/{result.perPrompt.length}</td>
                      <td className="py-2 px-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 px-6 py-3">
                          {availableDimensions.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-gray-500">Pivot by:</span>
                              <select
                                value={pivotDimension}
                                onChange={(e) => setPivotDimension(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-teal-500"
                              >
                                <option value="">Per prompt</option>
                                {availableDimensions.map(d => (
                                  <option key={d.key} value={d.key}>{d.label}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {!pivotDimension ? (
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
                                  {result.perPrompt.map(p => (
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
                          ) : pivotData ? (
                            <div className="max-h-60 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-400">
                                    <th className="text-left py-1 pr-3 capitalize">{pivotDimension}</th>
                                    <th className="text-right py-1 px-2">Matches</th>
                                    <th className="text-right py-1 px-2">Total</th>
                                    <th className="text-right py-1 pl-2">%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pivotData.map(d => (
                                    <tr key={d.groupValue} className="border-t border-gray-200">
                                      <td className="py-1 pr-3 text-gray-700">{d.groupValue}</td>
                                      <td className="py-1 px-2 text-right text-gray-600">{d.containsCount}</td>
                                      <td className="py-1 px-2 text-right text-gray-600">{d.totalResponses}</td>
                                      <td className="py-1 pl-2 text-right font-medium text-gray-900">{d.percent.toFixed(1)}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
