import { db } from "~/connectors/prisma";
import { entities } from "~/utils/entityTypes";

export const sitemapPageSize = 1000;

export const loader = async () => {
    const counts = await Promise.all(entities.map(async (entity) => {
      const count = await db[entity].count();
      return { entity, count };
    }));

    const domain = process.env.DOMAIN ?? 'http://localhost:3000';
    // handle "GET" request
  // separating xml content from Response to keep clean code. 
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  ${counts.map(({ entity, count }) => {
    const pages = Math.ceil(count / sitemapPageSize);
    let content = '';
    for (let i = 0; i < pages; i++) {
      content += `
      <sitemap>
        <loc>${domain}/${entity}/sitemap.xml?p=${i + 1}</loc>
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
  