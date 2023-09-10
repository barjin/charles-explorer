import Prisma, { PrismaClient } from '@prisma/client';
import { capitalize } from './utils';

export const db = new PrismaClient();

export const entities = ['person', 'publication', 'programme', 'class'] as const;

export const getJoinableEntities = (entity: string) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => entities.includes(x.type.toLowerCase() as any))
        .map(x => ({ name: x.name, type: x.type }));
  };

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