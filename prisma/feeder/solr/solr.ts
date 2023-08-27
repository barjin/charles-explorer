import { type PrismaClient } from '@prisma/client';
import axios from 'axios';

class SolrCollection {
    private solr: Solr;
    private collection: string;
    private emptyResponse = [];
    private exists = false;

    constructor(solr: Solr, collection: string) {
        this.solr = solr;
        this.collection = collection;
    }

    public async createIfNotExists() {
        if(this.exists) return;

        await axios(`${this.solr.url}/solr/admin/cores?action=STATUS&core=${this.collection}`).then(async (res) => {
            if(Object.values(res.data.status[this.collection]).length > 0) return;

            await axios.post(`${this.solr.url}/api/cores`, {
                create: [{
                    name: this.collection,
                    instanceDir: this.collection,
                    configSet: "sharedConfig"
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });

        this.exists = true;
    }

    private getSelfUrl(slug: string = '') {
        return new URL(`/solr/${this.collection}/${slug}`, this.solr.url).href;
    }

    async addDocument(document: any) {
        await this.createIfNotExists();

        await axios.post(this.getSelfUrl('update'), document, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async addDocuments(documents: any[]) {
        await this.createIfNotExists();

        await axios.post(this.getSelfUrl('update'), documents, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        await axios.get(this.getSelfUrl('update?commit=true'));
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
        const fields = ["lvl0_cs", "lvl0_en", "lvl1_cs", "lvl1_en", "lvl2_cs", "lvl2_en"];

        fields.forEach((field, i) => {
            queryParts.push(`${field}:"${escapedQuery}"^${fields.length - i}`);
        });
    
        let solrQuery = queryParts.join(' OR ');
    
        try {
            const url = `${this.getSelfUrl('select')}?fl=id, score&indent=true&q=(${encodeURIComponent(solrQuery)})&rows=${options?.rows ?? 30}&start=0`;
            return axios.get(url).then(res => res.data.response.docs);
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

        return entities
            .map((entity: any) => ({
                ...entity,
                score: idsWithScores.find(({ id }) => entity.id === id)?.score ?? 0
            }))
            .sort((a: any, b: any) => b.score - a.score);
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