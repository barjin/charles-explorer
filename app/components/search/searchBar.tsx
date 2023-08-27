import { useCallback, useRef, useState } from "react";
import { getSearchUrl } from "~/utils/backend";
import { Link, useParams, useNavigate, useLocation } from "@remix-run/react";
import { BiSearch } from "react-icons/bi";
import { capitalize } from "~/utils/lang";
import { type entityTypes } from "~/utils/entityTypes";

export function SearchBar() {
    const { search } = useLocation();

    const form = useRef<HTMLFormElement>(null);
    const [focus, setFocus] = useState(false);
    const [ query, setQuery ] = useState<string>(new URLSearchParams(search).get('query') ?? '');

    const navigate = useNavigate();
    const searchMode = useParams<{ category: entityTypes }>().category!;

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if(query.length > 0) {
            navigate(getSearchUrl(searchMode, query));
            setFocus(false);
        }
    }, [query, searchMode, navigate]);

    return (
    <form 
        ref={form}
        onSubmit={onSubmit}>
        <div className="bg-white p-2 pl-4 rounded-lg flex flex-row border-b-slate-200 border-b-2">
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
            />
            <Link 
                to={getSearchUrl(searchMode, query)}
                className="border-l-slate-200 border-l-2 pl-2 cursor-pointer"
                title={`Search for ${query}`}
            >
                <BiSearch size={28} color='gray' title={`Search for ${query}`}/>
            </Link>     
        </div>
        <div className={`${focus ? 'flex' : 'hidden'} absolute px-5 py-2 pt-3 bg-slate-50 flex-col w-full box-border rounded-md drop-shadow-lg`}>
            {
                query !== '' &&
                <Link 
                    className='pb-2 flex flex-row items-center cursor-pointer'
                    to={getSearchUrl(searchMode, query)}
                >
                    <BiSearch size={28} color='rgb(150,150,150)'/>
                    <div className='flex flex-col pl-2'>
                        <span className="text-gray-800">{query}</span>
                        <span className='text-xs text-gray-700'>{capitalize(searchMode!)}</span>
                    </div>
                </Link>
            }
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
            {/* {history.map((x) => (
                <div className='search-history-item' 
                    onClick={() => {
                        setFocus(false);
                        setSearchText(x.query);
                        setSearchMode(x.mode)
                    }}
                    key={x.query}
                >
                    <RxCounterClockwiseClock size={24} color={'rgb(150,150,150)'}/>
                    <div style={{display: 'flex', flexDirection: 'column', marginLeft: '10px'}}>
                    <span>{x.query}</span>
                    <span style={{fontSize: '80%'}}>{x.mode}</span>
                    </div>
                </div>
            ))} */}
        </div>
    </form>);
}