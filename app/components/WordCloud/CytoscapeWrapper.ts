import cytoscape from 'cytoscape';
//@ts-ignore 
import fcose from 'cytoscape-fcose';

class RenderingScene {
    private manager: CytoscapeWrapper;
    private collection: any[] = [];
    private sceneElements: any = [];
    private lifecycle: 'appearing' | 'disappearing' | 'idle' = 'idle';
    private zoomingTargets: (string | null)[] = [];
    private currentZoomedTarget: (string | null) = null;
    private zooming: boolean = false;
    public sceneId;

    constructor(manager: CytoscapeWrapper, id:string) {
        this.manager = manager;
        this.sceneId = id;
    }

    public getLifecycle() {
        return this.lifecycle;
    }

    public addNode(id: string, title: string, options?: { parent?: string, style?: any, data?: any, edgeData?: any }) {
        this.collection.push({
            group: 'nodes',
            data: {
                ...options?.data,
                id: id as any,
                title
            },
            style: {
                ...options?.style,
                opacity: 0,
            },
            position: {
                x: this.manager.cytoscape?.width() as number / 2,
                y: this.manager.cytoscape?.height() as number / 2
            }
        });

        if (options?.parent) {
            this.collection?.push({
                group: 'edges',
                data: {
                    ...options?.edgeData,
                    id: `${id}-${options.parent}`,
                    source: id,
                    target: options.parent
                }
            });
        }
    }

    private async _zoomTowardsNextTarget() {
        const currentTarget = this.zoomingTargets.shift();
        
        if(currentTarget !== undefined) {
            this.zooming = true;

            if (currentTarget !== this.currentZoomedTarget) {
                console.log('zooming towards ' + currentTarget);
                const zoomingAnimation = this.manager.cytoscape.animation({
                    fit: {
                        eles: !currentTarget ? this.manager.cytoscape.nodes() : this.getNodeById(currentTarget),
                        padding: currentTarget ? 200 : 0,
                    },
                    easing: 'ease-in-out-cubic',
                    duration: 1500
                })

                await zoomingAnimation.play().promise();

                this.currentZoomedTarget = currentTarget;
    
                await this._zoomTowardsNextTarget();
            }
        }

        this.zooming = false;
    }

    public zoomTowards(id: string | null) {
        this.zoomingTargets.push(id);
        if (this.zooming) return;

        this._zoomTowardsNextTarget();
    }

    public getNodeById(id: string) {
        return this.manager.cytoscape.$id(`${id}-${this.sceneId}`);
    }

    public finish() {
        this.manager['publishScene'](this);
    }

    private appear() {
        this.lifecycle = 'appearing';

        const nodes = this.collection
            .filter((element) => element.group === 'nodes')
            .map(x => (
                {...x, 
                    data: {
                        ...x.data, 
                        id: `${x.data.id}-${this.sceneId}`,
                    }
                }
            ));
        
        const edges = this.collection
            .filter((element) => element.group === 'edges')
            .map(x => (
                {...x, 
                    data: 
                        {...x.data, 
                            id: `${x.data.id}-${this.sceneId}`, 
                            source: `${x.data.source}-${this.sceneId}`, 
                            target: `${x.data.target}-${this.sceneId}`
                        }
                    }
                )
            );

        this.sceneElements = this.manager.cytoscape.collection([...nodes, ...edges]);

        this.sceneElements.nodes().animate({
            style: {
                opacity: 1,
            },
            easing: 'ease-in-out',
            duration: 2000,
        });
        
        const layoutAnimation = this.sceneElements.layout({
            name: 'fcose',
            animate: true,
            animationDuration: 2000,
            numIter: 10000,
            nodeRepulsion: (n) => n.data('id').startsWith('query') ? 100000 : 1000,
            idealEdgeLength: (e: any) => {
                return e.data('idealEdgeLength') ?? 20;
            },
            randomize: true,
            animationEasing: 'ease-in-out-quart',
            nodeDimensionsIncludeLabels: true,
        } as any);
        
        layoutAnimation.run();

        this.lifecycle = 'idle';
    }

    private disappear() {
        this.lifecycle = 'disappearing';

        this.sceneElements?.nodes?.().animate({
            style: {
                opacity: 0,
            },
            easing: 'ease-in-out',
            duration: 2000,
        });

        setTimeout(() => {
            this.sceneElements?.remove();
        }, 2000);
    }
}

export class CytoscapeWrapper {
    public scenes: RenderingScene[] = [];
    public cytoscape: cytoscape.Core;

    private switchToScene(scene: RenderingScene | null) {
        if (!scene) {
            return;
        }
        this.scenes.forEach(x => x['disappear']());
        scene['appear']();
        this.scenes = [scene];
    }

    constructor(container: HTMLDivElement) {
        cytoscape.use(fcose);

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
                        'label': (element: any) => element?.data('title')?.split(' ').reduce((p,x,_,a) => {
                            if(p[p.length-1]?.length <= 3) {
                                p[p.length-1] += ' ' + x;
                                return p;
                            }
                            return [...p, x];
                        }, []).join('\n'),
                        'text-wrap': 'wrap',
                        'background-opacity': 0,
                        "text-valign" : "center",
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
    }

    private hasDebouncedScene(id: string) {
        return (this.scenes.find(x => x.sceneId === id)?.getLifecycle() ?? 'disappearing') !== 'disappearing';
    }

    public newScene(id: string) {
        if (!this.hasDebouncedScene(id)) {
            return new RenderingScene(this, String(id));
        }
        return null;
    }

    private publishScene(scene: RenderingScene) {
        this.switchToScene(scene);
    }

    public getCurrentScene() {
        return this.scenes[0];
    }
}