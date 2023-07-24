import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.person.deleteMany({});
    await prisma.faculty.deleteMany({});
    await prisma.publication.deleteMany({});

    const f = await prisma.faculty.create({
        data: {
            id: '123',
            names: {
                create: [
                    {
                        value: "Faculty of Informatics",
                        lang: "en"
                    },
                    {
                        lang: "cs",
                        value: "Fakulta informatiky"
                    }
                ]
            },
        }
    });

    await prisma.person.create({
        data: {
            id: '123',
            ukco: "123456789",
            names: {
                create: [
                    {
                        value: "John Doe",
                        lang: "en"
                    },
                    {
                        value: "Jan Novák",
                        lang: "cs"
                    }

                ]
            },
            publications: {
                create: {
                    id: '111',
                    year: '2020',
                    names: {
                        create: [
                            {
                                lang: "en",
                                value: "On parsing XML documents with a non-deterministic automaton"
                            },
                            {
                                lang: "cs",
                                value: "O parsování XML dokumentů pomocí nedeterministického automatu"
                            }
                        ]
                    },
                    authors: "John Doe, Jane Unknown",
                    abstract: {
                        create: [
                            {
                                lang: "en",
                                value: "Abstract 1"
                            }
                        ]
                    },
                    faculties: {
                        connect: { id: f.id }
                    }
                }
            },
            faculties: {
                connect: { id: f.id }
            }
        }
    });

}

main()