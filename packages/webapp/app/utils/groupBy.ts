/**
 * Group an array of objects by a given predicate. If the predicate returns the same string for two objects, they will be in the same group.
 * @param array Array of objects to group
 * @param predicate The grouping predicate
 * @returns An object with the groups as keys and the objects in the groups as values
 */
export function groupBy<T> (array: T[], predicate: (arg: T) => string) {
    return array.reduce((memo, x) => {
        const key = predicate(x);
        if (!memo[key]) { memo[key] = []; }
        memo[key].push(x);
        return memo;
    }, {} as Record<string, T[]>);
}