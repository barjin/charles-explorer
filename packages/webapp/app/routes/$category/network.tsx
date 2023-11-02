import { type LoaderArgs } from "@remix-run/node";
import socialNetwork from "~/assets/social_network.json";
import { db } from "~/connectors/prisma";

export async function loader({ request, params }: LoaderArgs) {
    const searchParams = new URL(request.url).searchParams;
    const { category } = params;

    if (category !== 'person') {
        console.error('Invalid category');
        return [];
    }

    const id = searchParams.get('id');

    if(!id) {
        console.error('No personId provided');
        return []; 
    }

    const { private_id } = await db.person.findFirst({
        where: { id },
        select: { private_id: true }
    }) ?? {};

    if(!private_id) {
        console.error('No private_id found');
        return [];
    }

    let friendScores = (socialNetwork as any)[String(private_id)] ?? {};

    friendScores = Object.fromEntries(
        Object.entries(friendScores)
    );

    if (Object.keys(friendScores).length > 0) {
        const people = await db.person.findMany({
            where: {
                private_id: {
                    in: [private_id, ...Object.keys(friendScores)]
                }
            },
            select: {
                private_id: true,
                id: true,
                names: true,
            }
        });

        return {
            me: {...(people.find(x => x.id === id) ?? {}), private_id: undefined},
            friends: Object.entries(friendScores).map(([k,score]) => ({
                score,
                mutual: Object.fromEntries(
                    Object.entries(socialNetwork[k])
                        .filter(([k]) => friendScores[k])
                        .map(([k,v]) => [people.find(x => x.private_id === k)?.id, v])
                        .filter(([k]) => k)
                ),
                ...people.find(y => y.private_id === k)
            }))
                .sort((a,b) => b.score - a.score)
                .filter(x => x.id)
                .map(x => ({...x, private_id: undefined}))
        }
    }

    return [];
}
