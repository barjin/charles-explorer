import { type LoaderArgs } from "@remix-run/node";
import graph, { Integer, Node } from 'neo4j-driver';
import { db } from '~/connectors/prisma';
import { searchClient } from "~/connectors/solr.server";


const driver = graph.driver('bolt://localhost:7687');
/**
 * Given a set of ids, returns a set of nodes and edges that represent the social network of the given ids
 * A social network of ids are an induced subgraph of the entire social network graph.
 * @param param0 
 * @returns 
 */
export async function loader({ request, params }: LoaderArgs): Promise<any> {
    const ids = new URL(request.url).searchParams.getAll('id');

    const retrievedGraphP = (async () => {
        const session = await driver.session({ defaultAccessMode: graph.session.READ });
        const result = await session.executeRead((tx) => 
            tx.run(`
                match 
                    p=(origin:person {PERSON_ID: $personId})-->(pub)<--(c)
                    with project(p) as ego_subgraph
                return ego_subgraph;`, 
                { personId: ids[0] }
            )
        );
        await session.close();
        return result;
    })()
    
    const identitiesP = (async () => {
        const session = await driver.session({ defaultAccessMode: graph.session.READ });
        const result = await session.executeRead((tx) => 
        tx.run(`
            match 
                (origin:person {PERSON_ID: $personId})-->(pub)<--(c)
            with 
                reduce(
                accumulator = "", 
                variable IN collections.sort(
                    collections.remove_all(
                    split(
                        toLower(coalesce(c.PERSON_NAME, "")), 
                        ' '), 
                    [ "doc.", "ph.d.", "phd", "rndr.", "mgr.", "prof.", "csc.", "ing.", "m.sc.", "mudr.", "dipl.-inform.", "dipl.-ing.", "bc.", "drsc."]
                    )
                ) | accumulator + " " + variable
                ) as name_normalized, 
                MIN(c.PERSON_NAME) as name,
                collect(DISTINCT c.PERSON_ID) as ids, 
                collect(DISTINCT c) as nodes,
                count(pub) as common_pub_count
            return name_normalized, name, ids, common_pub_count, nodes
            order by common_pub_count desc;`, 
                { personId: ids[0] }
            )
        );
        await session.close();
        return result;
    })();
    
    const communitiesP = (async () => {
        const session = await driver.session({ defaultAccessMode: graph.session.READ });
        const result = await session.executeRead((tx) => 
        tx.run(`
            match 
            p=((:person {PERSON_ID: $personId})-[*2]-())
            with project(p) as ego_subgraph
                call community_detection.get_subgraph(ego_subgraph.nodes, ego_subgraph.edges)
                yield node, community_id
            return node, community_id as community
            order by community_id;`, { personId: ids[0] }
            )
        );
        await session.close();
        return result;
    })();

    const [retrievedGraph, identities, communities] = await Promise.all([retrievedGraphP, identitiesP, communitiesP]);

    const communityMap = new Map();

    const communityArray = communities.records.map(x => ({node: (x.get('node') as Node).elementId, community: (x.get('community') as Integer).toNumber()}));

    for (const { node, community } of communityArray) {
        communityMap.set(node, community);
    }

    const nodeIdentityMap = new Map<string, string>();
    const publicationTitles: string[] = [];

    const outGraph: any = {
        nodes: retrievedGraph.records[0]._fields[0].nodes.map((node: Node) => {
            const identity = identities.records.find(r => r.get('nodes').some((x: Node) => x.identity.toNumber() === node.identity.toNumber()));

            if(node.properties.TITLE) {
                publicationTitles.push(node.properties.TITLE);
            }

            if(nodeIdentityMap.has(node.elementId)) return false;
    
            identity?.get("nodes")?.forEach((alternative: Node) => {
                nodeIdentityMap.set(alternative.elementId, node.elementId);
            });

            nodeIdentityMap.set(node.elementId, node.elementId);
    
            return {
                ...node.properties,
                id: node.elementId,
                label: node.labels[0],
                alternativeIds: identity?.get("ids"),
                community: communityMap.get(node.elementId),
            }
        }).filter(x => x),
        edges: retrievedGraph.records[0]._fields[0].edges.map(edge => ({
            type: edge.type,
            source: nodeIdentityMap.get(edge.startNodeElementId),
            target: edge.endNodeElementId,
        })),
    };

    const keywords = await searchClient.getKeywords(publicationTitles.join(' '), { lang: 'en' });
    outGraph.keywords = [...keywords.slice(0, 3), ...keywords.slice(-3)].map((keyword, i) => keyword.value); 

    return outGraph;
}
