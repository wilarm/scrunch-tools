import { useState, useMemo, useCallback } from 'react';
import { Download } from 'lucide-react';
import { extractWordFrequencies, extractBigramFrequencies } from '../utils/textAnalysis';
import { exportWordFrequenciesCSV } from '../utils/exportUtils';
import type { ResponseRow } from '../types';

interface WordCloudProps {
  data: ResponseRow[];
  onWordClick: (word: string) => void;
}

type CloudMode = 'word' | 'phrase';

export function WordCloud({ data, onWordClick }: WordCloudProps) {
  const [minFrequency, setMinFrequency] = useState(5);
  const [maxWords, setMaxWords] = useState(100);
  const [mode, setMode] = useState<CloudMode>('word');
  const [excludeInput, setExcludeInput] = useState('');

  const excludeWords = useMemo(() => {
    return new Set(
      excludeInput
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [excludeInput]);

  const words = useMemo(() => {
    if (mode === 'phrase') {
      return extractBigramFrequencies(data, minFrequency, maxWords, excludeWords);
    }
    return extractWordFrequencies(data, minFrequency, maxWords, excludeWords);
  }, [data, minFrequency, maxWords, mode, excludeWords]);

  const maxValue = useMemo(() => Math.max(...words.map(w => w.value), 1), [words]);

  const getFontSize = useCallback((value: number) => {
    const minSize = 14;
    const maxSize = 64;
    const ratio = value / maxValue;
    return minSize + ratio * (maxSize - minSize);
  }, [maxValue]);

  const getColor = useCallback((value: number) => {
    const ratio = value / maxValue;
    const colors = [
      'text-gray-400',
      'text-teal-400',
      'text-teal-500',
      'text-teal-600',
      'text-teal-700',
      'text-teal-800',
    ];
    const index = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
    return colors[index];
  }, [maxValue]);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No data to analyze. Adjust your filters or upload a CSV.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mode:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setMode('word')}
              className={`px-3 py-1 text-sm font-medium ${
                mode === 'word' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Words
            </button>
            <button
              onClick={() => setMode('phrase')}
              className={`px-3 py-1 text-sm font-medium border-l border-gray-300 ${
                mode === 'phrase' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Phrases (2-word)
            </button>
          </div>
        </div>

        {/* Min frequency */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Min frequency:</label>
          <input
            type="range"
            min={2}
            max={Math.max(20, Math.floor(data.length * 0.1))}
            value={minFrequency}
            onChange={(e) => setMinFrequency(Number(e.target.value))}
            className="w-32 accent-teal-600"
          />
          <span className="text-sm font-medium text-gray-700 w-8">{minFrequency}</span>
        </div>

        {/* Max words */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Max {mode === 'phrase' ? 'phrases' : 'words'}:</label>
          <input
            type="range"
            min={25}
            max={200}
            step={25}
            value={maxWords}
            onChange={(e) => setMaxWords(Number(e.target.value))}
            className="w-32 accent-teal-600"
          />
          <span className="text-sm font-medium text-gray-700 w-8">{maxWords}</span>
        </div>

        {/* Export */}
        <button
          onClick={() => exportWordFrequenciesCSV(words)}
          className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 ml-auto"
          title="Export as CSV"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Exclude words */}
      <div className="flex items-center gap-2 mb-6">
        <label className="text-sm text-gray-600 whitespace-nowrap">Exclude words:</label>
        <input
          type="text"
          value={excludeInput}
          onChange={(e) => setExcludeInput(e.target.value)}
          placeholder="e.g. brand, company, product (comma-separated)"
          className="flex-1 max-w-sm px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No {mode === 'phrase' ? 'phrases' : 'words'} meet the minimum frequency threshold. Try lowering it.</p>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center items-baseline py-8 px-4 min-h-[300px]">
          {words.map(word => (
            <button
              key={word.text}
              onClick={() => onWordClick(word.text)}
              className={`${getColor(word.value)} hover:opacity-75 transition-opacity cursor-pointer font-medium`}
              style={{ fontSize: `${getFontSize(word.value)}px` }}
              title={`${word.text}: appears in ${word.value} responses`}
            >
              {word.text}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        Click a {mode === 'phrase' ? 'phrase' : 'word'} to search for it in the Phrase Search tab. Showing {words.length} {mode === 'phrase' ? 'phrases' : 'words'}.
      </p>
    </div>
  );
}
