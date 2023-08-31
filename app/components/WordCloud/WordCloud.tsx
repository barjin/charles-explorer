import React, { useRef, memo, useEffect, useCallback } from 'react';
import { CytoscapeWrapper } from './CytoscapeWrapper';
import { useSearchResults } from '~/providers/SearchResultsContext';
import { getFacultyColor } from '~/utils/colors';

export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);
    const searchResults = useSearchResults();

    useEffect(() => {
        if (graphRef.current) {
            cy.current = new CytoscapeWrapper(graphRef.current);
        }
    }, []);

    const getCurrentFaculties = useCallback(() => {
        return searchResults.searchResults.flatMap(x => x.faculties)
            .filter((x, i, a) => a.findIndex(b => b.id === x.id) === i);
    }, [searchResults]);

    useEffect(() => {
        if (cy.current) {
            const scene = cy.current.newScene(searchResults.query + searchResults.category);
            scene?.addNode('query', searchResults.query);

            const faculties = getCurrentFaculties();
            const facultySizes = faculties.map(f => {
                return searchResults.searchResults.filter(y => y.faculties.some(z => z.id === f.id)).length
            }).map((x, _,a) => {
                return Math.pow(x / Math.max(...a), 1/5) * 30;
            })

            faculties.forEach((x, i) => {
                scene?.addNode(x.id, x.names[1].value, { parent: 'query', style: {
                    color: getFacultyColor(x.id),
                    fontWeight: 'bold',
                    fontSize: facultySizes[i],
                } });
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