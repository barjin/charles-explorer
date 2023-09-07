import { type AsyncDatabase } from "promised-sqlite3";

/**
 * For a given database and a query, return the number of rows in the query result.
 * @param sqliteDB SQLite3 database
 * @param query SQL query
 * @returns Number of rows in the query result
 */
export async function getQuerySize(sqliteDB: AsyncDatabase, query: string): Promise<number> {
    const results = await sqliteDB.all(`SELECT COUNT(*) FROM (${query.replace(';', '')});`);

    return Number((results[0] as any)['COUNT(*)']);
}