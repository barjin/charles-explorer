import { type LoaderArgs } from "@remix-run/node";
import graph from 'neo4j-driver';
import { db } from '~/connectors/prisma';


const driver = graph.driver('bolt://localhost:7687');
/**
 * Given a set of ids, returns a set of nodes and edges that represent the social network of the given ids
 * A social network of ids are an induced subgraph of the entire social network graph.
 * @param param0 
 * @returns 
 */
export async function loader({ request, params }: LoaderArgs): Promise<any> {
    const graphSession = await driver.session({ defaultAccessMode: graph.session.READ });

    const ids = new URL(request.url).searchParams.getAll('id');

    const result = await graphSession.executeRead((tx) => 
        tx.run(`
            match 
                p=(origin:person {PERSON_ID: $personId})-->(pub)<--(c)
                with project(p) as ego_subgraph
            return ego_subgraph;`, 
            { personId: ids[0] }
        )
    );

    await graphSession.close();
    return result.records[0]._fields[0];
}
