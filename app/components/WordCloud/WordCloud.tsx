import React, { useRef, memo, useEffect, useCallback } from 'react';
import { CytoscapeWrapper } from './CytoscapeWrapper';
import { useSearchResults } from '~/providers/SearchResultsContext';
import { getFacultyColor } from '~/utils/colors';
import { useLocalize } from '~/providers/LangContext';
import { DummyKeywords } from './DummyKeywords';

const NODES_LIMIT = 50;

export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);
    const { searchResults, query, category, keywords } = useSearchResults();
    const { localize, lang } = useLocalize();

    useEffect(() => {
        if (graphRef.current) {
            cy.current = new CytoscapeWrapper(graphRef.current);
        }
    }, []);

    const getCurrentFaculties = useCallback(() => {
        return searchResults.flatMap(x => x.faculties)
            .filter((x, i, a) => a.findIndex(b => b.id === x.id) === i);
    }, [searchResults]);

    useEffect(() => {
        if (cy.current) {
            const scene = cy.current.newScene(query + category + lang);
            scene?.addNode('query', query, {
                style: {
                    'font-size': '32px',
                }
            });

            const faculties = getCurrentFaculties();

            faculties.forEach((x, i) => {
                if(!keywords?.[x.id]) return;
                scene?.addNode(x.id, localize(x.names), { parent: 'query', style: {
                    color: getFacultyColor(x.id),
                    fontWeight: 'bold',
                    fontSize: 32 - faculties.length,
                }, edgeData: {
                    idealEdgeLength: faculties.length * 10,
                },});
                [
                    ...keywords?.[x.id], 
                    ...(DummyKeywords.find(k => k.code == Number(x.id))?.keywords[lang]?.map(x => ({ value: x })) ?? [])
                ]
                    ?.slice(0, (NODES_LIMIT - faculties.length) / faculties.length)
                    .forEach(({ value }, i) => {
                    
                    if (value === query) return;
                    scene?.addNode(`${value}${x.id}`, value, { parent: x.id, style: {
                        'font-size': Math.max(30 - i * 2.5, 12),
                        'color': getFacultyColor(x.id, 50, 50),
                    }, edgeData: {
                        idealEdgeLength: i * 2.5,
                    }});
                });
            });

            scene?.finish();
        }
    }, [cy, getCurrentFaculties, keywords]);

    return <GraphInternal r={graphRef} />;
}

const GraphInternal = memo(
    function GraphInternal ( props: { r: React.RefObject<HTMLDivElement> } ) {
        return (
            <div
                ref={props.r}
                id="cy" 
                className='w-full h-full background-slate-50'
            >
            </div>
        );
    }, () => true, );