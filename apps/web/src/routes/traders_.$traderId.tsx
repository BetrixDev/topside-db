import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/traders_/$traderId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className="pt-16 min-h-screen">Hello "/trader/$traderId"!</div>;
}
