import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/content/site";
import { NotFound } from "@/components/NotFound";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${SITE.name} | ${SITE.role}` },
      { name: "description", content: SITE.description },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=Jost:wght@300;400;500;600&family=Libre+Caslon+Text:wght@400;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // The home page is the full-screen gallery, so it has no footer.
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isHome && <SiteFooter />}
      <Toaster richColors position="top-center" />
    </div>
  );
}
