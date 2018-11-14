import 'jest-extended'; // require for type definitions
import { DataEntity, DataEncoding } from '../../src';
import { parseJSON } from '../../src/utils';

describe('DataEntity', () => {
    describe('when constructed with an object', () => {
        const dataEntity = new DataEntity({
            blue: 'green',
            metadata: {
                uh: 'oh',
            },
            purple: 'pink',
        });

        it('should be an instance of DataEntity', () => {
            expect(dataEntity).toBeInstanceOf(DataEntity);
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
            expect(metadata).toHaveProperty('createdAt');
        });

        it('should be able to set and get a metadata property', () => {
            dataEntity.setMetadata('yellow', 'mellow');
            expect(dataEntity.getMetadata('yellow')).toEqual('mellow');
        });

        it('should be able to get the metadata by key', () => {
            const createdAt = dataEntity.getMetadata('createdAt');
            expect(createdAt).toBeNumber();
        });

        it('should not be able to set createdAt', () => {
            expect(() => {
                dataEntity.setMetadata('createdAt', 'hello');
            }).toThrowError('Cannot set readonly metadata property createdAt');
        });

        it('should be return undefined if getting a metadata that does not exist', () => {
            expect(dataEntity.getMetadata('hello')).toBeUndefined();
        });
    });

    describe('when constructed with a non-object', () => {
        it('should do nothing when called with null', () => {
            expect(() => {
                // @ts-ignore
                new DataEntity(null);
            }).not.toThrow();
        });

        it('should do nothing with called with undefined', () => {
            expect(() => {
                // @ts-ignore
                new DataEntity();
            }).not.toThrow();
        });

        it('should throw an error when called with an Array', () => {
            const arr = [{ hello: true }];
            expect(() => {
                // @ts-ignore
                new DataEntity(arr);
            }).toThrowError('Invalid data source, must be an object, got "array"');
        });

        it('should throw an error when called with a Buffer', () => {
            const buf = Buffer.from(JSON.stringify({ hello:true }));
            expect(() => {
                // @ts-ignore
                new DataEntity(buf);
            }).toThrowError('Invalid data source, must be an object, got "buffer"');
        });
    });

    describe('->toBuffer', () => {
        it('should be convertable to a buffer', () => {
            const dataEntity = new DataEntity({ foo: 'bar' }, { hello: 'there' });
            const buf = dataEntity.toBuffer({ _encoding: DataEncoding.JSON });
            expect(Buffer.isBuffer(buf)).toBeTrue();
            const obj = parseJSON(buf);

            expect(obj).toEqual({ foo: 'bar' });
        });

        it('should be able to handle no config', () => {
            const dataEntity = new DataEntity({ foo: 'bar' }, { hello: 'there' });
            const buf = dataEntity.toBuffer();
            expect(Buffer.isBuffer(buf)).toBeTrue();
            const obj = parseJSON(buf);

            expect(obj).toEqual({ foo: 'bar' });
        });

        it('should fail if given an invalid encoding', () => {
            const dataEntity = new DataEntity({ foo: 'bar' }, { hello: 'there' });

            expect(() => {
                // @ts-ignore
                dataEntity.toBuffer({ _encoding: 'baz' });
            }).toThrowError('Unsupported encoding type, got "baz"');
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
                const dataEntity = DataEntity.make(DataEntity.make({
                    hello: 'there',
                }));
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
                getMetadata() {

                },
                setMetadata() {

                },
                toBuffer() {

                }
            };
            expect(DataEntity.isDataEntity(fakeDataEntity)).toBeTrue();
        });

        it('should return false when given an array of DataEntities', () => {
            const input = DataEntity.makeArray([
                { hi: true },
                { hi: true },
            ]);
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
            const input = DataEntity.makeArray([
                { hi: true },
                { hi: true },
            ]);
            expect(DataEntity.isDataEntityArray(input)).toBeTrue();
        });

        it('should return true when given an array of DataEntity compatible objects', () => {
            const fakeDataEntities = [{
                getMetadata() {

                },
                setMetadata() {

                },
                toBuffer() {

                }
            }];
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
            const entity = DataEntity.fromBuffer(buf, {
                _op: 'baz',
                _encoding: DataEncoding.JSON,
            }, {
                howdy: 'there'
            });

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
                    _encoding: DataEncoding.JSON,
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
