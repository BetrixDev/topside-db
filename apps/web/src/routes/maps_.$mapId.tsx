import { usePageView } from "@/lib/hooks/use-page-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/maps_/$mapId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  usePageView("map", params.mapId);

  return <div>Hello "/map/$mapId"!</div>;
}
