import { entities, type entityTypes } from "./entityTypes";
import Prisma from "@prisma/client";
import { capitalize } from "./lang";


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

export const getJoinableEntities = (entity: entityTypes) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => entities.includes(x.type.toLowerCase() as any))
        .map(x => x.name)
  };
  
export const getTextFields = (entity: entityTypes) => {
    return Prisma.Prisma.dmmf.datamodel
        .models
        .find(x => x.name === capitalize(entity))
        ?.fields
        .filter(x => x.type === "Text")
        .map(x => x.name)
  };