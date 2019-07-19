import 'jest-extended'; // require for type definitions
import { DataEntity, parseJSON } from '../src';

describe('DataEntity', () => {
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

    // @ts-ignore
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
                dataEntity.teal = 'neal';
            });

            it('should have the input properties top-level', () => {
                expect(dataEntity).toHaveProperty('teal', 'neal');
                expect(dataEntity).toHaveProperty('blue', 'green');
                expect(dataEntity).toHaveProperty('metadata', {
                    uh: 'oh',
                });
                expect(dataEntity).toHaveProperty('purple', 'pink');
            });

            it('should not be able to enumerate metadata methods', () => {
                const keys = Object.keys(dataEntity);
                expect(keys).not.toInclude('getMetadata');
                expect(keys).not.toInclude('setMetadata');
                expect(keys).not.toInclude('toBuffer');

                // tslint:disable-next-line: forin
                for (const prop in dataEntity) {
                    expect(prop).not.toEqual('getMetadata');
                    expect(prop).not.toEqual('setMetadata');
                    expect(prop).not.toEqual('toBuffer');
                }
            });

            it('should only convert non-metadata properties with stringified', () => {
                const object = JSON.parse(JSON.stringify(dataEntity));
                expect(object).not.toHaveProperty('getMetadata');
                expect(object).not.toHaveProperty('setMetadata');
                expect(object).not.toHaveProperty('toBuffer');

                expect(object).toHaveProperty('teal', 'neal');
                expect(object).toHaveProperty('blue', 'green');
                expect(object).toHaveProperty('metadata', {
                    uh: 'oh',
                });
                expect(object).toHaveProperty('purple', 'pink');
            });

            it('should be able to get the metadata', () => {
                const metadata = dataEntity.getMetadata();
                expect(metadata).toHaveProperty('_createTime');
            });

            it('should be able to set and get a metadata property', () => {
                dataEntity.setMetadata('yellow', 'mellow');
                expect(dataEntity.getMetadata('yellow')).toEqual('mellow');
            });

            it('should be able to get the metadata by key', () => {
                const _createTime = dataEntity.getMetadata('_createTime');
                expect(_createTime).toBeNumber();
            });

            it('should not be able to set _createTime', () => {
                expect(() => {
                    dataEntity.setMetadata('_createTime', 'hello');
                }).toThrowError('Cannot set readonly metadata property _createTime');
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
                        // @ts-ignore
                        new DataEntity(null);
                    } else {
                        // @ts-ignore
                        DataEntity.make(null);
                    }
                }).not.toThrow();
            });

            it('should do nothing with called with undefined', () => {
                expect(() => {
                    if (useClass) {
                        // @ts-ignore
                        new DataEntity();
                    } else {
                        // @ts-ignore
                        DataEntity.make();
                    }
                }).not.toThrow();
            });

            it('should throw an error when called with an Array', () => {
                const arr = [{ hello: true }];
                expect(() => {
                    if (useClass) {
                        // @ts-ignore
                        new DataEntity(arr);
                    } else {
                        // @ts-ignore
                        DataEntity.make(arr);
                    }
                }).toThrowError('Invalid data source, must be an object, got "Array"');
            });

            it('should throw an error when called with a Buffer', () => {
                const buf = Buffer.from(JSON.stringify({ hello: true }));
                expect(() => {
                    if (useClass) {
                        // @ts-ignore
                        new DataEntity(buf);
                    } else {
                        // @ts-ignore
                        DataEntity.make(buf);
                    }
                }).toThrowError('Invalid data source, must be an object, got "Buffer"');
            });
        });

        describe('->toBuffer', () => {
            const data = { foo: 'bar' };
            const metadata = { hello: 'there' };
            const dataEntity = useClass ? new DataEntity(data, metadata) : DataEntity.make(data);

            it('should be convertable to a buffer', () => {
                const buf = dataEntity.toBuffer({ _encoding: 'json' });
                expect(Buffer.isBuffer(buf)).toBeTrue();
                const obj = parseJSON(buf);

                expect(obj).toEqual({ foo: 'bar' });
            });

            it('should be able to handle no config', () => {
                const buf = dataEntity.toBuffer();
                expect(Buffer.isBuffer(buf)).toBeTrue();
                const obj = parseJSON(buf);

                expect(obj).toEqual({ foo: 'bar' });
            });

            it('should fail if given an invalid encoding', () => {
                expect(() => {
                    // @ts-ignore
                    dataEntity.toBuffer({ _encoding: 'baz' });
                }).toThrowError('Unsupported encoding type, got "baz"');
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

    describe('#isDataEntity', () => {
        it('should return false when given object', () => {
            expect(DataEntity.isDataEntity({})).toBeFalse();
        });

        it('should return false when given null', () => {
            expect(DataEntity.isDataEntity(null)).toBeFalse();
        });

        it('should return false when given array of object', () => {
            expect(DataEntity.isDataEntity([{}])).toBeFalse();
        });

        it('should return true when given a DataEntity', () => {
            expect(DataEntity.isDataEntity(DataEntity.make({}))).toBeTrue();
        });

        it('should return true when given a DataEntity compatible object', () => {
            const fakeDataEntity = {
                getMetadata() {},
                setMetadata() {},
                toBuffer() {},
            };
            expect(DataEntity.isDataEntity(fakeDataEntity)).toBeTrue();
        });

        it('should return false when given an array of DataEntities', () => {
            const input = DataEntity.makeArray([{ hi: true }, { hi: true }]);
            expect(DataEntity.isDataEntity(input)).toBeFalse();
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

        it('should return true when given an array of DataEntity compatible objects', () => {
            const fakeDataEntities = [
                {
                    getMetadata() {},
                    setMetadata() {},
                    toBuffer() {},
                },
            ];
            expect(DataEntity.isDataEntityArray(fakeDataEntities)).toBeTrue();
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
            // @ts-ignore
            expect(DataEntity.getMetadata(null, 'hi')).toBeNil();
        });
    });

    describe('#fromBuffer', () => {
        it('should be able to create a DataEntity from a buffer', () => {
            const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
            const entity = DataEntity.fromBuffer(
                buf,
                {
                    _op: 'baz',
                    _encoding: 'json',
                },
                {
                    howdy: 'there',
                }
            );

            expect(entity.foo).toEqual('bar');
            expect(entity.getMetadata('howdy')).toEqual('there');
        });

        it('should be able handle no config', () => {
            const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
            const entity = DataEntity.fromBuffer(buf);

            expect(entity.foo).toEqual('bar');
        });

        it('should throw an error if given invalid buffer', () => {
            const buf = Buffer.from('hello:there');
            expect(() => {
                DataEntity.fromBuffer(buf, {
                    _op: 'test',
                    _encoding: 'json',
                });
            }).toThrow();
        });

        it('should throw an error if given an unsupported encoding', () => {
            const buf = Buffer.from(JSON.stringify({ hi: 'there' }));
            expect(() => {
                // @ts-ignore
                DataEntity.fromBuffer(buf, {
                    _op: 'test',
                    _encoding: 'crazy',
                });
            }).toThrowError('Unsupported encoding type, got "crazy"');
        });
    });
});
