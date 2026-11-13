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
import { MiniPlayer } from "@/components/MiniPlayer";
import { PlayerProvider } from "@/lib/player";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // viewport-fit=cover: added to the home screen, the page runs under the notch (SiteNav keeps clear of it)
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#fcfbfe" },
      // opens as its own app once added to the home screen (public/manifest.webmanifest)
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: SITE.name },
      { title: `${SITE.name} | ${SITE.role}` },
      { name: "description", content: SITE.description },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app/apple-touch-icon.png" },
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
  const path = useRouterState({ select: (s) => s.location.pathname });
  // The landing (/), the gallery (/gallery) and the About page's sky (/about) fill the screen: no footer
  const isHome = path === "/" || path === "/gallery" || path === "/about" || path === "/about/";
  // PlayerProvider and MiniPlayer: a film keeps playing, in the corner, across pages
  return (
    <PlayerProvider>
      <div className="flex min-h-screen flex-col">
        <SiteNav />
        <main className="flex-1">
          {/* each page fades in as you arrive, as an app's screens do */}
          <div key={path} className="duration-300 animate-in fade-in">
            <Outlet />
          </div>
        </main>
        {!isHome && <SiteFooter />}
        <Toaster richColors position="top-center" />
      </div>
      <MiniPlayer />
    </PlayerProvider>
  );
}
