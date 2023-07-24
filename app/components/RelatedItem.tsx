import { Link } from "@remix-run/react";
import { CategoryIcons } from "~/utils/icons";
import { type entityTypes } from "~/utils/entityTypes";

export function RelatedItem(input: { name: string, description: string, link: string, type: entityTypes }) {
    const loading = !input;
  
    const { name, link, type } = input;
  
    return (
      <Link title={name} to={link} className="border border-slate-300 shadow rounded-md mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
        <div className={`${loading ? 'motion-safe:animate-pulse' : ''} flex space-x-4`}>
          <div className="p-1 bg-orange-400 text-white text-xl">
            {CategoryIcons[type]({})}
          </div>
          <div className="flex-1 w-full p-2">
            <div className="h-6 font-medium text-ellipsis whitespace-nowrap overflow-x-hidden w-11/12">{name}</div>
            <div className="text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">{input.description}</div>
          </div>
        </div>
      </Link>
    )
  }