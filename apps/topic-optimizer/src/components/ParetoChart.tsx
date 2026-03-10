import { useState, useMemo } from 'react';
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell,
} from 'recharts';
import { EliminationTrajectory } from '../engine/types';
import { strategyLabel } from '../utils/strategyLabels';

interface ParetoChartProps {
  trajectories: EliminationTrajectory[];
  selectedBudget: number;
  selectedStrategy: string;
  nPrompts: number;
}

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#6366f1', '#0d9488'];
const SELECTED_COLOR = '#fbbf24';

interface StrategyDot {
  strategyName: string;
  label: string;
  coverage: number;
  resilience: number;
  isDominated: boolean;
  isSelected: boolean;
  color: string;
}

function getPointsAtBudget(trajectories: EliminationTrajectory[], budget: number): Omit<StrategyDot, 'isSelected'>[] {
  const points: { name: string; cov: number; res: number; idx: number }[] = [];

  for (let i = 0; i < trajectories.length; i++) {
    const traj = trajectories[i];
    let best = traj.points[0];
    for (const pt of traj.points) {
      if (pt.budget === budget) { best = pt; break; }
      if (Math.abs(pt.budget - budget) < Math.abs(best.budget - budget)) best = pt;
    }
    points.push({ name: traj.strategyName, cov: best.coverageFrac, res: best.resilienceFrac, idx: i });
  }

  return points.map(p => {
    const dominated = points.some(o =>
      o !== p &&
      o.cov >= p.cov && o.res >= p.res &&
      (o.cov > p.cov || o.res > p.res)
    );
    return {
      strategyName: p.name,
      label: strategyLabel(p.name),
      coverage: p.cov * 100,
      resilience: p.res * 100,
      isDominated: dominated,
      color: COLORS[p.idx % COLORS.length],
    };
  });
}

export function ParetoChart({ trajectories, selectedBudget, selectedStrategy, nPrompts }: ParetoChartProps) {
  const [sliderBudget, setSliderBudget] = useState(selectedBudget);

  const [prevSelected, setPrevSelected] = useState(selectedBudget);
  if (selectedBudget !== prevSelected) {
    setSliderBudget(selectedBudget);
    setPrevSelected(selectedBudget);
  }

  // Compute stable axis bounds across ALL budget levels so axes don't jump when sliding
  const axisBounds = useMemo(() => {
    let minCov = Infinity, maxCov = -Infinity;
    let minRes = Infinity, maxRes = -Infinity;
    for (const traj of trajectories) {
      for (const pt of traj.points) {
        const cov = pt.coverageFrac * 100;
        const res = pt.resilienceFrac * 100;
        if (cov < minCov) minCov = cov;
        if (cov > maxCov) maxCov = cov;
        if (res < minRes) minRes = res;
        if (res > maxRes) maxRes = res;
      }
    }
    // Add a small margin
    const covPad = Math.max((maxCov - minCov) * 0.05, 1);
    const resPad = Math.max((maxRes - minRes) * 0.05, 1);
    return {
      covMin: Math.max(0, Math.floor(minCov - covPad)),
      covMax: Math.min(100, Math.ceil(maxCov + covPad)),
      resMin: Math.max(0, Math.floor(minRes - resPad)),
      resMax: Math.min(100, Math.ceil(maxRes + resPad)),
    };
  }, [trajectories]);

  const { dots, frontierLine } = useMemo(() => {
    const points = getPointsAtBudget(trajectories, sliderBudget);
    const allDots = points.map(p => ({
      ...p,
      isSelected: p.strategyName === selectedStrategy && sliderBudget === selectedBudget,
    }));

    // Compute frontier line: non-dominated points sorted by coverage ascending
    const nonDominated = allDots
      .filter(d => !d.isDominated)
      .sort((a, b) => a.coverage - b.coverage);
    const line = nonDominated.map(d => ({ coverage: d.coverage, resilience: d.resilience }));

    return { dots: allDots, frontierLine: line };
  }, [trajectories, sliderBudget, selectedBudget, selectedStrategy]);

  if (trajectories.length === 0) return <div className="text-sm text-gray-500">No data</div>;

  const minBudget = Math.min(...trajectories[0].points.map(p => p.budget));

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-0.5">Pareto Frontier at Budget</h4>
      <p className="text-xs text-gray-400 mb-3">
        Coverage vs resilience for each strategy at a given prompt count. Faded points are dominated. Axes are fixed so you can compare across budgets.
      </p>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{minBudget} prompts</span>
          <span className="font-medium text-gray-700">
            Viewing: {sliderBudget} prompts
            {sliderBudget === selectedBudget && <span className="text-violet-600 ml-1">(selected)</span>}
          </span>
          <span>{nPrompts} prompts</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={minBudget}
            max={nPrompts}
            value={sliderBudget}
            onChange={(e) => setSliderBudget(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
          {selectedBudget >= minBudget && selectedBudget <= nPrompts && (
            <div
              className="absolute top-0 w-0.5 h-2 bg-amber-500 pointer-events-none"
              style={{ left: `${((selectedBudget - minBudget) / (nPrompts - minBudget)) * 100}%` }}
            />
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart margin={{ top: 5, right: 10, left: 0, bottom: 20 }} data={frontierLine}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="coverage"
            name="Coverage"
            domain={[axisBounds.covMin, axisBounds.covMax]}
            tickFormatter={v => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            label={{ value: 'Coverage %', position: 'bottom', offset: 2 }}
          />
          <YAxis
            type="number"
            dataKey="resilience"
            name="Resilience"
            domain={[axisBounds.resMin, axisBounds.resMax]}
            tickFormatter={v => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              if (!('label' in d)) return null;
              const dot = d as StrategyDot;
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
                  <div className="font-medium text-gray-900">{dot.label}</div>
                  <div className="text-gray-600">Coverage: {dot.coverage.toFixed(2)}%</div>
                  <div className="text-gray-600">Resilience: {dot.resilience.toFixed(2)}%</div>
                  {dot.isDominated && <div className="text-orange-500 mt-0.5">Dominated</div>}
                  {dot.isSelected && <div className="text-violet-600 mt-0.5 font-medium">Selected operating point</div>}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            verticalAlign="top"
            payload={dots.map(d => ({
              value: d.label,
              type: 'circle',
              color: d.isSelected ? SELECTED_COLOR : d.color,
            }))}
          />
          <Line
            dataKey="resilience"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            legendType="none"
            tooltipType="none"
          />
          <Scatter data={dots} name="Strategies">
            {dots.map((d, i) => (
              <Cell
                key={i}
                fill={d.isSelected ? SELECTED_COLOR : d.color}
                fillOpacity={d.isDominated && !d.isSelected ? 0.3 : 1}
                r={d.isSelected ? 8 : 5}
                stroke={d.isSelected ? '#92400e' : undefined}
                strokeWidth={d.isSelected ? 2 : 0}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
