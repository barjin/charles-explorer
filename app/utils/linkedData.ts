import type { entityTypes } from '~/utils/entityTypes';

const categoryToClass: Record<entityTypes, string> = {
    person: 'https://schema.org/Person',
    class: "https://schema.org/Course",
    programme: "https://schema.org/EducationalOccupationalProgram",
    publication: "https://schema.org/CreativeWork"
}

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

interface LinkedDataTransformer {
    transform(data: Record<string, any>): Record<string, any>;
}

const url = 'http://localhost:3000/'

class PersonTransformer implements LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/person/${data.id}`, url).href,
            '@type': categoryToClass.person,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'sponsor': [
                ...data.programmes.map((x: { id: string }) => ({
                    "@type": categoryToClass.programme,
                    "@id": new URL(`/programme/${x.id}`, url).href
                })),
                ...data.classes.map((x: { id: string }) => ({
                    "@type": categoryToClass.class,
                    "@id": new URL(`/class/${x.id}`, url).href,
                })),
            ],
            'authorOf': [
                ...data.publications.map((x: { id: string }) => ({ 
                    "@type": categoryToClass.publication,
                    "@id": new URL(`/publication/${x.id}`, url).href 
                })),
            ]
        }
    }
}

class ClassTransformer implements LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/class/${data.id}`, url).href,
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
                    "@id": new URL(`/person/${x.id}`, url).href
                })),
            ],
            'isCourseOf': [
                ...data.programmes.map((x: { id: string }) => ({
                    "@type": categoryToClass.programme,
                    "@id": new URL(`/programme/${x.id}`, url).href
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

class PublicationTransformer implements LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/publication/${data.id}`, url).href,
            '@type': categoryToClass.publication,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'author': data.people.map((x: { id: string }) => ({
                    "@type": categoryToClass.person,
                    "@id": new URL(`/person/${x.id}`, url).href
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

class ProgrammeTransformer implements LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': new URL(`/publication/${data.id}`, url).href,
            '@type': categoryToClass.publication,
            'name': data.names.map((x: { lang: string, value: string }) => ({
                "@language": x.lang,
                "@value": x.value,
            })),
            'sponsoredBy': data.people.map((x: { id: string }) => ({
                "@type": categoryToClass.person,
                "@id": new URL(`/person/${x.id}`, url).href
            })),
            'hasCourse': data.classes.map((x: { id: string }) => ({
                "@type": categoryToClass.class,
                "@id": new URL(`/class/${x.id}`, url).href
            })),
        }
    }
}

class LinkedDataProcessor {
    private transformers: Partial<Record<entityTypes, LinkedDataTransformer>> = {
        person: new PersonTransformer(),
        class: new ClassTransformer(),
        publication: new PublicationTransformer(),
        programme: new ProgrammeTransformer(),
    };

    public getTransformer(category: entityTypes) {
        return this.transformers[category];
    }
}

const linkedDataProcessor = new LinkedDataProcessor();

export function getLinkedData(category: entityTypes, data: Record<string, any>) {
    return linkedDataProcessor.getTransformer(category)?.transform(data);
}