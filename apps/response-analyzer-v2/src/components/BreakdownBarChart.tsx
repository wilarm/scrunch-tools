import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const TEAL_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];

export interface BreakdownBarChartItem {
  label: string;
  percent: number;
  count: number;
  total: number;
}

interface BreakdownBarChartProps {
  data: BreakdownBarChartItem[];
  maxLabelLength?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BreakdownBarChartItem & { displayLabel: string } }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-900 mb-1">{d.label}</p>
      <p className="text-gray-600">{d.count}/{d.total} responses ({d.percent.toFixed(1)}%)</p>
    </div>
  );
};

export function BreakdownBarChart({ data, maxLabelLength = 35 }: BreakdownBarChartProps) {
  const sorted = [...data].sort((a, b) => b.percent - a.percent);
  const height = Math.max(160, sorted.length * 34);

  const truncate = (s: string) =>
    s.length > maxLabelLength ? s.slice(0, maxLabelLength) + '…' : s;

  const chartData = sorted.map(d => ({ ...d, displayLabel: truncate(d.label) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="displayLabel"
          width={176}
          tick={{ fontSize: 11, fill: '#374151' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdfa' }} />
        <Bar dataKey="percent" radius={[0, 3, 3, 0]} maxBarSize={22}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={TEAL_COLORS[i % TEAL_COLORS.length]} />
          ))}
          <LabelList
            dataKey="percent"
            position="right"
            formatter={(v: number) => `${v.toFixed(1)}%`}
            style={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
