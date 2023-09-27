import { useParams, Link, useLocation } from '@remix-run/react';
import { type entityTypes } from '~/utils/entityTypes';
import { capitalize } from '~/utils/lang';
import { SearchBar } from './SearchBar';
import { CategoryIcons } from '~/utils/icons';
import { useTranslation } from 'react-i18next';

/**
 * Returns a random query from a list of queries for a given language
 * @param language ISO 639-1 of the language to get the query for
 */
export function getRandomQuery(language: 'cs'|'en') {
    const queries = language === 'en' ? [
        'Machine learning',
        'Japan',
        'Archeology',
        '3D rendering',
        'Video games',
        'Oceans',
        'Dentistry',
        'Greenhouse gases',
        'Architecture'
    ] : [
        'Strojové učení',
        'Japonsko',
        'Python',
        'Mongolština',
        'Onkologie',
        'Oceány',
        'Dinosauři',
        'Skandinávie',
    ];

    return queries[Math.floor((+new Date())/5000) % queries.length];
}

/**
 * Renders a search tool with a search bar and a category picker.
 */
export function SearchTool() {
    const { search } = useLocation();
    const searchMode = useParams<{ category: entityTypes }>().category!;
    const { t } = useTranslation();

    const query = new URLSearchParams(search).get('query');

    return (
        <div className='w-full pb-4 bg-slate-50 drop-shadow-md rounded-md'>
            <div className='relative'>
                <SearchBar/>
            </div>
            <div className="flex flex-row w-full justify-around pt-3 bg-slate-50 divide-x-2">
                {
                    Object.entries(
                        CategoryIcons
                    ).map(([mode, icon]) => {
                        return (
                        <Link 
                            to={{ pathname: `/${mode}`, search: search.toString() }}
                            key={mode} 
                            title={t('search.searchFor', { mode: t(`search.${mode}`), query })}
                            role='button'
                            aria-label={t('search.searchFor', { mode: t(`search.${mode}` ), query })}
                            className='flex flex-1 flex-col items-center'
                        >
                            {icon({
                                className: `${searchMode === mode ? 'text-orange-400' : 'text-slate-400'} pb-1`,
                                size: 25,
                                cursor: 'pointer',
                                'aria-hidden': true,
                            } as any)}
                            <span 
                                className='inline text-xs'
                                aria-hidden={true}
                            >
                                {capitalize(t(`search.${mode}`))}
                            </span>
                        </Link>
                    )}
                    )
                }
            </div>
        </div>
    );
}