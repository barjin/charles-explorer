import { type entityTypes } from "~/utils/entityTypes";
import { getNames } from "~/utils/retrievers";
import { db } from "./prisma";

async function getRelevantIds(query: string, category: entityTypes, { limit: number = 10 } = {}): Promise<string[]>{
    return ["123"];
    // const url = `http://localhost:8983/solr/charles/select?fl=id&q=${query}&rows=${number}&wt=json`;
    // return fetch(url)
    //     .then(res => res.json())
    //     .then(json => json.response.docs)
    //     .then(docs => docs.map(doc => doc.id));
}

export async function getRelevantEntities(query: string, category: entityTypes, { limit } = { limit: 10 }): Promise<any[]>
    {
        const ids = await getRelevantIds(query, category, { limit });
        return (db[category] as typeof db['class']).findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
            ...getNames().include,
            departments: getNames(),
            faculties: getNames(),
            },
        });
    }