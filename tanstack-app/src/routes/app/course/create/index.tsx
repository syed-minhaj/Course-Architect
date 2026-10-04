import { createFileRoute } from '@tanstack/react-router'
import CreateCourseForm from './components/-createCourseForm'
import { requireUser } from '@/server/requireUser'

export const Route = createFileRoute('/app/course/create/')({
    component: RouteComponent,
    beforeLoad: () => requireUser({ data: { redirectTo: '/app/course/create' } }),
})

function RouteComponent() {
    return (
        <div className='bg-bg1 flex flex-col items-center flex-1'>
            <CreateCourseForm />
        </div>
    )
}
