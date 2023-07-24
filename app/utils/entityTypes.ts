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
