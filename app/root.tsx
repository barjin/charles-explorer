import type { LinksFunction, HandleErrorFunction } from "@remix-run/node";
import styles from './styles/app.css';

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
};

export const ErrorBoundary: HandleErrorFunction = (error) => {
  console.log(error);

  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <Meta />
        <Links />
      </head>

      <body className="w-screen h-screen">
        <div className="w-full h-full grid grid-cols-1 xl:grid-cols-3 gap-4 text-slate-800">
          <div className="xl:col-start-2 xl:col-end-3 rounded-md bg-slate-100 p-4 drop-shadow-md m-5">
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-b-slate-300 pb-2">Oh no!</h1>
            <p>
              Charles Explorer seems to be down. Please try again later.
            </p>
            <pre
              className="text-xs font-mono text-white bg-slate-500 mt-4 py-4 rounded-md px-4 overflow-auto"
            >{JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen bg-slate-100">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
