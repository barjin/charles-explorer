import { Prisma } from "@prisma/client";
import { db } from ".";

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

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

/**
 * Using the Prisma experimental Metrics API, this function waits until the database is idle (has less than 5 busy connections).
 */
export function waitUntilDbIdle() {
    new Promise<void>(resolve => {
        const interval = setInterval(async () => {
            const metrics = await db.$metrics.json();
            if(metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value <= 5) {
                clearInterval(interval);
                resolve();
            }
        }, 1e3);
    })
}