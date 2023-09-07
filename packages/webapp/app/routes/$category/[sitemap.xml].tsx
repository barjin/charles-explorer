import { db } from "~/connectors/prisma";
import { isValidEntity } from "~/utils/entityTypes";
import { sitemapPageSize } from "../[sitemap.xml]";

export const loader = async ({ params, request }) => {
  const url = new URL(request.url);
  const { category } = params;

  if (!isValidEntity(category)) {
      return new Response('Invalid category', {
          status: 400
      });
  }

  const page: number = Number(url.searchParams.get('p') ?? 1);
  const domain = url.origin;

  const ids = await db[category].findMany({
      select: {
          id: true
      },
      skip: (page - 1) * sitemapPageSize,
      take: sitemapPageSize
  });

    let content = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset 
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xhtml="http://www.w3.org/1999/xhtml"
    >`;

    for (const { id } of ids) {
      const entityUrl = new URL(`${domain}/${category}/${id}`);

        content += `
        <url>
            <loc>${entityUrl.toString()}</loc>
            <xhtml:link
              rel="alternate"
              hreflang="en"
              href="${
                (() => {
                  const x = new URL(entityUrl);
                  x.searchParams.set('lang', 'en');
                  
                  return x.toString();
                })()
              }"/>
            <xhtml:link
              rel="alternate"
              hreflang="cs"
              href="${
                (() => {
                  const x = new URL(entityUrl);
                  x.searchParams.set('lang', 'cs');
                  
                  return x.toString();
                })()
              }"/>

            <changefreq>monthly</changefreq>
            <priority>0.8</priority>
        </url>
        `;
    }

    content += `
    </urlset>
    `;
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
  