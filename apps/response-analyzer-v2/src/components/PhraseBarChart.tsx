import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { NgramResult } from '../types';

interface PhraseBarChartProps {
  data: NgramResult[];
  topN: number;
  onBarClick?: (phrase: string) => void;
}

const TEAL_SHADES = [
  '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: NgramResult }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">"{d.phrase}"</p>
      <p className="text-teal-700 font-medium">{d.responsePercent.toFixed(1)}% of responses</p>
      <p className="text-gray-500">{d.responseCount.toLocaleString()} responses · {d.count.toLocaleString()} occurrences</p>
    </div>
  );
}

export function PhraseBarChart({ data, topN, onBarClick }: PhraseBarChartProps) {
  const chartData = data
    .slice(0, topN)
    .sort((a, b) => a.responsePercent - b.responsePercent); // ascending so highest is at top

  const maxPercent = Math.max(...chartData.map(d => d.responsePercent), 1);
  const yAxisWidth = Math.max(120, Math.max(...chartData.map(d => d.phrase.length)) * 7);

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
        barCategoryGap="20%"
      >
        <XAxis
          type="number"
          domain={[0, Math.ceil(maxPercent / 10) * 10]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="phrase"
          width={yAxisWidth}
          tick={{ fontSize: 12, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdfa' }} />
        <Bar
          dataKey="responsePercent"
          radius={[0, 4, 4, 0]}
          onClick={(d) => onBarClick?.(d.phrase)}
          style={{ cursor: onBarClick ? 'pointer' : 'default' }}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.phrase}
              fill={TEAL_SHADES[Math.min(index, TEAL_SHADES.length - 1)]}
              opacity={0.85 + (index / chartData.length) * 0.15}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
