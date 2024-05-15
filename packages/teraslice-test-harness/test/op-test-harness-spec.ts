import 'jest-extended';
import {
    DataEntity, OpConfig, TestClientConfig,
    debugLogger
} from '@terascope/job-components';
import { OpTestHarness } from '../src';
import transformer from './fixtures/asset/transformer/processor.js';

describe('OpTestHarness', () => {
    const logger = debugLogger('OpTestHarness');

    const clients: TestClientConfig[] = [
        {
            type: 'example',
            createClient: async () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                },
                logger
            })
        }
    ];

    describe('when given a valid job config', () => {
        const opHarness = new OpTestHarness(transformer, { clients });

        it('should be able to call initialize', () => {
            const opConfig: OpConfig = {
                _op: 'transformer',
                action: 'set',
                key: 'greeting',
                setValue: 'hello',
            };
            return expect(opHarness.initialize({
                opConfig,
                type: 'processor'
            })).resolves.toBeNil();
        });

        it('should have an operation', () => {
            expect(opHarness.operation).not.toBeNil();
        });

        it('should be able to call run', async () => {
            const result = await opHarness.run([
                {
                    example: true
                }
            ]) as DataEntity[];
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
            expect(result[0]).toHaveProperty('greeting', 'hello');
        });

        it('should be able to call shutdown', () => expect(opHarness.shutdown()).resolves.toBeNil());
    });
});
