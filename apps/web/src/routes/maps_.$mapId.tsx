import { usePageView } from "@/lib/hooks/use-page-view";
import { createFileRoute } from "@tanstack/react-router";
import { UnderConstruction } from "@/components/under-construction";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/maps_/$mapId")({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      ...seo({
        title: `Map ${params.mapId} | Topside DB`,
        description: `View detailed information about map ${params.mapId} in Arc Raiders.`,
        keywords: `arc raiders, database, search engine, map, ${params.mapId}`,
      }),
    ],
  }),
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("map", params.mapId);

  return <UnderConstruction />;
}
