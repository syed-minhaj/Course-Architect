import { cn } from "@/lib/utils"
import { AuthView } from "@daveyplate/better-auth-ui"
import { createFileRoute } from "@tanstack/react-router"
import z from "zod"


export const Route = createFileRoute("/app/auth/$authView")({
    component: RouteComponent,
    validateSearch: z.object({
        redirectTo: z.string().optional(),
    }),
    staticData: {
        hideNavbar: true 
    },
})

function RouteComponent() {
    const { authView } = Route.useParams()
    const { redirectTo: searchRedirectTo } = Route.useSearch()

    const redirectTo = searchRedirectTo ?? localStorage.getItem('currentURL') ?? "/app/course"

    return (
        <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
            <AuthView pathname={authView} redirectTo={redirectTo} />

            <p className={cn(["callback", "sign-out"].includes(authView) && "hidden", "text-muted-foreground text-xs")}>
                Powered by{" "}
                <a className="text-warning underline" href="https://better-auth.com" target="_blank" rel="noreferrer">
                    better-auth.
                </a>
            </p>
        </main>
    )
}