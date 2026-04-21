export interface CliArgs {
  limit?: number;
  topicId?: string;
  runMissing: boolean;
  /** cluster-specific: raw JSON string of pre-defined categories; undefined for survey/enrichment */
  rawCategories?: string;
  /** Filter personas by this demographic tag and use it as the output demographic name */
  demographic?: string;
}

/**
 * Parses process.argv-style argument arrays into a typed CliArgs object.
 * Supported flags: --limit N, --topic ID, --missing, --categories JSON, --demographic TAG
 */
export function parseCliArgs(argv: string[]): CliArgs {
  const limitIndex = argv.indexOf('--limit');
  const limit =
    limitIndex !== -1 ? parseInt(argv[limitIndex + 1], 10) : undefined;

  const topicIndex = argv.indexOf('--topic');
  const topicId = topicIndex !== -1 ? argv[topicIndex + 1] : undefined;

  const runMissing = argv.includes('--missing');

  const categoriesIndex = argv.indexOf('--categories');
  const rawCategories =
    categoriesIndex !== -1 ? argv[categoriesIndex + 1] : undefined;

  const demographicIndex = argv.indexOf('--demographic');
  const demographic =
    demographicIndex !== -1 ? argv[demographicIndex + 1] : undefined;

  return { limit, topicId, runMissing, rawCategories, demographic };
}
