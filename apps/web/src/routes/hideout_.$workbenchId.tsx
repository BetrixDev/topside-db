import { createFileRoute } from "@tanstack/react-router";
import { usePageView } from "@/lib/hooks/use-page-view";
import { UnderConstruction } from "@/components/under-construction";

export const Route = createFileRoute("/hideout_/$workbenchId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  // usePageView("hideout", params.workbenchId);

  return <UnderConstruction />;
}
