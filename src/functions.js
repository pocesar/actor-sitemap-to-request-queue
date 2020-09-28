const Apify = require('apify');

/**
 * The more concurrent writes to the RequestQueue,
 * the slower it gets but not exponentially slower, but pretty fast when doing one
 * at a time, that recalculates after each addRequest call
 *
 * Example on increasing concurrentWrites:
 *   1 = 1ms (2ms on addRequest call)
 *   3 = 3ms (6ms)
 *   10 = 10ms (20ms)
 *   20 = 20ms (40ms)
 *   30 = 30ms (60ms)
 *   100 = 200ms (400ms)
 *   1000 = 3000ms (6000ms)
 *
 * @param {Apify.RequestQueue} rq
 */
exports.RateLimitedRQ = (rq) => {
    let concurrentWrites = 0;

    const currentSleepValue = () => (concurrentWrites || 1) * (Math.round(Math.log10(concurrentWrites || 1)) || 1);

    return {
        /**
       * Gets the current interval sleep value in ms
       */
        currentSleepValue,
        /**
       * @param {Partial<Apify.RequestOptions>} request
       * @param {{ forefront: boolean }} [options]
       * @returns {Promise<Apify.QueueOperationInfo>}
       */
        async addRequest(request, options) {
            // racing conditions may happen
            if (concurrentWrites < 0) {
                concurrentWrites = 0;
            }
            concurrentWrites++;

            await Apify.utils.sleep(currentSleepValue());
            const added = await rq.addRequest(request, options);

            concurrentWrites--;
            await Apify.utils.sleep(currentSleepValue());

            if (concurrentWrites < 0) {
                concurrentWrites = 0;
            }

            return added;
        },
    };
};
