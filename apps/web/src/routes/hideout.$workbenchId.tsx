import { createFileRoute } from "@tanstack/react-router";
import { usePageView } from "@/lib/hooks/use-page-view";

export const Route = createFileRoute("/hideout/$workbenchId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  usePageView("hideout", params.workbenchId);

  return <div>Hello "/hideout/$workbenchId"!</div>;
}
