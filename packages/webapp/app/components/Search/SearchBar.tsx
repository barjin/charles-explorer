import { useCallback, useEffect, useRef, useState } from "react";
import { getSearchUrl } from "~/utils/backend";
import { Link, useParams, useNavigate, useLocation, useFetcher } from "@remix-run/react";
import { BiSearch } from "react-icons/bi";
import { RxCounterClockwiseClock } from "react-icons/rx";
import { type entityTypes } from "~/utils/entityTypes";
import { CategoryIcons } from "~/utils/icons";
import { useTranslation } from "react-i18next";
import { useDebounce } from "~/utils/hooks/useDebounce";
import SuggestionItem from "./SuggestionItem";

/**
 * Renders a search bar (input field) with the search history and suggestions.
 */
export function SearchBar() {
    const { search } = useLocation();
    const [searchHistory, setSearchHistory] = useState<{query: string, mode: entityTypes}[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [enterSubmitInput, setEnterSubmitInput] = useState<boolean>(true);
    
    const form = useRef<HTMLFormElement>(null);
    const [focus, setFocus] = useState(false);
    const [query, setQuery] = useState<string>(new URLSearchParams(search).get('query') ?? '');

    const debouncedQuery = useDebounce(query, 500);

    const navigate = useNavigate();
    const searchMode = useParams<{ category: entityTypes }>().category!;

    useEffect(() => {
        const history = localStorage.getItem('searchHistory');
        if(history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    useEffect(() => {
        setQuery(new URLSearchParams(search).get('query') ?? '');
    }, [search]);

    useEffect(() => {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }, [searchHistory]);

    useEffect(() => {
        if(!focus) {
            setActiveIndex(0);
            setEnterSubmitInput(true);
        }
    }, [focus]);

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if(query.length > 0) {
            const historyItem = {query, mode: searchMode};
            setSearchHistory([historyItem, ...searchHistory.filter(x => x.query !== query)].slice(0,3));
            navigate(getSearchUrl(searchMode, query, new URLSearchParams(search)));
            setFocus(false);
        }
    }, [query, searchMode, navigate]);

    const suggester = useFetcher();
    const [currentlySuggested, setCurrentlySuggested] = useState<string>(query);

    useEffect(() => {
        if(debouncedQuery.length > 0) {
            if (suggester.state === "idle" && debouncedQuery !== currentlySuggested) {
                setCurrentlySuggested(debouncedQuery.slice(0, 50));
                suggester.load(`./suggest?query=${debouncedQuery.slice(0, 50)}`);
            }
        }
    }, [debouncedQuery, suggester, currentlySuggested]);

    const suggestionsPanel =  [
        {query, mode: searchMode, icon: BiSearch},
        ...(suggester.data?.slice(0,4).map((x: any) => ({query: x.term, mode: searchMode, icon: CategoryIcons[searchMode]})) ?? []),
        ...searchHistory.map(x => ({query: x.query, mode: x.mode, icon:  RxCounterClockwiseClock}))
    ] as const;

    const { t } = useTranslation();

    return (
    <form 
        ref={form}
        onSubmit={onSubmit}>
        <div className="bg-white p-2 pl-4 rounded-lg rounded-b-none flex flex-row border-b-slate-200 border-b-2">
            <label 
                htmlFor="searchBar" 
                className="sr-only">{t('search.search')}</label>
            <input 
                id="searchBar"
                onFocus={() => setFocus(true)}
                onBlur={() => {
                    setTimeout(() => setFocus(false), 100);
                }}
                type="text" 
                className='w-full border-none outline-none bg-white'
                placeholder={t('search.searchCTA', { query: t(`search.topic`) })}
                title={t('search.searchCTA', { query: t(`search.topic`) })}
                value={query}
                tabIndex={0}
                onChange={(x) => {
                    setQuery(x.target.value);
                    setFocus(true);
                }}
                onKeyDown={(e) => {
                    if(e.key === 'ArrowDown') {
                        e.preventDefault();
                        if(activeIndex < suggestionsPanel.length) {
                            setActiveIndex(activeIndex + 1);
                            setEnterSubmitInput(false);
                        }
                    }
                    if(e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveIndex(activeIndex - 1 > 0 ? activeIndex - 1 : 0);
                        setEnterSubmitInput(false);
                    }
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        if(activeIndex === 0 || enterSubmitInput) {
                            onSubmit(e as any);
                        } else {
                            const historyItem = suggestionsPanel[activeIndex];
                            setQuery(historyItem.query);
                            navigate(getSearchUrl(historyItem.mode, historyItem.query, search));
                            setFocus(false);
                        }
                    }
                    if(e.key === 'Escape') {
                        setFocus(false);
                    }
                }}
            />
            <Link 
                to={getSearchUrl(searchMode, query, search)}
                className="border-l-slate-200 border-l-2 pl-2 cursor-pointer"
                title={t('search.searchFor', { mode: query })}
            >
                <BiSearch size={28} color='gray' title={t('search.searchFor', { mode: t(searchMode, {count: 2}), query })}/>
            </Link>     
        </div>
        <div 
            className={`${focus ? 'flex' : 'hidden'} absolute bg-slate-50 flex-col w-full box-border rounded-md rounded-t-none drop-shadow-lg overflow-hidden z-50`}
        >
            {
                query !== '' &&
                suggestionsPanel.map((x, i) => (
                    <SuggestionItem
                        key={i}
                        activeIndex={activeIndex}
                        i={i}
                        setActiveIndex={setActiveIndex}
                        setEnterSubmitInput={setEnterSubmitInput}
                        x={x}
                    />
                ))
            }
        </div>
    </form>);
}