import { TaskContextProvider, useTaskContextValue } from '@/components/taskContextProvider'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {z} from "zod";
import { db } from '@/lib/drizzle'
import { Separator } from '@/components/ui/separator'
import Task from './components/-task'
import Content from './components/-content';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Topbar from './components/-topbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectGroup, SelectValue } from '@/components/ui/select'
import { getRequestHeaders } from '@tanstack/react-start-server';
import { auth } from '@/lib/auth';
import { useMediaQuery } from 'react-responsive'
import { useState } from 'react';

const getCourse = createServerFn().inputValidator(z.string()).handler(async ({ data }) => {
    let course = await db.query.courses.findFirst({
        where: (courses , {eq}) => eq(courses.id , data),
        with : {
            chapters : {
                orderBy: (chapters, { asc }) => [asc(chapters.order)],
                with : {
                    modules : true
                }
            },
            student : {
                columns : {userId : true}
            }
        }
    })
    const session = await auth.api.getSession({ headers: getRequestHeaders()});
    if (!course) {
        throw redirect({to : "/app/course"})
    };
    const isStudent = course.student.some((student) => student.userId == session?.user.id);
    if (course.access === "private" && session?.user.id !== course.createrId && !isStudent) {
        throw redirect({to : "/app/course"})
    }
    return Object.assign(course , {isStudent})
})

const SetView = ({view , setView} : {view : "content" | "Task" , setView : (val : "content" | "Task") => void}) => {

    const views = ["content" , "Task"] as const
    return (
        <div className='flex flex-row rounded-full bg-bg2 mx-auto my-2'>
            {views.map((tab  , index) => (
                <button key={index} onClick={() => setView(tab)} 
                    className={` ${tab == view ? "bg-primary" : "bg-bg2"} p-1 px-4 rounded-full`}>
                    {tab}
                </button>
            ))}
        </div>
    )
}

export const Route = createFileRoute('/app/course/$courseID_/$moduleID')({
    component: RouteComponent,
    loader: async ({ params }) => await getCourse({ data : params.courseID }),
})

function MobileViewSelect({view, setView}: {view: "content" | "Task", setView: (v: "content" | "Task") => void}) {
    const {task , setTask} = useTaskContextValue()

    return (
        <div className='flex flex-row items-center justify-center gap-2 mx-auto my-2'>
            <SetView view={view} setView={setView} />
            <Separator orientation='vertical' className='h-6 bg-black/50' />
            <Select value={task} onValueChange={setTask}>
                <SelectTrigger className='bg-bg2 rounded w-fit'>
                    <SelectValue placeholder='Task'/>
                </SelectTrigger>
                <SelectContent className='rounded'>
                    <SelectGroup>
                        <SelectItem value={"Quiz"}>Quiz</SelectItem>
                        <SelectItem value={"Mission"}>Mission</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}

function RouteComponent() {
    const course = Route.useLoaderData();
    const { moduleID} = Route.useParams() 

    const isDesktop = useMediaQuery({minWidth : 1224})
    const isMobile = useMediaQuery({maxWidth : 1224})
    const [view , setView] = useState<"content"|"Task">("content")

    return (
        <div className='flex flex-col  bg-bg1 flex-1 overflow-scroll  ' style={{scrollbarWidth : "none"}}>
            <TaskContextProvider>
                <Topbar chapters={course.chapters} moduleID={moduleID} showTask={!isMobile} />
                <Separator className=" bg-black/50" />
                {isDesktop && 
                    <ResizablePanelGroup direction="horizontal" className='flex flex-row h-[calc(100%-(48px+8px))] '>
                        <ResizablePanel className='overflow-y-auto!' defaultSize={50}>
                            <Content moduleID={moduleID} course={course}/>
                        </ResizablePanel>
                        <ResizableHandle className=' bg-black/50 ' />
                        <ResizablePanel className={`${course.isStudent && 'overflow-y-auto! '} relative  `} defaultSize={50}>
                            {!course.isStudent && 
                                <div className=" backdrop-blur-md absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center text-lg font-medium">
                                    Inrole to course first
                                    <Link to="/app/course/$courseID" params={{courseID: course.id}} className="ml-2 text-primary"> Go to course</Link>
                                </div>
                            }
                            <Task moduleID={moduleID} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                }   
                {isMobile &&
                    <>
                        <MobileViewSelect view={view} setView={setView} />
                        <Separator className=" bg-black/50" />
                        {view == "content" ? 
                            <Content moduleID={moduleID} course={course}/>
                        :
                            <div className='relative'>
                                {!course.isStudent && 
                                    <div className=" backdrop-blur-md absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center text-lg font-medium">
                                        Inrole to course first
                                        <Link to="/app/course/$courseID" params={{courseID: course.id}} className="ml-2 text-primary"> Go to course</Link>
                                    </div>
                                }
                                <Task moduleID={moduleID} />
                            </div>
                        }
                    </>
                }
            </TaskContextProvider>
        </div>
    )
}


