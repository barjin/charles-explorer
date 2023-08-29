import cytoscape from 'cytoscape';
//@ts-ignore 
import fcose from 'cytoscape-fcose';
import React, { useRef, memo, useEffect } from 'react';

class CytoscapeWrapper {
    private cytoscape: cytoscape.Core;
    private currentCollection: cytoscape.Collection
    private nextCollection: any[] = [];

    constructor(container: HTMLDivElement) {
        this.cytoscape = cytoscape({
            container,
            wheelSensitivity: 0.1,
            autoungrabify: true,
            userPanningEnabled: false,
            elements: {
                nodes: [],
                edges: []
            },
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': (element: any) => element?.data('title')?.split(' ').join('\n'),
                        'text-wrap': 'wrap',
                        'background-opacity': 0,
                        "text-valign" : "center",
                        'transition-property': 'opacity',
                        'transition-duration': 2,
                        'opacity': 1,
                        'width': 'label',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        opacity: 0,
                    }
                },
                {
                    selector: '.hidden',
                    style: {
                        display: 'none',
                    }
                }
            ]
        });

        this.currentCollection = this.cytoscape.collection();
    }

    public addNode(id: string, title: string, parent: string | null = null) {
        if(!this.nextCollection) throw new Error('nextCollection is null');
        this.nextCollection.push({
            group: 'nodes',
            data: {
                id: id as any,
                title
            },
            style: {
                opacity: 0,
            },
            position: {
                x: this.cytoscape?.width() as number / 2,
                y: this.cytoscape?.height() as number / 2
            }
        });

        if (parent) {
            this.nextCollection?.push({
                group: 'edges',
                data: {
                    id: `${id}-${parent}`,
                    source: id,
                    target: parent
                }
            });
        }
    }

    public async blip() {
        if (!this.cytoscape) throw new Error('cytoscape is null');

        const nodes = this.nextCollection.filter((element) => element.group === 'nodes');
        const edges = this.nextCollection.filter((element) => element.group === 'edges');

        const nextNodes = this.cytoscape?.add(nodes);
        const nextEdges = this.cytoscape?.add(edges);

        this.currentCollection.animate({
            style: {
                opacity: 0,
            }
        });

        nextNodes.animate({
            style: {
                opacity: 1,
            }
        });

        const nextBlip = nextNodes.add(nextEdges);

        const layoutAnimation = nextBlip.layout({
            name: 'fcose',
            animate: true,
            animationDuration: 2000,
            animationEasing: 'ease-in-out',
            randomize: true,
            nodeDimensionsIncludeLabels: true,
        } as any);

        layoutAnimation.run();
        await layoutAnimation.promiseOn('layoutstop');

        this.currentCollection.remove();
        this.currentCollection = nextBlip;
        this.nextCollection = [];
    }       
}

export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);

    useEffect(() => {
        if (graphRef.current) {
            cytoscape.use(fcose);

            cy.current = new CytoscapeWrapper(graphRef.current);

            cy.current.addNode('1', 'Machine Learning');
            cy.current.addNode('2', 'Deep Learning', '1');
            cy.current.addNode('3', 'Reinforcement Learning', '1');
            cy.current.addNode('4', 'Supervised Learning', '2');
            cy.current.addNode('5', 'Unsupervised Learning', '2');
            cy.current.addNode('6', 'Semi-Supervised Learning', '2');
            cy.current.addNode('7', 'Generative Adversarial Networks', '2');
            cy.current.addNode('8', 'Convolutional Neural Networks', '2');
            cy.current.addNode('9', 'Recurrent Neural Networks', '2');
            cy.current.addNode('10', 'Graph Neural Networks', '2');

            cy.current.blip().then(() => {
                setTimeout(() => {
                    cy.current?.addNode('11', 'Graph Neural Networks', '2');
                    cy.current?.blip();
                }, 3000);
            })
        }
    }, []);

    return <GraphInternal r={graphRef} />;
}

const GraphInternal = memo(
    function GraphInternal ( props: { r: React.RefObject<HTMLDivElement> } ) {
        return (
            <div
                ref={props.r}
                id="cy" 
                style={{ width: '100%', height: '100%' ,
                backgroundRepeat: 'no-repeat', backgroundImage: 'url(./logo_aux.svg)', backgroundSize: '150px', backgroundPosition: '98% 98%'}} >
            </div>
        );
    }, () => true, );