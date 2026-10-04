import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth";
import { getRequestHeaders } from "@tanstack/react-start-server";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

export const requireUser = createServerFn()
    .inputValidator(z.object({ redirectTo: z.string().optional() }).optional())
    .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!session?.user) {
        throw redirect({ to: "/app/auth/$authView", params: { authView: "login" }, search: { redirectTo: data?.redirectTo } });
    }
    return session.user;
});
