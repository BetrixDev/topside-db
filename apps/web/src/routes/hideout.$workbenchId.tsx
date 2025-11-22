import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hideout/$workbenchId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/hideout/$workbenchId"!</div>
}
