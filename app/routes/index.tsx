import { redirect } from "@remix-run/node"
import { Outlet, useLocation } from "@remix-run/react"
import { SearchTool } from "~/components/search"
import { WordCloud } from "~/components/wordcloud"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"
import { GlobalLoading } from "~/components/GlobalLoading"

import { useRef, useEffect, useState } from "react"

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
  const location = useLocation();

  const [ prevLoc, setPrevLoc ] = useState(location.pathname);

  useEffect(() => {
    if (prevLoc !== location.pathname) {
      scrollRef.current?.scrollTo(0, 0);
    }
    setPrevLoc(location.pathname);
  }, [location, setPrevLoc]);

  return (
    <>
    <GlobalLoading />
    <div className="grid grid-cols-1 xl:grid-cols-3 h-full">
      <div className="h-full col-span-1 bg-slate-100 box-border flex flex-col xl:h-screen">
          <div className="bg-white xl:rounded-md xl:m-4 box-border flex-1 drop-shadow-md xl:h-screen overflow-hidden">
            <SearchTool />
              <div ref={scrollRef} className="flex justify-start items-start flex-col p-4 xl:h-[89%] xl:overflow-y-auto">
                <Outlet/>
              </div>
            </div>
          </div>
      <div className="h-full col-span-2 hidden xl:block">
        <WordCloud />
      </div>
    </div>
    </>
  )
}