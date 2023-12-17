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
import { GraphTooltip } from './GraphTooltip';

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

    const { id, filters } = data;

    const seeds = [id, ...(filters?.map(x => x.id).filter(x => x) ?? [])];

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
            fetch(`/${category}/network?mode=all&ids=${seeds.join(',')}`)
                .then((x) => x.json())
                .then((x) => {
                    const maxScore = Math.max(...x.relations.map(x => x.score));

                    x.entities = x.entities
                    .filter((x,_,a) => a.length < 30 || Math.min(...x.relations.filter(x => seeds.includes(x.source) || seeds.includes(x.target).map(x => x.score))) >= 0.1*maxScore)
                    .map(b => ({
                        ...b, 
                        score: x.relations.filter((edge) => 
                            (edge.source === id && edge.target === b.id) || 
                            (edge.source === b.id && edge.target === id))
                                .reduce((acc, x) => acc + x.score, 0)
                            }
                        )
                    );
                    
                    const communities = jLouvain(x.entities.map(x => x.id), x.relations.map(x => ({...x, value: x.score/(maxScore+1)})), 0.1);


                    if(Object.keys(communities).length === [...new Set(Object.values(communities))].length) {
                        setState({
                            entities: x.entities,
                            relationships: x.relations,
                        });
                    } else {
                        setState({
                            entities: x.entities
                                .filter(x => x.id !== id),
                            relationships: communities.length > x.relations.length * 0.8 ? 
                                x.relations.filter(edge => edge.source !== id && edge.target !== id) : 
                                x.relations
                                    .filter(edge => edge.source !== id && edge.target !== id)
                                    .filter(x => communities[x.source] === communities[x.target]),
                        })
                    }
                });
        }
    }, [id, filters, context])

    return (
        <INetworkView {...{...state}} />
    );
}, (prev, next) => {
    return (prev.data.id === next.data.id && prev.data.filters?.length === next.data.filters?.length && prev.context === next.context && prev.data.query === next.data.query);
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
    const { search, pathname } = useLocation();

    const [tooltipData, setTooltipData] = useState<any>({
        name: '',
        color: '',
        faculty: {
            abbreviations: [
                { value: '' }
            ]
        },
        visible: false,
        position: [0, 0]
    });

    const faculties = entities.map((x) => x.faculty).filter((x, i, a) => a.findIndex(z => z.id === x.id) === i);
    
    useEffect(() => {
        if(graphRef.current && window.screen.width > 1280) {
            cytoscape.use(fcose);

            cy.current = cytoscape({
                container: graphRef.current,
                autoungrabify: true,
                wheelSensitivity: 0.1,
                elements: {
                    nodes: entities.map((x) => ({ 
                        data: x,
                        classes: x.class ?? 'normal' 
                    })),
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
                            'width': '1.5em',
                            'height': '1.5em'
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

            cy.current.on('mouseover', 'node', function({ target: node }) {
                graphRef.current?.classList.add('cursor-pointer');

                setTooltipData({
                    name: stripTitles(node.data('title')),
                    color: getFacultyColor(node.data('faculty')?.id),
                    faculty: node.data('faculty'),
                    publications: node.data('score'),
                    visible: true,
                    position: [node.renderedPosition().x, node.renderedPosition().y],
                });
            });

            cy.current.on('mouseout', 'node', function() {
                graphRef.current?.classList.remove('cursor-pointer');

                setTooltipData({
                    visible: false,
                });
            });

            cy.current?.on('click', 'node', function({ target: node }){
                const id = node.id();

                setTooltipData({
                    visible: false,
                });

                navigate(`/${category}/${id}?` + search.substring(1));
            });

            cy.current?.on('cxttapstart', 'node', function({ target: node }){
                const id = node.id();

                setTooltipData({
                    visible: false,
                });

                const newPath = pathname + `,${id}`;

                navigate(newPath + search);
            });

            cy.current?.layout({
                name: 'fcose',
                nodeRepulsion: 6000,
                animate: true,
                animationDuration: 1000,
                animationEasing: 'ease-in-out',
                randomize: true,
                fit: true,
                padding: 100,
            }).run();
        }
    }, [graphRef.current, entities, relationships, pathname, search ]);

    return (
        <WithLegend 
            legend={<FacultiesLegend faculties={faculties} />}
            className="w-full h-full relative"
        >   
        {
            tooltipData.visible &&
            <GraphTooltip 
                className={'absolute top-0 left-0 z-50'}
                name={tooltipData.name}
                color={tooltipData.color}
                faculty={tooltipData.faculty}
                publications={tooltipData.publications}
                followCursor={graphRef.current}
            />
        }
            <GraphInternal r={graphRef} />
        </WithLegend>
    );
}

/**
 * Renders a sunburst view on entities and their relationships
 */