/**
 * This file includes several Prisma accessors (parts for the Prisma `select` function parameter) 
 * to simplify the code reading data from the database.
 */

import { entities, type entityTypes } from "./entityTypes";
import Prisma from "@prisma/client";
import { capitalize } from "./lang";

/**
 * Get the `select` parameter for a given entity.
 * @returns The `select` parameter for the given entity
 */
export const getNames = () => {
    return {
      include: {
        names: {
          select: {
            value: true,
            lang: true,
          }
        }
      }
    }
  }

/**
 * For a given entity, return a list of all its joinable entities (e.g. `person` -> [`publication`, `class`, `programme`])
 * @param entity Name of the entity
 * @returns A list of names of joinable entities
 */
export const getJoinableEntities = (entity: entityTypes) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => entities.includes(x.type.toLowerCase() as any))
        .map(x => x.name)
  };
  
/**
 * For a given entity, return a list of all its text fields (e.g. `class` -> [`name`, `syllabus`, `annotation`])
 * @param entity Name of the entity
 * @returns A list of names of text fields
 */
export const getTextFields = (entity: entityTypes) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => x.type === "Text")
        .map(x => x.name)
  };