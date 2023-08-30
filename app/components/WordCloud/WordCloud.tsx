import React, { useRef, memo, useEffect } from 'react';
import { CytoscapeWrapper } from './CytoscapeWrapper';
import { useSearchResults } from '~/providers/SearchResultsContext';

export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);
    const searchResults = useSearchResults();

    useEffect(() => {
        if (graphRef.current) {
            cy.current = new CytoscapeWrapper(graphRef.current);
        }
    }, []);

    useEffect(() => {
        if (cy.current) {
            const scene = cy.current.newScene(searchResults.query + searchResults.category);
            scene?.addNode('query', searchResults.query);

            searchResults.searchResults.flatMap(x => x.faculties)
            .filter((x, i, a) => a.findIndex(b => b.id === x.id) === i)
            .forEach(x => {
                scene?.addNode(x.id, x.names[0].value, 'query');
            });

            scene?.finish();
        }
    }, [searchResults, cy]);

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