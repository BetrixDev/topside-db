import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/quest/$questId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/quest/$questId"!</div>
}
