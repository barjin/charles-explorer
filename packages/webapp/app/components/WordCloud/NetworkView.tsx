import { useRef, useEffect, useState, memo } from 'react';
import { GraphInternal } from './WordCloud';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import cytoscape from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import { getFacultyColor } from '~/utils/colors';
import { FacultiesLegend } from './Legends/FacultiesLegend';
import { WithLegend } from './Legends/WithLegend';
import { stripTitles } from '~/utils/people';
import { jLouvain } from './louvain';
import { groupBy } from '~/utils/groupBy';

interface GraphEntity {
    id: string;
    title: string;
    faculty: any;
    class?: 'normal' | 'large';
}

interface GraphRelationship {
    source: string;
    target: string;
    score: number;
}

export const NetworkView = memo(function NetworkView({
    data, context
}: {
    data: any,
    context: 'search' | 'entity',
}) {
    const [ state, setState ] = useState<any>({ entities: [], relationships: [], communities: [] });

    useEffect(() => {
        const { id, category } = data;
        
        if ( context === 'search' ) {
            const searchResultIds = data.searchResults.map(x => x.id)

            fetch(`/${category}/network?ids=${searchResultIds.join(',')}`)
                .then((x) => x.json())
                .then((x) => {

                    const maxScore = Math.max(...x.relations.map(x => x.score));
                    const communities = jLouvain(x.entities.map(x => x.id), x.relations.map(x => ({...x, value: x.score/(maxScore+1)})), 0.05);

                    setState({
                        entities: x.entities,
                        relationships: x.relations.filter(x => communities[x.source] === communities[x.target]),
                        communities,
                    })
                });
        } else if (context === 'entity') {

            fetch(`/${category}/network?ids=${id}`)
                .then((x) => x.json())
                .then((x) => {
                    
                    const maxScore = Math.max(...x.relations.map(x => x.score));
                    const communities = jLouvain(x.entities.map(x => x.id), x.relations.map(x => ({...x, value: x.score/(maxScore+1)})), 0.1);

                    if(groupBy(Object.values(communities), (x) => x).length === x.entities.length) {
                        setState({
                            entities: x.entities,
                            relationships: x.relations,
                        });
                    } else {
                        setState({
                            entities: x.entities.filter(x => x.id !== id),
                            relationships: communities.length > x.relations.length * 0.8 ? 
                                x.relations.filter(edge => edge.source !== id && edge.target !== id) : 
                                x.relations
                                    .filter(edge => edge.source !== id && edge.target !== id)
                                    .filter(x => communities[x.source] === communities[x.target]),
                        })
                    }
                });
        }
    }, [data])

    return (
        <INetworkView {...{...state}} />
    );
}, (prev, next) => {
    return (prev.data.id === next.data.id && prev.context === next.context && prev.data.query === next.data.query);
});

/**
 * Renders a social network view on entities and their relationships
 */
export function INetworkView({
    entities,
    relationships,
    communities
} : {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    communities: any[];
}) {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<cytoscape.Core>(null);

    const { category } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();

    const faculties = entities.map((x) => x.faculty).filter((x, i, a) => a.findIndex(z => z.id === x.id) === i);
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280) {
            cytoscape.use(fcose);

            cy.current = cytoscape({
                container: graphRef.current,
                autoungrabify: true,
                wheelSensitivity: 0.1,
                elements: {
                    nodes: entities.map((x) => ({ data: x, classes: x.class ?? 'normal' })),
                    edges: relationships.map((x) => ({ data: x })),
                },
                style: [
                    {
                        selector: '.large',
                        style: {
                            "font-size": "2em",
                            "font-weight": "bold",
                        }
                    },
                    {
                        selector: 'node',
                        style: {
                            'content': (element: any) => stripTitles(element?.data('title')),
                            'font-size': '0.5em',
                            'background-opacity': 1,
                            shape: 'ellipse',
                            'color': (e: any) => getFacultyColor(e?.data('faculty')?.id),
                            'background-color': (e: any) => getFacultyColor(e?.data('faculty')?.id, 40, 70),
                            'opacity': 1,
                            'width': '2em',
                            'height': '2em'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            opacity: 0.5,
                            width: (element: any) => element?.data('score') / 10,
                        }
                    }
                ],
            });

            cy.current?.layout({
                name: 'fcose',
                animate: true,
                animationDuration: 1000,
                animationEasing: 'ease-in-out',
                randomize: true,
                fit: true,
            }).run();

            cy.current?.on('click', 'node', function(evt){
                const node = evt.target;
                const id = node.id();

                navigate(`/${category}/${id}?` + search.substring(1));
            });
        }
    }, [graphRef.current, entities, relationships]);

    return (
        <WithLegend 
            legend={<FacultiesLegend faculties={faculties} />}
            className="w-full h-full"
        >
            <GraphInternal r={graphRef} />
        </WithLegend>
    );
}

/**
 * Renders a sunburst view on entities and their relationships
 */