import type {LoaderArgs} from '@remix-run/node'
import { getPlural } from '~/utils/entityTypes';
import { createOGImage } from '~/utils/ogImage/ogImage.server'

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

function getParams(data) {
    try {
        const b = JSON.parse(Buffer.from(data, 'base64').toString());

        const allowedEntities = ['classes', 'people', 'programmes', 'publications'];

        b.entities = Object.keys(b.entities).filter(e => allowedEntities.includes(e) && e !== getPlural(b.category)).reduce((obj, key) => {
            obj[key] = b.entities[key];
            return obj;
        }, {});

        return b;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export const loader = async ({request}: LoaderArgs) => {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get('data');

  const params = getParams(data);

  const png = await createOGImage(params);

  // Respond with the PNG buffer
  return new Response(png, {
    status: 200,
    headers: {
      // Tell the browser the response is an image
      'Content-Type': 'image/png',
      // Tip: You might want to heavily cache the response in production
      // 'cache-control': 'public, immutable, no-transform, max-age=31536000',
    },
  })
}