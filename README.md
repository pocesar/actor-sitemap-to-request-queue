# Sitemap to RequestQueue

Downloads a sitemap.xml files and append them to a RequestQueue of your choice.

## Example

```js
// this is your actor
Apify.main(async () => {
  const { proxyConfig } = await Apify.getInput();
  const requestQueue = await Apify.openRequestQueue();

  // this might take a while!
  await Apify.call('pocesar/sitemap-to-request-queue', {
    // required proxy configuration, like { useApifyProxy: true, apifyProxyGroups: ['SHADER'] }
    proxyConfig,
    // use this for this run's RequestQueue, but can be a named one, or if you
    // leave it empty, it will be placed on the remote run RQ
    targetRQ: rq.queueId,
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
  });

  const crawler = new Apify.PuppeteerCrawler({
    requestQueue, // ready to use!
    //...
  });

  await crawler.run();
});
```

## License

Apache 2.0
