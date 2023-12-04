import { redirect } from "@remix-run/node"
import { Outlet, useLocation, useMatches, useSearchParams } from "@remix-run/react"
import { SearchTool, getRandomQuery } from "~/components/Search/SearchTool"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"
import { GlobalLoading } from "~/components/GlobalLoading"


import { useRef, useEffect, useState } from "react"
import { LangProvider } from "~/utils/providers/LangContext"
import { localize } from "~/utils/lang"
import { useTranslation } from 'react-i18next';
import remixi18n from '~/i18next.server';
import Topbar from "~/components/Topbar/Topbar"

import { Visualizer } from "~/components/WordCloud/Visualizer";

/**
 * Redirects the user from the root of the website to a random search query.
 */
export async function loader({ request }: { request: any }) {
  const locale = await remixi18n.getLocale(request);

  return redirect(getSearchUrl('class', getRandomQuery(locale as 'en' | 'cs'), new URL(request.url).searchParams));
}

/**
 * Sets the canonical link for the root of the website.
 */
export function links () {
  return [{
    rel: 'canonical', href: "https://explorer.cuni.cz/",
  }];
}

/**
 * Sets the meta title for the root of the website.
 */
export function meta() {
  return [{
    title: createMetaTitle(),
  }];
}

/**
 * Renders the root of the website.
 */
export default function Index() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [ prevLoc, setPrevLoc ] = useState(pathname);
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const lang = i18n.language as 'cs'|'en';

  useEffect(() => {
    if (prevLoc !== pathname) {
      scrollRef.current?.scrollTo(0, 0);
    }
    setPrevLoc(pathname);
  }, [pathname, setPrevLoc]);

  const matches = useMatches();  
  const context = matches[2]?.id === 'routes/$category/index' ? 'search' : 'entity';

  return (
    <>
    <GlobalLoading />
    <LangProvider lang={lang} localize={(token) => localize(token, { lang })}>
      <div className="grid grid-cols-1 xl:grid-cols-3 h-full">
        <div className="h-full col-span-1 bg-slate-100 box-border flex flex-col xl:h-screen xl:p-4 relative">
            <Topbar />
            <div className="bg-white xl:rounded-md xl:rounded-tr-none box-border flex-1 shadow-lg xl:h-screen overflow-hidden">
              <SearchTool />
                <div 
                  ref={scrollRef} 
                  className="flex justify-start items-start flex-col p-4 xl:h-[89%] xl:overflow-y-auto overflow-x-hidden"
                  tabIndex={-1}
                >
                  <Outlet/>
                </div>
            </div>
        </div>
        <div className="h-full col-span-2 hidden xl:block">
          <Visualizer type={searchParams.get('view') ?? 'cloud'} data={matches[2].data} context={context} />
        </div>
      </div>
    </LangProvider>
    </>
  )
}