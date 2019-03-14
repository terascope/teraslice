import 'jest-extended';
import { TSError } from '@terascope/utils';
import { Spaces } from '../../src/models/spaces';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Spaces', () => {
    const client = makeClient();
    const spaces = new Spaces(client, {
        namespace: 'test'
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
                name: 'hello',
                views: ['hello'],
                roles: ['howdy'],
                data_type: 'test-space-creation-data-type',
                metadata: {
                    a: {
                        b: {
                            c: 1
                        }
                    },
                    example: true
                }
            });

            expect(created).toHaveProperty('name');
            expect(created).toHaveProperty('views', ['hello']);
            expect(created).toHaveProperty('roles', ['howdy']);
            expect(created).toHaveProperty('metadata', {
                a: {
                    b: {
                        c: 1
                    }
                },
                example: true
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
