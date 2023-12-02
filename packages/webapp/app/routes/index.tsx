import { redirect } from "@remix-run/node"
import { Outlet, useLocation, useParams, useSearchParams } from "@remix-run/react"
import { SearchTool, getRandomQuery } from "~/components/Search/SearchTool"
import { WordCloud } from "~/components/WordCloud/WordCloud";
import { NetworkView } from "~/components/WordCloud/NetworkView"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"
import { GlobalLoading } from "~/components/GlobalLoading"
import { Tooltip } from "react-tooltip";

import { useRef, useEffect, useState } from "react"
import { LangProvider } from "~/utils/providers/LangContext"
import { localize } from "~/utils/lang"
import { useTranslation } from 'react-i18next';
import remixi18n from '~/i18next.server';
import Topbar from "~/components/Topbar/Topbar"
import { SunburstView } from "~/components/WordCloud/Sunburst";
import { BiNetworkChart } from "react-icons/bi";
import { MdCloudQueue } from "react-icons/md";
import { TbChartArcs, TbChartDonut } from "react-icons/tb";
import { ChordChart } from "~/components/WordCloud/ChordChart";
import { useBeta } from "~/utils/hooks/useBeta";

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

export const viewTypes = [
  { name: 'cloud', icon: MdCloudQueue, component: WordCloud, tooltipLocalizationKey: 'views.wordcloud' },
  { name: 'network', icon: BiNetworkChart, component: NetworkView, tooltipLocalizationKey: 'views.network' },
  { name: 'sunburst', icon: TbChartDonut, component: SunburstView, tooltipLocalizationKey: 'views.sunburst' },
  // { name: 'chord', icon: TbChartArcs, component: ChordChart, tooltipLocalizationKey: 'views.chord' },
] as const;

function ViewmodeSwitch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const { category, id } = useParams();
  const view: (typeof viewTypes)[number]['name'] = searchParams.get('view') as any ?? 'cloud';

  if(category !== 'person' || !id) return null;

  return (
        <div className="absolute top-1/3 -right-4 hidden xl:block z-50">
          {
            viewTypes.map((v, i, a) => (
              <div 
                key={v.name}
                onClick={() => {
                  setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('view', v.name);
                      return next;
                  });
                }}
                data-tooltip-id="mode-switch-tooltip" data-tooltip-content={t(v.tooltipLocalizationKey)}
                className={`w-8 h-9 p-1 ${i == 0 ? 'rounded-tr-md' : ''} ${i === a.length - 1 ? 'rounded-br-md': ''} shadow-md cursor-pointer flex items-center justify-center ${v.name === view ? 'bg-slate-100' : 'bg-white'}`}>
                {typeof v.icon === 'function' ? v.icon({size: 30, color: v.name === view ? '#1F2937' : '#9CA3AF'}) : v.icon}
              </div>
            ))
          }
          <Tooltip id="mode-switch-tooltip" place="right-end"/>
        </div>
  )
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
            {
              useBeta() && (
                <ViewmodeSwitch />
              )
            }
        </div>
        <div className="h-full col-span-2 hidden xl:block">
          { 
            searchParams.get('view') === 'sunburst' ? (
              <SunburstView />
            ) : searchParams.get('view') === 'network' ? (
              <NetworkView />
            ) : 
            // searchParams.get('view') === 'chord' ? (
            //   <ChordChart />
            // ) : 
            (
              <WordCloud />
            ) 
          }
        </div>
      </div>
    </LangProvider>
    </>
  )
}