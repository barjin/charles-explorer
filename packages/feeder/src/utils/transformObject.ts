import { db, utils } from '@charles-explorer/prisma';
const { getTableSchema } = utils;

type PrismaClient = typeof db;

/**
 * `true` if the object contains any nullish values, `false` otherwise.
 */
function containsNullishLiterals(obj: any) {
    return Object.values(obj).some(x => !x);
}

/**
 * Based on the Prisma schema, returns an object containing only the literal fields of the given object.
 */
export function getOnlyLiterals(obj: Record<string, string>, tableName: string) {
    const literalFields = Object.values(getTableSchema(tableName))
    ?.filter((x: any) => x.kind === 'scalar' || x.kind === 'enum')
    .map((x: any) => x.name);

    if (!literalFields) {
        throw new Error(`Table ${tableName} not found`);
    }

    return Object.fromEntries(
        Object.entries(obj)
        .filter(([key]) => literalFields.includes(key))
    )
}

/**
 * 
 * @param prismaDb 
 * @returns 
 */
export async function addIdsToTextCreators(prismaDb: PrismaClient){
    let count = await prismaDb.text.count() + 1;
    return (obj: any) => {
        return Object.fromEntries(Object.entries(obj).map(([key, value]: [string, any]) => {
            if (value?.create) {
                value.create = value.create.map((x: any, i: number) => ({
                    ...x,
                    id: count + i,
                }));

                count += value.create.length;
            }

            return [key, value];
        }));
    }
}

/**
 * Removes all nullish values from the given object.
 */
export function removeNullishLiterals(obj: any) {
    for (const [key, value] of Object.entries(obj)) {
        if ( (value as any)?.create ) {
            (value as any).create = (value as any).create.filter((x: any) => !containsNullishLiterals(x));
        }

        if ((value as any)?.connect) {
            if (containsNullishLiterals((value as any).connect)) {
                delete obj[key as keyof typeof obj];
            }
        }
    }
    return obj;
}

/**
 * Analyzes a Prisma create object and returns an object containing only the `connect` fields.
 * 
 * *Used internally to separate the insertion and connection tasks.*
 */
export function getConnectors(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.connect || key === 'id'));
}

/**
 * Analyzes a Prisma create object and returns an object containing only the `create` fields.
 *
 * *Used internally to separate the insertion and connection tasks.*
 */
export function getCreators(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.create || key === 'id'));
}