import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'
import appCss from '../styles.css?url'
import { getThemeServerFn } from '@/lib/theme'
import "@fontsource/irish-grover";
import TopLoader from '@/components/topLoader'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Course Architect',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  ssr : true,
  loader: () => getThemeServerFn(),
  notFoundComponent: () => {
    return (
      <div className="bg-bg1 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="underline mt-4">Go Home</Link>
      </div>
    )
  },
  shellComponent: RootDocument,
  
})


function setCurrentURL() {
    const currentURL = new URL(window.location.href)
    if (!currentURL.href.includes('/app/auth')){
        localStorage.setItem('currentURL', currentURL.href)
    }
}


function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = Route.useLoaderData()
  useEffect(() => {
    setCurrentURL()
  })

  return (
    <html className={theme}  lang="en" suppressHydrationWarning>
      <head>
         <meta
            name="viewport"
            content="initial-scale=1, viewport-fit=cover, width=device-width"
        />
        <meta
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content="oklch(1 0 0)"
        />
        <meta
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content="oklch(0.145 0 0)"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
        <HeadContent />
      </head>
      <body suppressHydrationWarning >
            <TopLoader color={"var(--primary)"} showSpinner={false} />
            {children}
            <Toaster position="top-center"/>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}


