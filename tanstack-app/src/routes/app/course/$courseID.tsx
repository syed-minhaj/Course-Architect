import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/drizzle'
import { createFileRoute,  Link,  redirect } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import {z} from "zod";
import { getRequestHeaders } from "@tanstack/react-start-server";
import { auth } from '@/lib/auth'
import { userToCourseTaken } from 'db/auth-schema'
import { useState } from 'react'
import { courses, modules } from 'db/schema';
import { primaryMissions, quickQuizzes, userToPrimaryMissionsPassed, userToQuickQuizzesPassed } from 'db/schema';
import { and, eq } from 'drizzle-orm';
import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';


const courseIDSchema = z.string()
const getCoursee = createServerFn()
    .inputValidator(courseIDSchema)
    .handler(async({data}) => {
        const session = await auth.api.getSession({ headers: getRequestHeaders()});
        const course = await db.query.courses.findFirst({
            where: (courses , {eq}) => eq(courses.id , data),
            with : {
                chapters : {
                    orderBy: (chapters, { asc }) => [asc(chapters.order)],
                    with : {
                        modules : true
                    }
                },
                student : {
                    where : (student , {eq}) => eq(student.userId , session?.user.id ?? ""),
                    columns : {userId : true}
                }
            }
        })
        if (!course) {
            throw redirect({to : "/app/course"})
        };
        if (course.access === "private") {
            const isCreator = session?.user.id === course.createrId;
            const isEnrolled = course.student.length > 0;
            if (!isCreator && !isEnrolled) {
                throw redirect({to : "/app/course"})
            }
        }
        if (course.student.length == 0) return Object.assign(course , {moduleI : 0, isCreator: session?.user.id === course.createrId})
        const completedModules = await db.select({
            moduleId: modules.id,
        }).from(modules)
            .innerJoin(courses, eq(modules.courseId, courses.id))
            .innerJoin(quickQuizzes, eq(modules.id, quickQuizzes.moduleId))
            .innerJoin(primaryMissions, eq(modules.id, primaryMissions.moduleId))
            .innerJoin(userToQuickQuizzesPassed, eq(quickQuizzes.id, userToQuickQuizzesPassed.quickQuizId))
            .innerJoin(userToPrimaryMissionsPassed, eq(primaryMissions.id, userToPrimaryMissionsPassed.primaryMissionId))
            .where(and(
                eq(courses.id, data),
                eq(userToQuickQuizzesPassed.userId, session?.user.id ?? ""),
                eq(userToPrimaryMissionsPassed.userId, session?.user.id ?? "")
            ))
            .execute();

        if (completedModules.length === 0) return Object.assign(course , {moduleI : 0, isCreator: session?.user.id === course.createrId})

        const allModules = course.chapters.flatMap((c) => c.modules);
        const indexOfNextModule = allModules.findIndex((module) => 
            completedModules.every((completedModule) => completedModule.moduleId !== module.id)
        );
        return Object.assign(course, { 
            moduleI: indexOfNextModule == -1 ? 0 : indexOfNextModule,
            isCreator: session?.user.id === course.createrId,  
        });
})

const deleteCourse = createServerFn()
    .inputValidator(z.string())
    .handler(async ({ data }) => {
        const session = await auth.api.getSession({ headers: getRequestHeaders() });
        if (!session?.user) {
            throw redirect({ to: "/app/auth/$authView", params: { authView: "login" } });
        }
        const course = await db.query.courses.findFirst({
            where: (courses, { eq }) => eq(courses.id, data),
        });
        if (!course) throw new Error("Course not found");
        if (course.createrId !== session.user.id) throw new Error("Unauthorized");

        await db.delete(courses).where(eq(courses.id, data));
        throw redirect({ to: "/app/course" });
  });

const joinCourseFn = createServerFn()
    .inputValidator(z.object({courseID : courseIDSchema , moduleID : z.string()}))
    .handler(async({data}) => {
        const session = await auth.api.getSession({ headers: getRequestHeaders()});
        if (!session || !session.user) {
            throw redirect({to : "/app/auth/$authView" , params : {authView : "login"}})
        }
        const userHasTakenCourse = await db.query.userToCourseTaken.findFirst({
            where : (userToCourseTaken , {eq,and}) => and(eq(userToCourseTaken.userId , session.user.id) , eq(userToCourseTaken.courseId , data.courseID) )
        })
        if (userHasTakenCourse) {
            throw redirect({to : "/app/course/$courseID/$moduleID" , params : {courseID : data.courseID , moduleID : data.moduleID}})
        }
        await db.insert(userToCourseTaken).values({userId : session.user.id , courseId : data.courseID})
        throw redirect({to : "/app/course/$courseID/$moduleID" , params : {courseID : data.courseID , moduleID : data.moduleID}})
    })


export const Route = createFileRoute('/app/course/$courseID')({
    loader:  async({ params }) => await getCoursee({ data : params.courseID }),
    component: RouteComponent,
    pendingComponent: () => <div className='bg-bg1 flex-1'></div>,
})


function RouteComponent() {
    const course = Route.useLoaderData();
    const allModules = course.chapters.flatMap((c) => c.modules);
    const joinCourse = useServerFn(joinCourseFn)
    const deleteCourseFn = useServerFn(deleteCourse)
    const [isLoading, setIsLoading] = useState(false)
    
    async function join(data : {courseID : string , moduleID : string}) {
        setIsLoading(true)
        await joinCourse({data})
        setIsLoading(false)
    }

    async function handleDelete() {
        toast.info("Do you want to delete this field ?", {
            id : "confirm",
            action : 
                {
                    label : "Yes",
                    onClick : () => {
                        toast.dismiss("confirm");
                        toast.loading("Deleting field" , {
                            id : "loading",
                        });
                        deleteCourseFn({ data: course.id }).then(() => {
                            toast.dismiss("loading");
                            toast.success("Successfully deleted");
                        })
                    }
                }
            
        });
    }

    return (
        <div className='bg-bg1  '>
            <div className='w-full h-screen relative '>
                <div className='bg-[url(/bgImage.webp)] bg-cover bg-center w-full h-full absolute '/>
                <div className='bg-black/66 w-full h-full absolute flex flex-col justify-center items-center'>
                    <div className='flex flex-col gap-8 items-center justify-center'>
                        <h2 className='font-irish-grover text-2xl sm:text-4xl text-center text-white '>{course.courseTitle}</h2>
                        <div className='flex flex-row gap-6 text-white text-lg font-bold'>
                            {course.student.length > 0 ?  
                                <Link to="/app/course/$courseID/$moduleID" params={{courseID : course.id , moduleID : allModules[course.moduleI].id}} 
                                className='w-37 py-4 text-center rounded-sm  bg-[#3A10E5] disabled:opacity-25' disabled={isLoading} >Continue</Link>
                            :
                                <button onClick={() => join({courseID: course.id , moduleID : allModules[0].id})} 
                                className='w-37 py-4 text-center rounded-sm  bg-[#3A10E5] disabled:opacity-25' disabled={isLoading} >Join Coure</button>
                            }
                            <Link to="/app/course/$courseID/$moduleID" params={{courseID : course.id , moduleID:allModules[course.moduleI].id}} className='w-37 py-4 text-center rounded-sm  bg-[#919191]' disabled={isLoading} >
                                View Course
                            </Link>
                            {course.isCreator && ( 
                                <Popover >
                                    <PopoverTrigger className=" flex flex-row items-center p-2 ">
                                        <Settings2/>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit z-300 bg-transparent backdrop-blur-sm">
                                        <Button  className='bg-destructive ml-auto hover:bg-destructive/85 rounded-sm ' onClick={() => {handleDelete()}}>
                                            Delete Course
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div id="detail" className='flex flex-col items-center py-32 gap-28'>
                <div className='flex flex-col items-center w-190 max-w-11/12'>
                    <h3 className='font-medium text-2xl/[250%]'>Course Summary</h3>
                    <p className='text-xl/[250%] text-center'>{course.introSummary}</p>
                </div>
                <div className='flex flex-col items-center  max-w-11/12'>
                    <h3 className='font-medium text-2xl/[250%] pb-5'>Chapters</h3>
                    {course.chapters.map((chapter, ci) => (
                        <div key={chapter.id} className='w-full'>
                            <h4 className='font-semibold text-xl/[200%] pb-2'>{chapter.title}</h4>
                            {chapter.modules.map((module, mi) => {
                                const globalIndex = course.chapters.slice(0, ci).reduce((sum, c) => sum + c.modules.length, 0) + mi;
                                return (
                                    <div key={module.id}>
                                        <div className='pr-4 flex flex-row gap-2 w-full text-lg/[100%] sm:text-xl/[100%]'>
                                            <h6 className='w-fit'>{globalIndex + 1}: </h6>
                                            <p className='flex-1'>{module.title}</p>
                                        </div>
                                        {mi !== chapter.modules.length - 1 && <Separator className="my-4 bg-black/50" />}
                                    </div>
                                );
                            })}
                            {ci !== course.chapters.length - 1 && <Separator className="my-8 bg-black/70" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
