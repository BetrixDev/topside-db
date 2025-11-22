import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/map/$mapId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/map/$mapId"!</div>
}
