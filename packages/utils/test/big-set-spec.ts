import 'jest-extended';
import { jest } from '@jest/globals';
import { BigSet } from '../src/big-set.js';

describe('BigSet', () => {
    let bigSet: BigSet<string>;
    let set: Set<string>;

    beforeEach(() => {
        BigSet.DEFAULT_MAX_SIZE = 1;
        bigSet = new BigSet();
        set = new Set();
    });

    afterEach(() => {
        if (bigSet) bigSet.clear();
        if (set) set.clear();
    });

    describe('when comparing against a regular Set', () => {
        describe('->add', () => {
            it('should return should not return the same thing all of the time', () => {
                expect(bigSet.add('hello-0')).toEqual(set.add('hello-0'));
                expect(bigSet.add('hello-1')).not.toEqual(set.add('hello-1'));
            });
        });

        describe('->has', () => {
            beforeEach(() => {
                bigSet.add('hi-0');
                set.add('hi-0');
                bigSet.add('hi-1');
                set.add('hi-1');
            });

            describe('when the key exists', () => {
                it('should return the same thing', () => {
                    expect(bigSet.has('hi-0')).toStrictEqual(set.has('hi-0'));
                    expect(bigSet.has('hi-1')).toStrictEqual(set.has('hi-1'));
                });
            });

            describe('when the key does NOT exists', () => {
                it('should return the same thing', () => {
                    expect(bigSet.has('wrong')).toStrictEqual(set.has('wrong'));
                });
            });
        });

        describe('->delete', () => {
            beforeEach(() => {
                bigSet.add('aloha-0');
                set.add('aloha-0');
                bigSet.add('aloha-1');
                set.add('aloha-1');
            });

            it('should return the same thing', () => {
                expect(bigSet.delete('aloha-0')).toEqual(set.delete('aloha-0'));
                expect(bigSet.delete('aloha-1')).toEqual(set.delete('aloha-1'));
            });
        });

        describe('->clear', () => {
            beforeEach(() => {
                bigSet.add('abc-0');
                set.add('abc-0');
                bigSet.add('abc-1');
                set.add('abc-1');
            });

            it('should return the same thing', () => {
                expect(bigSet.clear()).toEqual(set.clear());
            });
        });

        describe('->size', () => {
            beforeEach(() => {
                bigSet.add('foo-0');
                set.add('foo-0');
                bigSet.add('foo-1');
                set.add('foo-1');
            });

            it('should return the same thing', () => {
                expect(bigSet.size).toEqual(set.size);
            });
        });

        describe('->forEach', () => {
            beforeEach(() => {
                bigSet.add('bar-0');
                set.add('bar-0');
                bigSet.add('bar-1');
                set.add('bar-1');
            });

            it('should be a called with similar arguments', () => {
                const setFn = jest.fn();
                set.forEach(setFn);

                expect(setFn).toHaveBeenNthCalledWith(1, 'bar-0', 'bar-0', set);
                expect(setFn).toHaveBeenNthCalledWith(2, 'bar-1', 'bar-1', set);

                const bigSetFn = jest.fn();
                bigSet.forEach(bigSetFn);

                expect(bigSetFn).toHaveBeenNthCalledWith(1, 'bar-0', 'bar-0', bigSet);
                expect(bigSetFn).toHaveBeenNthCalledWith(2, 'bar-1', 'bar-1', bigSet);
            });
        });
    });
});
