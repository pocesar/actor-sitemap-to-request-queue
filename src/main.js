const Apify = require('apify');
const { RateLimitedRQ } = require('./functions');

const { log } = Apify.utils;

Apify.main(async () => {
    const { startUrls, targetRQ, proxyConfig, userData } = await Apify.getInput();

    const rq = await Apify.openRequestQueue(targetRQ, targetRQ ? { forceCloud: true } : undefined);
    const requestList = await Apify.openRequestList('STARTURLS', startUrls);

    const proxyConfiguration = await Apify.createProxyConfiguration({
        ...proxyConfig,
    });

    log.info(`Will parse ${requestList.length()} sitemaps`);

    const evaled = userData && typeof userData === 'string'
        ? eval(`() => { return (${userData}) }`)()
        : (request) => request.userData;

    const rateLimited = RateLimitedRQ(rq);

    const sitemapCrawler = new Apify.CheerioCrawler({
        requestList,
        requestTimeoutSecs: 120,
        handlePageTimeoutSecs: 3600,
        additionalMimeTypes: [
            'application/xml',
        ],
        useSessionPool: true,
        proxyConfiguration,
        ignoreSslErrors: true,
        maxRequestRetries: 4,
        handlePageFunction: async ({ request, $ }) => {
            log.info(`Parsing ${request.url}`);

            const urls = $('urlset url loc')
                .map((_, el) => $(el).text())
                .get();

            let unique = 0;

            for (const url of urls) {
                const r = await rateLimited.addRequest({
                    url,
                    userData: evaled(request),
                });

                if (!r.wasAlreadyPresent) {
                    unique++;
                }
            }

            log.info(`Added ${unique} urls`);
        },
    });

    await sitemapCrawler.run();
});
