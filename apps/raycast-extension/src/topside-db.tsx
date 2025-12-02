import { useState } from "react";
import { Cache, List } from "@raycast/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { orpc } from "./api";
import { capitalize } from "es-toolkit/string";
import { SearchHit } from "@topside-db/schemas";

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

  const { data } = useQuery(
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
    >
      {hits.length === 0 && <List.EmptyView title="No results found" />}
      {hits.map((item) => (
        <List.Item
          icon={{
            source: getIconForSearchHit(item) ?? "unknown.png",
            tooltip: item.name,
          }}
          key={item.id}
          title={item.name}
          subtitle={capitalize(item.kind)}
          detail={<TopsideDetail id={item.id} kind={item.kind} />}
        />
      ))}
    </List>
  );
}

function getIconForSearchHit(hit: SearchHit) {
  switch (hit.kind) {
    case "items":
      return hit.imageFilename;
    case "arcs":
      return hit.imageUrl;
    case "maps":
      return hit.imageUrl;
    case "traders":
      return hit.imageUrl;
  }
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
  if (kind === "items") {
    return <ItemDetail id={id} />;
  }

  if (kind === "maps") {
    return <MapDetail id={id} />;
  }

  return <List.Item.Detail markdown="Not implemented" />;
}

function ItemDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail markdown="Loading..." />;
  }

  if (!data) {
    return <List.Item.Detail markdown="No data found" />;
  }

  return (
    <List.Item.Detail markdown={`# ${data.name}\n\n${data.description}`} />
  );
}

function MapDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery(
    orpc.maps.getMap.queryOptions({
      input: { id },
    })
  );

  if (isLoading) {
    return <List.Item.Detail markdown="Loading..." />;
  }

  if (!data) {
    return <List.Item.Detail markdown="No data found" />;
  }

  return (
    <List.Item.Detail
      markdown={`# ${data.name}\n\n![${data.name} map image](${data.imageUrl})`}
    />
  );
}
