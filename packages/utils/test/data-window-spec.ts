import 'jest-extended';
import {
    DataWindow,
    DataEntity,
} from '../src';

describe('DataWindow', () => {
    describe('when constructed with nothing', () => {
        it('should return an array like entity', () => {
            const window = new DataWindow();
            expect(window).toBeArrayOfSize(0);
        });
    });

    describe('when constructed with docs', () => {
        it('should return an array of size 2', () => {
            type TestData = DataEntity<{ a: number }, { b: number }>;

            const window = new DataWindow<TestData>(
                new DataEntity({ a: 1 }, { b: 1 }),
                new DataEntity({ a: 2 }, { b: 1 })
            );

            expect(window).toBeArrayOfSize(2);
        });
    });

    describe('when testing the metadata functions', () => {
        it('should have a getMetadata function', () => {
            const window = new DataWindow();
            expect(window.getMetadata).toBeFunction();
        });

        it('should have a setMetadata function', () => {
            const window = new DataWindow();
            expect(window.setMetadata).toBeFunction();
        });

        it('should have a getKey function', () => {
            const window = new DataWindow();
            expect(window.getKey).toBeFunction();
        });

        it('should have a setKey function', () => {
            const window = new DataWindow();
            expect(window.setKey).toBeFunction();
        });

        it('should have a getStartTime function', () => {
            const window = new DataWindow();
            expect(window.getStartTime).toBeFunction();
        });

        it('should have a setStartTime function', () => {
            const window = new DataWindow();
            expect(window.setStartTime).toBeFunction();
        });

        it('should have a getFinishTime function', () => {
            const window = new DataWindow();
            expect(window.getFinishTime).toBeFunction();
        });

        it('should have a setFinishTime function', () => {
            const window = new DataWindow();
            expect(window.setFinishTime).toBeFunction();
        });
    });
});
