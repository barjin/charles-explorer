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

import { useChangeLanguage } from "~/utils/hooks/useChangeLanguage";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

import logo from '~/assets/logo.svg';

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

      <body className="w-screen h-screen overflow-hidden">
        <div className="w-full h-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 gap-4 text-slate-800">
          <div className="xl:col-start-2 xl:col-end-3 row-start-2 row-end-3 text-center px-4">
            <img src={logo} />
            <p className="mt-3">
              {t('ohnoDescription')}
            </p>
            <p className="mt-3 border-t border-t-slate-400 pt-3">
              {t('takingTooLong')}
              </p><p>
              {t('contactUsAt')}&nbsp;
              <a className="font-semibold" href="mailto:explorer@jindrich.bar">explorer@jindrich.bar</a>
            </p>
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W8ERPYSLFH"></script>
        <script dangerouslySetInnerHTML={{ __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-W8ERPYSLFH');`}} />
      </head>
      <body className="h-screen bg-slate-100 overflow-hidden">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
