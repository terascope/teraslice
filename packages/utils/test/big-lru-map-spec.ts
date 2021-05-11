import 'jest-extended';
import { BigLruMap } from '../src/big-lru-map';

describe('BigLruMap', () => {
    const mapSize = 5;
    it('should be defined and empty', async () => {
        const map = new BigLruMap(mapSize);
        expect(map).toBeDefined();
        expect(map.size).toBe(0);
    });
    it('should set a key value pair', async () => {
        const map = new BigLruMap(mapSize);
        map.set('aaa', 1);
        expect(map.size).toBe(1);
    });
    it('should set a numeric key value pair', async () => {
        const map = new BigLruMap(mapSize);
        map.set(1234, 1);
        expect(map.size).toBe(1);
    });
    it('should get a value pair', async () => {
        const map = new BigLruMap(mapSize);
        map.set('aaa', 'testvalue');
        expect(map.size).toBe(1);
        expect(map.get('aaa')).toBe('testvalue');
    });
    it('should check for a key', async () => {
        const map = new BigLruMap(mapSize);
        map.set('aaa', 'testvalue');
        expect(map.has('aaa')).toBe(true);
    });
    it('should clear map', async () => {
        const map = new BigLruMap(mapSize);
        map.set('aaa', 'testvalue');
        map.clear();
        expect(map.size).toBe(0);
        expect(map.get('aaa')).toBe(undefined);
    });
    it('should set an existing key with new value', async () => {
        const map = new BigLruMap(mapSize);
        map.set('aaa', 1);
        map.set('aaa', 2);
        expect(map.size).toBe(1);
        expect(map.get('aaa')).toBe(2);
    });
    it('should evict oldest key after execeding size', async () => {
        const map = new BigLruMap(mapSize);
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
    it('should not error with a cache size larger than 11.8 million', async () => {
        const mapSizeBig = 12000000;
        const map = new BigLruMap(mapSizeBig);
        const MAX = 12000000;
        for (let i = 0; i < MAX; i++) {
            map.set(`X-${i}-A9998`, i);
        }
        expect(map).toBeDefined();
        expect(map.size).toBe(12000000);
    });
});
