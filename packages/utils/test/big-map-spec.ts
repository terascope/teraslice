import 'jest-extended';
import { jest } from '@jest/globals';
import { BigMap } from '../src/big-map.js';

describe('BigMap', () => {
    let bigMap: BigMap<string, string>;
    let map: Map<string, string>;

    beforeEach(() => {
        BigMap.DEFAULT_MAX_SIZE = 1;
        bigMap = new BigMap();
        map = new Map();
    });

    afterEach(() => {
        if (bigMap) bigMap.clear();
        if (map) map.clear();
    });

    describe('when comparing against a regular Map', () => {
        describe('->set', () => {
            it('should return should not return the same thing all of the time', () => {
                expect(bigMap.set('hello-0', 'hello-0')).toEqual(map.set('hello-0', 'hello-0'));
                expect(bigMap.set('hello-1', 'hello-1')).not.toEqual(map.set('hello-1', 'hello-1'));
            });
        });

        describe('->has', () => {
            beforeEach(() => {
                bigMap.set('hi-0', 'hi-0');
                map.set('hi-0', 'hi-0');
                bigMap.set('hi-1', 'hi-1');
                map.set('hi-1', 'hi-1');
            });

            describe('when the key exists', () => {
                it('should return the same thing', () => {
                    expect(bigMap.has('hi-0')).toStrictEqual(map.has('hi-0'));
                    expect(bigMap.has('hi-1')).toStrictEqual(map.has('hi-1'));
                });
            });

            describe('when the key does NOT exists', () => {
                it('should return the same thing', () => {
                    expect(bigMap.has('wrong')).toStrictEqual(map.has('wrong'));
                });
            });
        });

        describe('->get', () => {
            beforeEach(() => {
                bigMap.set('howdy-0', 'howdy-0');
                map.set('howdy-0', 'howdy-0');
                bigMap.set('howdy-1', 'howdy-1');
                map.set('howdy-1', 'howdy-1');
            });

            describe('when the key exists', () => {
                it('should return the same thing', () => {
                    expect(bigMap.get('howdy-0')).toStrictEqual(map.get('howdy-0')!);
                    expect(bigMap.get('howdy-1')).toStrictEqual(map.get('howdy-1')!);
                });
            });

            describe('when the key does NOT exists', () => {
                it('should return the same thing', () => {
                    expect(bigMap.get('wrong')).toEqual(map.get('wrong'));
                });
            });
        });

        describe('->delete', () => {
            beforeEach(() => {
                bigMap.set('aloha-0', 'aloha-0');
                map.set('aloha-0', 'aloha-0');
                bigMap.set('aloha-1', 'aloha-1');
                map.set('aloha-1', 'aloha-1');
            });

            it('should return the same thing', () => {
                expect(bigMap.delete('aloha-0')).toEqual(map.delete('aloha-0'));
                expect(bigMap.delete('aloha-1')).toEqual(map.delete('aloha-1'));
            });
        });

        describe('->clear', () => {
            beforeEach(() => {
                bigMap.set('abc-0', 'abc-0');
                map.set('abc-0', 'abc-0');
                bigMap.set('abc-1', 'abc-1');
                map.set('abc-1', 'abc-1');
            });

            it('should return the same thing', () => {
                expect(bigMap.clear()).toEqual(map.clear());
            });
        });

        describe('->size', () => {
            beforeEach(() => {
                bigMap.set('foo-0', 'foo-0');
                map.set('foo-0', 'foo-0');
                bigMap.set('foo-1', 'foo-1');
                map.set('foo-1', 'foo-1');
            });

            it('should return the same thing', () => {
                expect(bigMap.size).toEqual(map.size);
            });
        });

        describe('->forEach', () => {
            beforeEach(() => {
                bigMap.set('bar-0', 'bar-0');
                map.set('bar-0', 'bar-0');
                bigMap.set('bar-1', 'bar-1');
                map.set('bar-1', 'bar-1');
            });

            it('should be a called with similar arguments', () => {
                const mapFn = jest.fn();
                map.forEach(mapFn);

                expect(mapFn).toHaveBeenNthCalledWith(1, 'bar-0', 'bar-0', map);
                expect(mapFn).toHaveBeenNthCalledWith(2, 'bar-1', 'bar-1', map);

                const bigMapFn = jest.fn();
                bigMap.forEach(bigMapFn);

                expect(bigMapFn).toHaveBeenNthCalledWith(1, 'bar-0', 'bar-0', bigMap);
                expect(bigMapFn).toHaveBeenNthCalledWith(2, 'bar-1', 'bar-1', bigMap);
            });
        });

        describe('->entries', () => {
            beforeEach(() => {
                bigMap.set('baz-0', 'baz-0');
                map.set('baz-0', 'baz-0');
                bigMap.set('baz-1', 'baz-1');
                map.set('baz-1', 'baz-1');
            });

            it('should be able to iterate the map the same way', () => {
                const bigMapEntries: ([string, string])[] = [];
                for (const entry of bigMap) {
                    bigMapEntries.push(entry);
                }

                const mapEntries: ([string, string])[] = [];
                for (const entry of map) {
                    mapEntries.push(entry);
                }

                expect(bigMapEntries).toStrictEqual(mapEntries);
            });

            it('should be able to iterate the method the same way', () => {
                const bigMapEntries: ([string, string])[] = [];
                for (const entry of bigMap.entries()) {
                    bigMapEntries.push(entry);
                }

                const mapEntries: ([string, string])[] = [];
                for (const entry of map.entries()) {
                    mapEntries.push(entry);
                }

                expect(bigMapEntries).toStrictEqual(mapEntries);
            });
        });
    });

    describe('->values', () => {
        beforeEach(() => {
            bigMap.set('cool-0', 'cool-0');
            map.set('cool-0', 'cool-0');
            bigMap.set('cool-1', 'cool-1');
            map.set('cool-1', 'cool-1');
        });

        it('should be able to iterate the same way', () => {
            const bigMapValues: string[] = [];
            for (const entry of bigMap.values()) {
                bigMapValues.push(entry);
            }

            const mapValues: string[] = [];
            for (const entry of map.values()) {
                mapValues.push(entry);
            }

            expect(bigMapValues).toStrictEqual(mapValues);
        });
    });

    describe('->keys', () => {
        beforeEach(() => {
            bigMap.set('hot-0', 'hot-0');
            map.set('hot-0', 'hot-0');
            bigMap.set('hot-1', 'hot-1');
            map.set('hot-1', 'hot-1');
        });

        it('should be able to iterate the same way', () => {
            const bigMapKeys: string[] = [];
            for (const entry of bigMap.keys()) {
                bigMapKeys.push(entry);
            }

            const mapKeys: string[] = [];
            for (const entry of map.keys()) {
                mapKeys.push(entry);
            }

            expect(bigMapKeys).toStrictEqual(mapKeys);
        });
    });
});
