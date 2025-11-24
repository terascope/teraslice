import 'jest-extended';
import { BigLRUMap, FlexibleArray } from '../src/index.js';

describe('BigLRUMap', () => {
    const mapSize = 5;
    it('should be defined and empty', async () => {
        const map = new BigLRUMap(mapSize);
        expect(map).toBeDefined();
        expect(map.size).toBe(0);
    });
    it('should be defined and empty when using a TypedArray for key and value arrays', async () => {
        const map = new BigLRUMap(mapSize, Uint8Array, Uint8Array);
        expect(map).toBeDefined();
        expect(map.size).toBe(0);
    });
    it('should be defined and empty when using a TypedArray value arrays', async () => {
        const map = new BigLRUMap(mapSize, FlexibleArray, Uint8Array);
        expect(map).toBeDefined();
        expect(map.size).toBe(0);
    });

    it('should set a key value pair', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 1);
        expect(map.size).toBe(1);
    });
    it('should set a key value pair with a Uint8Array', async () => {
        const map = new BigLRUMap(mapSize, FlexibleArray, Uint8Array);
        map.set('aaa', 128);
        expect(map.get('aaa')).toBe(128);
        expect(map.size).toBe(1);
    });
    it('should get a value pair', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 'testvalue');
        expect(map.size).toBe(1);
        expect(map.get('aaa')).toBe('testvalue');
    });
    it('should get a value pair with TypedArrays', async () => {
        const map = new BigLRUMap(mapSize, FlexibleArray, Uint8Array);
        map.set(1, 230);
        map.set(64, 300);
        map.set(512, 600);
        map.set(512, 600);
        expect(map.size).toBe(3);
        expect(map.get(1)).toBe(230);
        // numbers greater than 255 get rounded
        expect(map.get(64)).toBe(44);
        expect(map.get(512)).toBe(88);
    });

    it('should check for a key', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 'testvalue');
        expect(map.has('aaa')).toBe(true);
    });
    it('should clear map', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 'testvalue');
        map.clear();
        expect(map.size).toBe(0);
        expect(map.get('aaa')).toBe(undefined);
    });
    it('should set an existing key with new value', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 1);
        map.set('aaa', 2);
        expect(map.size).toBe(1);
        expect(map.get('aaa')).toBe(2);
    });

    it('should evict oldest key after exceeding size', async () => {
        const map = new BigLRUMap(mapSize);
        map.set('aaa', 1);
        map.set('aab', 2);
        map.set('aac', 3);
        map.set('aad', 4);
        map.set('aaa', 1);
        map.set('aae', 5);
        map.set('aaf', 6);
        expect(map.size).toBe(5);
        expect(map.get('aab')).toBe(undefined);
        expect(map.get('aaf')).toBe(6);
    });
    // only run this test to test with a large cache, takes 70+ seconds to run

    it('should not error with a cache size larger than 11.8M and when processing more than 16.7M records', async () => {
        const mapSizeBig = 12000000;
        const map = new BigLRUMap(mapSizeBig);
        const MAX = 20000000;
        for (let i = 0; i < MAX; i++) {
            map.set(`X-${i}-A9998`, i);
        }
        expect(map).toBeDefined();
        expect(map.size).toBe(12000000);
    });
});
