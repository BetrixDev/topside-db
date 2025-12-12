import { useState } from "react";
import {
  Action,
  ActionPanel,
  Cache,
  Color,
  Icon,
  List,
  openExtensionPreferences,
} from "@raycast/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { orpc } from "./api";
import type { SearchHit } from "@topside-db/schemas";
import { createTopsideDbUrl } from "@topside-db/utils";

const cache = new Cache();

function createRaycastPersister(cacheKey = "topside-query-cache"): Persister {
  return {
    persistClient: async (client) => {
      cache.set(cacheKey, JSON.stringify(client));
    },
    restoreClient: async () => {
      const cached = cache.get(cacheKey);
      if (!cached) return undefined;
      try {
        return JSON.parse(cached);
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      cache.remove(cacheKey);
    },
  };
}

const persister = createRaycastPersister();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Command() {
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = useQuery(
    orpc.search.search.queryOptions({
      input: {
        query: searchText,
      },
    })
  );

  const hits = data?.hits ?? [];

  return (
    <List
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="Search anything in Arc Raiders"
      searchBarPlaceholder="Search anything in Arc Raiders"
      throttle
      isShowingDetail
      isLoading={isLoading}
    >
      {hits.length === 0 && !isLoading && (
        <List.EmptyView
          title="No results found"
          description={
            searchText
              ? "Try a different search term"
              : "Start typing to search"
          }
          icon={Icon.MagnifyingGlass}
        />
      )}
      {hits.map((item) => (
        <List.Item
          icon={{
            source: getIconForSearchHit(item) ?? Icon.Document,
            tooltip: item.name,
          }}
          key={`${item.kind}-${item.id}`}
          title={item.name}
          subtitle={getSubtitleForSearchHit(item)}
          accessories={[{ tag: { value: formatKind(item.kind) } }]}
          detail={<TopsideDetail id={item.id} kind={item.kind} />}
          actions={<SearchResultActions item={item} />}
        />
      ))}
    </List>
  );
}

function formatKind(
  kind: "items" | "hideoutStations" | "maps" | "traders" | "quests" | "arcs"
): string {
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

function getSubtitleForSearchHit(hit: SearchHit): string | undefined {
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

function getIconForSearchHit(hit: SearchHit): string | Icon {
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

function getUrlForSearchHit(hit: SearchHit): string | null {
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

function SearchResultActions({ item }: { item: SearchHit }) {
  const url = getUrlForSearchHit(item);

  return (
    <ActionPanel>
      {url && (
        <>
          <Action.OpenInBrowser title="Open in Browser" url={url} />
          <Action.CopyToClipboard
            title="Copy URL"
            content={url}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </>
      )}
      <Action.CopyToClipboard
        title="Copy Name"
        content={item.name}
        shortcut={{ modifiers: ["cmd"], key: "c" }}
      />
      <Action
        title="Open Extension Preferences"
        icon={Icon.Gear}
        onAction={openExtensionPreferences}
        shortcut={{ modifiers: ["cmd"], key: "," }}
      />
    </ActionPanel>
  );
}

export default function CommandWrapper() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <Command />
    </PersistQueryClientProvider>
  );
}

type TopsideDetailProps = {
  id: string;
  kind: "items" | "hideoutStations" | "maps" | "traders" | "quests" | "arcs";
};

function TopsideDetail({ id, kind }: TopsideDetailProps) {
  switch (kind) {
    case "items":
      return <ItemDetail id={id} />;
    case "maps":
      return <MapDetail id={id} />;
    case "quests":
      return <QuestDetail id={id} />;
    case "traders":
      return <TraderDetail id={id} />;
    case "arcs":
      return <ArcDetail id={id} />;
    case "hideoutStations":
      return <HideoutDetail id={id} />;
    default:
      return <List.Item.Detail markdown="Unknown type" />;
  }
}

// ============================================================================
// ITEM DETAIL
// ============================================================================

function ItemDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# Item Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Basic info
  if (data.type) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="type"
        title="Type"
        text={data.type}
      />
    );
  }
  if (data.rarity) {
    metadata.push(
      <List.Item.Detail.Metadata.TagList key="rarity" title="Rarity">
        <List.Item.Detail.Metadata.TagList.Item
          text={data.rarity}
          color={getRarityColor(data.rarity)}
        />
      </List.Item.Detail.Metadata.TagList>
    );
  }
  if (data.stackSize != null) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="stackSize"
        title="Stack Size"
        text={String(data.stackSize)}
      />
    );
  }
  if (data.weightKg != null) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="weight"
        title="Weight"
        text={`${data.weightKg} kg`}
      />
    );
  }
  if (data.value != null) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="value"
        title="Value"
        text={`${data.value.toLocaleString()} credits`}
        icon={Icon.Coins}
      />
    );
  }

  // Effects
  if (data.effects && data.effects.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="effects-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="effects-header"
        title="✨ Effects"
        text=""
      />
    );
    data.effects.forEach((effect, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`effect-${idx}`}
          title={effect.name}
          text={String(effect.value)}
        />
      );
    });
  }

  // Recycles
  if (data.recycles && data.recycles.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="recycles-sep" />
    );
    const recycleWorth =
      data.recycledValue != null && data.value != null
        ? data.recycledValue > data.value
          ? " ✅"
          : " ⚠️"
        : "";
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="recycles-header"
        title={`♻️ Recycles Into${recycleWorth}`}
        text={data.recycledValue ? `(${data.recycledValue.toLocaleString()} cr)` : ""}
      />
    );
    data.recycles.forEach((r, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`recycle-${idx}`}
          title={r.material?.name ?? r.materialId}
          text={`×${r.quantity}`}
          icon={r.material?.imageFilename ?? Icon.Box}
        />
      );
    });
  }

  // Salvages
  if (data.salvages && data.salvages.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="salvages-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="salvages-header"
        title="✂️ Salvages Into"
        text=""
      />
    );
    data.salvages.forEach((s, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`salvage-${idx}`}
          title={s.material?.name ?? s.materialId}
          text={`×${s.quantity}`}
          icon={s.material?.imageFilename ?? Icon.Box}
        />
      );
    });
  }

  // Crafting recipe
  if (data.recipes && data.recipes.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="recipes-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="recipes-header"
        title="🔨 Crafting Materials"
        text=""
      />
    );
    data.recipes.forEach((r, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`recipe-${idx}`}
          title={r.material?.name ?? r.materialId}
          text={`×${r.quantity}`}
          icon={r.material?.imageFilename ?? Icon.Box}
        />
      );
    });
  }

  // Traders
  if (data.traders && data.traders.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="traders-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="traders-header"
        title="🛒 Available From"
        text={`${data.traders.length} trader${data.traders.length > 1 ? "s" : ""}`}
      />
    );
    data.traders.slice(0, 5).forEach((t, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`trader-${idx}`}
          title={t.trader?.name ?? t.traderId}
          text=""
          icon={t.trader?.imageUrl ?? Icon.Person}
        />
      );
    });
    if (data.traders.length > 5) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="traders-more"
          title=""
          text={`...and ${data.traders.length - 5} more`}
        />
      );
    }
  }

  // Hideout requirements
  if (data.hideoutRequirements && data.hideoutRequirements.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="hideout-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="hideout-header"
        title="🏠 Used in Hideout"
        text=""
      />
    );
    data.hideoutRequirements.slice(0, 5).forEach((h, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`hideout-${idx}`}
          title={h.hideoutStation?.name ?? "Unknown"}
          text={`×${h.quantity} (Level ${h.level})`}
        />
      );
    });
  }

  // Quest rewards
  if (data.questsRewards && data.questsRewards.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="quest-rewards-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="quest-rewards-header"
        title="🎁 Quest Reward From"
        text=""
      />
    );
    data.questsRewards.slice(0, 5).forEach((q, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`quest-reward-${idx}`}
          title={q.quest?.name ?? "Unknown Quest"}
          text={`×${q.quantity}`}
        />
      );
    });
  }

  // Arc loot
  if (data.arcLootItems && data.arcLootItems.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="arc-loot-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="arc-loot-header"
        title="👾 Dropped By ARCs"
        text=""
      />
    );
    data.arcLootItems.slice(0, 5).forEach((a, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`arc-loot-${idx}`}
          title={a.arc?.name ?? "Unknown ARC"}
          text=""
          icon={a.arc?.imageUrl ?? Icon.Bug}
        />
      );
    });
  }

  // Build markdown for top section
  let markdown = `# ${data.name}\n\n`;
  if (data.imageFilename) {
    markdown += `![${data.name}](${data.imageFilename})\n\n`;
  }
  if (data.description) {
    markdown += data.description;
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}

function getRarityColor(rarity: string): Color {
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

// ============================================================================
// MAP DETAIL
// ============================================================================

function MapDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.maps.getMap.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# Map Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Maximum time
  if (data.formattedMaxTime) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="maxTime"
        title="⏱️ Maximum Time"
        text={data.formattedMaxTime}
        icon={Icon.Clock}
      />
    );
  }

  // Difficulties
  if (data.difficulties && data.difficulties.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="diff-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="diff-header"
        title="📊 Difficulties"
        text=""
      />
    );
    data.difficulties.forEach((d, idx) => {
      const stars = "★".repeat(Math.round(d.rating * 5));
      const emptyStars = "☆".repeat(5 - Math.round(d.rating * 5));
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`diff-${idx}`}
          title={d.name}
          text={stars + emptyStars}
        />
      );
    });
  }

  // Requirements
  if (data.requirements && data.requirements.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="req-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="req-header"
        title="📋 Requirements"
        text=""
      />
    );
    data.requirements.forEach((req, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`req-${idx}`}
          title=""
          text={`• ${req}`}
        />
      );
    });
  }

  // Build markdown
  let markdown = `# ${data.name}\n\n`;
  if (data.imageUrl) {
    markdown += `![${data.name}](${data.imageUrl})\n\n`;
  }
  if (data.description) {
    markdown += data.description;
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}

// ============================================================================
// QUEST DETAIL
// ============================================================================

function QuestDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.quests.getQuest.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# Quest Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Quest info
  if (data.trader) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="trader"
        title="Trader"
        text={data.trader}
        icon={Icon.Person}
      />
    );
  }
  if (data.xp != null) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="xp"
        title="XP Reward"
        text={data.xp.toLocaleString()}
        icon={Icon.Star}
      />
    );
  }
  if (data.totalRewardValue != null && data.totalRewardValue > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="rewardValue"
        title="Total Reward Value"
        text={`${data.totalRewardValue.toLocaleString()} credits`}
        icon={Icon.Coins}
      />
    );
  }

  // Objectives
  if (data.objectives && data.objectives.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="obj-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="obj-header"
        title="🎯 Objectives"
        text=""
      />
    );
    data.objectives.forEach((obj, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`obj-${idx}`}
          title={`${idx + 1}.`}
          text={obj.text}
        />
      );
    });
  }

  // Reward items
  if (data.rewardItems && data.rewardItems.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="rewards-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="rewards-header"
        title="🎁 Item Rewards"
        text=""
      />
    );
    data.rewardItems.forEach((r, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`reward-${idx}`}
          title={r.item?.name ?? r.itemId}
          text={`×${r.quantity}`}
          icon={r.item?.imageFilename ?? Icon.Box}
        />
      );
    });
  }

  // Prerequisites
  if (data.prerequisites && data.prerequisites.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="prereq-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="prereq-header"
        title="🔒 Prerequisites"
        text=""
      />
    );
    data.prerequisites.forEach((p, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`prereq-${idx}`}
          title=""
          text={`• ${p.quest?.name ?? p.prerequisiteQuestId}`}
        />
      );
    });
  }

  // Unlocks
  if (data.nextQuests && data.nextQuests.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="next-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="next-header"
        title="🔓 Unlocks"
        text=""
      />
    );
    data.nextQuests.forEach((n, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`next-${idx}`}
          title=""
          text={`• ${n.quest?.name ?? n.nextQuestId}`}
        />
      );
    });
  }

  // Build markdown
  let markdown = `# ${data.name}\n\n`;
  if (data.description) {
    markdown += data.description;
  } else {
    markdown += "*No description available*";
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}

// ============================================================================
// TRADER DETAIL
// ============================================================================

function TraderDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.traders.getTrader.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# Trader Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Stats overview
  if (data.stats) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="stats-items"
        title="Items for Sale"
        text={String(data.stats.totalItemsForSale)}
        icon={Icon.Box}
      />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="stats-quests"
        title="Quests"
        text={String(data.stats.totalQuests)}
        icon={Icon.CheckCircle}
      />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="stats-categories"
        title="Categories"
        text={String(data.stats.uniqueCategories)}
        icon={Icon.Tag}
      />
    );
  }

  // Sell categories
  if (data.sellCategories && data.sellCategories.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="cat-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.TagList key="categories" title="🏷️ Categories">
        {data.sellCategories.map((cat, idx) => (
          <List.Item.Detail.Metadata.TagList.Item key={idx} text={cat} />
        ))}
      </List.Item.Detail.Metadata.TagList>
    );
  }

  // Items by currency
  if (data.itemsByCurrency) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="currency-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="currency-header"
        title="🛒 Items for Sale"
        text=""
      />
    );

    if (data.itemsByCurrency.credits.length > 0) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="credits-count"
          title="💰 Credits"
          text={`${data.itemsByCurrency.credits.length} items`}
        />
      );
    }
    if (data.itemsByCurrency.seeds.length > 0) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="seeds-count"
          title="🌱 Seeds"
          text={`${data.itemsByCurrency.seeds.length} items`}
        />
      );
    }
    if (data.itemsByCurrency.augment.length > 0) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="augment-count"
          title="✨ Augment"
          text={`${data.itemsByCurrency.augment.length} items`}
        />
      );
    }
  }

  // Quests
  if (data.quests && data.quests.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="quest-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="quest-header"
        title="📜 Quests"
        text=""
      />
    );
    data.quests.slice(0, 8).forEach((q, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`quest-${idx}`}
          title={q.name}
          text={q.xp ? `${q.xp.toLocaleString()} XP` : ""}
        />
      );
    });
    if (data.quests.length > 8) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="quest-more"
          title=""
          text={`...and ${data.quests.length - 8} more`}
        />
      );
    }
  }

  // Build markdown
  let markdown = `# ${data.name}\n\n`;
  if (data.imageUrl) {
    markdown += `![${data.name}](${data.imageUrl})\n\n`;
  }
  if (data.description) {
    markdown += data.description;
  } else {
    markdown += "*No description available*";
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}

// ============================================================================
// ARC DETAIL
// ============================================================================

function ArcDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.arcs.getArc.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# ARC Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Combat stats
  if (data.threatLevel) {
    metadata.push(
      <List.Item.Detail.Metadata.TagList key="threat" title="💀 Threat Level">
        <List.Item.Detail.Metadata.TagList.Item
          text={data.threatLevel}
          color={getThreatColor(data.threatLevel)}
        />
      </List.Item.Detail.Metadata.TagList>
    );
  }
  if (data.health != null) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="health"
        title="Health"
        text={data.health.toLocaleString()}
        icon={Icon.Heart}
      />
    );
  }
  if (data.armorPlating) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="armor"
        title="Armor"
        text={data.armorPlating}
        icon={Icon.Shield}
      />
    );
  }

  // Stats overview
  if (data.stats) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="stats-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="attacks-count"
        title="Attacks"
        text={String(data.stats.totalAttacks)}
      />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="weaknesses-count"
        title="Weaknesses"
        text={String(data.stats.totalWeaknesses)}
      />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="loot-count"
        title="Loot Items"
        text={String(data.stats.totalLoot)}
      />
    );
  }
  if (data.totalLootValue != null && data.totalLootValue > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="loot-value"
        title="Total Loot Value"
        text={`${data.totalLootValue.toLocaleString()} credits`}
        icon={Icon.Coins}
      />
    );
  }

  // Weaknesses
  if (data.weaknesses && data.weaknesses.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="weak-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="weak-header"
        title="🎯 Weaknesses"
        text=""
      />
    );
    data.weaknesses.forEach((w, idx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`weak-${idx}`}
          title=""
          text={`• ${w}`}
        />
      );
    });
  }

  // Attack types
  if (data.attacksByType && Object.keys(data.attacksByType).length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="attack-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="attack-header"
        title="⚔️ Attack Types"
        text=""
      />
    );
    Object.entries(data.attacksByType)
      .slice(0, 5)
      .forEach(([type, attacks], idx) => {
        const attackList = attacks as string[];
        metadata.push(
          <List.Item.Detail.Metadata.Label
            key={`attack-${idx}`}
            title={type}
            text={attackList.slice(0, 3).join(", ")}
          />
        );
      });
  }

  // Loot
  if (data.lootDetails && data.lootDetails.length > 0) {
    metadata.push(
      <List.Item.Detail.Metadata.Separator key="loot-sep" />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="loot-header"
        title="📦 Potential Loot"
        text=""
      />
    );
    data.lootDetails.slice(0, 8).forEach((l, idx) => {
      const item = l.item;
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`loot-${idx}`}
          title={item?.name ?? l.name}
          text={item?.value ? `${item.value.toLocaleString()} cr` : ""}
          icon={item?.imageFilename ?? Icon.Box}
        />
      );
    });
    if (data.lootDetails.length > 8) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="loot-more"
          title=""
          text={`...and ${data.lootDetails.length - 8} more`}
        />
      );
    }
  }

  // Build markdown
  let markdown = `# ${data.name}\n\n`;
  if (data.imageUrl) {
    markdown += `![${data.name}](${data.imageUrl})\n\n`;
  }
  if (data.description) {
    markdown += data.description;
  } else {
    markdown += "*No description available*";
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}

function getThreatColor(threatLevel: string): Color {
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

// ============================================================================
// HIDEOUT DETAIL
// ============================================================================

function HideoutDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.hideouts.getHideout.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail isLoading />;
  }

  if (!data) {
    return <List.Item.Detail markdown="# Hideout Station Not Found" />;
  }

  const metadata: React.ReactNode[] = [];

  // Stats
  if (data.stats) {
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="total-items"
        title="Total Items Required"
        text={String(data.stats.totalItemsRequired)}
        icon={Icon.Box}
      />
    );
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="unique-items"
        title="Unique Items"
        text={String(data.stats.uniqueItemsRequired)}
      />
    );
    if (data.stats.totalValueRequired > 0) {
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key="total-value"
          title="Total Value"
          text={`${data.stats.totalValueRequired.toLocaleString()} credits`}
          icon={Icon.Coins}
        />
      );
    }
  }

  // Levels with requirements
  if (data.levels && data.levels.length > 0) {
    data.levels.forEach((level, levelIdx) => {
      metadata.push(
        <List.Item.Detail.Metadata.Separator key={`level-sep-${levelIdx}`} />
      );
      metadata.push(
        <List.Item.Detail.Metadata.Label
          key={`level-header-${levelIdx}`}
          title={`📊 Level ${level.level}`}
          text={
            level.totalValueForLevel > 0
              ? `${level.totalValueForLevel.toLocaleString()} cr`
              : ""
          }
        />
      );
      if (level.description) {
        metadata.push(
          <List.Item.Detail.Metadata.Label
            key={`level-desc-${levelIdx}`}
            title=""
            text={level.description}
          />
        );
      }
      if (level.requirements && level.requirements.length > 0) {
        level.requirements.forEach((req, reqIdx) => {
          metadata.push(
            <List.Item.Detail.Metadata.Label
              key={`level-${levelIdx}-req-${reqIdx}`}
              title={req.item?.name ?? req.itemId}
              text={`×${req.quantity}`}
              icon={req.item?.imageFilename ?? Icon.Box}
            />
          );
        });
      } else {
        metadata.push(
          <List.Item.Detail.Metadata.Label
            key={`level-${levelIdx}-no-req`}
            title=""
            text="No items required"
          />
        );
      }
    });
  }

  // Build markdown
  let markdown = `# ${data.name}\n\n`;
  if (data.description) {
    markdown += data.description;
  } else {
    markdown += "*No description available*";
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        metadata.length > 0 ? (
          <List.Item.Detail.Metadata>{metadata}</List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
}
