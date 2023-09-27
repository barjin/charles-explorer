import Prisma, { PrismaClient } from '@prisma/client';
import { capitalize } from './utils';

/**
 * The Prisma client - there should only be one instance of this per application.
 */
export const db = new PrismaClient();

/**
 * The searchable entities in the Charles Explorer system.
 */
export const entities = ['person', 'publication', 'programme', 'class'] as const;

/**
 * Analyzes the Prisma schema and returns names of entities that can be joined with the given entity.
 * @param entity The entity to analyze.
 * @example getJoinableEntities('person') // [{ name: 'publications', type: 'publication' }, { name: 'programmes', type: 'programme' }, { name: 'classes', type: 'class' }}]
 * @returns Names of entities that can be joined with the given entity.
 */
export const getJoinableEntities = (entity: string) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => entities.includes(x.type.toLowerCase() as any))
        .map(x => ({ name: x.name, type: x.type }));
  };

/**
 * Analyzes the Prisma schema and returns names of text fields for the given entity.
 * 
 * @example getTextFields('class') // ['name', 'syllabus', 'annotation']
 * @param entity The entity to analyze.
 * @returns Names of text fields for the given entity.
 */
export const getTextFields = (entity: string) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => x.type === "Text")
        .map(x => x.name)
  };

import * as utils from './utils';

export { utils };