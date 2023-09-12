export const loader = async ({ request }) => {   
    const sitemapUrl = new URL('/sitemap.xml', request.url);

    return new Response(`Sitemap: ${sitemapUrl.toString()}`,{
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "encoding": "UTF-8"
        }
    });
}