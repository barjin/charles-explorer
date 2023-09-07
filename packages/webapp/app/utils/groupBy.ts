export function groupBy<T> (array: T[], predicate: (arg: T) => string) {
    return array.reduce((memo, x) => {
        const key = predicate(x);
        if (!memo[key]) { memo[key] = []; }
        memo[key].push(x);
        return memo;
    }, {} as Record<string, T[]>);
}