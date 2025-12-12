import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";

export function HideoutDetail({ id }: { id: string }) {
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
  const markdown = `# ${data.name}`;

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
