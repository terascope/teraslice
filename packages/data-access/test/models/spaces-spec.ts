import 'jest-extended';
import { TSError } from '@terascope/utils';
import { Spaces } from '../../src/models/spaces';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Spaces', () => {
    const client = makeClient();
    const spaces = new Spaces(client, {
        namespace: 'test',
    });

    beforeAll(async () => {
        await cleanupIndex(spaces);
        return spaces.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(spaces);
        return spaces.shutdown();
    });

    describe('when testing space creation', () => {
        it('should be able to create a space', async () => {
            const created = await spaces.create({
                client_id: 1,
                type: 'search',
                name: 'hello',
                endpoint: '-HOWDY# 123',
                views: ['hello'],
                roles: ['howdy'],
                data_type: 'test-space-creation-data-type',
                config: {
                    index: 'hello',
                },
            });

            expect(created).toHaveProperty('name', 'hello');
            expect(created).toHaveProperty('type', 'search');
            expect(created).toHaveProperty('endpoint', 'howdy-123');
            expect(created).toHaveProperty('views', ['hello']);
            expect(created).toHaveProperty('roles', ['howdy']);
            expect(created).toHaveProperty('config', {
                index: 'hello',
                connection: 'default',
                max_query_size: 10000,
                preserve_index_name: false,
                require_query: false,
                enable_history: false,
                sort_dates_only: false,
            });

            const fetched = await spaces.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });

    describe('when testing spaces updates', () => {
        it('should throw when adding a views to space without a space id', async () => {
            expect.hasAssertions();

            try {
                await spaces.addViewsToSpace('', []);
            } catch (err) {
                expect(err.message).toEqual('Missing space to attaching views to');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        it('should throw when removing a sapce to role without a space id', async () => {
            expect.hasAssertions();

            try {
                await spaces.removeViewsFromSpace('', []);
            } catch (err) {
                expect(err.message).toEqual('Missing space to remove views from');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });
    });
});
