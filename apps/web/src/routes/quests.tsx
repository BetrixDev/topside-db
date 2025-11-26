import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/quests')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/quests"!</div>
}
