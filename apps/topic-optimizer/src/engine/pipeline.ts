import { BipartiteGraph } from './graph';
import { backwardEliminate } from './backwardElimination';
import { assessFlatness } from './flatness';
import { fullParetoEnvelope } from './pareto';
import { greedyForwardCurve } from './greedyCurve';
import { DEFAULT_STRATEGIES } from './strategies';
import { getBaselineMetrics, findBestPointForConstraint, replayTrajectoryCuts } from './selection';
import { PromptSource, Constraint, TopicResult, ManifestRow } from './types';

export interface TopicGroup {
  topicId: string;
  topicName: string;
  promptSources: PromptSource[];
}

export function runPipeline(
  groups: TopicGroup[],
  constraint: Constraint,
): TopicResult[] {
  return groups.map(group => runOneGroup(group, constraint));
}

function runOneGroup(group: TopicGroup, constraint: Constraint): TopicResult {
  const { topicId, topicName, promptSources } = group;

  const graph = BipartiteGraph.fromPromptSources(promptSources);
  const greedyCurve = greedyForwardCurve(promptSources);

  const flatness = assessFlatness(greedyCurve, graph.nUrls);

  // Always run backward elimination (web app = test_mode equivalent)
  const trajectories = DEFAULT_STRATEGIES.map(strategy =>
    backwardEliminate(graph, strategy)
  );

  const paretoEnvelope = fullParetoEnvelope(trajectories);

  // Selection
  let selectedPoint = null;
  let selectedBudget = graph.nPrompts;
  let selectedStrategy = 'none';
  let selectedCoverage = 0;
  let selectedResilience = 0;
  let cutIndices: number[] = [];

  if (trajectories.length > 0) {
    const { baselineCoverage, baselineResilience } = getBaselineMetrics(trajectories);
    selectedCoverage = baselineCoverage;
    selectedResilience = baselineResilience;

    selectedPoint = findBestPointForConstraint(
      paretoEnvelope,
      constraint,
      baselineCoverage,
      baselineResilience,
    );

    if (selectedPoint) {
      selectedBudget = selectedPoint.budget;
      selectedStrategy = selectedPoint.strategyName;
      selectedCoverage = selectedPoint.coverageFrac;
      selectedResilience = selectedPoint.resilienceFrac;
      cutIndices = replayTrajectoryCuts(trajectories, selectedStrategy, selectedBudget);
    }
  }

  const cutSet = new Set(cutIndices);
  const keptIndices = promptSources.map((_, i) => i).filter(i => !cutSet.has(i));

  // For each CUT prompt, find the KEPT prompt with the most shared URLs
  const cutUrlSets = new Map<number, Set<string>>();
  for (const ci of cutIndices) {
    cutUrlSets.set(ci, new Set(promptSources[ci].sources));
  }
  const keptUrlSets = keptIndices.map(ki => ({
    idx: ki,
    urls: new Set(promptSources[ki].sources),
  }));

  const closestKept = new Map<number, { keptIdx: number; shared: number }>();
  for (const ci of cutIndices) {
    const cutUrls = cutUrlSets.get(ci)!;
    let bestIdx = -1;
    let bestShared = -1;
    for (const { idx: ki, urls: keptUrls } of keptUrlSets) {
      let shared = 0;
      for (const url of cutUrls) {
        if (keptUrls.has(url)) shared++;
      }
      if (shared > bestShared) {
        bestShared = shared;
        bestIdx = ki;
      }
    }
    if (bestIdx >= 0) {
      closestKept.set(ci, { keptIdx: bestIdx, shared: bestShared });
    }
  }

  const manifest: ManifestRow[] = promptSources.map((ps, i) => {
    const overlap = closestKept.get(i);
    return {
      topicId,
      topicName,
      promptId: ps.promptId,
      promptText: ps.promptText,
      status: cutSet.has(i) ? 'CUT' as const : 'KEPT' as const,
      nUrls: ps.sources.length,
      closestKeptId: overlap ? promptSources[overlap.keptIdx].promptId : null,
      closestKeptText: overlap ? promptSources[overlap.keptIdx].promptText : null,
      sharedUrls: overlap ? overlap.shared : null,
    };
  });

  return {
    topicId,
    topicName,
    nPrompts: graph.nPrompts,
    nUrls: graph.nUrls,
    flatness,
    greedyCurve,
    trajectories,
    paretoEnvelope,
    promptSources,
    selectedPoint,
    selectedBudget,
    selectedStrategy,
    selectedCoverage,
    selectedResilience,
    cutIndices,
    manifest,
  };
}
