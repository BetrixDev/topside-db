import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/traders')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/traders"!</div>
}
