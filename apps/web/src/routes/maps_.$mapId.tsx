import { usePageView } from "@/lib/hooks/use-page-view";
import { createFileRoute } from "@tanstack/react-router";
import { UnderConstruction } from "@/components/under-construction";

export const Route = createFileRoute("/maps_/$mapId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("map", params.mapId);

  return <UnderConstruction />;
}
