import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/arcs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/arcs"!</div>
}
