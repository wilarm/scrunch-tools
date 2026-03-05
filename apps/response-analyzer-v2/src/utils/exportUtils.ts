import type { NgramResult, WordFrequency } from '../types';

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTopPhrasesCSV(data: NgramResult[], ngramSize: number) {
  const header = 'Phrase,Occurrences,Responses,Response %';
  const rows = data.map(d =>
    `"${d.phrase.replace(/"/g, '""')}",${d.count},${d.responseCount},${d.responsePercent.toFixed(2)}`
  );
  const csv = [header, ...rows].join('\n');
  triggerDownload(csv, `top-phrases-${ngramSize}gram-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportWordFrequenciesCSV(data: WordFrequency[]) {
  const header = 'Word,Frequency';
  const rows = data.map(d => `"${d.text.replace(/"/g, '""')}",${d.value}`);
  const csv = [header, ...rows].join('\n');
  triggerDownload(csv, `word-frequencies-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}
