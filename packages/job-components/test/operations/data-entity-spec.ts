import 'jest-extended'; // require for type definitions
import { DataEntity } from '../../src';

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

            for (const prop in dataEntity) {
                expect(prop).not.toEqual('getMetadata');
                expect(prop).not.toEqual('setMetadata');
            }
        });

        it('should only convert non-metadata properties with stringified', () => {
            const object = JSON.parse(JSON.stringify(dataEntity));
            expect(object).not.toHaveProperty('getMetadata');
            expect(object).not.toHaveProperty('setMetadata');

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

    describe('#make', () => {
        describe('when wrapped', () => {
            it('should return a single data entity', () => {
                const dataEntity = DataEntity.make({
                    hello: 'there',
                });
                expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();
                expect(dataEntity).toBeInstanceOf(DataEntity);
                expect(dataEntity).toHaveProperty('hello', 'there');
            });
        });

        describe('when not wrapped', () => {
            it('should return a single data entity', () => {
                const dataEntity = DataEntity.make(DataEntity.make({
                    hello: 'there',
                }));
                expect(DataEntity.isDataEntity(dataEntity)).toBeTrue();
                expect(dataEntity).toBeInstanceOf(DataEntity);
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
            expect(dataEntities[0]).toBeInstanceOf(DataEntity);
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
            expect(dataEntities[0]).toBeInstanceOf(DataEntity);
            expect(dataEntities[0]).toHaveProperty('hello', 'there');
            expect(dataEntities[1]).toBeInstanceOf(DataEntity);
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
});
