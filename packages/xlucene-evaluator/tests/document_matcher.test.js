'use strict';

const DocumentMatcher = require('../lib/document-matcher');

// //TODO: add tests for regex, ip, dates
describe('document matcher', () => {
    let documentMatcher;
    
    beforeEach(() => {
        documentMatcher = new DocumentMatcher();
    });
 it('',() => {})
    // describe('term patterns', () => {
    //     it('can match basic terms', () => {
    //         const data = { hello: 'world' };
    //         const badData = { hello: 'goodbye' };
    //         const badData2 = { something: 'else' };
    //         const badData3 = {};
    
    //         documentMatcher.parse('hello:world');
    
    //         expect(documentMatcher.match(data)).toEqual(true);
    //         expect(documentMatcher.match(badData)).toEqual(false);
    //         expect(documentMatcher.match(badData2)).toEqual(false);
    //         expect(documentMatcher.match(badData3)).toEqual(false);
    //     });

    //     it('can handle "&& AND" operators', () => {
    //         const data1 = { some: 'data' };
    //         const data2 = { some: 'data', other: 'things' };
    //         const data3 = { some: 'data', other: 'stuff' };
    
    //         documentMatcher.parse('some:data AND other:stuff');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //     });
    
    //     it('can handle "|| OR" operators', () => {
    //         const data1 = { some: 'data' };
    //         const data2 = { some: 'otherData', other: 'things' };
    //         const data3 = { some: 'otherData', other: 'stuff' };
    //         const data4 = { some: 'data', other: 'stuff' };
    
    //         documentMatcher.parse('some:data OR other:stuff');
    
    //         expect(documentMatcher.match(data1)).toEqual(true);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //     });

    //     it('can handle _exists_', () => {
    //         const data1 = { some: 'data' };
    //         const data2 = { other: 'data' };
    //         const data3 = { some: null };

    //         documentMatcher.parse('_exists_:some');

    //         expect(documentMatcher.match(data1)).toEqual(true);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(false);
    //     });

    //     it('can handle complex term "()" operators', () => {
    //         const data1 = { some: 'data' };
    //         const data2 = { some: 'otherData', other: 'things' };
    //         const data3 = { some: 'otherData', other: 'stuff' };
    //         const data4 = { some: 'data', other: 'stuff' };
    //         const data5 = { some: 'data', fake: 'stuff' };
    //         const data6 = { data: 'data', fake: 'stuff' };
    //         const data7 = { data: 'data', other: 'stuff' };
    
    //         documentMatcher.parse('some:data AND (other:stuff OR other:things)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(false);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    
    //         documentMatcher.parse('some:data OR (other:stuff OR other:things)');
    
    //         expect(documentMatcher.match(data1)).toEqual(true);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(true);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    //         expect(documentMatcher.match(data7)).toEqual(true);
    //     });
    // });
   
    // describe('numerical range queries', () => {
    //     it('can handle "< > <= >="', () => {
    //         const data = { age: 33 };
    //         const data2 = { age: 8 };
    //         const data3 = { age: 8100 };
    //         const data4 = { other: 33 };
    //         const data5 = { age: 10 };
    
    //         documentMatcher.parse('age:>10');
    
    //         expect(documentMatcher.match(data)).toEqual(true);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    
    //         documentMatcher.parse('age:<10');
    
    //         expect(documentMatcher.match(data)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(false);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    
    //         documentMatcher.parse('age:>=10');
    
    //         expect(documentMatcher.match(data)).toEqual(true);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(true);
    
    //         documentMatcher.parse('age:<=10');
    
    //         expect(documentMatcher.match(data)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(false);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(true);
    //     });
    //     //TODO: this should be in the parser test 
    //     it('can catch malformed range queries', () => {
    //         const errMsg = 'malformed range syntax, please use (<=, >=) and not(=<, =>)';
    //         expect(() => documentMatcher.parse('age: =>10')).toThrowError(errMsg);
    //         expect(() => documentMatcher.parse('age: =<10')).toThrowError(errMsg)
    //         expect(() => documentMatcher.parse('age:(>=10 AND =<20)')).toThrowError(errMsg)
    //     });
    
    //     it('can handle complex range "()" operators', () => {
    //         const data1 = { age: 8 };
    //         const data2 = { age: 10 };
    //         const data3 = { age: 15 };
    //         const data4 = { age: 20 };
    //         const data5 = { age: 50 };
    //         const data6 = { age: 100 };
    
    //         documentMatcher.parse('age:(>10 AND <20)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:(>=10 AND <20)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:(>10 AND <=20)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:(>=10 AND <=20)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:((>=10 AND <=20) OR >=100)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(true);
    //     });
    
    //     it('can handle elasticsearch range queries ([],{},[}, {])', () => {
    //         const data1 = { age: 8 };
    //         const data2 = { age: 10 };
    //         const data3 = { age: 15 };
    //         const data4 = { age: 20 };
    //         const data5 = { age: 50 };
    //         const data6 = { age: 100 };
    
    //         documentMatcher.parse('age:[10 TO 20]');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:{10 TO 20]');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:[10 TO 20}');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:{10 TO 20}');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(false);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(false);
    
    //         documentMatcher.parse('age:{10 TO *}');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(false);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(true);
    //         expect(documentMatcher.match(data6)).toEqual(true);
    
    //         documentMatcher.parse('age:([10 TO 20] OR >=100)');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(true);
    
    //         //swithcing directions of last test to check grammar
    //         documentMatcher.parse('age:(>=100 OR [10 TO 20])');
    
    //         expect(documentMatcher.match(data1)).toEqual(false);
    //         expect(documentMatcher.match(data2)).toEqual(true);
    //         expect(documentMatcher.match(data3)).toEqual(true);
    //         expect(documentMatcher.match(data4)).toEqual(true);
    //         expect(documentMatcher.match(data5)).toEqual(false);
    //         expect(documentMatcher.match(data6)).toEqual(true);
    //     });
    // });

    describe('ip expressions', () => {

        xit('can do exact matches, no type changes', () => {
            const data1 = { ip: '157.60.0.1' };
            const data2 = { ip: '1:2:3:4:5:6:7:8'};
            const data3 = { ip: 'fe80::/10'};

            documentMatcher.parse('ip:"157.60.0.1"');

            // console.log('ast', documentMatcher._ast)
             console.log('filterFn', documentMatcher.filterFn.toString())

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(false);
            expect(documentMatcher.match(data3)).toEqual(false);

            // documentMatcher.parse('ip:"1:2:3:4:5:6:7:8"');

            // expect(documentMatcher.match(data1)).toEqual(false);
            // expect(documentMatcher.match(data2)).toEqual(true);
            // expect(documentMatcher.match(data3)).toEqual(false);

            // documentMatcher.parse('ip:"fe80::/10"');

            // expect(documentMatcher.match(data1)).toEqual(false);
            // expect(documentMatcher.match(data2)).toEqual(false);
            // expect(documentMatcher.match(data3)).toEqual(true);
        });

        it('can do cidr range matches with type anotations', () => {
            const data1 = { ipfield: '192.198.0.0/24' };
            const data2 = { ipfield: '192.198.0.1' };
            const data3 = { ipfield: '1:2:3:4:5:6:7:8' };
            const data4 = { ipfield: 'fe80::/10' };

            documentMatcher.parse('ipfield:"192.198.0.0/24"', { ipfield: 'ip' });
           // console.log('ast', documentMatcher._ast)

            expect(documentMatcher.match(data1)).toEqual(true);
            expect(documentMatcher.match(data2)).toEqual(true);
            expect(documentMatcher.match(data3)).toEqual(false);
            expect(documentMatcher.match(data4)).toEqual(false);
           // TODO: test cidrs that intersect from both ways

            documentMatcher.parse('ipfield:"1:2:3:4:5:6:7:8"', { ipfield: 'ip' });
            //console.log('ast', documentMatcher.filterFn.toString())

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
    });
    
});
