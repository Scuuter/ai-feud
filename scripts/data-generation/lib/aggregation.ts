import type { AnswerCategory } from '../types.js';

export interface AggregatedCluster {
  category: AnswerCategory;
  personaIds: string[];
 }

export interface AggregateAssignmentsResult {
  clusters: AggregatedCluster[];
  wildcardPersonaIds: string[];
}

/**
 * Pure function: aggregates flat assignment records into per-category persona buckets.
 * - Valid category IDs → appended to the matching cluster's personaIds.
 * - "wildcard" or hallucinated category IDs → appended to wildcardPersonaIds.
 * - All categories from the input list are always present in the result, even with personaIds: [].
 */
export function aggregateAssignments(
  assignments: Array<{ personaId: string; assignedCategory: string }>,
  categories: AnswerCategory[]
): AggregateAssignmentsResult {
  const result: AggregateAssignmentsResult = {
    clusters: categories.map(c => ({ category: c, personaIds: [] })),
    wildcardPersonaIds: [],
  };

  const validCategoryIds = new Set(categories.map(c => c.id));

  for (const assignment of assignments) {
    if (
      assignment.assignedCategory === 'wildcard' ||
      !validCategoryIds.has(assignment.assignedCategory)
    ) {
      result.wildcardPersonaIds.push(assignment.personaId);
    } else {
      const cluster = result.clusters.find(
        c => c.category.id === assignment.assignedCategory
      );
      if (cluster) {
        cluster.personaIds.push(assignment.personaId);
      } else {
        // Defensive fallback (should be unreachable given the Set check above)
        result.wildcardPersonaIds.push(assignment.personaId);
      }
    }
  }

  return result;
}
