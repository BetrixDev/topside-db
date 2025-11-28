import { createFileRoute } from "@tanstack/react-router";
import { usePageView } from "@/lib/hooks/use-page-view";
import { UnderConstruction } from "@/components/under-construction";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/quests_/$questId")({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      ...seo({
        title: `Quest ${params.questId} | Topside DB`,
        description: `View detailed information about quest ${params.questId} in Arc Raiders.`,
        keywords: `arc raiders, database, search engine, quest, ${params.questId}`,
      }),
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("quest", params.questId);

  return <UnderConstruction />;
}
