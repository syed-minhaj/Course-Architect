import { db } from '@/lib/drizzle'
import { createFileRoute } from '@tanstack/react-router'
import { courses, chapters, modules } from 'db/schema'
import { userToCourseTaken } from 'db/auth-schema'
import CoursePreview, { CourseSkeleton } from '../course/components/-coursePreview'
import { count, countDistinct, eq , and , ilike, sql , desc} from 'drizzle-orm'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { useEffect, useRef } from 'react'
import {useInfiniteQuery} from "@tanstack/react-query"
import z from 'zod'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start-server'
import { useHash } from '@/hooks/hash'
import useDebounce from '@/hooks/debounce'
import Search from '@/components/search'
import { requireUser } from '@/server/requireUser'

export type course = {
    id : string;
    courseTitle : string;
    introSummary : string;
    no_of_modules : number;
    no_of_chapters : number;
}

const COURSES_PER_PAGE = 10;
const Taps = ['Inroaled' , 'Created'] as const

const authMiddleware = createMiddleware().server(async ({ next }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user) {
        console.log("redirecting")
        throw new Error('UNAUTHORIZED')
    }
    return next({ context: { user: session.user } });
})

const getCoursesCreated = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({pageParam : z.number().optional() , search : z.string().optional()}))
    .handler(
    async ({ data , context }) => {
        const user = context.user
        return await db
            .select({
                id: courses.id,
                courseTitle: courses.courseTitle,
                introSummary: courses.introSummary,
                no_of_modules: count(modules.id),
                no_of_chapters: countDistinct(chapters.id),
            })
            .from(courses)
            .where(and(
                eq(courses.createrId , user.id),
                data.search
                    ? sql`(
                        setweight(to_tsvector('english', ${courses.courseTitle}), 'A') ||
                        setweight(to_tsvector('english', ${courses.introSummary}), 'B')
                    ) @@ websearch_to_tsquery('english', ${data.search})`: undefined
            ))
            .orderBy(desc(sql`ts_rank(
                setweight(to_tsvector('english', ${courses.courseTitle}), 'A') ||
                setweight(to_tsvector('english', ${courses.introSummary}), 'B'),
                websearch_to_tsquery('english', ${data.search})
            )`))
            .leftJoin(chapters, eq(courses.id, chapters.courseId))
            .leftJoin(modules, eq(courses.id, modules.courseId))
            .groupBy(courses.id).limit(COURSES_PER_PAGE).offset(data.pageParam ?? 0)
    }
    )


const getCoursesTaken = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({pageParam : z.number().optional() , search : z.string().optional()}))
    .handler(
    async ({ data , context }) => {
        const user = context.user
        return await db
            .select({
                id: courses.id,
                courseTitle: courses.courseTitle,
                introSummary: courses.introSummary,
                no_of_modules: count(modules.id),
                no_of_chapters: countDistinct(chapters.id),
            })
            .from(courses)
            .innerJoin(userToCourseTaken, eq(courses.id, userToCourseTaken.courseId))
            .where(and(
                eq(userToCourseTaken.userId , user.id), 
                data.search
                    ? sql`(
                            setweight(to_tsvector('english', ${courses.courseTitle}), 'A') ||
                            setweight(to_tsvector('english', ${courses.introSummary}), 'B')
                        ) @@ websearch_to_tsquery('english', ${data.search})`: undefined
            ))
            .orderBy(desc(sql`ts_rank(
                setweight(to_tsvector('english', ${courses.courseTitle}), 'A') ||
                setweight(to_tsvector('english', ${courses.introSummary}), 'B'),
                websearch_to_tsquery('english', ${data.search})
            )`))
            .leftJoin(chapters, eq(courses.id, chapters.courseId))
            .leftJoin(modules, eq(courses.id, modules.courseId))
            .groupBy(courses.id).limit(COURSES_PER_PAGE).offset(data.pageParam ?? 0)
    }
    )

function CourseSection({tap , search} : {tap : typeof Taps[number] , search : string}) {
    let func = tap == "Inroaled" ? getCoursesTaken : getCoursesCreated
    const loadMoreRef = useRef<HTMLDivElement | null>(null)
    const {data, fetchNextPage , hasNextPage , isFetching} = useInfiniteQuery({
        queryKey: [tap , search],
        initialPageParam: 0,
        queryFn: ({ pageParam }) => func({ data : {pageParam , search} }),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < COURSES_PER_PAGE) return undefined
            return allPages.length * COURSES_PER_PAGE
        },
    })

    useEffect(() => {
        if (!hasNextPage) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                fetchNextPage()
                }
            },
            { threshold: 1 }
        )
        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }
        return () => observer.disconnect()
    }, [fetchNextPage, hasNextPage])

    return (
        <div className="w-11/12 mx-auto flex flex-col gap-4 py-8">
            {data?.pages.map((page) =>
                page.map((course: course) => (
                    <CoursePreview key={course.id} course={course} />
                ))
            )}

            {isFetching && <CourseSkeleton />}
            <div ref={loadMoreRef} />
        </div>
    )
}

export const Route = createFileRoute('/app/catalog/')({
    component: RouteComponent,
    beforeLoad: () => requireUser({ data: { redirectTo: '/app/catalog' } }),
    validateSearch: z.object({
        search: z.string().optional(),
    }),
})

function RouteComponent() {

    const {hash , updateHash} = useHash<typeof Taps[number]>("Inroaled" , Taps)
    const navigate = Route.useNavigate()
    const {search} = Route.useSearch()
    const debouncedSearch = useDebounce(search ?? "" , 500)

    function handleSearchChange(value: string) {
        navigate({
            search: (prev) => ({
                ...prev,
                search: value || undefined, 
            }),
        })
    }
    function deleteSeacrh() {
        navigate({
            search: undefined,
        })
    }
    useEffect(() => {
        window.scrollTo({ top: 0 })
    }, [debouncedSearch])

    return (
        <div className='bg-bg1 flex-1  overflow-auto'>
            <h2 className='font-irish-grover text-4xl mx-auto py-34 text-center bg-[url(/bgImageCoursePage.webp)] bg-cover bg-center
             border-b-amber-400 border-b-4  ' >
                Your Course Catalog
            </h2>
            <div className='flex flex-row justify-center mx-auto mt-8 border-2 border-gray-700 w-fit'>
                {Taps.map((tap) =>
                    <button onClick={() => updateHash(tap)} disabled={hash == tap} key={tap}
                        className={`h-15 w-40 sm:w-50 sm:text-lg ${hash == tap ? "inset-shadow-sm inset-shadow-black/50" : "bg-primary shadow-md shadow-black/50"} font-bold`}>
                        {tap}
                    </button>
                )}
            </div>
            <div className='pt-8 w-11/12 mx-auto'>
                <Search search={search} handleSearchChange={handleSearchChange} deleteSeacrh={deleteSeacrh} />
            </div>
            <CourseSection tap={hash} search={debouncedSearch} />
        </div>
    )
}
