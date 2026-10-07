import { createFileRoute } from '@tanstack/react-router'
import CreateCourseForm from './components/-createCourseForm'

export const Route = createFileRoute('/app/course/create/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className='bg-bg1 flex flex-col items-center flex-1'>
            <CreateCourseForm />
        </div>
    )
}
