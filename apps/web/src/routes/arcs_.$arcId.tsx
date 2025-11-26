import { usePageView } from "@/lib/hooks/use-page-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/arcs_/$arcId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  usePageView("arc", params.arcId);

  return <div className="mt-16">Hello "/arc/$arcId"!</div>;
}
