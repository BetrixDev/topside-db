import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";

export function TraderDetail({ id }: { id: string }) {
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="cat-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="currency-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="quest-sep" />);
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
