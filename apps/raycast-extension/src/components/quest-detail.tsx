import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";

export function QuestDetail({ id }: { id: string }) {
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="obj-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="rewards-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="prereq-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="next-sep" />);
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
