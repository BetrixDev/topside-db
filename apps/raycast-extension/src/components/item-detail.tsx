import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";
import { getRarityColor } from "../utils/colors";

export function ItemDetail({ id }: { id: string }) {
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="effects-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="recycles-sep" />);
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
        text={
          data.recycledValue
            ? `(${data.recycledValue.toLocaleString()} cr)`
            : ""
        }
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="salvages-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="recipes-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="traders-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="hideout-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="arc-loot-sep" />);
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
