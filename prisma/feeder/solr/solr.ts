import { type PrismaClient, Prisma } from '@prisma/client';
import axios from 'axios';
import { capitalize } from '../utils/lang';

export const getTextFields = (entity) => {
    return Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => x.type === "Text")
        .map(x => x.name)
  };

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
    }

    async finish() {
        await axios.get(this.getSelfUrl('update?commit=true'));
        await axios.get(this.getSelfUrl('suggest?suggest.buildAll=true'));
    }
    
    private escapeSolrQuery(query: string){
        const specialChars = ["+","-","&","|","!","(",")","{","}","[","]","^","\"","~","*","?",":","/"];
    
        return specialChars.reduce((acc, char) => acc.replaceAll(char, `\\${char}`), query).split(' ').join(' ');
    }
    
    async searchIds(query: string, options?: { rows?: number, ids?: string[] }): Promise<{ id: string, score: number }[]> {
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

        const filterQuery = ((options?.ids?.length ?? 0) > 0) ? `id:(${options!.ids!.join(' OR ')})&` : '';

        try {
            const url = new URL(this.getSelfUrl('select'));

            url.searchParams.append('fl', 'id, score');
            url.searchParams.append('indent', 'true');
            url.searchParams.append('q', solrQuery);
            url.searchParams.append('rows', String(options?.rows ?? 30));
            url.searchParams.append('start', '0');
            url.searchParams.append('wt', 'json');
            url.searchParams.append('fq', filterQuery);

            return axios.get(url.toString()).then(res => res.data.response.docs);
        }
        catch (e) {
            console.error(e);
            return Promise.resolve(this.emptyResponse);
        }
    }
    
    async search(query: string, options?: { rows?: number, includeTextFields?: boolean }): Promise<any[]> {
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
                ...(options?.includeTextFields ? 
                    getTextFields(this.collection as any)?.reduce((p: Record<string, any>, x) => ({
                    ...p,
                    [x]: true
                }), {}) : {})
            }
        });

        return entities
            .map((entity: any) => ({
                ...entity,
                score: idsWithScores.find(({ id }) => entity.id === id)?.score ?? 0
            }))
            .sort((a: any, b: any) => b.score - a.score);
    }

    async suggest(query: string, options?: { rows?: number, lang?: 'cs' | 'en' }): Promise<any[]> {
        const url = new URL(this.getSelfUrl('suggest'))
        url.searchParams.append('suggest.q', query);
        url.searchParams.append('suggest.count', String(options?.rows ?? 5));
        url.searchParams.append('suggest.dictionary', `${options?.lang ?? 'cs'}_suggester`);

        return axios.get(url.href).then(res => {
            return (Object.values(res.data.suggest)[0] as any)[query].suggestions;
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