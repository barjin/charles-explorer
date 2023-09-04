import { redirect } from "@remix-run/node"
import { Outlet, useLocation } from "@remix-run/react"
import { SearchTool } from "~/components/search"
import { WordCloud } from "~/components/WordCloud/WordCloud"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"
import { GlobalLoading } from "~/components/GlobalLoading"

import { useRef, useEffect, useState } from "react"
import { type SearchResultsContextType, SearchResultsProvider } from "~/providers/SearchResultsContext"
import { LangProvider } from "~/providers/LangContext"
import { localize } from "~/utils/lang"
import { useTranslation } from 'react-i18next';
import i18next from "i18next";


export function loader() {
  // TODO - generate redirect randomly
  return redirect(getSearchUrl('person', 'Machine Learning'));
}

export function meta() {
  return [{
    title: createMetaTitle(),
  }];
}

export default function Index() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [ prevLoc, setPrevLoc ] = useState(pathname);
  const { i18n } = useTranslation();
  const lang = i18next.language as 'cs'|'en';

  useEffect(() => {
    if (prevLoc !== pathname) {
      scrollRef.current?.scrollTo(0, 0);
    }
    setPrevLoc(pathname);
  }, [pathname, setPrevLoc]);

  const [searchResults, setSearchResults] = useState<Omit<SearchResultsContextType, 'setContext'>>({
    searchResults: [],
    query: "",
    keywords: {},
    category: "person",
  });

  return (
    <>
    <GlobalLoading />
    <SearchResultsProvider
      searchResults={searchResults.searchResults}
      query={searchResults.query}
      keywords={searchResults.keywords}
      category={searchResults.category}
      setContext={setSearchResults}
    >
    <LangProvider lang={lang} localize={(token) => localize(token, { lang })}>
      <div className="grid grid-cols-1 xl:grid-cols-3 h-full">
        <div className="h-full col-span-1 bg-slate-100 box-border flex flex-col xl:h-screen xl:p-4">
            <div className="flex-row items-center justify-between hidden xl:flex">
              <span></span>
              <div className="flex flex-row items-center space-x-2">
                <button 
                  className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500" 
                  onClick={() => i18n.changeLanguage(lang === "cs" ? "en" : "cs")}
                >
                  {lang === "cs" ? "🇨🇿" : "🇬🇧"}
                </button>
              </div>
            </div>
            <div className="bg-white xl:rounded-md xl:rounded-tr-none box-border flex-1 drop-shadow-md xl:h-screen overflow-hidden">
              <SearchTool />
                <div ref={scrollRef} className="flex justify-start items-start flex-col p-4 xl:h-[89%] xl:overflow-y-auto overflow-x-hidden">
                  <Outlet/>
                </div>
              </div>
            </div>
        <div className="h-full col-span-2 hidden xl:block">
          <WordCloud />
        </div>
      </div>
    </LangProvider>
    </SearchResultsProvider>
    </>
  )
}