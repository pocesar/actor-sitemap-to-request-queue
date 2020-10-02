# Sitemap to RequestQueue

Downloads a sitemap.xml files and append them to a RequestQueue of your choice.

## Example

```js
// this is your actor
Apify.main(async () => {
  const { proxyConfig } = await Apify.getInput();
  const requestQueue = await Apify.openRequestQueue();

  const run = (await Apify.setValue('SITEMAP-CALL', run)) || { runId: '', actorId: '' };

  if (!run.runId) {
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
      // Provide your own userData callback
      userData: ((request) => {
        return {
          label: request.url.includes('/item/') ? 'DETAILS' : 'CATEGORY'
        }
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
