import "server-only";

import { generatePosterTool, spinWheelTool } from "./fun";
import { listMatchesTool, proposeDeleteTool, proposeMatchesTool, proposeUpdateTool } from "./matches";
import { headToHeadTool, queryStatsTool, trashTalkTool } from "./stats";

/** Every tool is a read: the propose_* tools only validate; the admin's confirm card writes (ADR Q4). */
export const TOOLS = [
  listMatchesTool,
  proposeMatchesTool,
  proposeUpdateTool,
  proposeDeleteTool,
  queryStatsTool,
  headToHeadTool,
  spinWheelTool,
  generatePosterTool,
  trashTalkTool,
];
