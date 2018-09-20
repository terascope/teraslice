import { TestContext, newTestExecutionConfig } from '@terascope/teraslice-types';
import { Schema } from 'convict';
import 'jest-extended'; // require for type definitions
import { OperationCore } from '../../../src/operations/core/operation-core';
import { DataEntity } from '../../../src';

describe('OperationCore', () => {
    describe('when constructed', () => {
        let operation: OperationCore;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const exConfig = newTestExecutionConfig();
            exConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = exConfig.operations[0];
            operation = new OperationCore(context, opConfig, exConfig);
        });

        describe('->initialize', () => {
            it('should resolve undefined', () => {
                return expect(operation.initialize()).resolves.toBeUndefined();
            });
        });

        describe('->shutdown', () => {
            it('should resolve undefined', () => {
                return expect(operation.shutdown()).resolves.toBeUndefined();
            });
        });

        describe('->onSliceInitialized', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceInitialized('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->onSliceStarted', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceStarted('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->onSliceFinalizing', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceFinalizing('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->onSliceFinished', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceFinished('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->onSliceFailed', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceFailed('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->onSliceRetry', () => {
            it('should resolve undefined', () => {
                return expect(operation.onSliceRetry('slice-id')).resolves.toBeUndefined();
            });
        });

        describe('->wrapData', () => {
            it('should return a single data entity', () => {
                const dataEntity = operation.wrapData({
                    hello: 'there',
                });
                expect(dataEntity).toBeInstanceOf(DataEntity);
                expect(dataEntity).toHaveProperty('hello', 'there');
            });

            it('should return a batch of data entities', () => {
                const dataEntities = operation.wrapData([
                    {
                        hello: 'there',
                    },
                    {
                        howdy: 'partner',
                    },
                ]);
                expect(dataEntities).toBeArrayOfSize(2);
                expect(dataEntities[0]).toBeInstanceOf(DataEntity);
                expect(dataEntities[0]).toHaveProperty('hello', 'there');
                expect(dataEntities[1]).toBeInstanceOf(DataEntity);
                expect(dataEntities[1]).toHaveProperty('howdy', 'partner');
            });
        });

        describe('->ensureData', () => {
            describe('when wrapped', () => {
                it('should return a single data entity', () => {
                    const dataEntity = operation.ensureData({
                        hello: 'there',
                    });
                    expect(dataEntity).toBeInstanceOf(DataEntity);
                    expect(dataEntity).toHaveProperty('hello', 'there');
                });

                it('should return a batch of data entities', () => {
                    const dataEntities = operation.ensureData([
                        {
                            hello: 'there',
                        },
                        {
                            howdy: 'partner',
                        },
                    ]);
                    expect(dataEntities).toBeArrayOfSize(2);
                    expect(dataEntities[0]).toBeInstanceOf(DataEntity);
                    expect(dataEntities[0]).toHaveProperty('hello', 'there');
                    expect(dataEntities[1]).toBeInstanceOf(DataEntity);
                    expect(dataEntities[1]).toHaveProperty('howdy', 'partner');
                });
            });
        });

        describe('when not wrapped', () => {
            it('should return a single data entity', () => {
                const dataEntity = operation.ensureData(operation.wrapData({
                    hello: 'there',
                }));
                expect(dataEntity).toBeInstanceOf(DataEntity);
                expect(dataEntity).toHaveProperty('hello', 'there');
            });

            it('should return a batch of data entities', () => {
                const dataEntities = operation.ensureData(operation.wrapData([
                    {
                        hello: 'there',
                    },
                    {
                        howdy: 'partner',
                    },
                ]));
                expect(dataEntities).toBeArrayOfSize(2);
                expect(dataEntities[0]).toBeInstanceOf(DataEntity);
                expect(dataEntities[0]).toHaveProperty('hello', 'there');
                expect(dataEntities[1]).toBeInstanceOf(DataEntity);
                expect(dataEntities[1]).toHaveProperty('howdy', 'partner');
            });
        });
    });
});

describe('#validate', () => {
    it('should succeed when given invalid data', () => {
        const schema: Schema<any> = {
            example: {
                default: 'howdy',
                doc: 'some example value',
                format: 'required_String',
            }
        };

        return expect(OperationCore.validate(schema, {
            _op: 'hello',
            example: 'hi'
        })).resolves.toEqual({
            _op: 'hello',
            example: 'hi'
        });
    });

    it('should fail when given invalid data', () => {
        const schema: Schema<any> = {
            example: {
                default: 'hi',
                doc: 'some example value',
                format: 'required_String',
            }
        };

        return expect(OperationCore.validate(schema, {})).rejects.toThrow();
    });
});
