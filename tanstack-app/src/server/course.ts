
import { createServerFn } from "@tanstack/react-start";
import { geminiGenerator } from "@/lib/gemini";
import { db } from "@/lib/drizzle";
import { courses , chapters , modules , externalResources , primaryMissions , quickQuizzes } from "db/schema";
import {z} from "zod"
import { auth } from "@/lib/auth";
import { getRequestHeaders } from "@tanstack/react-start-server";
import { eq, count } from "drizzle-orm";


const courseInputSchema = z.object({
    topic: z.string(),
    userContext: z.string(),
    depthLevel: z.string(),
    access: z.enum(["public" , "private"]).default("public"),
})

const userAllowedToCreateCourse = async(userID : string) => {
    const result = await db.select({ value: count() }).from(courses).where(eq(courses.createrId, userID)).execute();
    return result[0].value < 2;
}

export const generateCourse = createServerFn({method: 'POST'})
    .inputValidator(courseInputSchema)
    .handler(async ({data}) => {
        try {
            const { topic, userContext, depthLevel } = await data;
            const session = await auth.api.getSession({ headers: getRequestHeaders()});
            if (!session || !session.user) {
                return {error : "Not logged in" , course: null};
            }
            const AdminID = process.env.ADMIN_ID;
            if (session.user.id !== AdminID && !(await userAllowedToCreateCourse(session.user.id))) {
                return {error : "Not allowed to create course (max 2 courses per user)" , course: null};
            }

            const {success , course } = await geminiGenerator({course : {topic, userContext, depthLevel}})
            if (!success) return {error : "Failed to generate course" , course: null};
                let courseID: string | null = null;
                let created: { id: string; title: string };
                try {
                const courseCreated = await db.insert(courses).values({courseTitle: course.course_title, introSummary: course.intro_summary , createrId : session.user.id , access : data.access}).returning({id : courses.id , title : courses.courseTitle});
                if (!courseCreated.length) throw new Error("Failed to create course");
                courseID = courseCreated[0].id;
                for (let chapterIdx = 0; chapterIdx < course.chapters.length; chapterIdx++) {
                    const chapterData = course.chapters[chapterIdx];
                    const chapterCreated = await db.insert(chapters).values({courseId: courseID, title: chapterData.title, order: chapterIdx}).returning({id: chapters.id});
                    if (!chapterCreated.length) throw new Error("Failed to create chapter");
                    const chapterID = chapterCreated[0].id;
                    for (const module of chapterData.modules) {
                        const moduleCreated = await db.insert(modules).values({courseId : courseID, chapterId: chapterID, title : module.title, conceptualDeepDive : module.conceptual_deep_dive}).returning({id : modules.id});
                        if (!moduleCreated.length) throw new Error("Failed to create module");
                        const moduleID = moduleCreated[0].id;
                        for (const resource of module.external_resources) {
                            await db.insert(externalResources).values({moduleId : moduleID, type : resource.type, title : resource.title, url : resource.url});
                        }
                        await db.insert(primaryMissions).values({moduleId : moduleID, title : module.assessment.primary_mission.title, instructions : module.assessment.primary_mission.instructions, rubric : module.assessment.primary_mission.rubric});
                        for (const quiz of module.assessment.quick_quiz) {
                            await db.insert(quickQuizzes).values({moduleId : moduleID, question : quiz.question, options : quiz.options, answer : quiz.answer});
                        }
                    }
                }
                created = { id: courseCreated[0].id, title: courseCreated[0].title };
                } catch (insertError) {
                    if (courseID) {
                        await db.delete(courses).where(eq(courses.id, courseID));
                    }
                    throw insertError;
                }
                console.log("success")
                return {error : null , course: created};

        }catch(e ){
            console.error(e)
            if (e instanceof Error) return {error : e.message , course: null}
            else return {error : "Unknown error" , course: null}
        }
});

