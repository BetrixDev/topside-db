import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/item/$itemId")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      orpc.items.getItem.queryOptions({
        input: { id: params.itemId },
      })
    );
  },
});

function RouteComponent() {
  const params = Route.useParams();

  const { data } = useQuery(
    orpc.items.getItem.queryOptions({
      input: { id: params.itemId },
    })
  );

  return <div>Hello {data?.name}!</div>;
}
