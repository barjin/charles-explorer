export const loader = async ({ request }) => {   
    const sitemapUrl = new URL('/sitemap.xml', request.url);

    return new Response(`Sitemap: ${sitemapUrl.toString()}`,{
        status: 200,
        headers: {
          "Content-Type": "application/xml",
          "xml-version": "1.0",
          "encoding": "UTF-8"
        }
    });
}