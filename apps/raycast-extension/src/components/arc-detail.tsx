import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";
import { getThreatColor } from "../utils/colors";

export function ArcDetail({ id }: { id: string }) {
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="stats-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="weak-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="attack-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="loot-sep" />);
    metadata.push(
      <List.Item.Detail.Metadata.Label
        key="loot-header"
        title="📦 Potential Loot"
        text=""
      />
    );
    data.lootDetails.forEach((l, idx) => {
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
