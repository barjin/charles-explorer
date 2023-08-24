import { Prisma } from "@prisma/client";
import { capitalize } from "~/utils/lang";

/**
 * Returns a schema object for a given table name as an object
 * @param tableName Name of the table to get the schema for
 * @returns Schema object for the given table, indexed by field name. Values of this object are objects containing the field's type and other metadata.
 */
export function getTableSchema(tableName: string): Record<string, any> {
    const entries = Prisma.dmmf.datamodel.models
            .find(x => x.name === capitalize(tableName))
            ?.fields?.map(x => [x.name, x]);

    if (!entries) {
        throw new Error(`Table ${tableName} not found`);
    }

    return Object.fromEntries(entries);
}