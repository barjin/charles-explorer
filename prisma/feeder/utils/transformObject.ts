import { type  PrismaClient, Prisma } from '@prisma/client';

function containsNullishLiterals(obj: any) {
    return Object.values(obj).some(x => !x);
}

export function getOnlyLiterals(obj: Record<string, string>, tableName: string) {
    const literalFields = getSchemaFields(tableName)
    ?.filter(x => x.kind === 'scalar')
    .map(x => x.name);

    if (!literalFields) {
        throw new Error(`Table ${tableName} not found`);
    }

    return Object.fromEntries(
        Object.entries(obj)
        .filter(([key]) => literalFields.includes(key))
    )
}

export function getSchemaFields(tableName: string) {
    return Object.fromEntries(Prisma.dmmf.datamodel.models
    .find(x => x.name.toLowerCase() === tableName.toLowerCase())
    ?.fields
    .map(x => [x.name, x]) ?? []);
}

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

export function getConnectors(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.connect || key === 'id'));
}

export function getCreators(obj: any){
    return Object.fromEntries(Object.entries(obj).filter(([key, value]: [string, any]) => value?.create || key === 'id'));
}