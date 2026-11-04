import type { WrappedStory } from "@/server/stats/wrapped";

import { BestDaySlide, FavouriteSlide, IntroSlide, MatchesSlide, StreakSlide } from "./performance-slides";
import { BadgesSlide, MoneySlide, RivalsSlide } from "./social-slides";

/** Story order; `tone` picks the backdrop wash behind the slide. */
export const SLIDES = [
  { id: "intro", tone: "felt" },
  { id: "matches", tone: "felt" },
  { id: "favourite", tone: "lamp" },
  { id: "streak", tone: "lamp" },
  { id: "rivals", tone: "cold" },
  { id: "money", tone: "loss" },
  { id: "bestDay", tone: "lamp" },
  { id: "badges", tone: "felt" },
] as const;

export type SlideId = (typeof SLIDES)[number]["id"];

export function SlideView({ id, story, onReplay }: { id: SlideId; story: WrappedStory; onReplay: () => void }) {
  switch (id) {
    case "intro":
      return <IntroSlide story={story} />;
    case "matches":
      return <MatchesSlide story={story} />;
    case "favourite":
      return <FavouriteSlide story={story} />;
    case "streak":
      return <StreakSlide story={story} />;
    case "rivals":
      return <RivalsSlide story={story} />;
    case "money":
      return <MoneySlide story={story} />;
    case "bestDay":
      return <BestDaySlide story={story} />;
    case "badges":
      return <BadgesSlide story={story} onReplay={onReplay} />;
  }
}
