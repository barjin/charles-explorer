import React, { useRef, memo, useEffect, useCallback } from 'react';
import { CytoscapeWrapper } from './CytoscapeWrapper';
import { useSearchResults } from '~/providers/SearchResultsContext';
import { getFacultyColor } from '~/utils/colors';

export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);
    const { searchResults, query, category, keywords } = useSearchResults();

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
            const scene = cy.current.newScene(query + category);
            scene?.addNode('query', query, {
                style: {
                    'font-size': '32px',
                }
            });

            const faculties = getCurrentFaculties();

            faculties.forEach((x, i) => {
                if(!keywords?.[x.id]) return;
                scene?.addNode(x.id, x.names[1].value, { parent: 'query', style: {
                    color: getFacultyColor(x.id),
                    fontWeight: 'bold',
                    fontSize: '32px',
                } });

                keywords?.[x.id]?.forEach(({ value }, i) => {
                    if (value === query) return;
                    scene?.addNode(`${value}${x.id}`, value, { parent: x.id, style: {
                        'font-size': 30 - i * 1.5,
                        'color': getFacultyColor(x.id, 50, 50),
                    }, edgeData: {
                        idealEdgeLength: i * 10,
                    }});
                });
            });

            scene?.finish();
        }
    }, [searchResults, cy, getCurrentFaculties]);

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