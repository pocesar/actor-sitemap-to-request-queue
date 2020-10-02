const Apify = require('apify');
const { RateLimitedRQ } = require('./functions');

const { log } = Apify.utils;

Apify.main(async () => {
    const { startUrls, targetRQ, proxyConfig, transform } = await Apify.getInput();

    const rq = await Apify.openRequestQueue(targetRQ, targetRQ ? { forceCloud: true } : undefined);
    const requestList = await Apify.openRequestList('STARTURLS', startUrls);

    const proxyConfiguration = await Apify.createProxyConfiguration({
        ...proxyConfig,
    });

    log.info(`Will parse ${requestList.length()} sitemaps`);

    const evaled = transform && typeof transform === 'string'
        ? eval(`() => { return (${transform}) }`)()
        : (request) => request;

    const rateLimited = RateLimitedRQ(rq);
    let total = 0;

    const sitemapCrawler = new Apify.CheerioCrawler({
        requestList,
        requestTimeoutSecs: 120,
        handlePageTimeoutSecs: 3600,
        additionalMimeTypes: [
            'application/xml',
            'text/xml',
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
                const req = evaled(new Apify.Request({ url, userData: { ...request.userData } }));

                if (req && req instanceof Apify.Request) {
                    const r = await rateLimited.addRequest(req);

                    if (!r.wasAlreadyPresent) {
                        unique++;
                        total++;
                    }
                }
            }

            log.info(`Added ${unique} urls from ${request.url}`);
        },
    });

    await sitemapCrawler.run();

    log.info(`Added ${total} total urls`);
});
