import { debugLogger, chunk, pMap } from '@terascope/utils';
import elasticsearchAPI from '../index';
import { data } from './helpers/data';
import { TEST_INDEX_PREFIX } from './helpers/config';
import {
    makeClient, cleanupIndex,
    waitForData, formatUploadData
} from './helpers/elasticsearch';

const THREE_MINUTES = 3 * 60 * 1000;

jest.setTimeout(THREE_MINUTES + 30000);

describe('bulkSend can work with congested queues', () => {
    const logger = debugLogger('congested_test');
    const index = `${TEST_INDEX_PREFIX}_congested_queues_`;

    let client;
    let api;

    beforeAll(async () => {
        client = await makeClient();
        await cleanupIndex(client, index);
        api = elasticsearchAPI(client, logger);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('can get correct data even with congested queues', async () => {
        const chunkedData = chunk(data, 50);

        await pMap(chunkedData, async (cData) => {
            const formattedData = formatUploadData(index, cData);
            return api.bulkSend(formattedData);
        }, { concurrency: 9 });

        await waitForData(client, index, data.length, logger, THREE_MINUTES);
    });
});
