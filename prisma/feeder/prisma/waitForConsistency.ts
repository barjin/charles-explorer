/**
 * Using the Prisma experimental Metrics API, this function waits until the database is idle (has less than 5 busy connections).
 */
export function waitUntilDbIdle(prismaDb: any) {
    new Promise<void>(resolve => {
        const interval = setInterval(async () => {
            const metrics = await prismaDb.$metrics.json();
            if(metrics.gauges.find((x: any) => x.key === 'prisma_pool_connections_busy').value <= 5) {
                clearInterval(interval);
                resolve();
            }
        }, 1e3);
    })
}