import 'jest-extended';
import { DataEntity, OpConfig } from '@terascope/job-components';
import { OpTestHarness } from '../src/index.js';
import transformer from './fixtures/asset/transformer/index.js';

describe('OpTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                }
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
