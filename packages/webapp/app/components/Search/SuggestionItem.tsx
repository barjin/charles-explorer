import { useLocalize } from "~/utils/providers/LangContext";
import { capitalize } from "~/utils/lang";
import { getSearchUrl } from "~/utils/backend";
import { Link, useLocation } from "@remix-run/react";

/**
 * Renders a suggestion / history item in the dropdown menu of the search bar
 */
export default function SuggestionItem({x, i, activeIndex, setActiveIndex, setEnterSubmitInput}: {x: any, i: number, activeIndex: number, setActiveIndex: (i: number) => void, setEnterSubmitInput: (b: boolean) => void}) {
    const { localize } = useLocalize();
    const { search } = useLocation();
    
    return (
        <Link 
            className={`w-full px-3 py-3 flex flex-row items-center cursor-pointer ${activeIndex === i ? 'bg-slate-200': ''}`}
            to={getSearchUrl(x.mode, x.query, search)}
            onMouseOver={() => {
                setActiveIndex(i);
                setEnterSubmitInput(true);
            }}
        >
            <x.icon size={28} color={'rgb(150,150,150)'}/>
            <div className='flex flex-col pl-2 w-11/12'>
                <span className="text-gray-800 truncate">{x.query}</span>
                <span className='text-xs text-gray-700'>{capitalize(localize(x.mode))}</span>
            </div>
        </Link>
    )
}