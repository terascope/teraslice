import { ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import { debugLogger } from '@terascope/utils';
import opensearch from '@opensearch-project/opensearch';
import API from '../dist/src/index.js';

const logger = debugLogger('retry spec');
const port = '1111';

const { data } = ElasticsearchTestHelpers.EvenDateData;

const body = ElasticsearchTestHelpers.formatUploadData('retry-error-test', data);

describe('retry behavior', () => {
    it('will work with opensearch when connection cannot be established', async () => {
        expect.assertions(4);
        const client = new opensearch.Client({ node: `http://127.0.0.1:${port}` });
        const { isErrorRetryable } = API(client, logger);

        try {
            await client.bulk({ body });
            throw Error('should have thrown');
        } catch (err) {
            expect(err).toBeDefined();
            expect(isErrorRetryable(err)).toBeTrue();
        }

        // we try again as we have seen the second call be marked as unretryable
        try {
            await client.bulk({ body });
            throw Error('should have thrown');
        } catch (err) {
            expect(err).toBeDefined();
            expect(isErrorRetryable(err)).toBeTrue();
        }
    });
});
