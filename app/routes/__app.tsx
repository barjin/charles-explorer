import { Outlet } from "@remix-run/react"
import { WordCloud } from "~/components/wordcloud"

export default function Index() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3">
      <div className="h-full col-span-1 bg-slate-50">
        <Outlet/>
      </div>
      <div className="h-full col-span-2 invisible md:visible">
        <WordCloud />
      </div>
    </div>
  )
}