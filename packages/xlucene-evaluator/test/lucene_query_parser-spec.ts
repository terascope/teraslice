import 'jest-extended';
import { LuceneQueryParser, IMPLICIT } from '../src';

describe('luceneQueryParser', () => {
    let luceneQueryParser: LuceneQueryParser;

    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    describe(' whitespace handling', () => {
        // term parsing
        it('handles empty string', () => {
            luceneQueryParser.parse('');

            expect(luceneQueryParser._ast).toBeEmpty();
        });

        it('handles leading whitespace with no contents', () => {
            luceneQueryParser.parse(' \r\n');

            expect(luceneQueryParser._ast).toBeEmpty();
        });

        it('handles leading whitespace before an expression string', () => {
            luceneQueryParser.parse(' Test:Foo');

            expect(luceneQueryParser._ast['left']!['field']).toBe('Test');
            expect(luceneQueryParser._ast['left']!['term']).toBe('Foo');
        });

        it('handles whitespace around the colon', () => {
            luceneQueryParser.parse('Test : Foo');

            expect(luceneQueryParser._ast['left']!['field']).toBe('Test');
            expect(luceneQueryParser._ast['left']!['term']).toBe('Foo');
        });
    });

    describe('luceneQueryParser: term parsing', () => {
        // term parsing
        it('parses terms', () => {
            luceneQueryParser.parse('bar');

            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
        });

        it('parses quoted terms', () => {
            luceneQueryParser.parse('"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
        });

        it("accepts terms with '-'", () => {
            luceneQueryParser.parse('created_at:>now-5d');

            expect(luceneQueryParser._ast['left']!['field']).toBe('created_at');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('now-5d');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(Infinity);
        });

        it("accepts terms with '+'", () => {
            luceneQueryParser.parse('published_at:>now+5d');

            expect(luceneQueryParser._ast['left']!['field']).toBe('published_at');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('now+5d');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(Infinity);
        });

        it('handles escaping', () => {
            luceneQueryParser.parse('device_model:GALAXY\\ S8\\+');

            expect(luceneQueryParser._ast['left']!['field']).toBe('device_model');
            expect(luceneQueryParser._ast['left']!['term']).toBe('GALAXY\\ S8\\+');
        });

        it('handles empty term with operator', () => {
            expect(() => luceneQueryParser.parse('device_model: AND x:y')).toThrow();
        });

        it('parses terms with +', () => {
            luceneQueryParser.parse('fizz+buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz+buzz');
        });

        it('parses terms with -', () => {
            luceneQueryParser.parse('fizz-buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz-buzz');
        });

        it('parses terms with OR', () => {
            luceneQueryParser.parse('xxx:x86_OR');

            expect(luceneQueryParser._ast['left']!['term']).toBe('x86_OR');
        });

        it('parses term with regular expression', () => {
            luceneQueryParser.parse('/bar/');

            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['regexpr']).toBe(true);
        });

        it('parses term with regular expression containing /', () => {
            luceneQueryParser.parse('/fizz\\/buzz/');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz/buzz');
            expect(luceneQueryParser._ast['left']!['regexpr']).toBe(true);
        });
    });

    describe('luceneQueryParser: term prefix operators', () => {

        it('parses prefix operators (-)', () => {
            luceneQueryParser.parse('-bar');

            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('-');
        });

        it('parses prefix operator (+)', () => {
            luceneQueryParser.parse('+bar');

            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('+');
        });

        it('parses prefix operator on quoted term (-)', () => {
            luceneQueryParser.parse('-"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('-');
        });

        it('parses prefix operator on quoted term (+)', () => {
            luceneQueryParser.parse('+"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('+');
        });
    });

    describe('luceneQueryParser: field name support', () => {

        it('parses implicit field name for term', () => {
            luceneQueryParser.parse('bar');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
        });

        it('parses implicit field name for quoted term', () => {
            luceneQueryParser.parse('"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
        });

        it('parses explicit field name for term', () => {
            luceneQueryParser.parse('foo:bar');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
        });

        it('parses explicit field name for term for ipv4 and cidr', () => {
            luceneQueryParser.parse('ip:"157.30.173.14"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term']).toBe('157.30.173.14');

            luceneQueryParser.parse('ip:"192.198.0.0/24"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term']).toBe('192.198.0.0/24');
        });

        it('parses explicit field name for term for ipv6 and cidr', () => {
            luceneQueryParser.parse('ip:"2001:0:ce49:7601:e866:efff:62c3:fffe"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term']).toBe('2001:0:ce49:7601:e866:efff:62c3:fffe');

            luceneQueryParser.parse('ip:"fe80::/10"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term']).toBe('fe80::/10');

            luceneQueryParser.parse('ip:"::ffff:4a7d:2b63"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term']).toBe('::ffff:4a7d:2b63');
        });

        it('parses explicit field name for date term', () => {
            luceneQueryParser.parse('foo:2015-01-01');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('2015-01-01');
        });

        it("parses explicit field name including dots (e.g 'sub.field') for term", () => {
            luceneQueryParser.parse('sub.foo:bar');

            expect(luceneQueryParser._ast['left']!['field']).toBe('sub.foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
        });

        it('parses explicit field name for quoted term', () => {
            luceneQueryParser.parse('foo:"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
        });

        it('parses explicit field name for term with prefix', () => {
            luceneQueryParser.parse('foo:-bar');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('-');

            luceneQueryParser.parse('foo:+bar');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('+');
        });

        it('parses explicit field name for quoted term with prefix', () => {
            luceneQueryParser.parse('foo:-"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('-');

            luceneQueryParser.parse('foo:+"fizz buzz"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz buzz');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('+');
        });

    });

    describe('luceneQueryParser: conjunction operators', () => {

        it('parses implicit conjunction operator (OR)', () => {
            luceneQueryParser.parse('fizz buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (AND)', () => {
            luceneQueryParser.parse('fizz AND buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (OR)', () => {
            luceneQueryParser.parse('fizz OR buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('OR');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (NOT)', () => {
            luceneQueryParser.parse('fizz NOT buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('NOT');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (&&)', () => {
            luceneQueryParser.parse('fizz && buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (||)', () => {
            luceneQueryParser.parse('fizz || buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('OR');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (!)', () => {
            luceneQueryParser.parse('fizz ! buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('NOT');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });

        it('parses explicit conjunction operator (AND NOT)', () => {
            luceneQueryParser.parse('fizz AND NOT buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND NOT');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');

            luceneQueryParser.parse('fizz && ! buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND NOT');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');

            luceneQueryParser.parse('fizz && !buzz');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND NOT');
            expect(luceneQueryParser._ast['right']!['term']).toBe('buzz');
        });
    });

    describe('luceneQueryParser: parentheses groups', () => {

        it('parses parentheses group', () => {
            luceneQueryParser.parse('fizz (buzz baz)');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);

            const rightNode = luceneQueryParser._ast['right']!;

            expect(rightNode['left']!['term']).toBe('buzz');
            expect(rightNode['operator']).toBe(IMPLICIT);
            expect(rightNode['right']!['term']).toBe('baz');
        });

        it('parses parentheses groups with explicit conjunction operators ', () => {
            luceneQueryParser.parse('fizz AND (buzz OR baz)');

            expect(luceneQueryParser._ast['left']!['term']).toBe('fizz');
            expect(luceneQueryParser._ast['operator']).toBe('AND');

            const rightNode = luceneQueryParser._ast['right']!;

            expect(rightNode['left']!['term']).toBe('buzz');
            expect(rightNode['operator']).toBe('OR');
            expect(rightNode['right']!['term']).toBe('baz');
        });
    });

    describe('luceneQueryParser: range expressions', () => {

        it('parses inclusive range expression', () => {
            luceneQueryParser.parse('foo:[bar TO baz]');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('baz');
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(true);
        });

        it('parses exclusive range expression', () => {
            luceneQueryParser.parse('foo:{bar TO baz}');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('baz');
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(false);
        });

        it('parses inclusive/exclusive range expression', () => {
            luceneQueryParser.parse('foo:[bar TO baz}');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('baz');
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(false);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(false);
        });

        it('parses inclusive/exclusive range expression', () => {
            luceneQueryParser.parse('foo:{bar TO baz]');

            expect(luceneQueryParser._ast['left']!['field']).toBe('foo');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('bar');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('baz');
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(false);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(false);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('throws error if < > chars is used incorrectly', () => {
            expect((() => luceneQueryParser.parse('age:> 10'))).toThrowError('cannot have a space between a (<, <=, >, >=) and the value');
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('age:>10');

            expect(luceneQueryParser._ast['left']!['field']).toBe('age');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(10);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(Infinity);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(false);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('age:>=10');

            expect(luceneQueryParser._ast['left']!['field']).toBe('age');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(10);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(Infinity);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('can catch malformed range queries', () => {
            const errMsg = 'malformed range syntax, please use (<=, >=) and not(=<, =>)';
            expect(() => luceneQueryParser.parse('age: =>10')).toThrowError(errMsg);
            expect(() => luceneQueryParser.parse('age: =<10')).toThrowError(errMsg);
            expect(() => luceneQueryParser.parse('age:(>=10 AND =<20)')).toThrowError(errMsg);
        });

        it('parses inclusive/exclusive unnbounded ip range expression', () => {
            luceneQueryParser.parse('ip:<="2001:0:ce49:7601:e866:efff:62c3:eeee"');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('2001:0:ce49:7601:e866:efff:62c3:eeee');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(-Infinity);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('age:<10');

            expect(luceneQueryParser._ast['left']!['field']).toBe('age');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(-Infinity);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(10);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(false);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('age:<=10');

            expect(luceneQueryParser._ast['left']!['field']).toBe('age');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(-Infinity);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(10);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('age:(>=10 AND <20)');

            expect(luceneQueryParser._ast['left']!['field']).toBe('age');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(10);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(20);
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(false);
        });

        it('[], {] range with ip\'s', () => {
            luceneQueryParser.parse('ip:{"2001:0:ce49:7601:e866:efff:62c3:eeee" TO "2001:0:ce49:7601:e866:efff:62c3:ffff"]');

            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('2001:0:ce49:7601:e866:efff:62c3:eeee');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('2001:0:ce49:7601:e866:efff:62c3:ffff');
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(false);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });
        it('parses inclusive/exclusive unnbounded ip range expression', () => {
            //  DOES NOT WORK IN ELASTICSEARCH BUT { TO ] WORKS
            luceneQueryParser.parse('ip:(>="2001:0:ce49:7601:e866:efff:62c3:eeee" AND <="2001:0:ce49:7601:e866:efff:62c3:ffff")');
            expect(luceneQueryParser._ast['left']!['field']).toBe('ip');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('2001:0:ce49:7601:e866:efff:62c3:eeee');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('2001:0:ce49:7601:e866:efff:62c3:ffff');
            expect(luceneQueryParser._ast['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['inclusive_max']).toBe(true);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('bytes:((>=1000 AND <=200000) OR >5000000)');

            expect(luceneQueryParser._ast['left']!['field']).toBe('bytes');
            expect(luceneQueryParser._ast['left']!['left']!['operator']).toBe('OR');
            expect(luceneQueryParser._ast['left']!['left']!['right']!['term_min']).toBe(5000000);
            expect(luceneQueryParser._ast['left']!['left']!['right']!['term_max']).toBe(Infinity);
            expect(luceneQueryParser._ast['left']!['left']!['right']!['inclusive_min']).toBe(false);
            expect(luceneQueryParser._ast['left']!['left']!!['right']!['inclusive_max']).toBe(true);

            expect(luceneQueryParser._ast['left']!['left']!['left']!['term_min']).toBe(1000);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['term_max']).toBe(200000);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['inclusive_max']).toBe(true);
        });

        it('parses inclusive/exclusive unnbounded range expression', () => {
            luceneQueryParser.parse('bytes:((>=1000 AND <=200000) OR >5000000) AND wasFound:true');

            expect(luceneQueryParser._ast['left']!['field']).toBe('bytes');
            expect(luceneQueryParser._ast['left']!['left']!['operator']).toBe('OR');
            expect(luceneQueryParser._ast['left']!['left']!['right']!['term_min']).toBe(5000000);
            expect(luceneQueryParser._ast['left']!['left']!['right']!['term_max']).toBe(Infinity);
            expect(luceneQueryParser._ast['left']!['left']!['right']!['inclusive_min']).toBe(false);
            expect(luceneQueryParser._ast['left']!['left']!['right']!['inclusive_max']).toBe(true);

            expect(luceneQueryParser._ast['left']!['left']!['left']!['term_min']).toBe(1000);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['term_max']).toBe(200000);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['inclusive_min']).toBe(true);
            expect(luceneQueryParser._ast['left']!['left']!['left']!['inclusive_max']).toBe(true);

            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['field']).toBe('wasFound');
            expect(luceneQueryParser._ast['right']!['term']).toBe('true');
        });
    });

    describe('luceneQueryParser: Lucene Query syntax documentation examples', () => {

        it('parses example: title:"The Right Way" AND text:go', () => {
            luceneQueryParser.parse('title:"The Right Way" AND text:go');

            expect(luceneQueryParser._ast['left']!['field']).toBe('title');
            expect(luceneQueryParser._ast['left']!['term']).toBe('The Right Way');
            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['field']).toBe('text');
            expect(luceneQueryParser._ast['right']!['term']).toBe('go');
        });

        it('parses example: title:"Do it right" AND right', () => {
            luceneQueryParser.parse('title:"Do it right" AND right');

            expect(luceneQueryParser._ast['left']!['field']).toBe('title');
            expect(luceneQueryParser._ast['left']!['term']).toBe('Do it right');
            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('right');
        });

        it('parses example: title:Do it right', () => {
            luceneQueryParser.parse('title:Do it right');

            expect(luceneQueryParser._ast['left']!['field']).toBe('title');
            expect(luceneQueryParser._ast['left']!['term']).toBe('Do');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);

            const rightNode = luceneQueryParser._ast['right']!;

            expect(rightNode['left']!['field']).toBe(IMPLICIT);
            expect(rightNode['left']!['term']).toBe('it');
            expect(rightNode['operator']).toBe(IMPLICIT);

            expect(rightNode['right']!['field']).toBe(IMPLICIT);
            expect(rightNode['right']!['term']).toBe('right');
        });

        it('parses example: te?t', () => {
            luceneQueryParser.parse('te?t');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('te?t');
        });

        it('parses example: test*', () => {
            luceneQueryParser.parse('test*');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('test*');
        });

        it('parses example: te*t', () => {
            luceneQueryParser.parse('te*t');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('te*t');
        });

        it('parses example: roam~', () => {
            luceneQueryParser.parse('roam~');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('roam');
            expect(luceneQueryParser._ast['left']!['similarity']).toBe(0.5);
        });

        it('parses example: roam~0.8', () => {
            luceneQueryParser.parse('roam~0.8');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('roam');
            expect(luceneQueryParser._ast['left']!['similarity']).toBe(0.8);
        });

        it('parses example: "jakarta apache"~10', () => {
            luceneQueryParser.parse('"jakarta apache"~10');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['left']!['proximity']).toBe(10);
        });

        it('parses example: mod_date:[20020101 TO 20030101]', () => {
            luceneQueryParser.parse('mod_date:[20020101 TO 20030101]');

            expect(luceneQueryParser._ast['left']!['field']).toBe('mod_date');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe(20020101);
            expect(luceneQueryParser._ast['left']!['term_max']).toBe(20030101);
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(true);
        });

        it('parses example: title:{Aida TO Carmen}', () => {
            luceneQueryParser.parse('title:{Aida TO Carmen}');

            expect(luceneQueryParser._ast['left']!['field']).toBe('title');
            expect(luceneQueryParser._ast['left']!['term_min']).toBe('Aida');
            expect(luceneQueryParser._ast['left']!['term_max']).toBe('Carmen');
            expect(luceneQueryParser._ast['left']!['inclusive']).toBe(false);
        });

        it('parses example: jakarta apache', () => {
            luceneQueryParser.parse('jakarta apache');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('apache');
        });

        it('parses example: jakarta^4 apache', () => {
            luceneQueryParser.parse('jakarta^4 apache');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta');
            expect(luceneQueryParser._ast['left']!['boost']).toBe(4);
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('apache');
        });

        it('parses example: "jakarta apache"^4 "Apache Lucene"', () => {
            luceneQueryParser.parse('"jakarta apache"^4 "Apache Lucene"');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['left']!['boost']).toBe(4);
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('Apache Lucene');

        });

        it('parses example: "jakarta apache" jakarta', () => {
            luceneQueryParser.parse('"jakarta apache" jakarta');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('jakarta');
        });

        it('parses example: "jakarta apache" OR jakarta', () => {
            luceneQueryParser.parse('"jakarta apache" OR jakarta');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe('OR');
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('jakarta');
        });

        it('parses example: "jakarta apache" AND "Apache Lucene"', () => {
            luceneQueryParser.parse('"jakarta apache" AND "Apache Lucene"');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('Apache Lucene');
        });

        it('parses example: +jakarta lucene', () => {
            luceneQueryParser.parse('+jakarta lucene');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta');
            expect(luceneQueryParser._ast['left']!['prefix']).toBe('+');
        });

        it('parses example: "jakarta apache" NOT "Apache Lucene"', () => {
            luceneQueryParser.parse('"jakarta apache" NOT "Apache Lucene"');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe('NOT');
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('Apache Lucene');
        });

        it('parses example: NOT "jakarta apache"', () => {
            luceneQueryParser.parse('NOT "jakarta apache"');
            // not a valid query, so operator is ignored.
            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe(undefined);
        });

        it('parses example: "jakarta apache" -"Apache Lucene"', () => {
            luceneQueryParser.parse('"jakarta apache" -"Apache Lucene"');

            expect(luceneQueryParser._ast['left']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['left']!['term']).toBe('jakarta apache');
            expect(luceneQueryParser._ast['operator']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('Apache Lucene');
            expect(luceneQueryParser._ast['right']!['prefix']).toBe('-');
        });

        it('parses example: (jakarta OR apache) AND website', () => {
            luceneQueryParser.parse('(jakarta OR apache) AND website');

            const leftNode = luceneQueryParser._ast['left']!;

            expect(IMPLICIT).toEqual('<implicit>');
            expect(leftNode['left']!['field']).toBe(IMPLICIT);
            expect(leftNode['left']!['term']).toBe('jakarta');
            expect(leftNode['operator']).toBe('OR');
            expect(leftNode['right']!['field']).toBe(IMPLICIT);
            expect(leftNode['right']!['term']).toBe('apache');

            expect(luceneQueryParser._ast['operator']).toBe('AND');
            expect(luceneQueryParser._ast['right']!['field']).toBe(IMPLICIT);
            expect(luceneQueryParser._ast['right']!['term']).toBe('website');
        });

        it('parses example: title:(+return +"pink panther")', () => {
            luceneQueryParser.parse('title:(+return +"pink panther")');

            const leftNode = luceneQueryParser._ast['left']!;

            expect(leftNode['left']!['field']).toBe(IMPLICIT);
            expect(leftNode['left']!['term']).toBe('return');
            expect(leftNode['left']!['prefix']).toBe('+');
            expect(leftNode['operator']).toBe(IMPLICIT);
            expect(leftNode['right']!['field']).toBe(IMPLICIT);
            expect(leftNode['right']!['term']).toBe('pink panther');
            expect(leftNode['right']!['prefix']).toBe('+');
            expect(leftNode['field']).toBe('title');
        });
    });
});
