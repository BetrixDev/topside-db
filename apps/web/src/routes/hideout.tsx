import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hideout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/hideout"!</div>
}
