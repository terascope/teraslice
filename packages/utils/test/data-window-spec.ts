import 'jest-extended';
import {
    DataWindow,
    DataEntity,
    fastCloneDeep,
    __IS_WINDOW_KEY,
    __DATAWINDOW_METADATA_KEY,
} from '../src';

describe('DataWindow', () => {
    const methods: readonly (keyof DataWindow)[] = [
        'getMetadata',
        'setMetadata',
        'getKey',
        'setKey',
        'getCreateTime',
        'getStartTime',
        'setStartTime',
        'getFinishTime',
        'setFinishTime',
    ];

    const hiddenProps: string[] = [
        __IS_WINDOW_KEY,
        __DATAWINDOW_METADATA_KEY,
    ];

    describe('when constructed with nothing', () => {
        it('should return an array like entity', () => {
            const window = new DataWindow();
            expect(window).toBeArrayOfSize(0);
        });

        it('should NOT have any enumerable built-in methods', () => {
            const window = new DataWindow();

            // eslint-disable-next-line guard-for-in
            for (const key in window) {
                expect(methods).not.toContain(key);
            }
        });

        it('should NOT have any enumerable internal properties', () => {
            const window = new DataWindow();

            // eslint-disable-next-line guard-for-in
            for (const key in window) {
                expect(hiddenProps).not.toContain(key);
            }
        });

        it('should NOT be able to overwrite a built-in method', () => {
            const window = new DataWindow();

            for (const method of methods) {
                try {
                    window[method] = 'overwritten' as any;
                } catch (err) {
                    expect(err).toBeInstanceOf(TypeError);
                }
                expect(window[method]).not.toBe('overwritten');
            }
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

        it('should be able to set and get a metadata value', () => {
            type M = { hello?: string };
            const window = new DataWindow<DataEntity, M>();
            window.setMetadata('hello', 'there');

            expect(window.getMetadata()).toHaveProperty('hello', 'there');
            const result: string|undefined = window.getMetadata('hello');
            expect(result).toEqual('there');
        });

        it('should NOT be able to set _createTime', () => {
            const window = new DataWindow();
            expect(() => {
                window.setMetadata('_createTime', 0);
            }).toThrowError(/Cannot set readonly metadata property/);
        });

        it('should NOT be able to set an empty key', () => {
            const window = new DataWindow();
            expect(() => {
                window.setMetadata('', '');
            }).toThrowError(/Missing field to set in metadata/);
        });

        it('should have a getKey function', () => {
            const window = new DataWindow();
            expect(window.getKey).toBeFunction();
        });

        it('should have a setKey function', () => {
            const window = new DataWindow();
            expect(window.setKey).toBeFunction();
        });

        it('should be able to get the _createTime', () => {
            const window = new DataWindow();
            expect(window.getCreateTime()).toBeDate();
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

    describe('when fast cloning the window', () => {
        it('should NOT have any of the built-in methods', () => {
            const window = new DataWindow();
            const cloned = fastCloneDeep(window);

            for (const method of methods) {
                expect(cloned[method]).not.toBeFunction();
            }
        });

        it('should NOT have any of the internal properties', () => {
            const window = new DataWindow();
            const cloned = fastCloneDeep(window);

            for (const prop of hiddenProps) {
                expect(cloned).not.toHaveProperty(prop);
            }
        });
    });
});
