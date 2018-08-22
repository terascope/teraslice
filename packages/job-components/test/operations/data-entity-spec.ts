import 'jest-extended'; // require for type definitions
import { DataEntity } from '../../src';

describe('Data Entity', () => {
    describe('when constructed with an object', () => {
        const dataEntity = new DataEntity({
            blue: 'green',
            metadata: {
                uh: 'oh',
            },
            purple: 'pink',
        });

        it('should be to set an additional property', () => {
            dataEntity.teal = 'neal';
        });

        it('should have the input properties top-level', () => {
            expect(dataEntity).toHaveProperty('teal', 'neal')
            expect(dataEntity).toHaveProperty('blue', 'green');
            expect(dataEntity).toHaveProperty('metadata', {
                uh: 'oh',
            });
            expect(dataEntity).toHaveProperty('purple', 'pink');
        });

        it('should only convert non-metadata properties with stringified', () => {
            const object = JSON.parse(JSON.stringify(dataEntity));
            expect(object).toHaveProperty('teal', 'neal')
            expect(object).toHaveProperty('blue', 'green');
            expect(object).toHaveProperty('metadata', {
                uh: 'oh',
            });
            expect(object).toHaveProperty('purple', 'pink');
        });

        it('should be able to get the metadata', () => {
            const metadata = dataEntity.getMetadata();
            expect(metadata).toHaveProperty('fetchedAt');
        });

        it('should be able to set and get a metadata property', () => {
            dataEntity.setMetadata('yellow', 'mellow');
            expect(dataEntity.getMetadata('yellow')).toEqual('mellow');
        });

        it('should be able to get the metadata by key', () => {
            const fetchedAt = dataEntity.getMetadata('fetchedAt');
            expect(fetchedAt).toBeDate();
        });

        it('should be return undefined if getting a metadata that does not exist', () => {
            expect(dataEntity.getMetadata('hello')).toBeUndefined();
        });

        it('should be both metadata and data', () => {
            const metadata = dataEntity.getMetadata();
            const object = JSON.parse(JSON.stringify(dataEntity))
            expect(dataEntity.getMetadataAndData()).toEqual({
               data: object,
               metadata,
            });
        });
    });

    describe('when constructed with object that has a property __metadata', () => {
        it('should throw an error', () => {
            expect(() => {
                // tslint:disable-next-line
                new DataEntity({
                    __metadata: {
                        hello: 'there',
                    },
                });
            }).toThrowError('DataEntity cannot be constructed with a __metadata property');
        });
    });
});
