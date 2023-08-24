import { type PrismaClient } from '@prisma/client';
import axios from 'axios';

class SolrCollection {
    private solr: Solr;
    private collection: string;
    private emptyResponse = [];

    constructor(solr: Solr, collection: string) {
        this.solr = solr;
        this.collection = collection;
    }

    private getSelfUrl(slug: string = '') {
        return `${this.solr.url}/solr/${this.collection}/${slug}`;
    }

    async addDocument(document: any) {
        await axios.post(this.getSelfUrl('update'), document, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async addDocuments(documents: any[]) {
        await axios.post(this.getSelfUrl('update'), documents, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    
    private escapeSolrQuery(query: string){
        const specialChars = ["+","-","&","|","!","(",")","{","}","[","]","^","\"","~","*","?",":","/"];
    
        return specialChars.reduce((acc, char) => acc.replaceAll(char, `\\${char}`), query).split(' ').join(' ');
    }
    
    async searchIds(query: string, options?: { rows?: number }): Promise<{ id: string, score: number }[]> {
        if (!query) {
            return Promise.resolve(this.emptyResponse);
        }
    
        const escapedQuery = this.escapeSolrQuery(query);
        
        let queryParts: string[] = [];
        ["class_name_cs", "class_annotation_cs", "class_syllabus_cs"].forEach((field, i) => {
            queryParts.push(`${field}:"${escapedQuery}"^${10 - 3*i}`);
        });
    
        let solrQuery = queryParts.join(' OR ');
    
        try {
            return axios.get(`${this.getSelfUrl('select')}?fl=id, score&indent=true&q=(${encodeURIComponent(solrQuery)})&rows=${options?.rows ?? 30}&start=0`).then(res => res.data.response.docs);
        }
        catch (e) {
            console.error(e);
            return Promise.resolve(this.emptyResponse);
        }
    }
    
    async search(query: string, options?: { rows?: number }): Promise<any[]> {
        const idsWithScores = await this.searchIds(query, options);

        const entities = await (this.solr.db as any)[this.collection].findMany({
            where: {
                id: {
                    in: idsWithScores.map(({ id }) => id)
                }
            },
            include: {
                names: true,
                faculties: {
                    include: {
                        names: true,
                    }
                },
            }
        });

        return entities.sort((a, b) => {
            const aScore = idsWithScores.find(({ id }) => id === a.id)?.score;
            const bScore = idsWithScores.find(({ id }) => id === b.id)?.score;

            return bScore - aScore;
        });
    }
}

export class Solr {
    public url: string;
    public db: PrismaClient;
    constructor(url: string, db: PrismaClient) {
        this.url = url;
        this.db = db;
    }

    getCollection(collection: string) {
        return new SolrCollection(this, collection);
    }
}