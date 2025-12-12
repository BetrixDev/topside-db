import { Icon } from "@raycast/api";
import type { SearchHit } from "@topside-db/schemas";
import { createTopsideDbUrl } from "@topside-db/utils";

export type EntityKind =
  | "items"
  | "hideoutStations"
  | "maps"
  | "traders"
  | "quests"
  | "arcs";

export function formatKind(kind: EntityKind): string {
  switch (kind) {
    case "items":
      return "Item";
    case "hideoutStations":
      return "Hideout";
    case "maps":
      return "Map";
    case "traders":
      return "Trader";
    case "quests":
      return "Quest";
    case "arcs":
      return "ARC";
  }
}

export function getSubtitleForSearchHit(hit: SearchHit): string | undefined {
  switch (hit.kind) {
    case "items":
      return hit.type;
    case "quests":
      return hit.trader;
    case "arcs":
      return hit.threatLevel ?? undefined;
    case "maps":
    case "traders":
    case "hideoutStations":
      return undefined;
  }
}

export function getIconForSearchHit(hit: SearchHit): string | Icon {
  switch (hit.kind) {
    case "items":
      return hit.imageFilename ?? Icon.Box;
    case "arcs":
      return hit.imageUrl ?? Icon.Bug;
    case "maps":
      return hit.imageUrl ?? Icon.Map;
    case "traders":
      return hit.imageUrl ?? Icon.Person;
    case "quests":
      return Icon.CheckCircle;
    case "hideoutStations":
      return Icon.House;
  }
}

export function getUrlForSearchHit(hit: SearchHit): string | null {
  switch (hit.kind) {
    case "items":
      return createTopsideDbUrl({ type: "item", id: hit.id });
    case "arcs":
      return createTopsideDbUrl({ type: "arc", id: hit.id });
    case "maps":
      return createTopsideDbUrl({ type: "map", id: hit.id });
    case "traders":
      return createTopsideDbUrl({ type: "trader", id: hit.id });
    case "quests":
      return createTopsideDbUrl({ type: "quest", id: hit.id });
    case "hideoutStations":
      return createTopsideDbUrl({ type: "hideout", id: hit.id });
  }
}
