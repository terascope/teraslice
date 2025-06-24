import 'jest-extended';
import { DataEntity } from '../src/entities/index.js';
import {
    getTypeOf, isPlainObject, cloneDeep,
    pMap
} from '../src/deps.js';

describe('Dependency Utils', () => {
    class TestObj {
        hi = true;
        has() {}
    }

    class TestEntity extends DataEntity {
        test = true;
    }

    class ClassWithValidation {
        value: number;
        constructor(value: number) {
            if (typeof value !== 'number') {
                throw new Error('Expected number');
            }
            this.value = value;
        }
    }

    describe('isPlainObject', () => {
        it('should correctly detect the an object type', () => {
            // @ts-expect-error
            expect(isPlainObject()).toBeFalse();
            expect(isPlainObject(null)).toBeFalse();
            expect(isPlainObject(true)).toBeFalse();
            expect(isPlainObject([])).toBeFalse();
            expect(isPlainObject([{ hello: true }])).toBeFalse();
            expect(isPlainObject('some-string')).toBeFalse();
            expect(isPlainObject(Buffer.from('some-string'))).toBeFalse();
            expect(isPlainObject(new TestObj())).toBeFalse();
            expect(isPlainObject(new DataEntity({}))).toBeFalse();
            expect(isPlainObject(Promise.resolve())).toBeFalse();
            expect(isPlainObject(Object.create({}))).toBeTrue();
            expect(isPlainObject(Object.create({ hello: true }))).toBeTrue();
            expect(isPlainObject({})).toBeTrue();
            expect(isPlainObject({ hello: true })).toBeTrue();
        });
    });

    describe('getTypeOf', () => {
        it('should return the correct kind', () => {
            expect(getTypeOf({})).toEqual('Object');
            expect(getTypeOf(Object.create(null))).toEqual('Object');

            expect(getTypeOf(new DataEntity({}))).toEqual('DataEntity');
            expect(getTypeOf(DataEntity.make({}))).toEqual('DataEntity');
            expect(getTypeOf(new TestEntity({}))).toEqual('TestEntity');

            expect(getTypeOf([])).toEqual('Array');

            const fn = () => 123;

            function hello() {
                return 'hello';
            }

            expect(getTypeOf(fn)).toEqual('Function');
            expect(getTypeOf(hello)).toEqual('Function');

            expect(getTypeOf(Buffer.from('hello'))).toEqual('Buffer');
            expect(getTypeOf('hello')).toEqual('String');

            expect(getTypeOf(123)).toEqual('Number');

            expect(getTypeOf(null)).toEqual('null');
            expect(getTypeOf(undefined)).toEqual('undefined');

            const error = new Error('Hello');
            expect(getTypeOf(error)).toEqual('Error');
        });
    });

    describe('cloneDeep', () => {
        it('should clone deep a plain object', () => {
            const input = { a: 1, b: { c: 2 } };
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output.b).not.toBe(input.b);
            output.b.c = 3;
            expect(output.b.c).toEqual(3);
            expect(input.b.c).toEqual(2);
        });

        it('should clone deep an object created by Object.create(null)', () => {
            const input: any = Object.create(null);
            input.foo = { bar: true };
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output.foo).not.toBe(input.foo);
            output.foo.bar = false;
            expect(output.foo.bar).toEqual(false);
            expect(input.foo.bar).toEqual(true);
        });

        it('should clone deeping a freezed object', () => {
            const input: Readonly<{ foo: { bar: true } }> = Object.freeze({
                foo: { bar: true }
            });
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output.foo).not.toBe(input.foo);
        });

        it('should clone deep an array of objects', () => {
            const input = [{ foo: { bar: 1 } }, { foo: { bar: 1 } }];
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            let i = 0;
            for (const inputItem of input) {
                const outputItem = output[i++];
                expect(outputItem).not.toBe(inputItem);
                outputItem.foo.bar = 10;
                expect(outputItem.foo.bar).toEqual(10);
                expect(inputItem.foo.bar).toEqual(1);
            }
        });

        it('should clone deep a DataEntity', () => {
            const input = new DataEntity({ a: 1, b: { c: 2 } }, { _key: 'foo' });
            const buf = Buffer.from('foo-bar');
            input.setRawData(buf);
            const output = cloneDeep(input);
            expect(output).toBeInstanceOf(DataEntity);
            // Test data mutation
            expect(output).not.toBe(input);
            expect(output.b).not.toBe(input.b);
            output.b.c = 3;
            expect(output.b.c).toEqual(3);
            expect(input.b.c).toEqual(2);

            // Test metadata mutation
            expect(output.getMetadata('_key')).toEqual('foo');
            output.setMetadata('_key', 'bar');
            expect(output.getMetadata('_key')).toEqual('bar');
            expect(input.getMetadata('_key')).toEqual('foo');

            // Test raw data mutation
            expect(output.getRawData()).not.toBe(input.getRawData());
            expect(output.getRawData().toString('utf-8'))
                .toEqual(input.getRawData().toString('utf-8'));

            output.setRawData(Buffer.from('changed'));
            expect(output.getRawData().toString('utf-8')).toEqual('changed');
            expect(input.getRawData().toString('utf-8')).toEqual('foo-bar');
        });

        it('should clone deep an object with classes', () => {
            const input = { obj: new TestObj() };
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output.obj).not.toBe(input.obj);
            expect(output.obj).toBeInstanceOf(TestObj);
            output.obj.hi = false;
            expect(output.obj.hi).toEqual(false);
            expect(input.obj.hi).toEqual(true);
        });

        it('should clone deep a class with validation', () => {
            const input = new ClassWithValidation(123);
            const output = cloneDeep(input);
            expect(output).not.toBe(input);
            expect(output).toBeInstanceOf(ClassWithValidation);
            expect(output.value).toEqual(123);
            output.value = 456;
            expect(output.value).toBe(456);
            expect(input.value).toBe(123);
        });
    });

    describe('pMap', () => {
        it('should map values successfully', async () => {
          const input = [1, 2, 3];
          const result = await pMap(input, async (n) => n * 2);
          expect(result).toEqual([2, 4, 6]);
        });

        it('should handle errors with stopOnError: true (default)', async () => {
          const input = [1, 2, 3];
          const mapper = async (n: number) => {
            if (n === 2) throw new Error('Failed on 2');
            return n;
          };

          await expect(pMap(input, mapper)).rejects.toThrow('Failed on 2');
        });

        it('should collect multiple errors when stopOnError is false', async () => {
          const input = [1, 2, 3];
          const mapper = async (n: number) => {
            if (n !== 1) throw new Error(`Error on ${n}`);
            return n;
          };

          try {
            await pMap(input, mapper, { stopOnError: false });
          } catch(err) {
            console.log('BOI');
            console.log(JSON.stringify(err.message));
          }
          await expect(
            pMap(input, mapper, { stopOnError: false })
          ).rejects.toThrow('pMap failed with 2 error(s):\n\n'
            + '[1] Error on 2\n'
            + '[2] Error on 3'
          );

        });
    });
});
