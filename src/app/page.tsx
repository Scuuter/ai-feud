import { GameClient } from "./game-client";
import surveyData from "../../scripts/output/game-of-thrones/suspicious-activity-3am-game-of-thrones-v1.json";
import type { SurveyResult } from "@/lib/game-logic/types";

export default function Home() {
  return <GameClient surveyData={surveyData as SurveyResult} />;
}
