import 'jest-extended';
import { addDays } from 'date-fns/addDays';
import {
    getTypeOf, isPlainObject, cloneDeep,
    isObjectEntity, parseJSON, fastCloneDeep,
    firstToLower, isKey,
} from '@terascope/core-utils';
import {
    DataEntity, DataEncoding, __IS_DATAENTITY_KEY,
    __ENTITY_METADATA_KEY, DataEntityMetadata,
} from '../src/entities/index.js';

describe('DataEntity', () => {
    const methods: readonly (keyof DataEntity)[] = [
        'getMetadata',
        'setMetadata',
        'getKey',
        'setKey',
        'getCreateTime',
        'getIngestTime',
        'setIngestTime',
        'getProcessTime',
        'setProcessTime',
        'getEventTime',
        'setEventTime',
        'getRawData',
        'setRawData',
        'toBuffer'
    ];

    const hiddenProps: string[] = [
        __IS_DATAENTITY_KEY,
        __ENTITY_METADATA_KEY
    ];

    const testCases = [
        [
            'when using new DataEntity',
            true, // use class
        ],
        [
            'when using make',
            false, // use make
        ],
    ];

    describe.each(testCases)('%s', (m, useClass) => {
        describe('when constructed with an object', () => {
            const data = {
                blue: 'green',
                metadata: {
                    uh: 'oh',
                },
                purple: 'pink',
            };
            const dataEntity = useClass ? new DataEntity(data) : DataEntity.make(data);

            it('should be a DataEntity', () => {
                expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();
            });

            it('should be to set an additional property', () => {
                expect(() => {
                    dataEntity.teal = 'neal';
                }).not.toThrow();
            });

            it('should have the input properties top-level', () => {
                expect(dataEntity).toHaveProperty('teal', 'neal');
                expect(dataEntity).toHaveProperty('blue', 'green');
                expect(dataEntity).toHaveProperty('metadata', {
                    uh: 'oh',
                });
                expect(dataEntity).toHaveProperty('purple', 'pink');
            });

            test.each(methods)('should be able to overwrite ->%s', (method) => {
                expect(() => {
                    dataEntity[method] = 'overwrite';
                }).toThrow();
            });

            test.each([
                ...methods,
                ...hiddenProps,
            ] as string[])('should NOT be able to enumerate ->%s', (key: string) => {
                expect(Object.keys(dataEntity)).not.toContain(key);

                for (const prop in dataEntity) {
                    expect(prop).not.toEqual(key);
                }
            });

            it('should not be able to override the DataEntity properties via an input', () => {
                const allProps = [
                    ...methods,
                    ...hiddenProps,
                ] as string[];

                const obj: Record<string, 'uhoh'> = {};
                for (const prop of allProps) {
                    obj[prop] = 'uhoh';
                }

                expect(() => {
                    useClass ? new DataEntity(obj) : DataEntity.make(obj);
                }).toThrow();
            });

            it('should only convert non-metadata properties with stringified', () => {
                const obj = fastCloneDeep(dataEntity);
                for (const method of methods) {
                    expect(obj).not.toHaveProperty(method as string);
                }

                for (const hiddenProp of hiddenProps) {
                    expect(obj).not.toHaveProperty(hiddenProp);
                }

                expect(obj).toHaveProperty('teal', 'neal');
                expect(obj).toHaveProperty('blue', 'green');
                expect(obj).toHaveProperty('metadata', {
                    uh: 'oh',
                });
                expect(obj).toHaveProperty('purple', 'pink');
            });

            it('should be able to get the metadata', () => {
                const metadata = dataEntity.getMetadata();
                expect(metadata).toHaveProperty('_createTime');
                expect(metadata._createTime).toBeNumber();
            });

            it('should be able to set and get a metadata property', () => {
                dataEntity.setMetadata('yellow', 'mellow');
                expect(dataEntity.getMetadata('yellow')).toEqual('mellow');
            });

            it('should be able to remove the metadata _key property', () => {
                dataEntity.setMetadata('_key', undefined);
                expect(dataEntity.getMetadata('_key')).toBeUndefined();
                expect(() => {
                    dataEntity.getKey();
                }).toThrow();
            });

            const cloneMethods = {
                fastCloneDeep,
                cloneDeep,
            };

            test.each(Object.keys(cloneMethods))(
                'should be able to %s and get a new metadata',
                (cloneMethod) => {
                    const newMetadata = { _key: 'hello' };
                    if (!isKey(cloneMethods, cloneMethod)) {
                        throw new Error(`${cloneMethod} key does not exist on object ${cloneMethods}`);
                    }
                    const cloned: any = cloneMethods[cloneMethod](dataEntity);
                    if (cloneMethod === 'cloneDeep') {
                        expect(DataEntity.isDataEntity(cloned)).toBeTrue();
                        expect(Object.keys(cloned)).not.toContain(['__IS_DATAENTITY_KEY', '__ENTITY_METADATA_KEY']);
                    } else {
                        expect(DataEntity.isDataEntity(cloned)).toBeFalse();
                    }

                    const newDataEntity = useClass
                        ? new DataEntity(cloned, newMetadata)
                        : DataEntity.make(cloned, newMetadata);

                    newDataEntity.setMetadata('test', 'hello');

                    expect(newDataEntity.getMetadata()).toMatchObject({
                        ...newMetadata,
                        test: 'hello'
                    });
                    const ogCreateTime = dataEntity.getMetadata('_createTime');
                    if (cloneMethod !== 'cloneDeep') {
                        expect(newDataEntity.getMetadata('_createTime')).not.toEqual(ogCreateTime);
                    }
                    expect(newDataEntity.getMetadata()).not.toMatchObject(dataEntity.getMetadata());
                }
            );

            test.each(Object.keys(cloneMethods))(
                'should be able to %s and get a new data',
                (cloneMethod) => {
                    if (!isKey(cloneMethods, cloneMethod)) {
                        throw new Error(`${cloneMethod} key does not exist on object ${cloneMethods}`);
                    }
                    const cloned = cloneMethods[cloneMethod](dataEntity);
                    const newDataEntity = useClass
                        ? new DataEntity(cloned)
                        : DataEntity.make(cloned);

                    newDataEntity.test = 'hello';

                    expect(newDataEntity).toMatchObject({
                        ...dataEntity,
                        test: 'hello'
                    });
                    expect(newDataEntity).not.toBe(dataEntity);
                }
            );

            it('should be able to get the metadata by key', () => {
                const _createTime = dataEntity.getMetadata('_createTime');
                expect(_createTime).toBeNumber();
            });

            it('should not be able to set _createTime', () => {
                expect(() => {
                    dataEntity.setMetadata('_createTime', 10);
                }).toThrow('Cannot set readonly metadata property _createTime');
            });

            it('should be return undefined if getting a metadata that does not exist', () => {
                expect(dataEntity.getMetadata('hello')).toBeUndefined();
            });
        });

        describe('when constructed with a DataEntity', () => {
            it('should either create a new instance or do nothing', () => {
                const og = new DataEntity({});
                const ogMetadata = og.getMetadata();
                if (useClass) {
                    const entity = new DataEntity(og);
                    expect(entity).not.toBe(og);
                    expect(entity.getMetadata()).not.toBe(ogMetadata);
                } else {
                    const entity = DataEntity.make(og);
                    expect(entity).toBe(og);
                    expect(entity.getMetadata()).toBe(ogMetadata);
                }
            });
        });

        describe('when constructed with a non-object', () => {
            it('should do nothing when called with null', () => {
                expect(() => {
                    if (useClass) {
                        new DataEntity(null);
                    } else {
                        // @ts-expect-error
                        DataEntity.make(null);
                    }
                }).not.toThrow();
            });

            it('should do nothing with called with undefined', () => {
                expect(() => {
                    if (useClass) {
                        // @ts-expect-error
                        new DataEntity();
                    } else {
                        // @ts-expect-error
                        DataEntity.make();
                    }
                }).not.toThrow();
            });

            it('should throw an error when called with an Array', () => {
                const arr = [{ hello: true }];
                expect(() => {
                    if (useClass) {
                        new DataEntity(arr);
                    } else {
                        DataEntity.make(arr);
                    }
                }).toThrow('Invalid data source, must be an object, got "Array"');
            });

            it('should throw an error when called with a Buffer', () => {
                const buf = Buffer.from(JSON.stringify({ hello: true }));
                expect(() => {
                    if (useClass) {
                        new DataEntity(buf);
                    } else {
                        DataEntity.make(buf);
                    }
                }).toThrow('Invalid data source, must be an object, got "Buffer"');
            });
        });

        describe('->getKey/->setKey', () => {
            const dataEntity = useClass ? new DataEntity({}) : DataEntity.make({});

            it('should throw an if there is no key', () => {
                expect(() => {
                    dataEntity.getKey();
                }).toThrow('No key has been set in the metadata');
            });

            it('should throw an when setting an invalid key', () => {
                expect(() => {
                    dataEntity.setKey('');
                }).toThrow('Invalid key to set in metadata');
            });

            it('should be able to set and get a string key', () => {
                expect(dataEntity.setKey('hello')).toBeNil();
                expect(dataEntity.getKey()).toBe('hello');
            });

            it('should be able to set and get a numeric key', () => {
                expect(dataEntity.setKey(1)).toBeNil();
                expect(dataEntity.getKey()).toBe(1);
            });

            it('should be able to set and get key with 0', () => {
                expect(dataEntity.setKey(0)).toBeNil();
                expect(dataEntity.getKey()).toBe(0);
            });
        });

        const cases: string[][] = [
            ['CreateTime', 'CreateTime'],
            ['EventTime', 'EventTime'],
            ['ProcessTime', 'ProcessTime'],
            ['IngestTime', 'IngestTime'],
        ];

        describe.each(cases)('->get%s/->set%s', (str) => {
            const dataEntity = useClass
                ? new DataEntity({})
                : DataEntity.make({});

            const getMethod = `get${str}` as keyof DataEntity;
            const setMethod = `set${str}` as keyof DataEntity;
            const field = `_${firstToLower(str)}` as keyof DataEntityMetadata;

            if (field !== '_createTime') {
                it(`should return undefined if ${field} does not exist`, () => {
                    expect(dataEntity[getMethod]()).toBeUndefined();
                });

                it('should throw if setting an invalid date', () => {
                    expect(() => {
                        dataEntity[setMethod](new Date('invalid-date'));
                    }).toThrow('Invalid date format');
                });

                it('should throw if setting an invalid date string', () => {
                    expect(() => {
                        dataEntity[setMethod]('invalid-date-string');
                    }).toThrow('Invalid date format');
                });

                it('should throw if setting an invalid unix time', () => {
                    expect(() => {
                        dataEntity[setMethod](Number.NaN);
                    }).toThrow('Invalid date format');
                });

                it('should be able to set a valid date', () => {
                    const date = new Date();
                    expect(dataEntity[setMethod](date)).toBeNil();
                    expect(dataEntity[getMethod]()).toBeDate();
                    expect(dataEntity[getMethod]()).toEqual(date);
                });

                it('should be able to set a valid date string', () => {
                    const date = new Date();
                    expect(dataEntity[setMethod](date.toISOString())).toBeNil();
                    const result = dataEntity[getMethod]() as Date;
                    expect(result).toBeDate();
                    expect(result.toISOString()).toEqual(date.toISOString());
                });

                it('should be able to set a valid unix time', () => {
                    const date = new Date();
                    expect(dataEntity[setMethod](date.getTime())).toBeNil();
                    const result = dataEntity[getMethod]() as Date;
                    expect(result).toBeDate();
                    expect(result.toISOString()).toEqual(date.toISOString());
                });

                it('should be able default now', () => {
                    expect(dataEntity[setMethod]()).toBeNil();
                    const result = dataEntity[getMethod]() as Date;
                    expect(result).toBeDate();
                });

                it('should be able to set a valid date by date math', () => {
                    const date = 'now+2d';
                    expect(dataEntity[setMethod](date)).toBeNil();
                    const twoDaysFromNow = addDays(new Date().setUTCHours(0, 0, 0, 0), 2);
                    const result = new Date((dataEntity[getMethod]()).setUTCHours(0, 0, 0, 0));
                    expect(result).toBeDate();
                    expect(result.toISOString()).toEqual(twoDaysFromNow.toISOString());
                });
            } else {
                it('should return a date for valid time', () => {
                    expect(dataEntity.getCreateTime()).toBeDate();
                });

                it(`should not have DataEntity->${setMethod}`, () => {
                    expect(dataEntity[setMethod]).toBeUndefined();
                });
            }
        });

        describe('->setRawData/->getRawData', () => {
            const dataEntity = useClass ? new DataEntity({}) : DataEntity.make({});
            const initialBuffer = Buffer.from('HI');
            const updatedBuffer = Buffer.from('HELLO');

            it('should throw an error if no data is set', () => {
                expect(() => dataEntity.getRawData()).toThrow();
            });

            it('should be able to initial set the raw data', () => {
                expect(dataEntity.setRawData(initialBuffer)).toBeNil();
            });

            it('should have not mutated the initial buffer', () => {
                expect(dataEntity.getRawData()).toBe(initialBuffer);
                expect(dataEntity.getRawData().toString('utf8'))
                    .toEqual('HI');
            });

            it('should be able to update the buffer', () => {
                expect(dataEntity.setRawData(updatedBuffer)).toBeNil();
                expect(dataEntity.getRawData()).not.toBe(initialBuffer);
                expect(Buffer.isBuffer(dataEntity.getRawData())).toBeTrue();

                expect(dataEntity.getRawData()).toBe(updatedBuffer);
                expect(dataEntity.getRawData().toString('utf8'))
                    .toEqual('HELLO');
            });

            it('should be able to mutate the raw data', () => {
                const buf = dataEntity.getRawData();
                buf.write('HOWDY', 'utf8');
                expect(updatedBuffer.toString('utf8')).toEqual('HOWDY');
            });

            it('should be able to set the data to null', () => {
                expect(dataEntity.setRawData(null)).toBeNil();
                expect(() => dataEntity.getRawData()).toThrow();
            });
        });

        describe('->toBuffer', () => {
            const data = { foo: 'bar' };
            const metadata = { hello: 'there' };
            const dataEntity = useClass
                ? new DataEntity(data, metadata)
                : DataEntity.make(data, metadata);

            const dataStr = JSON.stringify({ other: 'data' });
            dataEntity.setRawData(dataStr);

            describe('when using encoding type JSON', () => {
                it('should be convertable to a buffer', () => {
                    const buf = dataEntity.toBuffer({
                        _encoding: 'json' as DataEncoding
                    });
                    expect(Buffer.isBuffer(buf)).toBeTrue();
                    const obj = parseJSON(buf);

                    expect(obj).toEqual({ foo: 'bar' });
                });

                it('should be able to default to JSON', () => {
                    const buf = dataEntity.toBuffer();
                    expect(Buffer.isBuffer(buf)).toBeTrue();
                    const obj = parseJSON(buf);

                    expect(obj).toEqual({ foo: 'bar' });
                });
            });

            describe('when using encoding type RAW', () => {
                it('should be able to return the data', () => {
                    const buf = dataEntity.toBuffer({
                        _encoding: 'raw' as DataEncoding
                    });
                    expect(Buffer.isBuffer(buf)).toBeTrue();
                    const obj = parseJSON(buf);

                    expect(obj).toEqual({ other: 'data' });
                });
            });

            it('should fail if given an invalid encoding', () => {
                expect(() => {
                    // @ts-expect-error
                    dataEntity.toBuffer({ _encoding: 'baz' });
                }).toThrow('Unsupported encoding type, got "baz"');
            });
        });
    });

    describe('#make', () => {
        describe('when wrapped', () => {
            it('should return a single data entity', () => {
                const dataEntity = DataEntity.make({
                    hello: 'there',
                });
                expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();
                expect(dataEntity).toHaveProperty('hello', 'there');
            });
        });

        describe('when not wrapped', () => {
            it('should return a single data entity', () => {
                const dataEntity = DataEntity.make(
                    DataEntity.make({
                        hello: 'there',
                    })
                );
                expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();
                expect(dataEntity).toHaveProperty('hello', 'there');
            });
        });
    });

    describe('#makeArray', () => {
        it('should return an array with a single data entity', () => {
            const dataEntities = DataEntity.makeArray({
                hello: 'there',
            });

            expect(DataEntity.isDataEntityArray(dataEntities)).toBeTrue();
            expect(dataEntities).toBeArrayOfSize(1);
            expect(dataEntities[0]).toHaveProperty('hello', 'there');

            expect(DataEntity.makeArray(dataEntities)).toEqual(dataEntities);
        });

        it('should return a batch of data entities', () => {
            const dataEntities = DataEntity.makeArray([
                {
                    hello: 'there',
                },
                {
                    howdy: 'partner',
                },
            ]);

            expect(DataEntity.isDataEntityArray(dataEntities)).toBeTrue();
            expect(dataEntities).toBeArrayOfSize(2);
            expect(dataEntities[0]).toHaveProperty('hello', 'there');
            expect(dataEntities[1]).toHaveProperty('howdy', 'partner');

            expect(DataEntity.makeArray(dataEntities)).toEqual(dataEntities);
        });
    });

    describe('#fork', () => {
        describe('when withData is not set (it should default to true)', () => {
            it('should create a new instance and copy the data', () => {
                const entity = new DataEntity({ a: 1 }, { b: 2 });
                const forked = DataEntity.fork(entity);
                expect(forked).toHaveProperty('a', 1);
                const b = forked.getMetadata('b');
                expect(b).toBe(2);
            });
        });

        describe('when withData is true', () => {
            it('should create a new instance and copy the data', () => {
                const entity = new DataEntity({ a: 1 }, { b: 2 });
                const forked = DataEntity.fork(entity, true);
                expect(forked.a).toBe(1);
                expect(forked.getMetadata()).toHaveProperty('b', 2);
            });
        });

        describe('when withData is false', () => {
            it('should create a new instance and copy the data', () => {
                const entity = new DataEntity({ a: 1 }, { b: 2 });
                const forked = DataEntity.fork(entity, false);
                expect(forked).not.toHaveProperty('a', 1);
                expect(forked.getMetadata('b')).toBe(2);
            });
        });

        it('should throw if not given a data entity', () => {
            expect(() => DataEntity.fork(null as any)).toThrow(/Invalid input to fork/);
        });
    });

    describe('#isDataEntity', () => {
        it('should return false when given object', () => {
            expect(DataEntity.isDataEntity({})).toBeFalse();
            expect({}).not.toBeInstanceOf(DataEntity);
        });

        it('should return false when given null', () => {
            expect(DataEntity.isDataEntity(null)).toBeFalse();
        });

        it('should return false when given array of object', () => {
            expect(DataEntity.isDataEntity([{}])).toBeFalse();
            expect([{}]).not.toBeInstanceOf(DataEntity);
        });

        it('should return true when given a DataEntity', () => {
            expect(DataEntity.isDataEntity(DataEntity.make({}))).toBeTrue();
            expect(DataEntity.make({})).toBeInstanceOf(DataEntity);
        });

        it('should return false when given an array of DataEntities', () => {
            const input = DataEntity.makeArray([{ hi: true }, { hi: true }]);
            expect(DataEntity.isDataEntity(input)).toBeFalse();
        });

        it('should return false when called with another type of DataEntity', () => {
            class OtherEntity extends DataEntity {
            }
            const entity = new DataEntity({ og: true });
            expect(entity).not.toBeInstanceOf(OtherEntity);
        });
    });

    describe('#isDataEntityArray', () => {
        it('should return false when given object', () => {
            expect(DataEntity.isDataEntityArray({})).toBeFalse();
        });

        it('should return false when given null', () => {
            expect(DataEntity.isDataEntityArray(null)).toBeFalse();
        });

        it('should return false when given array of object', () => {
            expect(DataEntity.isDataEntityArray([{}])).toBeFalse();
        });

        it('should return true when given an array of DataEntities', () => {
            const input = DataEntity.makeArray([{ hi: true }, { hi: true }]);
            expect(DataEntity.isDataEntityArray(input)).toBeTrue();
        });

        it('should return true when given an empty array', () => {
            expect(DataEntity.isDataEntityArray([])).toBeTrue();
        });
    });

    describe('#getMetadata', () => {
        it('should be able to get metadata from object', () => {
            const input = { hello: true };
            expect(DataEntity.getMetadata(input, 'hello')).toBeTrue();
            expect(DataEntity.getMetadata(input, 'hi')).toBeNil();
        });

        it('should be able to get metadata from a DataEntity', () => {
            const input = DataEntity.make({ name: 'Batman' }, { hello: true });
            expect(DataEntity.getMetadata(input, 'hello')).toBeTrue();
            expect(DataEntity.getMetadata(input, 'hi')).toBeNil();
        });

        it('should not be able to get metadata from null', () => {
            expect(DataEntity.getMetadata(null, 'hi')).toBeNil();
        });
    });

    describe('#fromBuffer', () => {
        it('should throw an error if given an unsupported encoding', () => {
            const buf = Buffer.from(JSON.stringify({ hi: 'there' }));
            expect(() => {
                DataEntity.fromBuffer(buf, {
                    _op: 'test',
                    _encoding: 'crazy' as any,
                });
            }).toThrow('Unsupported encoding type, got "crazy"');
        });

        describe('when encoding is type JSON', () => {
            it('should be able to create a DataEntity from a JSON buffer', () => {
                const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
                const entity = DataEntity.fromBuffer(
                    buf,
                    {
                        _op: 'baz',
                        _encoding: DataEncoding.JSON,
                    },
                    {
                        howdy: 'there',
                    }
                );

                expect(entity.foo).toEqual('bar');
                expect(entity.getMetadata('howdy')).toEqual('there');
            });

            it('should be able to create a DataEntity from a json string', () => {
                const str = JSON.stringify({ foo: 'bar' });
                const entity = DataEntity.fromBuffer(
                    str,
                    {
                        _op: 'baz',
                        _encoding: DataEncoding.JSON,
                    },
                    {
                        howdy: 'there',
                    }
                );

                expect(entity.foo).toEqual('bar');
                expect(entity.getMetadata('howdy')).toEqual('there');
            });

            it('should be able handle to default to JSON', () => {
                const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
                const entity = DataEntity.fromBuffer(buf);

                expect(entity.foo).toEqual('bar');
            });

            it('should throw an error if given an invalid buffer', () => {
                const buf = Buffer.from('hello:there');
                expect(() => {
                    DataEntity.fromBuffer(buf, {
                        _op: 'test',
                        _encoding: DataEncoding.JSON,
                    });
                }).toThrow();
            });

            it('should throw an error if given an invalid input', () => {
                const input = 5 as any;
                expect(() => {
                    DataEntity.fromBuffer(input, {
                        _op: 'test',
                        _encoding: DataEncoding.JSON,
                    });
                }).toThrow();
            });
        });

        describe('when encoding is type RAW', () => {
            it('should be able to create a DataEntity from a buffer', () => {
                const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
                const entity = DataEntity.fromBuffer(
                    buf,
                    {
                        _op: 'baz',
                        _encoding: DataEncoding.RAW,
                    },
                    {
                        howdy: 'there',
                    }
                );

                expect(entity.getRawData()).toEqual(buf);
                expect(entity.getRawData()).toBe(buf);
                expect(Buffer.isBuffer(entity.getRawData())).toBeTrue();

                expect(entity).not.toHaveProperty('data');
                expect(entity.getMetadata('howdy')).toEqual('there');
                expect(entity.getMetadata('howdy')).toEqual('there');
            });

            it('should be able to create a DataEntity from a string', () => {
                const str = JSON.stringify({ foo: 'bar' });
                const entity = DataEntity.fromBuffer(
                    str,
                    {
                        _op: 'baz',
                        _encoding: DataEncoding.RAW,
                    },
                    {
                        howdy: 'there',
                    }
                );

                expect(entity.getRawData().toString('utf8')).toEqual(str);
                expect(Buffer.isBuffer(entity.getRawData())).toBeTrue();

                expect(entity).not.toHaveProperty('data');
                expect(entity.getMetadata('howdy')).toEqual('there');
                expect(entity.getMetadata('howdy')).toEqual('there');
            });

            it('should throw an error if given an invalid input', () => {
                const input = 1 as any;
                expect(() => {
                    DataEntity.fromBuffer(input, {
                        _op: 'test',
                        _encoding: DataEncoding.RAW,
                    });
                }).toThrow();
            });
        });
    });

    describe('interactions with core-utils functions', () => {
        class TestEntity extends DataEntity {
            test = true;
        }

        describe('getTypeOf', () => {
            it('should return the correct kind', () => {
                expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
                expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');
                expect(getTypeOf(new TestEntity({}))).toEqual('TestEntity');
            });
        });

        describe('isPlainObject', () => {
            it('should correctly detect the an object type', () => {
                expect(isPlainObject(new DataEntity({}))).toBeFalse();
            });
        });

        describe('isObjectEntity', () => {
            describe('when given a DataEntity', () => {
                it('should return true', () => {
                    const data = new DataEntity({});
                    expect(isObjectEntity(data)).toBeTrue();
                });
            });
        });

        describe('cloneDeep', () => {
            it('should clone deep a DataEntity', () => {
                const input = new DataEntity({ a: 1, b: { c: 2 } }, { _key: 'foo' });
                const buf = Buffer.from('foo-bar');
                input.setRawData(buf);
                const output = cloneDeep(input);

                expect(output).toBeInstanceOf(DataEntity);
                // Test data mutation
                expect(output).not.toBe(input);
                expect(output.b).not.toBe(input.b);

                output.b.c = 3;

                expect(output.b.c).toEqual(3);
                expect(input.b.c).toEqual(2);

                // Test metadata mutation
                expect(output.getMetadata('_key')).toEqual('foo');

                output.setMetadata('_key', 'bar');

                expect(output.getMetadata('_key')).toEqual('bar');
                expect(input.getMetadata('_key')).toEqual('foo');

                // Test raw data mutation
                expect(output.getRawData()).not.toBe(input.getRawData());
                expect(output.getRawData().toString('utf-8'))
                    .toEqual(input.getRawData().toString('utf-8'));

                output.setRawData(Buffer.from('changed'));

                expect(output.getRawData().toString('utf-8')).toEqual('changed');
                expect(input.getRawData().toString('utf-8')).toEqual('foo-bar');
            });
        });
    });
});
