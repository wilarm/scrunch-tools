const STRATEGY_MAP: Record<string, { label: string; description: string }> = {
  min_coverage_loss: {
    label: 'Protect Coverage',
    description: 'Removes prompts that contribute least to URL coverage',
  },
  min_resilience_loss: {
    label: 'Protect Resilience',
    description: 'Removes prompts that contribute least to backup URL coverage',
  },
  weighted_70_30: {
    label: 'Coverage 70 / Resilience 30',
    description: 'Blends 70% coverage priority with 30% resilience priority',
  },
  weighted_50_50: {
    label: 'Coverage 50 / Resilience 50',
    description: 'Equal weight on coverage and resilience',
  },
  weighted_30_70: {
    label: 'Coverage 30 / Resilience 70',
    description: 'Blends 30% coverage priority with 70% resilience priority',
  },
  min_degree: {
    label: 'Least Connected First',
    description: 'Removes prompts with the fewest URL connections first',
  },
  max_redundancy: {
    label: 'Most Redundant First',
    description: 'Removes prompts whose URLs are already well-covered by others',
  },
  none: {
    label: 'None',
    description: 'No pruning applied',
  },
};

export function strategyLabel(name: string): string {
  return STRATEGY_MAP[name]?.label ?? name;
}

export function strategyDescription(name: string): string {
  return STRATEGY_MAP[name]?.description ?? '';
}
