import _ from 'lodash';
import { DocumentMatcher, TypeConfig } from '../src';

describe('document matcher', () => {
    let documentMatcher: DocumentMatcher;

    beforeEach(() => {
        documentMatcher = new DocumentMatcher();
    });

    describe('exact match and term expressions', () => {
        it('can match basic terms', () => {
            const data = { hello: 'world' };
            const badData = { hello: 'goodbye' };
            const badData2 = { something: 'else' };
            const badData3 = {};

            documentMatcher.parse('hello:world');

            expect(documentMatcher.match(data)).toEqual(true);
            expect(documentMatcher.match(badData)).toEqual(false);
            expect(documentMatcher.match(badData2)).toEqual(false);
            expect(documentMatcher.match(badData3)).toEqual(false);
        });

        it('can match basic terms in objects', () => {
            const data = { foo: 'bar' };
            const badData = { other: 'thing' };
            const data2 = { foo: ['bar'] };
            const data3 = { foo: ['baz', 'bar'] };

            documentMatcher.parse('foo:bar');

            expect(documentMatcher.match(data)).toEqual(true);
            expect(documentMatcher.match(badData)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can match boolean terms', () => {
            const data1 = { bool: false };
            const data2 = { bool: true };
            const data3 = { bool: 'false' };
            const data4 = { bool: 'true' };
            const data5 = { something: 'else' };
            const data6 = {};

            documentMatcher.parse('bool:false');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('bool:true');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
        });

        it('can handle "&& AND" operators', () => {
            const data1 = { some: 'data' };
            const data2 = { some: 'data', other: 'things' };
            const data3 = { some: 'data', other: 'stuff' };

            documentMatcher.parse('some:data AND other:stuff');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can handle "|| OR" operators', () => {
            const data1 = { some: 'data' };
            const data2 = { some: 'otherData', other: 'things' };
            const data3 = { some: 'otherData', other: 'stuff' };
            const data4 = { some: 'data', other: 'stuff' };

            documentMatcher.parse('some:data OR other:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
        });

        it('can handle "NOT !" operators', () => {
            const data1 = { some: 'data' };
            const data2 = { some: 'otherData', other: 'things' };
            const data3 = { some: 'otherData', other: 'stuff' };
            const data4 = { some: 'data', other: 'stuff' };

            documentMatcher.parse('some:data NOT other:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('some:data ! other:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
        });

        it('can handle "AND NOT" operators', () => {
            const data1 = { some: 'data' };
            const data2 = { some: 'data', other: 'things' };
            const data3 = { some: 'otherData', other: 'stuff' };
            const data4 = { some: 'data', other: 'stuff' };

            documentMatcher.parse('some:data AND NOT other:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('some:data AND ! other:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
        });

        it('can handle long complex chaining of operators', () => {
            const data1 = {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'stuff'
            };
            const data2 = {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'other'
            };
            const data3 = {
                some: 'data',
                other: 'things',
                third: 'other',
                fourth: 'stuff'
            };
            const data4 = { some: 'data', other: 'stuff' };

            documentMatcher.parse('some:data AND other:things AND third:stuff AND fourth:stuff');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('some:data AND NOT other:stuff AND NOT bytes:1234');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('some:data AND ! other:stuff AND ! bytes:1234');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
        });

        it('can handle _exists_', () => {
            const data1 = { some: 'data' };
            const data2 = { other: 'data' };
            const data3 = { some: null };
            const data4 = { some: '' };
            const data5 = { some: [] };
            const data6 = { some: [null] };
            const data7 = { some: ['data', null] };

            documentMatcher.parse('_exists_:some');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(true);
        });

        it('can handle complex term "()" operators', () => {
            const data1 = { some: 'data' };
            const data2 = { some: 'otherData', other: 'things' };
            const data3 = { some: 'otherData', other: 'stuff' };
            const data4 = { some: 'data', other: 'stuff' };
            const data5 = { some: 'data', fake: 'stuff' };
            const data6 = { data: 'data', fake: 'stuff' };
            const data7 = { data: 'data', other: 'stuff' };

            documentMatcher.parse('some:data AND (other:stuff OR other:things)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('some:data OR (other:stuff OR other:things)');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(true);
        });

        it('can handle parens with 5 OR terms', () => {
            const data: any[] = [
                { id: 'hello' },
                { id: 'hi' },
                { id: 'howdy' },
                { id: 'aloha' },
                { id: 'hey' },
                { id: 'bye' }
            ];

            documentMatcher.parse('id:(hi OR hello OR howdy OR aloha OR hey)');

            const result = data.map(documentMatcher.match);
            expect(result).toEqual([
                true,
                true,
                true,
                true,
                true,
                false
            ]);
        });

        it('can handle a query that starts with NOT', () => {
            const data: any[] = [
                { value: 'awesome', other: 'thing' },
                { value: 'wrong', other: 'thing' },
                { value: 'awesome', other: 'wrong' },
                { value: 'wrong' },
            ];

            documentMatcher.parse('NOT value:wrong AND other:thing');

            const result = data.map(documentMatcher.match);
            expect(result).toEqual([
                true,
                false,
                false,
                false,
            ]);
        });

        it('can handle the query "a:false NOT b:true AND c:false"', () => {
            const data: any[] = [
                { a: false, b: false, c: false },
                { a: true, b: false, c: false },
                { a: true, b: true, c: false },
                { a: false, b: true, c: false },
                { a: false, b: true, c: true },
                { a: false, b: false, c: true },
            ];

            documentMatcher.parse('a:false NOT b:true AND c:false');

            const result = data.map(documentMatcher.match);
            expect(result).toEqual([
                true,
                false,
                false,
                false,
                false,
                false,
            ]);
        });

        it('can handle the query "a:false OR b:false AND c:true"', () => {
            const data: any[] = [
                { a: false, b: true, c: true }, // matches
                { a: true, b: false, c: true }, // matches
                { a: false, b: false, c: false }, // matches
                { a: true, b: true, c: true }, // misses
            ];

            documentMatcher.parse('a:false OR b:false AND c:true');

            const result = data.map(documentMatcher.match);
            expect(result).toEqual([
                true,
                true,
                true,
                false,
            ]);
        });
    });

    describe('numerical range queries', () => {
        it('can handle "< > <= >="', () => {
            const data = { age: 33 };
            const data2 = { age: 8 };
            const data3 = { age: 8100 };
            const data4 = { other: 33 };
            const data5 = { age: 10 };

            documentMatcher.parse('age:>0');

            expect(documentMatcher.match(data)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('age:>10');

            expect(documentMatcher.match(data)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('age:<10');

            expect(documentMatcher.match(data)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('age:>=10');

            expect(documentMatcher.match(data)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('age:<=10');

            expect(documentMatcher.match(data)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);
        });

        it('can handle complex range "()" operators', () => {
            const data1 = { age: 8 };
            const data2 = { age: 10 };
            const data3 = { age: 15 };
            const data4 = { age: 20 };
            const data5 = { age: 50 };
            const data6 = { age: 100 };

            documentMatcher.parse('age:(>10 AND <20)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:(>=10 AND <20)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:(>10 AND <=20)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:(>=10 AND <=20)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:((>=10 AND <=20) OR >=100)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(true);
        });

        it('can handle nested values', () => {
            const data1 = { person: { age: 8 } };
            const data2 = { person: { age: 10 } };
            const data3 = { person: { age: 15 } };
            const data4 = { person: { age: 20 } };
            const data5 = { person: { age: 50 } };
            const data6 = { person: { age: 100 } };

            documentMatcher.parse('person.age:[0 TO *]');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);
        });

        it('can handle bad values', () => {
            const data1 = {};
            const data2 = { person: 'asdfasdf' };
            const data3 = [123, 4234];
            const data4 = { person: null };
            const data5 = { person: ['asdf'] };
            const data6 = { other: { age: 100 } };

            documentMatcher.parse('person.age:[0 TO *]');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
        });

        it('can handle elasticsearch range queries ([],{},[}, {])', () => {
            const data1 = { age: 8 };
            const data2 = { age: 10 };
            const data3 = { age: 15 };
            const data4 = { age: 20 };
            const data5 = { age: 50 };
            const data6 = { age: 100 };

            documentMatcher.parse('age:[0 TO *]');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);

            documentMatcher.parse('age:[10 TO 20]');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:{10 TO 20]');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:[10 TO 20}');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:{10 TO 20}');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);

            documentMatcher.parse('age:{10 TO *}');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);

            documentMatcher.parse('age:([10 TO 20] OR >=100)');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(true);

            // swithcing directions of last test to check grammar
            documentMatcher.parse('age:(>=100 OR [10 TO 20])');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(true);
        });
    });

    describe('ip expressions', () => {
        it('can do exact matches, no type changes', () => {
            const data1 = { ip: '157.60.0.1' };
            const data2 = { ip: '1:2:3:4:5:6:7:8' };
            const data3 = { ip: 'fe80::/10' };

            documentMatcher.parse('ip:157.60.0.1');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('ip:1:2:3:4:5:6:7:8');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('ip:"fe80::/10"');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can do cidr range matches with type anotations', () => {
            const data1 = { ipfield: '192.198.0.0/24' };
            const data2 = { ipfield: '192.198.0.1' };
            const data3 = { ipfield: '1:2:3:4:5:6:7:8' };
            const data4 = { ipfield: 'fe80::/10' };

            documentMatcher.parse('ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            // TODO: test cidrs that intersect from both ways

            documentMatcher.parse('ipfield:1:2:3:4:5:6:7:8', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('ipfield:"fe80::/10"', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
        });

        it('can do ip type anotations with crazy data', () => {
            const data1 = { ipfield: '123u0987324asdf' };
            const data2 = { ipfield: null };
            const data3 = { ipfield: { some: 'data' } };
            const data4 = { ipfield: 12341234 };
            const data5 = { ipfield: [{ other: 'things' }] };
            const data6 = {};

            documentMatcher.parse('ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
        });

        it('can support ip range modifiers [], {}, [}', () => {
            const data1 = { ipfield: '192.198.0.0' };
            const data2 = { ipfield: '192.198.0.1' };
            const data3 = { ipfield: '192.198.0.254' };
            const data4 = { ipfield: '192.198.0.255' };
            const data5 = { ipfield: '192.198.0.0/30' };

            documentMatcher.parse('ipfield:[192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:{192.198.0.0 TO 192.198.0.255}', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:[192.198.0.0 TO 192.198.0.255}', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:{192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
        });

        it('can do AND OR ip matches', () => {
            const data1 = { ipfield: '192.198.0.0/24', some: 'value' };
            const data2 = { ipfield: '192.198.0.0/24', some: 'otherValue' };
            const data3 = { ipfield: '192.198.0.1', some: 'value' };
            const data4 = { ipfield: '192.198.0.1', key: 'value' };
            const data5 = { ipfield: '127.0.0.1', key: 'value' };
            const data6 = { ipfield: '127.0.0.1', some: 'value' };

            const data7 = { ipfield: '1:2:3:4:5:6:7:8', duration: 120300 };
            const data8 = { ipfield: '1:2:3:4:5:6:7:8', duration: 220300 };

            documentMatcher.parse('ipfield:"192.198.0.0/24" AND some:value', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(false);

            documentMatcher.parse('ipfield:"192.198.0.0/24" OR key:value', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(false);

            documentMatcher.parse('ipfield:"192.198.0.0/24" AND _exists_:key', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(false);

            documentMatcher.parse('ipfield:"1:2:3:4:5:6:7:8" AND duration:>=200000', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(true);
        });

        it('can do complex ip queries', () => {
            const data1 = { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 };
            const data2 = { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 };
            const data3 = { ipfield: '192.198.0.1', some: 'value' };
            const data4 = { ipfield: '192.198.0.1', key: 'value' };
            const data5 = { ipfield: '192.198.0.1', key: 'value', duration: 123999 };
            const data6 = { ipfield: '192.198.0.1', key: 'value', duration: 1234 };
            const data7 = { ipfield: '192.198.0.0', key: 'value', duration: 1234000 };

            const data8 = { ipfield: '127.0.0.1', key: 'value', duration: 1234 };
            const data9 = { ipfield: '127.0.0.1', some: 'value', duration: 1234 };

            documentMatcher.parse('key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(true);
            expect(documentMatcher.match(data9)).toEqual(false);

            documentMatcher.parse('key:value AND (duration:(<=10000 AND >=343) OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(true);
            expect(documentMatcher.match(data9)).toEqual(false);
        });
    });

    describe('date expressions', () => {
        it('can do exact matches, no type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z' };
            const data3 = { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' };

            documentMatcher.parse('_created:"2018-10-18T18:13:20.683Z"');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('_created:"Thu Oct 18 2018 11:13:20 GMT-0700"');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('_created:"Thu, 18 Oct 2018 18:13:20 GMT"');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can match dates, with type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z' };
            const data3 = { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' };

            documentMatcher.parse('_created:"2018-10-18T18:13:20.683Z"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('_created:"Thu Oct 18 2018 11:13:20 GMT-0700"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);

            documentMatcher.parse('_created:"Thu, 18 Oct 2018 18:13:20 GMT"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('date fields do not throw with wrong data', () => {
            const data1 = { _created: { some: 'thing' } };
            const data2 = { _created: [3, 53, 2342] };
            const data3 = { _created: false };
            const data4 = { _created: null };
            const data5 = { _created: 'asdfiuyasdf8yhkjlasdf' };
            documentMatcher.parse('_created:"2018-10-18T18:13:20.683Z"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
        });

        it('can can handle "< > <= >=", with type changes', () => {
            const data1 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z' };
            const data3 = { _created: '2018-10-18T18:15:34.123Z' };
            const data4 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' };
            const data5 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' };

            documentMatcher.parse('_created:>="2018-10-18T18:13:20.683Z"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('_created:<"Thu Oct 18 2018 11:13:20 GMT-0700"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('_created:<="2018-10-18T18:13:20.683Z"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);
        });

        it('can can handle [] {} {], with type changes', () => {
            const data1 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z' };
            const data3 = { _created: '2018-10-18T18:15:34.123Z' };
            const data4 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' };
            const data5 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' };

            documentMatcher.parse('_created:[2018-10-18T18:13:20.683Z TO *]', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('_created:{"2018-10-10" TO "Thu Oct 18 2018 11:13:20 GMT-0700"}', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('_created:[2018-10-18T18:13:20.000Z TO 2018-10-18T18:13:20.783Z]', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
        });
    });

    describe('geo expressions', () => {
        it('can do basic matches', () => {
            const data1 = { location: '33.435967,-111.867710' };
            const data2 = { location: '22.435967,-150.867710' };

            documentMatcher.parse('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);

            documentMatcher.parse('location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
        });

        it('can do basic matches with funky spaces', () => {
            const data1 = { location: '33.435967,  -111.867710 ' };
            const data2 = { location: '22.435967,-150.867710' };

            documentMatcher.parse('location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);

            documentMatcher.parse('location:( _geo_point_:"33.435518,    -111.873616" _geo_distance_: 5000m   )', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
        });

        it('geo fields do not throw with wrong data', () => {
            const data1 = { location: null };
            const data2 = { location: { some: 'data' } };
            const data3 = { location: [1234, 4234234, 223] };
            const data4 = { location: 'asdop234' };
            const data5 = { location: 1233.435967 };
            const data6 = {};

            documentMatcher.parse('location:(_geo_box_top_left_:" 33.906320,  -112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
        });

        it('can do basic matches with non string based geo points', () => {
            const data1 = { location: { lat: '33.435967', lon: '-111.867710' } };
            const data2 = { location: { latitude: '33.435967', longitude: '-111.867710' } };
            const data3 = { location: [33.435967, -111.867710] };
            // this is a geohash below
            const data4 = { location: '9tbqnqu6tkj8' };

            documentMatcher.parse('location:(_geo_box_top_left_:" 33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
        });

        it('can do complicated matches', () => {
            const data1 = { location: '33.435967,-111.867710', some: 'key', bytes: 123432 };
            const data2 = { location: '22.435967,-150.867710', other: 'key', bytes: 123432 };
            const data3 = { location: '22.435967,-150.867710', bytes: 100 };

            documentMatcher.parse('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
        });
    });

    describe('wildcard queries', () => {
        it('can do basic wildcard matches', () => {
            const data1 = { key: 'abcde' };
            const data2 = { key: 'field' };
            const data3 = { key: 'abcdef' };
            const data4 = { key: 'zabcde' };
            const data5 = { key: 'hello abcde' };
            const data6 = { key: 'abcde hello' };
            const data7 = { key: 'abcccde' };

            documentMatcher.parse('key:abc*');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(true);
            expect(documentMatcher.match(data7)).toEqual(true);

            documentMatcher.parse('key:abc??de');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(true);

            documentMatcher.parse('key:?abc*');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);

            documentMatcher.parse('key:*abc*');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);
            expect(documentMatcher.match(data6)).toEqual(true);
            expect(documentMatcher.match(data7)).toEqual(true);

            documentMatcher.parse('key:abcd');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(false);
            expect(documentMatcher.match(data7)).toEqual(false);
        });
        // FIXME:
        it('can do more complex wildcard queries', () => {
            const data1 = { some: 'value', city: { key: 'abcde', field: 'other' } };
            const data2 = { some: 'value', city: { key: 'abcde', field: 'other', nowIsTrue: 'something' } };
            const data3 = { some: 'value', city: { key: 'abcde', deeper: { nowIsTrue: 'something' } } };
            // const data4 = { some: 'value', city: { key: 'abcde', deeper: { other: 'thing' } } };

            documentMatcher.parse('city.*:something');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('city.*:someth*');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('city.deeper.*:someth*');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);

            documentMatcher.parse('city.*.*:someth*');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);

            // FIXME: THIS tentativley could be any value ip,date,num etc etc
            // documentMatcher.parse('city.*.*:(someth* OR thin?)');

            // expect(documentMatcher.match(data1)).toEqual(false);
            // expect(documentMatcher.match(data2)).toEqual(false);
            // expect(documentMatcher.match(data3)).toEqual(true);
            // expect(documentMatcher.match(data4)).toEqual(true);
        });
    });

    describe('regex queries', () => {
        it('can do basic regex matches', () => {
            const data1 = { key: 'abcde' };
            const data2 = { key: 'field' };
            const data3 = { key: 'abcdef' };
            const data4 = { key: 'zabcde' };

            documentMatcher.parse('key:/ab.*/');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('key:/abcd/');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
        });

        it('can do more complex regex matches', () => {
            const data1 = { key: 'abbccc' };
            const data2 = { key: 'field' };
            const data3 = { key: 'abc' };
            const data4 = { key: 'zabcde' };

            documentMatcher.parse('key:/ab{2}c{3}/');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('key:/ab*c*/');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('key:/.*abcd?e?/');

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
        });

        it('can do complex queries', () => {
            const data1 = { key: 'abcde', other: 'data2343' };
            const data2 = { key: 'field' };
            const data3 = { key: 'abcdef', bytes: 43 };
            const data4 = { key: 'zabcde', other: 'something' };

            documentMatcher.parse('key:/ab.*/ AND other:/data.*/');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
        });
    });

    describe('works properly with chaotic/crazy data/queries', () => {
        it('does not mutate orignal data', () => {
            const data1 = {
                key: 'abbccc',
                ipfield: '192.198.0.0/30',
                location: '33.435967,-111.867710',
                _created: '2018-11-18T18:13:20.683Z'
            };

            const clone = _.cloneDeep(data1);

            const typeConfig: TypeConfig = { ipfield: 'ip', _created: 'date', location: 'geo' };
            // tslint:disable-next-line
            const query = 'ipfield:[192.198.0.0 TO 192.198.0.255] AND _created:[2018-10-18T18:13:20.683Z TO *] AND key:/ab{2}c{3}/ AND location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")';

            documentMatcher.parse(query, typeConfig);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(data1).toEqual(clone);

            documentMatcher.parse(query, typeConfig);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(data1).toEqual(clone);
        });

        it('does not throw when fields are not present', () => {
            const data1 = {};
            const data2 = {
                ip: null,
                key: null,
                created: null,
                location: null
            };

            const types: TypeConfig = {
                ip: 'ip',
                created: 'date',
                location: 'geo'
            };

            documentMatcher.parse('some:field', types);
            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
        });

        it('does not throw when types are not present', () => {
            const data1 = {};
            const data2 = {
                ipfield: '192.198.3.0',
                date: '2018-10-18T18:15:34.123Z',
                str: 'someStr',
                location: '53.2333,-112.3343'
            };

           // tslint:disable-next-line
            const query = '(ipfield:{"192.198.0.0" TO "192.198.0.255"] AND date:"2018-10-18T18:15:34.123Z") OR (str:foo* AND location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902"))';
            documentMatcher.parse(query);

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
        });

        it('should not throw with AND NOT chaining', () => {
            const data1 = { date: '2018-10-10T17:36:13Z', value: 252, type: 'example' };
            const data2 = { date: '2018-10-10T17:36:13Z', value: 253, type: 'other' };
            const data3 = { date: '["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"]', value: 253, type: 'other' };

            const luceneQuery = 'date:["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"] AND NOT value:(251 OR 252) AND NOT type:example';
            const luceneQuery2 = 'date:["2018-10-10T17:36:13Z" TO "2018-10-10T17:36:13Z"] AND ! value:(251 OR 252) AND ! type:example';
            const typeConfig: TypeConfig = { date: 'date' };

            documentMatcher.parse(luceneQuery, typeConfig);

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse(luceneQuery2, typeConfig);

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
        });

        it('can accept unquoted dates', () => {
            const data1 = { date: '2018-10-10T17:36:13Z', value: 252, type: 'example' };
            const data2 = { date: '2018-10-10T18:36:13Z', value: 253, type: 'other' };
            const typeConfig: TypeConfig = { date: 'date' };

            const luceneQuery = 'date:[2018-10-10T17:36:13Z TO 2018-10-10T20:36:13Z]';

            documentMatcher.parse(luceneQuery, typeConfig);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
        });

        it('can can complex queries part1', () => {
            // all of these are the same date
            const data1 = { _created: '2018-10-18T18:13:20.683Z', some: 'key', bytes: 1232322 };
            const data2 = {
                _created: '2018-10-18T18:13:20.683Z',
                other: 'key',
                bytes: 1232322,
                _updated: '2018-10-18T20:13:20.683Z'
            };
            const data3 = { _created: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 122 };
            const data4 = { _created: '2018-04-02T12:15:34.123Z', bytes: 12233 };
            const data5 = { _updated: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 1232322 };
            const types: TypeConfig = { _created: 'date', _updated: 'date' };

            documentMatcher.parse('some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))', types);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)', types);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('some:key AND ((_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322)) OR _updated:>="2018-10-18T18:13:20.683Z")', types);

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);
        });

        it('can handle more complex queries part2', () => {
            const query1Data1 = {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'other',
                field5: 'other'
            };
            const query1Data2 = {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 2,
                field3: 25,
                field4: 'sometext',
                field5: 'other'
            };
            const query1Data3 = {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 25,
                field4: 'sometext',
                field5: 'value2'
            };
            const query1Data4 = {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'sometext',
                field5: 'other'
            };
            const query1Data5 = {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other'
            };
            const query1Data6 = {
                date: '2018-10-10T19:30:00Z',
                field1: { subfield: 'other' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other'
            };
            const query1Data7 = {
                date: '2018-09-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 62,
                field3: 15,
                field4: 'other',
                field5: 'other'
            };
            const query1Data8 = {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field4: 'other'
            };
            const query1Data9 = {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field3: 15,
                field5: 'other'
            };
            const query1Data10 = {
                date: '2018-11-10T19:30:00Z',
                field1: { subfield: 'value' },
                field2: 60,
                field4: 'other',
                field5: 'other'
            };

            const query1 = 'date:[2018-10-10T19:30:00Z TO *] AND field1.subfield:value AND field2:(1 OR 2 OR 5 OR 20 OR 50 OR 60) AND NOT (field3:15 AND field4:sometext) AND NOT field5:value2';

            expect(() => documentMatcher.parse(query1)).not.toThrow();
            documentMatcher.parse(query1, { date: 'date' });

            expect(documentMatcher.match(query1Data1)).toEqual(true);
            expect(documentMatcher.match(query1Data2)).toEqual(true);
            expect(documentMatcher.match(query1Data3)).toEqual(false);
            expect(documentMatcher.match(query1Data4)).toEqual(false);
            expect(documentMatcher.match(query1Data5)).toEqual(false);
            expect(documentMatcher.match(query1Data6)).toEqual(false);
            expect(documentMatcher.match(query1Data7)).toEqual(false);
            expect(documentMatcher.match(query1Data8)).toEqual(true);
            expect(documentMatcher.match(query1Data9)).toEqual(true);
            expect(documentMatcher.match(query1Data10)).toEqual(true);

            const data7 = {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 1
            };
            const data8 = {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 2
            };
            const data9 = {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-11T23:39:01Z',
                field1: 1
            };
            const data10 = {
                date1: '2018-09-16T04:30:00Z',
                ip_field: '192.168.196.196',
                date2: '2018-10-10T23:39:01Z',
                field1: 1
            };
            const data11 = {
                date1: '2018-09-09T04:30:00Z',
                ip_field: '192.168.196.145',
                date2: '2018-10-10T23:39:01Z',
                field1: 1
            };
            // tslint:disable-next-line
            const query2 = 'date1:[2018-09-10T00:00:00Z TO 2018-10-10T23:39:01Z] AND ip_field:[192.168.196.145 TO 192.168.196.195] AND date2:[2018-09-10T00:00:00Z TO 2018-10-10T23:39:01Z] AND field1:1';

            expect(() => documentMatcher.parse(query2)).not.toThrow();
            documentMatcher.parse(query2, { date1: 'date', ip_field: 'ip', date2: 'date' });

            expect(documentMatcher.match(data7)).toEqual(true);
            expect(documentMatcher.match(data8)).toEqual(false);
            expect(documentMatcher.match(data9)).toEqual(false);
            expect(documentMatcher.match(data10)).toEqual(false);
            expect(documentMatcher.match(data11)).toEqual(false);

            const data12 = { field1: 12343, ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' };
            const data13 = { field1: [{ some: 'stuff' }], ip_field: '192.168.196.145', date: '2017-09-30T23:20:01Z' };
            const data14 = { field1: 'm1-234567.blahblah', ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' };
            const data15 = { field1: 'm1-234567.blahblah', ip_field: '192.168.196.144', date: '2048-09-30T23:20:01Z' };
            const data16 = { field1: 'something else', ip_field: '192.168.196.145', date: '2048-09-30T23:20:01Z' };

            const query3 = 'field1:m?-?????*.blahblah AND ip_field:[192.168.196.145 TO 192.168.196.195] AND date:[2018-09-30T23:20:01Z TO *]';

            expect(() => documentMatcher.parse(query3)).not.toThrow();
            documentMatcher.parse(query3, { ip_field: 'ip', date: 'date' });

            expect(documentMatcher.match(data12)).toEqual(false);
            expect(documentMatcher.match(data13)).toEqual(false);
            expect(documentMatcher.match(data14)).toEqual(true);
            expect(documentMatcher.match(data15)).toEqual(false);
            expect(documentMatcher.match(data16)).toEqual(false);
        });
    });
});
