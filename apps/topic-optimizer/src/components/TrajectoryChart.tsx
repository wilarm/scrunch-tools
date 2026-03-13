import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { EliminationTrajectory } from '../engine/types';
import { strategyLabel } from '../utils/strategyLabels';

interface TrajectoryChartProps {
  trajectories: EliminationTrajectory[];
  selectedBudget: number;
  selectedStrategy: string;
  metric: 'coverage' | 'resilience';
}

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#6366f1', '#0d9488'];

const METRIC_CONFIG = {
  coverage: {
    title: 'Coverage Retention by Strategy',
    subtitle: 'How URL coverage changes as prompts are removed, for each pruning approach.',
    field: 'coverageFrac' as const,
    suffix: '_cov',
  },
  resilience: {
    title: 'Resilience Retention by Strategy',
    subtitle: 'How URL resilience (2+ prompt backup) changes as prompts are removed.',
    field: 'resilienceFrac' as const,
    suffix: '_res',
  },
};

export function TrajectoryChart({ trajectories, selectedBudget, selectedStrategy, metric }: TrajectoryChartProps) {
  if (trajectories.length === 0) return <div className="text-sm text-gray-500">No trajectory data</div>;

  const config = METRIC_CONFIG[metric];

  // Build unified data keyed by budget
  const budgets = new Set<number>();
  for (const t of trajectories) {
    for (const p of t.points) budgets.add(p.budget);
  }
  const sortedBudgets = Array.from(budgets).sort((a, b) => b - a);

  const data = sortedBudgets.map(budget => {
    const row: Record<string, number> = { budget };
    for (const t of trajectories) {
      const pt = t.points.find(p => p.budget === budget);
      if (pt) {
        row[`${t.strategyName}${config.suffix}`] = pt[config.field];
      }
    }
    return row;
  });

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-0.5">{config.title}</h4>
      <p className="text-xs text-gray-400 mb-2">{config.subtitle}</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="budget" reversed tick={{ fontSize: 11 }} label={{ value: 'Budget (prompts kept)', position: 'bottom', offset: 2 }} />
          <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-2.5 py-1.5 text-xs">
                  <div className="font-medium text-gray-700 mb-0.5">{label} prompts kept</div>
                  {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color }} className="flex justify-between gap-3">
                      <span>{p.name}</span>
                      <span className="font-mono">{((p.value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} iconType="line" verticalAlign="top" />
          {trajectories.map((t, i) => {
            const isSelected = t.strategyName === selectedStrategy;
            return (
              <Line
                key={`${t.strategyName}${config.suffix}`}
                dataKey={`${t.strategyName}${config.suffix}`}
                name={strategyLabel(t.strategyName)}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={isSelected ? 3 : 1}
                strokeOpacity={isSelected ? 1 : 0.3}
                dot={false}
              />
            );
          })}
          <ReferenceLine x={selectedBudget} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Selected', position: 'insideTopRight', fill: '#92400e', fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
