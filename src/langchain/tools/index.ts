import "server-only";

import { generatePosterTool, spinWheelTool } from "./fun";
import { listMatchesTool, proposeDeleteTool, proposeMatchesTool, proposeUpdateTool, resolveCardTool } from "./matches";
import { headToHeadTool, queryStatsTool, trashTalkTool } from "./stats";
import { listSubmissionsTool, proposeSubmissionDecisionTool } from "./submissions";

/** Every tool is a read: propose_* and resolve_card only validate; the admin's confirm card writes (ADR Q4). */
export const TOOLS = [
  listMatchesTool,
  proposeMatchesTool,
  proposeUpdateTool,
  proposeDeleteTool,
  listSubmissionsTool,
  proposeSubmissionDecisionTool,
  resolveCardTool,
  queryStatsTool,
  headToHeadTool,
  spinWheelTool,
  generatePosterTool,
  trashTalkTool,
];
