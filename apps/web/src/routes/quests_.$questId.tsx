import { createFileRoute } from "@tanstack/react-router";
import { usePageView } from "@/lib/hooks/use-page-view";
import { UnderConstruction } from "@/components/under-construction";

export const Route = createFileRoute("/quests_/$questId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("quest", params.questId);

  return <UnderConstruction />;
}
