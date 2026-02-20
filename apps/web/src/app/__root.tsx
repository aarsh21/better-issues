import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import appCss from "../index.css?url";
import Providers from "@/components/providers";
import AppError from "@/components/routes/app-error";
import NotFound from "@/components/routes/not-found";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "better-issues" },
      { name: "description", content: "A premium issue tracker for small teams" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
  errorComponent: AppError,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <Providers>
          <Outlet />
          {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
