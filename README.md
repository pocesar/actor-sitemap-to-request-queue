# Sitemap to RequestQueue

Downloads a sitemap.xml files and append them to a RequestQueue of your choice.

## Example

```js
// this is your actor
Apify.main(async () => {
  const { proxyConfig } = await Apify.getInput();
  const requestQueue = await Apify.openRequestQueue();

  // this is needed so it doesn't execute everytime there's a migration
  const run = (await Apify.getValue('SITEMAP-CALL', run)) || { runId: '', actorId: '' };

  if (!run || !run.runId) {
    // this might take a while!
    const runCall = await Apify.call('pocesar/sitemap-to-request-queue', {
      // required proxy configuration, like { useApifyProxy: true, apifyProxyGroups: ['SHADER'] }
      proxyConfig,
      // use this for this run's RequestQueue, but can be a named one, or if you
      // leave it empty, it will be placed on the remote run RQ
      targetRQ: requestQueue.queueId,
      // required sitemaps
      startUrls: [{
        url: "http://example.com/sitemap1.xml",
        userData: {
          label: "DETAILS" // userData will passthrough
        }
      }, {
        url: "http://example.com/sitemap2.xml",
      }],
      // Provide your own transform callback to filter or alter the request before adding it to the queue
      transform: ((request) => {
        if (!request.url.includes('detail')) {
          return null;
        }

        request.userData.label = request.url.includes('/item/') ? 'DETAILS' : 'CATEGORY';

        return request;
      }).toString()
    }, { waitSecs: 0 });

    run.runId = runCall.id;
    run.actorId = runCall.actId;

    await Apify.setValue('SITEMAP-CALL', run);
  }

  await Apify.utils.waitForRunToFinish(run);

  const crawler = new Apify.PuppeteerCrawler({
    requestQueue, // ready to use!
    //...
  });

  await crawler.run();
});
```

## License

Apache 2.0
