import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/maps')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/maps"!</div>
}
