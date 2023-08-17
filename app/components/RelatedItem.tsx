import { Link } from "@remix-run/react";
import { CategoryIcons } from "~/utils/icons";
import { type entityTypes } from "~/utils/entityTypes";
import { getFacultyColor } from "~/utils/colors";
import { getLocalizedName } from "~/utils/lang";

export function RelatedItem({item, type}: { item: any, type: entityTypes }) {
    const loading = !item;

    const name = getLocalizedName(item) ?? '';
    const link = `/${type}/${item.id}`;
  
    return (
      <Link title={name} to={link} className="border border-slate-300 shadow rounded-md mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
        <div className={`${loading ? 'motion-safe:animate-pulse' : ''} flex space-x-4`}>
          <div className="p-1 bg-orange-400 text-white text-xl" style={{backgroundColor: getFacultyColor(item.faculties[0].id)}}>
            {CategoryIcons[type]({})}
          </div>
          <div className="flex-1 w-full p-2">
            <div className="h-6 font-medium text-ellipsis whitespace-nowrap overflow-x-hidden w-11/12">{name}</div>
            <div className="text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">{getLocalizedName(item.faculties?.[0]) ?? ''}</div>
          </div>
        </div>
      </Link>
    )
  }