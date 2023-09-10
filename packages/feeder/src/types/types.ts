import type { PrismaClient } from "@prisma/client";

const tableNames = ['class', 'faculty', 'department', 'person', 'publication', 'programme'] as const;
type Tables = typeof tableNames[number];

type TransformedResult<T extends Tables> = Parameters<PrismaClient[T]['create']>[0]['data'];

interface Declaration<T extends Tables> {
    query: string;
    transform: (val: any) => TransformedResult<T>;
}

export type Transformers = {[K in Tables]: Declaration<K>};