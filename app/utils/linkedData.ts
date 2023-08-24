import type { entityTypes } from '~/utils/entityTypes';

const categoryToClass: Record<entityTypes, string> = {
    class: "https://schema.org/Course",
    programme: "https://schema.org/EducationalOccupationalProgram",
    publication: "https://schema.org/CreativeWork"
}

const commonContext = { "@context": { "name": { "@id": "schema:name", "@container": "@language" } } };

interface LinkedDataTransformer {
    transform(data: Record<string, any>): Record<string, any>;
}

class PersonTransformer implements LinkedDataTransformer {
    transform(data: Record<string, any>) {
        return {
            ...commonContext,
            '@id': data.id,
            '@type': 'https://schema.org/Person',
            'name': Object.fromEntries(
                data.names.map((x: { lang: string, value: string }) => [x.lang, x.value])
            ),
            
        }
    }
}

class LinkedDataProcessor {
    private transformers: Partial<Record<entityTypes, LinkedDataTransformer>> = {
        person: new PersonTransformer(),
    };

    public getTransformer(category: entityTypes) {
        return this.transformers[category];
    }
}

const linkedDataProcessor = new LinkedDataProcessor();

export function getLinkedData(category: entityTypes, data: Record<string, any>) {
    return linkedDataProcessor.getTransformer(category)?.transform(data);
}