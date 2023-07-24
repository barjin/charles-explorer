import { redirect } from "@remix-run/node"
import { Outlet } from "@remix-run/react"
import { SearchTool } from "~/components/search"
import { WordCloud } from "~/components/wordcloud"
import { createMetaTitle } from "~/utils/meta"
import { getSearchUrl } from "~/utils/backend"

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
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 h-full">
      <div className="h-full col-span-1 bg-slate-100 box-border flex flex-col">
        <div className="bg-white xl:rounded-md xl:m-4 box-border flex-1 drop-shadow-md">
          <SearchTool />
          <div className="flex justify-start items-start flex-col p-4 overflow-y-scroll overflow-x-hidden">
            <Outlet/>
          </div>
        </div>
      </div>
      <div className="h-full col-span-2 hidden xl:block">
        <WordCloud />
      </div>
    </div>
  )
}