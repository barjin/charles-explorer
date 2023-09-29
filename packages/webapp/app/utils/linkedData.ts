import type { entityTypes } from '~/utils/entityTypes';

const categoryToClass: Record<entityTypes, string> = {
    person: 'https://schema.org/Person',
    class: "https://schema.org/Course",
    programme: "https://schema.org/EducationalOccupationalProgram",
    publication: "https://schema.org/CreativeWork"
}

/**
 * JSON-LD context for the whole application.
 */
const commonContext = { 
    "@context": { 
        "schema": "https://schema.org/",
        "name": { 
            "@id": "schema:name",
        },
        "abstract": { 
            "@id": "schema:abstract", 
        },
        "sponsor": {
            "@id": "schema:sponsor",
        },
        "courseCode": {
            "@id": "schema:courseCode",
        },
        "datePublished": {
            "@id": "schema:datePublished",
        },
        "sponsoredBy": {
            "@reverse": "schema:sponsor",
        },
        "author": {
            "@id": "schema:author",
        },
        "authorOf": {
            "@reverse": "schema:author",
        },
        "isCourseOf": {
            "@reverse": "schema:hasCourse",
        }
    } };

/**
 * Common interface for all Linked Data transformers.
 */
abstract class LinkedDataTransformer {
    protected url: string;
    transform (data: Record<string, any>): Record<string, any> {
        return {}
    }

    constructor(url: string) {
        this.url = url;
    }
}

/**
 * Transformer for the `person` category.
 */
class PersonTransformer extends LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/person/${data.id}`, this.url).href,
            '@type': categoryToClass.person,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'sponsor': [
                ...data.programmes.map((x: { id: string }) => ({
                    "@type": categoryToClass.programme,
                    "@id": new URL(`/programme/${x.id}`, this.url).href
                })),
                ...data.classes.map((x: { id: string }) => ({
                    "@type": categoryToClass.class,
                    "@id": new URL(`/class/${x.id}`, this.url).href,
                })),
            ],
            'authorOf': [
                ...data.publications.map((x: { id: string }) => ({ 
                    "@type": categoryToClass.publication,
                    "@id": new URL(`/publication/${x.id}`, this.url).href 
                })),
            ]
        }
    }
}

/**
 * Transformer for the `class` category.
 */
class ClassTransformer extends LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/class/${data.id}`, this.url).href,
            '@type': categoryToClass.class,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'courseCode': data.id,
            'abstract': data.annotation.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'sponsor': [
                ...data.people.map((x: { id: string }) => ({
                    "@type": categoryToClass.person,
                    "@id": new URL(`/person/${x.id}`, this.url).href
                })),
            ],
            'isCourseOf': [
                ...data.programmes.map((x: { id: string }) => ({
                    "@type": categoryToClass.programme,
                    "@id": new URL(`/programme/${x.id}`, this.url).href
                })),
            ],
            'syllabusSections': [
                ...data.syllabus.map((x: { lang: string, value: string }) => ({
                    "@type": 'Syllabus',
                    "text": x.value,
                    "inLanguage": x.lang,
                })),
            ]
        }
    }
}

/**
 * Transformer for the `publication` category.
 */
class PublicationTransformer extends LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/publication/${data.id}`, this.url).href,
            '@type': categoryToClass.publication,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'author': data.people.map((x: { id: string }) => ({
                    "@type": categoryToClass.person,
                    "@id": new URL(`/person/${x.id}`, this.url).href
                })),
            'datePublished': {
                "@type": "schema:Date",
                "@value": `${data.year}-01-01`,
            },
            'abstract': data.abstract.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value
            }))
        }
    }
}

/**
 * Transformer for the `programme` category.
 */
class ProgrammeTransformer extends LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/publication/${data.id}`, this.url).href,
            '@type': categoryToClass.publication,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'sponsoredBy': data.people.map((x: { id: string }) => ({
                "@type": categoryToClass.person,
                "@id": new URL(`/person/${x.id}`, this.url).href
            })),
            'hasCourse': data.classes.map((x: { id: string }) => ({
                "@type": categoryToClass.class,
                "@id": new URL(`/class/${x.id}`, this.url).href
            })),
        }
    }
}

/**
 * A common "hub" for all Linked Data transformers.
 */
export class LinkedDataProcessor {
    private baseUrl: string;

    private transformers: Record<entityTypes, any> = {
        person: PersonTransformer,
        class: ClassTransformer,
        publication: PublicationTransformer,
        programme: ProgrammeTransformer,
    };

    public getTransformer(category: entityTypes) {
        return new this.transformers[category](this.baseUrl);
    }

    constructor(url: string) {
        this.baseUrl = url;
    }
}
