import { Link, useLocation } from "@remix-run/react";
import { CategoryIcons } from "~/utils/icons";
import { type entityTypes } from "~/utils/entityTypes";
import { getFacultyColor } from "~/utils/colors";
import { capitalize, getLocalizedName } from "~/utils/lang";

export function getSteppedGradientCSS(colors: string[]) {
    return `linear-gradient(135deg, ${[...colors.map((color, i) => `${color} ${i * 100 / (colors.length)}%, ${color} ${(i+1) * 100 / (colors.length)-0.01}%`), `${colors[colors.length - 1]} 100%`].join(', ')})`;
}

export function RelatedItem({items, type}: { items: any, type: entityTypes }) {
    const loading = !items;
    const { search } = useLocation();

    const name = getLocalizedName(items[0]) ?? '';
    const link = `/${type}/${items[0].id}`;
  
    return (
      <Link 
        title={name} 
        to={{pathname: link, search: search }} 
        className="border border-slate-300 shadow rounded-md mb-4 w-full hover:bg-slate-50 hover:cursor-pointer">
        <div className={`${loading ? 'motion-safe:animate-pulse' : ''} flex space-x-4`}>
          <div className="p-1 bg-orange-400 text-white text-xl" style={{background: getSteppedGradientCSS(items[0].faculties.map(x => getFacultyColor(x.id)))}}>
            {CategoryIcons[type]({})}
          </div>
          <div className="flex-1 w-full p-2">
            <div className="h-6 font-medium text-ellipsis whitespace-nowrap overflow-x-hidden w-11/12 overflow-y-hidden">
              {name}
              {
                items.length > 1 ? 
                <span className="text-xs text-slate-400 pb-3" title={
                  'Also includes: ' + items.slice(1).map(x => x.id).join(', ')
                }> +{items.length - 1}</span> : null
              }
              </div>
            <div className="text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
              {items[0].faculties.length > 0 ? 
                items[0].faculties.map(x => getLocalizedName(x)).join(', ') ?? '' :
                `${capitalize(type)} at CUNI`
              }
            </div>
          </div>
        </div>
      </Link>
    )
  }