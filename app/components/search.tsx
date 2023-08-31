import { useParams, Link, useLocation } from '@remix-run/react';
import { type entityTypes } from '~/utils/entityTypes';
import { capitalize } from '~/utils/lang';
import { SearchBar } from './search/searchBar';
import { CategoryIcons } from '~/utils/icons';
import { useLocalize } from '~/providers/LangContext';

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
    const { search } = useLocation();
    const searchMode = useParams<{ category: entityTypes }>().category!;

    const { localize } = useLocalize();

    return (
        <div className='w-full pb-4 bg-slate-50 drop-shadow-md rounded-md'>
            <div className='relative'>
                <SearchBar/>
            </div>
            <div className="flex flex-row w-full justify-around pt-3 bg-slate-50 divide-x-2">
                {
                    Object.entries(
                        CategoryIcons
                    ).map(([mode, icon]) => (
                        <Link 
                            to={{ pathname: `/${mode}`, search: search.toString() }}
                            key={mode} 
                            title={`Search for a ${mode}`}
                            role='button'
                            aria-label={`Search for a ${mode}`}
                            className='flex flex-1 flex-col items-center'
                        >
                            {icon({
                                className: `${searchMode === mode ? 'text-orange-400' : 'text-slate-400'} pb-1`,
                                size: 25,
                                cursor: 'pointer',
                                ariaHidden: true,
                            } as any)}
                            <span 
                                className='inline text-xs'
                                aria-hidden={true}
                            >
                                {capitalize(localize(mode))}
                            </span>
                        </Link>
                    ))
                }
            </div>
        </div>
    );
}