import { Icon, List } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../api";

export function MapDetail({ id }: { id: string }) {
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="diff-sep" />);
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
    metadata.push(<List.Item.Detail.Metadata.Separator key="req-sep" />);
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
