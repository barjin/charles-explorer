import { redirect } from "@remix-run/node"
import { Link, Outlet, useLocation } from "@remix-run/react"
import { SearchTool, getRandomQuery } from "~/components/search"
import { WordCloud } from "~/components/WordCloud/WordCloud"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"
import { GlobalLoading } from "~/components/GlobalLoading"

import { useRef, useEffect, useState } from "react"
import { LangProvider } from "~/providers/LangContext"
import { localize } from "~/utils/lang"
import { useTranslation } from 'react-i18next';
import remixi18n from '~/i18next.server';

import Twemoji from 'react-twemoji';
import { Modal } from "~/components/Modal/Modal"

export async function loader({ request }: { request: any }) {
  const locale = await remixi18n.getLocale(request);

  return redirect(getSearchUrl('class', getRandomQuery(locale as 'en' | 'cs')));
}

export function meta() {
  return [{
    title: createMetaTitle(),
  }];
}

export default function Index() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();
  const [ prevLoc, setPrevLoc ] = useState(pathname);
  const { i18n } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const lang = i18n.language as 'cs'|'en';

  useEffect(() => {
    if (prevLoc !== pathname) {
      scrollRef.current?.scrollTo(0, 0);
    }
    setPrevLoc(pathname);
  }, [pathname, setPrevLoc]);

  const queryParams = new URLSearchParams(search);

  return (
    <>
    <GlobalLoading />
    <LangProvider lang={lang} localize={(token) => localize(token, { lang })}>
      <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}  />
      <div className="grid grid-cols-1 xl:grid-cols-3 h-full">
        <div className="h-full col-span-1 bg-slate-100 box-border flex flex-col xl:h-screen xl:p-4">
            <div className="flex-row items-center justify-between flex">
              <span></span>
              <div className="flex flex-row items-center space-x-1">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500 p-2" 
                  >
                  {
                    <Twemoji options={{ className: 'twemoji' }}>
                      ℹ️
                    </Twemoji>
                  }
                </button>
                <Link
                  to={{ search: (() => {
                    queryParams.set('lang', lang === "cs" ? "en" : "cs");
                    return queryParams.toString();
                  })() }}
                  className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500 p-2" 
                  >
                  {
                    <Twemoji options={{ className: 'twemoji' }}>
                      { lang === "cs" ? '🇨🇿' : '🇬🇧' }
                    </Twemoji>
                  }
                </Link>
              </div>
            </div>
            <div className="bg-white xl:rounded-md xl:rounded-tr-none box-border flex-1 drop-shadow-md xl:h-screen overflow-hidden">
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
          <WordCloud />
        </div>
      </div>
    </LangProvider>
    </>
  )
}