import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { Client } from 'elasticsearch';
import { DataAccessConfig } from '@terascope/data-access';
import * as utils from '../src/search/utils';

const logger = debugLogger('search-utils-spec');

describe('Search Utils', () => {
    describe('search', () => {
        it('should throw if no indexConfig is given', async () => {
            expect.hasAssertions();

            const client = fakeClient();
            // @ts-ignore
            const accessConfig: DataAccessConfig = {};

            try {
                await utils.makeSearchFn(client, accessConfig, logger);
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly for search');
            }
        });

        it('should throw if no index is given', async () => {
            expect.hasAssertions();

            const client = fakeClient();
            const accessConfig: DataAccessConfig = {
                // @ts-ignore
                other: true
            };

            try {
                await utils.makeSearchFn(client, accessConfig, logger);
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly for search');
            }
        });
    });
});

function fakeClient(): Client {
    const client: unknown = {};
    return client as Client;
}
