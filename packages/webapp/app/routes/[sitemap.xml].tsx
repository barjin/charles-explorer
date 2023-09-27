import { db } from "~/connectors/prisma";
import { entities } from "~/utils/entityTypes";

export const sitemapPageSize = 1000;

/**
 * Returns the sitemap index for the Charles Explorer website.
 * Since the sitemap is too large to be served in a single file, it is split into multiple files by entity type.
 * 
 * Available at /sitemap.xml
 */
export const loader = async ({ request }) => {
    const counts = await Promise.all(entities.map(async (entity) => {
      const count = await db[entity].count();
      return { entity, count };
    }));

    const domain = request.url;
    // handle "GET" request
  // separating xml content from Response to keep clean code. 
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${counts.map(({ entity, count }) => {
    const pages = Math.ceil(count / sitemapPageSize);
    let content = '';
    for (let i = 0; i < pages; i++) {
      const url = new URL(`${entity}/sitemap.xml`, domain);
      url.searchParams.set('p', (i + 1).toString());

      content += `
      <sitemap>
        <loc>${url.toString()}</loc>
      </sitemap>
      `;
    }
    return content;
  }).join('\n')}
</sitemapindex>      
      `
      // Return the response with the content, a status 200 message, and the appropriate headers for an XML page
      return new Response(content,{
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "xml-version": "1.0",
          "encoding": "UTF-8"
        }
      });
  };
  