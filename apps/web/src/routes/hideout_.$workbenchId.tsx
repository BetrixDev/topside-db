import { createFileRoute } from "@tanstack/react-router";
import { usePageView } from "@/lib/hooks/use-page-view";
import { UnderConstruction } from "@/components/under-construction";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/hideout_/$workbenchId")({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      ...seo({
        title: `Hideout Station ${params.workbenchId} | Topside DB`,
        description: `View detailed information about hideout station ${params.workbenchId} in Arc Raiders.`,
        keywords: `arc raiders, database, search engine, hideout, workbench, ${params.workbenchId}`,
      }),
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("hideoutStation", params.workbenchId);

  return <UnderConstruction />;
}
