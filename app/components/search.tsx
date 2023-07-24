import { useParams, useSearchParams, Link } from '@remix-run/react';
import { useCallback, useEffect, useState } from 'react';
import { getSearchUrl } from '~/utils/backend';
import { type entityTypes } from '~/utils/entityTypes';
import { capitalize } from '~/utils/lang';
import { SearchBar } from './search/searchBar';
import { CategoryIcons } from '~/utils/icons';

// todo - random queries
// function getRandomQuery(language: 'cs'|'en') {
//     const queries = language === 'en' ? [
//         'Machine learning',
//         'Japan',
//         'Archeology',
//         '3D rendering',
//         'Video games',
//         'Oceans',
//         'Dentistry',
//         'Greenhouse gases',
//         'Architecture'
//     ] : [
//         'Strojové učení',
//         'Japonsko',
//         'Python',
//         'Mongolština',
//         'Onkologie',
//         'Oceány',
//         'Dinosauři',
//         'Skandinávie',
//     ];

//     return queries[Math.floor((+new Date())/5000) % queries.length];
// }

export function SearchTool() {
    const [searchParams] = useSearchParams();
    const getQuery = useCallback(() => {
        return searchParams.get('query') ?? '';
    }, [searchParams]);

    const [searchText, setSearchText] = useState(getQuery());
    const searchMode = useParams<{ category: entityTypes }>().category!;

    useEffect(() => {
        setSearchText(getQuery());
    }, [searchMode, getQuery]);

    return (
        <div className='w-full pb-4 bg-slate-50 drop-shadow-md rounded-md'>
            <div className='relative'>
                <SearchBar query={searchText} setQuery={setSearchText} />
            </div>
            <div className="flex flex-row w-full justify-around pt-3 bg-slate-50 divide-x-2">
                {
                    Object.entries(
                        CategoryIcons
                    ).map(([mode, icon]) => (
                        <Link 
                            to={getSearchUrl(mode as any, searchText)}
                            key={mode} 
                            className='flex flex-1 flex-col items-center'
                        >
                            {icon({
                                className: `${searchMode === mode ? 'text-orange-400' : 'text-slate-400'} pb-1`,
                                size: 25,
                                cursor: 'pointer',
                            } as any)}
                            <span className='inline text-xs'>
                                {capitalize(mode)}
                            </span>
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}