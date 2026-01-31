import { CheckCircle2, Circle } from 'lucide-react';
import { QUERY_METRICS } from '../utils/api';

interface MetricsSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
}

const METRIC_LABELS: Record<string, { label: string; description: string }> = {
  responses: {
    label: 'Total Responses',
    description: 'Total number of responses for this brand',
  },
  brand_presence_percentage: {
    label: 'Brand Presence %',
    description: 'Percentage of responses where brand was mentioned',
  },
  brand_position_score: {
    label: 'Brand Position Score',
    description: 'Average position/ranking of brand in responses',
  },
  brand_sentiment_score: {
    label: 'Brand Sentiment Score',
    description: 'Average sentiment score for brand mentions',
  },
  competitor_presence_percentage: {
    label: 'Competitor Presence %',
    description: 'Percentage of responses where competitors were mentioned',
  },
  competitor_position_score: {
    label: 'Competitor Position Score',
    description: 'Average position/ranking of competitors',
  },
  competitor_sentiment_score: {
    label: 'Competitor Sentiment Score',
    description: 'Average sentiment score for competitor mentions',
  },
};

export default function MetricsSelector({ selectedMetrics, onChange }: MetricsSelectorProps) {
  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      onChange(selectedMetrics.filter(m => m !== metric));
    } else {
      onChange([...selectedMetrics, metric]);
    }
  };

  const selectAll = () => {
    onChange([...QUERY_METRICS]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Select Metrics
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All
          </button>
          <span className="text-xs text-gray-400">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {QUERY_METRICS.map(metric => {
          const info = METRIC_LABELS[metric];
          const isSelected = selectedMetrics.includes(metric);

          return (
            <div
              key={metric}
              onClick={() => toggleMetric(metric)}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{info.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{info.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMetrics.length > 0 && (
        <div className="text-xs text-gray-500 pt-1">
          {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
