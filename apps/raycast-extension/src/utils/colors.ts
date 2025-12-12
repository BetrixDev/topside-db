import { Color } from "@raycast/api";

export function getRarityColor(rarity: string): Color {
  const lowerRarity = rarity.toLowerCase();
  if (lowerRarity.includes("legendary") || lowerRarity.includes("exotic")) {
    return Color.Yellow;
  }
  if (lowerRarity.includes("epic")) {
    return Color.Purple;
  }
  if (lowerRarity.includes("rare")) {
    return Color.Blue;
  }
  if (lowerRarity.includes("uncommon")) {
    return Color.Green;
  }
  return Color.SecondaryText;
}

export function getThreatColor(threatLevel: string): Color {
  const level = threatLevel.toLowerCase();
  if (level.includes("extreme") || level.includes("very high")) {
    return Color.Red;
  }
  if (level.includes("high")) {
    return Color.Orange;
  }
  if (level.includes("medium") || level.includes("moderate")) {
    return Color.Yellow;
  }
  if (level.includes("low")) {
    return Color.Green;
  }
  return Color.SecondaryText;
}
