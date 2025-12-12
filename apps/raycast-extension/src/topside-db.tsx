import { useState } from "react";
import {
  Action,
  ActionPanel,
  Cache,
  Icon,
  List,
  openExtensionPreferences,
} from "@raycast/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { orpc } from "./api";
import type { SearchHit } from "@topside-db/schemas";
import {
  formatKind,
  getIconForSearchHit,
  getSubtitleForSearchHit,
  getUrlForSearchHit,
  type EntityKind,
} from "./utils/search-helpers";
import {
  ItemDetail,
  MapDetail,
  QuestDetail,
  TraderDetail,
  ArcDetail,
  HideoutDetail,
} from "./components";

// ============================================================================
// QUERY CLIENT SETUP
// ============================================================================

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

// ============================================================================
// MAIN COMMAND
// ============================================================================

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

// ============================================================================
// ACTIONS
// ============================================================================

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

// ============================================================================
// DETAIL ROUTER
// ============================================================================

type TopsideDetailProps = {
  id: string;
  kind: EntityKind;
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
// EXPORT
// ============================================================================

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
