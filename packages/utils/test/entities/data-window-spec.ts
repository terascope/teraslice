import 'jest-extended';
import {
    DataWindow,
    DataEntity,
    fastCloneDeep,
    __IS_WINDOW_KEY,
    __ENTITY_METADATA_KEY,
} from '../../src';

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
        __ENTITY_METADATA_KEY,
    ];

    describe('when constructed with a array of numbers', () => {
        it('should throw an error', () => {
            expect(() => {
                new DataWindow([1] as any);
            }).toThrowError(/Invalid data source/);
        });
    });

    describe('when constructed with nothing', () => {
        it('should return an array like entity', () => {
            const window = new DataWindow();
            expect(window).toBeArrayOfSize(0);
            expect(Array.isArray(window)).toBeTrue();
        });

        it('should be push a DataEntity', () => {
            const window = new DataWindow();
            window.push(DataEntity.make({ foo: 'bar' }));
            expect(window).toBeArrayOfSize(1);
        });

        it('should be prepend a DataEntity', () => {
            const window = new DataWindow([
                DataEntity.make({ a: 1 })
            ]);
            window.unshift(DataEntity.make({ a: 2 }));
            expect(window).toBeArrayOfSize(2);
            expect(window[0].a).toBe(2);
            expect(window[1].a).toBe(1);
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

    describe('#isDataWindow', () => {
        const shouldBe: ([string, any])[] = [
            ['new DataWindow', new DataWindow()],
            ['DataWindow.make', DataWindow.make({})],
        ];

        test.each(shouldBe)('should think %s is a DataWindow', (_str, val) => {
            expect(DataWindow.isDataWindow(val)).toBeTrue();
        });

        const shouldNotBe: ([string, any])[] = [
            ['null', null],
            ['{ test: true }', { test: true }],
            ['an empty string', ''],
            ['"hello"', 'hello'],
            ['an empty array', []],
            ['[1, 2]', [1, 2]],
            ['[DataWindow]', [new DataWindow()]],
            ['Buffer.from', Buffer.from('hello')],
            ['DataEntity.make', DataEntity.make({})],
            ['new Set', new Set()],
            ['new Map', new Map()],
        ];

        test.each(shouldNotBe)('should NOT think %s is a DataWindow', (_str, val) => {
            expect(DataWindow.isDataWindow(val)).toBeFalse();
        });
    });

    describe('#isDataWindowArray', () => {
        const shouldBe: ([string, any])[] = [
            ['an empty array', []],
            ['[DataWindow]', [new DataWindow()]],
            ['[DataWindow.make]', [DataWindow.make({})]],
        ];

        test.each(shouldBe)('should think %s is an array of DataWindows', (_str, val) => {
            expect(DataWindow.isDataWindowArray(val)).toBeTrue();
        });

        const shouldNotBe: ([string, any])[] = [
            ['null', null],
            ['{ test: true }', { test: true }],
            ['an empty string', ''],
            ['"hello"', 'hello'],
            ['[1, 2]', [1, 2]],
            ['DataWindow', new DataWindow()],
            ['DataWindow.make', DataEntity.make],
            ['Buffer.from', Buffer.from('hello')],
            ['DataEntity.make', DataEntity.make({})],
            ['new Set', new Set()],
            ['new Map', new Map()],
        ];

        test.each(shouldNotBe)('should NOT think %s is an array of DataWindows', (_str, val) => {
            expect(DataWindow.isDataWindowArray(val)).toBeFalse();
        });
    });

    describe('#make', () => {
        it('should return a DataWindow', () => {
            const window = DataWindow.make({});
            expect(DataWindow.isDataWindow(window)).toBeTrue();
        });

        it('should have all of the methods', () => {
            const window = DataWindow.make({});
            for (const method of methods) {
                expect(window).toHaveProperty(method as string);
                expect(window[method]).toBeFunction();
            }
        });

        it('should be able to set the metadata', () => {
            const window = DataWindow.make([], {
                _key: 'hello',
                foo: 'bar'
            });
            expect(window.getKey()).toBe('hello');
            expect(window.getMetadata('foo')).toBe('bar');
        });

        describe('when given a DataWindow', () => {
            it('should NOT create a new window', () => {
                const window = new DataWindow();
                expect(DataWindow.make(window)).toBe(window);
            });
        });

        describe('when given an array of DataEntities', () => {
            it('should create window with those DataEntities', () => {
                const entities = DataEntity.makeArray([
                    { a: 1 },
                    { b: 2 },
                    { c: 3 }
                ]);
                expect(DataWindow.make(entities)).toEqual(entities);
            });
        });

        describe('when given an array of objects', () => {
            it('should create window and have it convert them to DataEntities', () => {
                const entities = [
                    { a: 1 },
                    { b: 2 },
                    { c: 3 }
                ];
                const result = DataWindow.make(entities);
                expect(result).toEqual(entities);
                expect(DataEntity.isArray(result)).toBeTrue();
            });
        });
    });

    describe('when constructed with docs', () => {
        it('should return an array of size 2', () => {
            type TestData = DataEntity<{ a: number }, { b: number }>;

            const window = new DataWindow<TestData>([
                new DataEntity({ a: 1 }, { b: 1 }),
                new DataEntity({ a: 2 }, { b: 1 })
            ]);

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

        it('should be able to get and set a key', () => {
            const window = new DataWindow();
            expect(window.setKey('hello')).toBeNil();
            expect(window.getKey()).toBe('hello');
        });

        it('should NOT be able set an invalid key', () => {
            const window = new DataWindow();
            expect(() => {
                window.setKey({ uh: 'oh' } as any);
            }).toThrowError('Invalid key to set in metadata');
        });

        it('should throw if no key is found', () => {
            const window = new DataWindow();
            expect(() => {
                window.getKey();
            }).toThrowError('No key has been set in the metadata');
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

        it('should be able to get and set the start time', () => {
            const window = new DataWindow();
            expect(window.setStartTime()).toBeNil();
            expect(window.getStartTime()).toBeDate();
        });

        it('should be able to get and set the start time to a specific time', () => {
            const window = new DataWindow();
            const dateStr = new Date(Date.now() - 60000).toISOString();
            expect(window.setStartTime(dateStr)).toBeNil();
            const result = window.getStartTime();
            if (result) {
                expect(result.toISOString()).toEqual(dateStr);
            }
        });

        it('should return undefined when there is no start time', () => {
            const window = new DataWindow();
            expect(window.getStartTime()).toBeUndefined();
        });

        it('should return false when there is no valid start time', () => {
            const window = new DataWindow();
            window.setMetadata('_startTime', 'uhoh');
            expect(window.getStartTime()).toBeFalse();
        });

        it('should throw when setting an invalid start time', () => {
            const window = new DataWindow();
            expect(() => {
                window.setStartTime('invalid');
            }).toThrowError(/Invalid date format/);
        });

        it('should have a getFinishTime function', () => {
            const window = new DataWindow();
            expect(window.getFinishTime).toBeFunction();
        });

        it('should have a setFinishTime function', () => {
            const window = new DataWindow();
            expect(window.setFinishTime).toBeFunction();
        });

        it('should be able to get and set the finish time', () => {
            const window = new DataWindow();
            expect(window.setFinishTime()).toBeNil();
            expect(window.getFinishTime()).toBeDate();
        });

        it('should be able to get and set the finish time to a specific time', () => {
            const window = new DataWindow();
            const dateStr = new Date(Date.now() - 60000).toISOString();
            expect(window.setFinishTime(dateStr)).toBeNil();
            const result = window.getFinishTime();
            if (result) {
                expect(result.toISOString()).toEqual(dateStr);
            }
        });

        it('should return undefined when there is no finish time', () => {
            const window = new DataWindow();
            expect(window.getFinishTime()).toBeUndefined();
        });

        it('should return false when there is no valid finish time', () => {
            const window = new DataWindow();
            window.setMetadata('_finishTime', 'uhoh');
            expect(window.getFinishTime()).toBeFalse();
        });

        it('should throw when setting an invalid finish time', () => {
            const window = new DataWindow();
            expect(() => {
                window.setFinishTime('invalid');
            }).toThrowError(/Invalid date format/);
        });
    });

    describe('when fast cloning the window', () => {
        const input = DataEntity.makeArray([
            { a: 1 },
            { a: 2 },
            { a: 3 },
        ]);

        const window = new DataWindow(input);
        window.setMetadata('foo', 'bar');

        const cloned = fastCloneDeep(window);

        it('should have the same length', () => {
            expect(cloned).toBeArrayOfSize(input.length);
        });

        it('should NOT be the same reference', () => {
            expect(cloned).not.toBe(window);
        });

        it('the data should keep the same order with a different reference', () => {
            window.forEach((doc, i) => {
                expect(cloned[i]).not.toBe(doc);
                expect(cloned[i]).toEqual(doc);
            });
        });

        it('should NOT have any of the built-in methods', () => {
            for (const method of methods) {
                expect(cloned[method]).not.toBeFunction();
            }
        });

        it('should NOT have any of the internal properties', () => {
            for (const prop of hiddenProps) {
                expect(cloned).not.toHaveProperty(prop);
            }
        });
    });

    type shallowEntity = DataEntity<{ a: number }>;
    type shallowTestFn = (window: DataWindow<shallowEntity>) => DataWindow<shallowEntity>;
    const shallowCloneCases: ([string, shallowTestFn])[] = [
        ['.slice()', (window) => window.slice()],
        ['.map((entity) => entity)', (window) => window.map((entity) => entity)],
        ['.filter(() => true)', (window) => window.filter(Boolean as any)],
    ];

    describe.each(shallowCloneCases)('when shallow cloning via %s on the window', (_str, fn) => {
        const input: shallowEntity[] = [
            DataEntity.make({ a: 1 }, { _key: 1 }),
            DataEntity.make({ a: 2 }, { _key: 2 }),
            DataEntity.make({ a: 3 }, { _key: 3 }),
        ];

        const window = new DataWindow(input);
        window.setMetadata('_key', 'hello');

        const cloned = fn(window);

        it('should have the same length', () => {
            expect(cloned).toBeArrayOfSize(input.length);
        });

        it('should NOT be the same reference', () => {
            expect(cloned).not.toBe(window);
        });

        it('the data should keep the same order with a same reference', () => {
            window.forEach((doc, i) => {
                expect(cloned[i]).toBe(doc);
                expect(cloned[i]).toEqual(doc);
            });
        });

        it('should have the built-in methods', () => {
            for (const method of methods) {
                expect(cloned[method]).toBeFunction();
            }
        });

        it('should be the a DataWindow', () => {
            expect(cloned).toBeInstanceOf(DataWindow);
        });

        it('should NOT have the same reference to the metadata', () => {
            expect(cloned.getMetadata()).not.toBe(window.getMetadata());
        });

        it('should have the same metadata', () => {
            expect(cloned.getMetadata()).toEqual(window.getMetadata());
        });
    });
});
