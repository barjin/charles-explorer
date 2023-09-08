import { type LinksFunction, type HandleErrorFunction, json } from "@remix-run/node";
import styles from './styles/app.css';

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { useChangeLanguage } from "~/utils/useChangeLanguage";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: styles }]
};

export const loader = async ({ request }) => {
  const locale = await i18next.getLocale(request);
  return json({ locale });
}

export const ErrorBoundary: HandleErrorFunction = (error) => {
  const { t } = useTranslation();

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
            <h1 className="text-2xl font-bold mb-4 border-b-2 border-b-slate-300 pb-2">{t('ohno')}</h1>
            <p>
              {t('ohnoDescription')}
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
  const { locale } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
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
