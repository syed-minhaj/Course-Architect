import { db } from "@/lib/drizzle"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {z} from "zod";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query"
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/auth";
import {  getRequestHeaders } from "@tanstack/react-start-server";
import { userToPrimaryMissionsPassed} from "db/schema";
import { toast } from "sonner";




const getMession = createServerFn().inputValidator(z.string()).handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders()});
    if (!session) {
        throw redirect({to : "/app/auth/$authView" , params : {authView : "login"}})
    }
    const task = await db.query.primaryMissions.findFirst({
        where : (messions , {eq}) => eq(messions.moduleId , data),
        with : {
            passedUsers : {
                where : (passedUsers , {eq}) => eq(passedUsers.userId , session.user.id),
                columns : {userId : true}
            }
        }
    })
    if (!task) {
        throw redirect({to : "/app/course"})
    };
    if (!session ) {
        return Object.assign(task , {isPassed : false})
    }
    if (task.passedUsers.some((passedUser) => passedUser.userId == session.user.id)) {
        return Object.assign(task , {isPassed : true})
    }
    return Object.assign(task , {isPassed : false})
})



const missionPassed = createServerFn().inputValidator(z.string()).handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders()});
    if (!session) {
        toast.error("Please login to continue")
        return
    }
    await db.insert(userToPrimaryMissionsPassed).values({userId : session.user.id , primaryMissionId : data})
    
})



export const Mission = ({moduleID} : {moduleID : string }) => {
    const m = useSuspenseQuery({
        queryKey: ["mission" , moduleID],
        queryFn: async() => getMession({data : moduleID}),
        gcTime: 1000 * 60 * 60 * 24 * 7,
    })
    const [finished, setFinished] = useState<boolean[]>(() => Array(m.data.rubric.length).fill(false))

    async function submitAnswer(index : number) {
        if (finished[index]) {
            return
        }
        const next = [...finished]
        next[index] = true
        setFinished(next)
        if (next.every((item) => item)) {
            await missionPassed({data : m.data.id})
            m.refetch()
        }
    }

    
    return (
        <>
        {m.data.isPassed && <div className="absolute w-fit top-5 right-5 p-4 py-2 rounded-full bg-amber-400 font-bold ">Passed</div>}
        <div className="w-4/5 gap-6 mx-auto py-16 flex flex-col ">
            <h5 className="font-medium text-xl">{m.data.title}</h5>
            <p className="text-lg text-foreground/85 ">{m.data.instructions}</p>
            <label className="text-lg font-medium">Tasks :</label>
            {m.data.rubric.map((item , index) => (
                <div className="flex items-center space-x-3" key={index}>
                    <Checkbox 
                        checked={finished[index]}
                        onCheckedChange={() => submitAnswer(index)}
                        id={`terms-${index}`}
                    />
                    <Label htmlFor={`terms-${index}`} >
                        {item}
                    </Label>
                </div>
            ))}
        </div>
        </>
    )
}