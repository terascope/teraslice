'use strict';

const DocumentMatcher = require('../lib/document-matcher');

// //TODO: add tests
describe('document matcher', () => {
    let documentMatcher;
    
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

        it('can handle _exists_', () => {
            const data1 = { some: 'data' };
            const data2 = { other: 'data' };
            const data3 = { some: null };

            documentMatcher.parse('_exists_:some');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
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
    });
   
    describe('numerical range queries', () => {
        it('can handle "< > <= >="', () => {
            const data = { age: 33 };
            const data2 = { age: 8 };
            const data3 = { age: 8100 };
            const data4 = { other: 33 };
            const data5 = { age: 10 };
    
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
        //TODO: this should be in the parser test 
        it('can catch malformed range queries', () => {
            const errMsg = 'malformed range syntax, please use (<=, >=) and not(=<, =>)';
            expect(() => documentMatcher.parse('age: =>10')).toThrowError(errMsg);
            expect(() => documentMatcher.parse('age: =<10')).toThrowError(errMsg)
            expect(() => documentMatcher.parse('age:(>=10 AND =<20)')).toThrowError(errMsg)
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
    
        it('can handle elasticsearch range queries ([],{},[}, {])', () => {
            const data1 = { age: 8 };
            const data2 = { age: 10 };
            const data3 = { age: 15 };
            const data4 = { age: 20 };
            const data5 = { age: 50 };
            const data6 = { age: 100 };
    
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
    
            //swithcing directions of last test to check grammar
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
            const data2 = { ip: '1:2:3:4:5:6:7:8'};
            const data3 = { ip: 'fe80::/10'};

            documentMatcher.parse('ip:"157.60.0.1"');

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('ip:"1:2:3:4:5:6:7:8"');

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

            documentMatcher.parse('ipfield:"1:2:3:4:5:6:7:8"', { ipfield: 'ip' });

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


        it('can support ip range modifiers [], {}, [}', () => {
            const data1 = { ipfield: '192.198.0.0' };
            const data2 = { ipfield: '192.198.0.1' };
            const data3 = { ipfield: '192.198.0.254' };
            const data4 = { ipfield: '192.198.0.255' };
            const data5 = { ipfield: '192.198.0.0/30' };

            documentMatcher.parse('ipfield:["192.198.0.0" TO "192.198.0.255"]', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:{"192.198.0.0" TO "192.198.0.255"}', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:["192.198.0.0" TO "192.198.0.255"}', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);

            documentMatcher.parse('ipfield:{"192.198.0.0" TO "192.198.0.255"]', { ipfield: 'ip' });

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
           
            documentMatcher.parse('key:value AND (duration:(<=10000 AND >=343) AND ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
            expect(documentMatcher.match(data6)).toEqual(true);
            expect(documentMatcher.match(data7)).toEqual(false);
            expect(documentMatcher.match(data8)).toEqual(false);
            expect(documentMatcher.match(data9)).toEqual(false);
        });
    });

    describe('date expressions', () => {
        it('can do exact matches, no type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z'};
            const data3 = { _created: 'Thu, 18 Oct 2018 18:13:20 GMT'};

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
        //TODO: should be testing multiple type fields of the same type ie _created:date, _updated:date
        it('can match dates, with type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z'};
            const data3 = { _created: 'Thu, 18 Oct 2018 18:13:20 GMT'};

            documentMatcher.parse('_created:"2018-10-18T18:13:20.683Z"', { _created: 'date' });
            
            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);

            documentMatcher.parse('_created:"Thu Oct 18 2018 11:13:20 GMT-0700"', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);

            documentMatcher.parse('_created:"Thu, 18 Oct 2018 18:13:20 GMT"',  { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can can handle "< > <= >=", with type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z'};
            const data3 = { _created: '2018-10-18T18:15:34.123Z'};
            const data4 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT'};
            const data5 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT'};

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

            documentMatcher.parse('_created:<="2018-10-18T18:13:20.683Z"',  { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(true);
        });

        it('can can handle [] {} {], with type changes', () => {
            // all of these are the same date
            const data1 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
            const data2 = { _created: '2018-10-18T18:13:20.683Z'};
            const data3 = { _created: '2018-10-18T18:15:34.123Z'};
            const data4 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT'};
            const data5 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT'};

            documentMatcher.parse('_created:["2018-10-18T18:13:20.683Z" TO *]', { _created: 'date' });
            
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

            documentMatcher.parse('_created:["2018-10-18T18:13:20.000Z" TO "2018-10-18T18:13:20.783Z"]',  { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);
        });

        it('can can complex queries', () => {
            // all of these are the same date
            const data1 = { _created: '2018-10-18T18:13:20.683Z', some: 'key', bytes: 1232322 };
            const data2 = { _created: '2018-10-18T18:13:20.683Z', other: 'key', bytes: 1232322 };
            const data3 = { _created: '2018-10-18T18:15:34.123Z', some: 'key', bytes: 122 };
            const data4 = { _created: '2018-04-02T12:15:34.123Z', bytes: 12233 };
            const data5 = { _updated: '2018-10-18T18:15:34.123Z', some: 'key',  bytes: 1232322 };

            documentMatcher.parse('some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))', { _created: 'date' });
            
            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
            expect(documentMatcher.match(data5)).toEqual(false);

            documentMatcher.parse('_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)', { _created: 'date' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(true);
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

            documentMatcher.parse('location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000)', { location: 'geo' });

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
        });

        //TODO: make more geo tests
    });

    describe('regex queries', () => {

        it('can do basic regex matches', () => {
            const data1 = { key : 'abcde' };
            const data2 = { key: 'field' };
            const data3 = { key : 'abcdef' };
            const data4 = { key : 'zabcde' };
    
            documentMatcher.parse('key:ab.*', { key: 'regex' });
    
            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(true);
            expect(documentMatcher.match(data4)).toEqual(false);

            documentMatcher.parse('key:abcd', { key: 'regex' });
    
            expect(documentMatcher.match(data1)).toEqual(false);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
        });
    });
    //TODO: test mulptile types of the same kind on data
});
