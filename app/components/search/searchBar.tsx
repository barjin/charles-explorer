import { useCallback, useEffect, useRef, useState } from "react";
import { getSearchUrl } from "~/utils/backend";
import { Link, useParams, useNavigate, useLocation } from "@remix-run/react";
import { BiSearch } from "react-icons/bi";
import { RxCounterClockwiseClock } from "react-icons/rx";
import { capitalize } from "~/utils/lang";
import { type entityTypes } from "~/utils/entityTypes";

export function SearchBar() {
    const { search } = useLocation();
    const [searchHistory, setSearchHistory] = useState<{query: string, mode: entityTypes}[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [enterSubmitInput, setEnterSubmitInput] = useState<boolean>(true);
    
    const form = useRef<HTMLFormElement>(null);
    const [focus, setFocus] = useState(false);
    const [ query, setQuery ] = useState<string>(new URLSearchParams(search).get('query') ?? '');

    const navigate = useNavigate();
    const searchMode = useParams<{ category: entityTypes }>().category!;

    useEffect(() => {
        const history = localStorage.getItem('searchHistory');
        if(history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

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
            navigate(getSearchUrl(searchMode, query));
            setFocus(false);
        }
    }, [query, searchMode, navigate]);

    return (
    <form 
        ref={form}
        onSubmit={onSubmit}>
        <div className="bg-white p-2 pl-4 rounded-lg rounded-b-none flex flex-row border-b-slate-200 border-b-2">
            <label 
                htmlFor="searchBar" 
                className="sr-only">Search</label>
            <input 
                id="searchBar"
                onFocus={() => setFocus(true)}
                onBlur={() => {
                    setTimeout(() => setFocus(false), 100);
                }}
                type="text" 
                className='w-full border-none outline-none bg-white'
                placeholder="Search for a topic" 
                title="Search for a topic"
                defaultValue="Default"
                value={query}
                tabIndex={0}
                onChange={(x) => {
                    setQuery(x.target.value);
                    setFocus(true);
                }}
                onKeyDown={(e) => {
                    if(e.key === 'ArrowDown') {
                        e.preventDefault();
                        if(activeIndex < searchHistory.length) {
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
                            const historyItem = searchHistory[activeIndex - 1];
                            setQuery(historyItem.query);
                            navigate(getSearchUrl(historyItem.mode, historyItem.query));
                            setFocus(false);
                        }
                    }
                    if(e.key === 'Escape') {
                        setFocus(false);
                    }
                }}
            />
            <Link 
                to={getSearchUrl(searchMode, query)}
                className="border-l-slate-200 border-l-2 pl-2 cursor-pointer"
                title={`Search for ${query}`}
            >
                <BiSearch size={28} color='gray' title={`Search for ${query}`}/>
            </Link>     
        </div>
        <div 
            className={`${focus ? 'flex' : 'hidden'} absolute bg-slate-50 flex-col w-full box-border rounded-md rounded-t-none drop-shadow-lg overflow-hidden`}
        >
            {
                query !== '' &&
                <Link 
                    className={`px-3 py-3 flex flex-row items-center cursor-pointer ${activeIndex === 0 ? 'bg-slate-200': ''}`}
                    to={getSearchUrl(searchMode, query)}
                    onMouseOver={() => {
                        setActiveIndex(0);
                        setEnterSubmitInput(true);
                    }}
                >
                    <BiSearch size={28} color='rgb(150,150,150)'/>
                    <div className='flex flex-col pl-2'>
                        <span className="text-gray-800">{query}</span>
                        <span className='text-xs text-gray-700'>{capitalize(searchMode!)}</span>
                    </div>
                </Link>
            }
            { searchHistory.map((x, i) => (
                <Link 
                    key={i+1}
                    className={`px-3 py-3 flex flex-row items-center cursor-pointer ${activeIndex === i + 1 ? 'bg-slate-200': ''}`}
                    onMouseOver={() => {
                        setActiveIndex(i + 1);
                        setEnterSubmitInput(true);
                    }}
                    to={getSearchUrl(x.mode, x.query)}
                    onClick={() => {
                        setFocus(false);
                        setQuery(x.query);
                    }}
                >
                    <RxCounterClockwiseClock size={28} color={'rgb(150,150,150)'}/>
                    <div className='flex flex-col pl-2'>
                        <span className="text-gray-800">{x.query}</span>
                        <span className='text-xs text-gray-700'>{capitalize(x.mode!)}</span>
                    </div>
                </Link>
            ))}
            {/* {
                suggestions.map((x) => (
                    <div className='search-history-item'
                        onClick={() => {
                            setFocus(false);
                            setSearchText(x);
                            setSearchMode('class');
                            // runSearch({query: x, mode: 'class'});
                        }}
                        key={x}
                    >
                        {}
                        <div style={{display: 'flex', flexDirection: 'column', marginLeft: '10px'}}>
                        <span>{x}</span>
                        <span style={{fontSize: '80%'}}>{}</span>
                        </div>
                    </div>
                ))
            } */}
        </div>
    </form>);
}