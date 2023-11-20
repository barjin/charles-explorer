import React, { useRef, memo, useEffect, useCallback } from 'react';
import { CytoscapeWrapper, type RenderingScene } from './CytoscapeWrapper';
import { getFacultyColor } from '~/utils/colors';
import { useLocalize } from '~/utils/providers/LangContext';
import { DummyKeywords } from './DummyKeywords';
import { useMatches, useNavigate } from '@remix-run/react';

const NODES_LIMIT = 40;

/**
 * Renders a word cloud with the query and the most relevant keywords based on the current search results
 */
export function WordCloud() {
    const graphRef = useRef<HTMLDivElement>(null);
    const cy = useRef<CytoscapeWrapper | null>(null);

    const matches = useMatches();
    const navigate = useNavigate();

    const { searchResults = [], query = '', category = '', keywords = {}, faculties = [] } = matches?.[2]?.data ?? {};
    const { localize, lang } = useLocalize();

    useEffect(() => {
        if (graphRef.current && window.screen.width > 1280) {
            cy.current = new CytoscapeWrapper(graphRef.current);
        }
    }, []);

    const getCurrentFaculties = useCallback(() => {
        if(faculties.length > 0) return faculties;
        return searchResults
                .flatMap(x => x.faculties)
                .filter((x, i, a) => a.findIndex(b => b.id === x.id) === i);
    }, [searchResults]);

    const drawCloud = useCallback((scene: RenderingScene) => {
        scene?.addNode('query', query, {
            style: {
                'font-size': '32px',
            }
        });

        const faculties = getCurrentFaculties();

        faculties.forEach((x, i) => {
            scene?.addNode(x.id, localize(x.names), { 
                parent: 'query', 
                    style: {
                        color: getFacultyColor(x.id),
                        fontWeight: 'bold',
                        fontSize: 32 - faculties.length,
                    }, edgeData: {
                        idealEdgeLength: 50
                    },
                });

            [
                ...(keywords?.[x.id] ?? []), 
                ...(DummyKeywords.find(k => k.code == Number(x.id))?.keywords[lang as 'cs' | 'en']?.map(x => ({ value: x })) ?? [])
            ]?.slice(0, (NODES_LIMIT - faculties.length) / faculties.length)
                .forEach(({ value }, i) => {
                
                if (value === query) return;
                scene?.addNode(`${value}${x.id}`, value, { parent: x.id, style: {
                    'font-size': Math.max(30 - i * 2.5, 12),
                    'color': getFacultyColor(x.id, 50, 50),
                }, edgeData: {
                    idealEdgeLength: 20,
                }, onClick: () => {
                    navigate({ pathname: `/${category}`, search: `query=${value}&lang=${lang}` });
                }});
            });
        });

        for(let i = 0; i < faculties.length; i++) {
            scene?.addEdge(faculties[i].id, faculties[(i+1) % faculties.length].id);
        }

        return scene;
    }, [category, getCurrentFaculties, keywords, lang, localize, navigate, query]);

    useEffect(() => {
        if (cy.current) {
            if(matches[2]?.id === 'routes/$category/index') {
                const scene = cy.current.newScene(query + category + lang);

                if(!scene) {
                    cy.current.getCurrentScene().zoomTowards(null);
                    return;
                }

                drawCloud(scene);
    
                scene?.finish();
            }

            if(matches[2]?.id === 'routes/$category/$id' && matches[2]?.data?.faculties?.[0]?.id) {
                const currentScene = cy.current.getCurrentScene();

                if(currentScene) {
                    currentScene.zoomTowards(matches[2].data.faculties[0].id);
                } else {
                    const scene = cy.current.newScene(query + category + lang);

                    if(!scene) return;

                    drawCloud(scene);
                    scene?.finish();
                }
            }
        }
    }, [cy, getCurrentFaculties, keywords, lang]);

    return <GraphInternal r={graphRef} />;
}

export const GraphInternal = memo(
    function GraphInternal ( props: { r?: React.RefObject<HTMLDivElement>, children?: React.ReactNode, className?: string } ) {
        return (
            <div
                ref={props.r}
                id="cy" 
                className={`
                    ${props.className ?? ''}
                    w-full 
                    h-full 
                    background-slate-50 
                    cursor-pointer
                    bg-no-repeat
                    bg-logo-aux
                `}
                style={{backgroundSize: '150px', backgroundPosition: '98% 98%'}}
            >
                {props.children}
            </div>
        );
    }, () => true, 
);