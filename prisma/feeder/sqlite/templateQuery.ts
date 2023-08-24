
/**
 * For a given query, return the query with the limit and offset applied.
 * 
 * This function supports {{LIMIT}} and {{OFFSET}} templates. If the query does not contain these templates, they LIMIT and OFFSET are appended to the query.
 * @param query 
 * @param limit 
 * @param offset 
 * @returns 
 */
export function getQuery(query: string, limit?: number, offset?: number) {
    if(!limit && !offset) return query.replace('{{LIMIT}}', '').replace('{{OFFSET}}', '');

    if(!query.includes('LIMIT') && !query.includes('OFFSET')) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
    }
    if(query.includes('{{LIMIT}}'))
        {
            query = query.replace('{{LIMIT}}', `LIMIT ${limit}`);
        }
    if(query.includes('{{OFFSET}}'))
        {
            query = query.replace('{{OFFSET}}', `OFFSET ${offset}`);
        }

    return query;
}
