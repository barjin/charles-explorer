import { searchClient } from "~/connectors/solr.server";

export const entities = ['person', 'publication', 'programme', 'class'] as const;
export type entityTypes = typeof entities[number];

const entitiesPlurals: Record<entityTypes, string> = {
    person: 'people',
    publication: 'publications',
    programme: 'programmes',
    class: 'classes'
}

export const isValidEntity = (entity?: string): entity is entityTypes => {
    return entities.includes(entity as entityTypes);
}

export const getPlural = (entity: entityTypes): string => {
    return entitiesPlurals[entity];
}

abstract class ParsedEntity {
    protected data: Record<string, any>;
  
    constructor(data: any) {
      this.data = data;
    }
  
    getNames(): any[] {
      return this.data.names;
    }
    getExternalLinks() : string[] {
      return [];
    }
    getFaculties() : any[] {
      return this.data.faculties;
    }
    getDetail(): string | null {
      return null
    }
    async getRelevantRelatedEntities(query: string): Promise<Record<string, any[]>> {
      return {};
    }
  }
  
  export class Class extends ParsedEntity {
    override getExternalLinks(): string[] {
      const url = new URL('https://is.cuni.cz/studium/predmety/index.php?');
      url.searchParams.set('kod', this.data.id);
      url.searchParams.set('do', 'predmet');
  
      return [url.toString()];
    }
  
    override getDetail(): string | null {
      return this.data.id;
    }
  }
  
  export class Publication extends ParsedEntity {
    override getExternalLinks(): string[] {
      const url = new URL('https://verso.is.cuni.cz/pub/verso.fpl/_TS_/1669118925');
      url.searchParams.set('id', this.data.id);
      url.searchParams.set('fname', 'obd_public_det');
      return [url.toString()];
    }
  
    override getDetail(): string | null {
      return this.data.year;
    }
  }
  
  export class Person extends ParsedEntity {
    override async getRelevantRelatedEntities(query: string): Promise<Record<string, any[]>> {
      return Promise.all([
        searchClient.searchIds('class', query, { rows: 256, ids: this.data.classes.map(x => x.id) } ),
        searchClient.searchIds('publication', query, { rows: 256, ids: this.data.publications.map(x => x.id) } )
      ]).then(([c, publication]) => (
        {
          class: c,
          publication
        }
      ));
    }

    override getExternalLinks() : string[] {
      const url = new URL(this.data.id, 'https://is.cuni.cz/webapps/whois2/osoba/');
      return [url.toString()];
    }
  }
  export class Programme extends ParsedEntity {
    override async getRelevantRelatedEntities(query: string): Promise<Record<string, any[]>> {
      return Promise.all([
        searchClient.searchIds('class', query, { rows: 256, ids: this.data.classes.map(x => x.id) } ),
      ]).then(([c]) => (
        {
          class: c,
        }
      ));
    }

    override getDetail(): string | null {
      const getDegree = () => {
        switch ( this.data.type ) {
          case 'B':
            return 'Bc.';
          case 'M':
            return 'Mgr.';
          case 'D':
            return 'PhD.';
          case 'N':
            return 'Mgr.';
        }
      }

      const getLang = () => {
        switch ( this.data.languages?.[0] ) {
          case 'cs':
            return '🇨🇿';
          case 'en':
            return '🇬🇧';
          case 'de':
            return '🇩🇪';
          case 'ru':
            return '🇷🇺';
          default: 
            return '';
        }
      }

      return `${getLang()}  ${getDegree()}`;
    }
  }
  
  export class EntityParser {
    static parse(data: any, type: entityTypes) {
      switch (type) {
        case 'class':
          return new Class(data);
        case 'publication':
          return new Publication(data);
        case 'person':
          return new Person(data);
        case 'programme':
          return new Programme(data);
        default:
          return null;
      }
    }
  }