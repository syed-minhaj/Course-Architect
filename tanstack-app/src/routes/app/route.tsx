import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { getThemeServerFn } from '@/lib/theme'
import { Link } from '@tanstack/react-router'
import { Providers } from '../../components/providers'
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/navbar'

export const Route = createFileRoute('/app')({
    component: RouteComponent,
    loader: () => getThemeServerFn(),
    ssr : true,
    notFoundComponent: () => {
        return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <Link to="/" className="underline mt-4">Go Home</Link>
        </div>
        )
    },
})

function RouteComponent() {
    const theme = Route.useLoaderData()
    const showNavbar = useMatches({
        select: (matches) => 
        !matches.some((match) => (match.staticData as { hideNavbar?: boolean })?.hideNavbar === true),
    })
    return (
        <Providers theme={theme}>
            <div className=" h-screen  flex flex-col w-dvw overflow-x-hidden" >
                {showNavbar && <Navbar />}
                <Outlet  />
                <Toaster position='top-center'/>
            </div>
        </Providers>
    )
}
