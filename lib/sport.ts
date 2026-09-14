import { SPORT_TYPES } from "@/lib/definitions";

export const sportLabel = (value: string) =>
  SPORT_TYPES.find((sport) => sport.value === value)?.label ?? value;

export const SPORT_COLORS: Record<string, string> = {
  padel: "bg-[#27783f]",
  fulbol: "bg-[#2e9c4b]",
  tenis: "bg-[#b8a014]",
  basquet: "bg-[#e86b0b]",
  voley: "bg-[#0f7bc2]",
  squash: "bg-[#8f3f3f]",
  badminton: "bg-[#6d4c41]",
  frontenis: "bg-[#455a64]",
};
