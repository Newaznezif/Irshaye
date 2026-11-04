/** Client-safe types for the advisor API (no server code in this module). */

export type AdvisorAnswer = {
  abstained: boolean;
  headline: string;
  recommendation: string;
  evidenceUsed: string[];
  uncertainty: string;
  limitations: string[];
};
