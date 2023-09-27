import cytoscape from 'cytoscape';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore 
import fcose from 'cytoscape-fcose';

/**
 * A scene is a set of nodes and edges that are rendered at the same time.
 */
class RenderingScene {
    private manager: CytoscapeWrapper;
    private collection: any[] = [];
    private sceneElements: any = [];
    private lifecycle: 'appearing' | 'disappearing' | 'idle' = 'idle';
    private zoomingTargets: (string | null)[] = [];
    private currentZoomedTarget: (string | null) = null;
    private zooming = false;
    public sceneId;

    constructor(manager: CytoscapeWrapper, id:string) {
        this.manager = manager;
        this.sceneId = id;
    }

    /**
     * Returns the current lifecycle stage of the scene (appearing, disappearing, idle)
     */
    public getLifecycle() {
        return this.lifecycle;
    }

    /**
     * Adds a node to the scene.
     * @param id ID of the node. Must be unique.
     * @param title Title of the node. Will be displayed on the node.
     * @param options Additional options.
     */
    public addNode(id: string, title: string, options?: { parent?: string, style?: any, data?: any, edgeData?: any, onClick?: any }) {
        this.collection.push({
            group: 'nodes',
            data: {
                ...options?.data,
                id: id as any,
                title,
                onclick: options?.onClick ?? undefined,
            },
            style: {
                ...options?.style,
                opacity: 0,
            },
            position: {
                x: this.manager.cytoscape?.width() as number / 2,
                y: this.manager.cytoscape?.height() as number / 2
            },
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

    /**
     * Adds an edge to the scene.
     * @param source ID of the source node.
     * @param target ID of the target node.
     * @param options Additional options.
     */
    public addEdge(source: string, target: string, options?: { style?: any, data?: any }) {
        this.collection?.push({
            group: 'edges',
            data: {
                ...options?.data,
                id: `${source}-${target}` as any,
                source,
                target,
                idealEdgeLength: 50,
            },
        });
    }

    
    private async _zoomTowardsNextTarget() {
        const currentTarget = this.zoomingTargets.shift();
        
        if(currentTarget !== undefined) {
            this.zooming = true;

            if (currentTarget !== this.currentZoomedTarget) {
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

    /**
     * Retrieves a node by its ID.
     * @param id ID of the node.
     * @returns The node with the given ID or null if no such node exists.
     */
    public getNodeById(id: string) {
        return this.manager.cytoscape.$id(`${id}-${this.sceneId}`);
    }

    /**
     * Switches the view to this scene.
     */
    public finish() {
        this.manager['publishScene'](this);
    }

    /**
     * Animates own nodes and edges to appear and runs the layout algorithm.
     */
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

        this.sceneElements.nodes().forEach((node: any) => {
            node.on('click', (e: any) => {
                if (node.data('onclick')) {
                    node.data('onclick')(e);
                }
            });
        });

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
            numIter: 2000,
            nodeRepulsion: (n) => n.data('id').startsWith('query') ? 100000 : 20000,
            idealEdgeLength: (e: any) => {
                return e.data('idealEdgeLength') ?? 25;
            },
            randomize: true,
            animationEasing: 'ease-in-out-quart',
            nodeDimensionsIncludeLabels: true,
        } as any);
        
        layoutAnimation.run();

        this.lifecycle = 'idle';
    }

    /**
     * Animates own nodes and edges to disappear and removes them from the scene.
     */
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

/**
 * A React wrapper around the Cytoscape library.
 * 
 * The wrapper works by rendering "scenes" - a "scene" is a set of nodes and edges that are rendered at the same time, see above.
 */
export class CytoscapeWrapper {
    public scenes: RenderingScene[] = [];
    public cytoscape: cytoscape.Core;

    /**
     * Switches to a new scene. Calls the `disappear` method on the current scene and `appear` on the new one.
     * @param scene The scene to switch to. In case this is null, the current scene will be removed.
     */
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

    /**
     * Checks whether a scene with the given ID is currently being rendered.
     */
    private hasDebouncedScene(id: string) {
        return (this.scenes.find(x => x.sceneId === id)?.getLifecycle() ?? 'disappearing') !== 'disappearing';
    }

    /**
     * Creates a new scene with the given ID. If a scene with the same ID is already being rendered, returns null.
     * @param id The ID of the scene to create.
     * @returns The newly created scene, or null if a scene with the same ID is already being rendered.
     */
    public newScene(id: string) {
        if (!this.hasDebouncedScene(id)) {
            return new RenderingScene(this, String(id));
        }
        return null;
    }

    /**
     * Publishes a scene. This method is called by the scene itself when it is ready to be rendered.
     */
    private publishScene(scene: RenderingScene) {
        this.switchToScene(scene);
    }

    /**
     * Returns the currently rendered scene.
     */
    public getCurrentScene() {
        return this.scenes[0];
    }
}