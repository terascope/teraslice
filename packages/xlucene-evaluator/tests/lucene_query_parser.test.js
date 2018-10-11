'use strict';

const LuceneQueryParser = require('../lib/lucene-query-parser');

xdescribe("luceneQueryParser: whitespace handling", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    // term parsing
    it("handles empty string", () => {
        luceneQueryParser.parse('');

        expect(isEmpty(luceneQueryParser.rawAst)).toBe(true);
    });

    it("handles leading whitespace with no contents", () => {
        luceneQueryParser.parse(' \r\n');

        expect(isEmpty(luceneQueryParser.rawAst)).toBe(true);
    });

    it("handles leading whitespace before an expression string", () => {
        luceneQueryParser.parse(' Test:Foo');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('Test');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('Foo');
    });

    it("handles whitespace around the colon", () => {
      luceneQueryParser.parse('Test : Foo');

      expect(luceneQueryParser.rawAst['left']['field']).toBe('Test');
      expect(luceneQueryParser.rawAst['left']['term']).toBe('Foo');
    });

    function isEmpty(arr) {
        for(const i in arr) {
            return false;
        }
        return true;
    }
});

xdescribe("luceneQueryParser: term parsing", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });
    // term parsing
    it("parses terms", () => {
        luceneQueryParser.parse('bar');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
    });

    it("parses quoted terms", () => {
        luceneQueryParser.parse('"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
    });
    //TODO: FIXME: this has issues with date math
    it("accepts terms with '-'", () => {
        luceneQueryParser.parse('created_at:>now-5d');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('>now-5d');
    });

    it("accepts terms with '+'", () => {
        luceneQueryParser.parse('published_at:>now+5d');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('>now+5d');
    });

    it("handles escaping", () => {
      luceneQueryParser.parse('device_model:GALAXY\\ S8\\+');

      expect(luceneQueryParser.rawAst['left']['field']).toBe('device_model');
      expect(luceneQueryParser.rawAst['left']['term']).toBe('GALAXY\\ S8\\+');
    });

    it("handles empty term with operator", () => {
      expect(function () {
        luceneQueryParser.parse('device_model: AND x:y');
      }).toThrow(new SyntaxError('Term can not be AND, OR, NOT, ||, &&'));
    });

    it("parses terms with +", () => {
      luceneQueryParser.parse('fizz+buzz');

      expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz+buzz');
    });

    it("parses terms with -", () => {
      luceneQueryParser.parse('fizz-buzz');

      expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz-buzz');
    });

    it("parses terms with OR", () => {
      luceneQueryParser.parse('xxx:x86_OR');

      expect(luceneQueryParser.rawAst['left']['term']).toBe('x86_OR');
    });

    it("parses term with regular expression", () => {
      luceneQueryParser.parse('/bar/');

      expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
      expect(luceneQueryParser.rawAst['left']['regexpr']).toBe(true);
    });

    it("parses term with regular expression containing /", () => {
      luceneQueryParser.parse('/fizz\\/buzz/');

      expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz/buzz');
      expect(luceneQueryParser.rawAst['left']['regexpr']).toBe(true);
    });
});

xdescribe("luceneQueryParser: term prefix operators", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    it("parses prefix operators (-)", () => {
        luceneQueryParser.parse('-bar');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('-');
    });

    it("parses prefix operator (+)", () => {
        luceneQueryParser.parse('+bar');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('+');
    });

    it("parses prefix operator on quoted term (-)", () => {
        luceneQueryParser.parse('-"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('-');
    });

    it("parses prefix operator on quoted term (+)", () => {
        luceneQueryParser.parse('+"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('+');
    });
});

xdescribe("luceneQueryParser: field name support", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    it("parses implicit field name for term", () => {
        luceneQueryParser.parse('bar');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
    });

    it("parses implicit field name for quoted term", () => {
        luceneQueryParser.parse('"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
    });

    it("parses explicit field name for term", () => {
        luceneQueryParser.parse('foo:bar');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
    });

    it("parses explicit field name for date term", () => {
        luceneQueryParser.parse('foo:2015-01-01');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('2015-01-01');
    });

    it("parses explicit field name including dots (e.g 'sub.field') for term", () => {
        luceneQueryParser.parse('sub.foo:bar');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('sub.foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
    });


    it("parses explicit field name for quoted term", () => {
        luceneQueryParser.parse('foo:"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
    });

    it("parses explicit field name for term with prefix", () => {
        luceneQueryParser.parse('foo:-bar');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('-');

        luceneQueryParser.parse('foo:+bar');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('+');
    });

    it("parses explicit field name for quoted term with prefix", () => {
        luceneQueryParser.parse('foo:-"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('-');

        luceneQueryParser.parse('foo:+"fizz buzz"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz buzz');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('+');
    });

});

xdescribe("luceneQueryParser: conjunction operators", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    it("parses implicit conjunction operator (OR)", () => {
        luceneQueryParser.parse('fizz buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (AND)", () => {
        luceneQueryParser.parse('fizz AND buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (OR)", () => {
        luceneQueryParser.parse('fizz OR buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('OR');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (NOT)", () => {
        luceneQueryParser.parse('fizz NOT buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('NOT');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (&&)", () => {
        luceneQueryParser.parse('fizz && buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (||)", () => {
        luceneQueryParser.parse('fizz || buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('OR');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });

    it("parses explicit conjunction operator (!)", () => {
        luceneQueryParser.parse('fizz ! buzz');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('NOT');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('buzz');
    });
});

xdescribe("luceneQueryParser: parentheses groups", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    it("parses parentheses group", () => {
        luceneQueryParser.parse('fizz (buzz baz)');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');

        const rightNode = luceneQueryParser.rawAst['right'];

        expect(rightNode['left']['term']).toBe('buzz');
        expect(rightNode['operator']).toBe('<implicit>');
        expect(rightNode['right']['term']).toBe('baz');
    });

    it("parses parentheses groups with explicit conjunction operators ", () => {
        luceneQueryParser.parse('fizz AND (buzz OR baz)');

        expect(luceneQueryParser.rawAst['left']['term']).toBe('fizz');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');

        const rightNode = luceneQueryParser.rawAst['right'];

        expect(rightNode['left']['term']).toBe('buzz');
        expect(rightNode['operator']).toBe('OR');
        expect(rightNode['right']['term']).toBe('baz');
    });
});

xdescribe("luceneQueryParser: range expressions", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    it("parses inclusive range expression", () => {
        luceneQueryParser.parse('foo:[bar TO baz]');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe('baz');
        expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(true);
    });

    it("parses exclusive range expression", () => {
        luceneQueryParser.parse('foo:{bar TO baz}');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe('bar');
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe('baz');
        expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(false);
    });

    it("parses inclusive/exclusive range expression", () => {
      luceneQueryParser.parse('foo:[bar TO baz}');

      expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
      expect(luceneQueryParser.rawAst['left']['term_min']).toBe('bar');
      expect(luceneQueryParser.rawAst['left']['term_max']).toBe('baz');
      expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(false);
      expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(true);
      expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(false);
    });

    it("parses inclusive/exclusive range expression", () => {
      luceneQueryParser.parse('foo:{bar TO baz]');

      expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
      expect(luceneQueryParser.rawAst['left']['term_min']).toBe('bar');
      expect(luceneQueryParser.rawAst['left']['term_max']).toBe('baz');
      expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(false);
      expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(false);
      expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(true);
    });
    
    it("parses inclusive/exclusive unnbounded range expression", () => {
        expect((() => luceneQueryParser.parse('age:> 10'))).toThrowError('cannot have a space between a (<, <=, >, >=) and the value');
    });

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('age:>10');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('age');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe(10);
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe(Infinity);
        expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(false);
        expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(true);
    });

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('age:>=10');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('age');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe(10);
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe(Infinity);
        expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(true);
    });

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('age:<10');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('age');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe(-Infinity);
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe(10);
        expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(false);
    });

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('age:<=10');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('age');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe(-Infinity);
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe(10);
        expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(true);
    });

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('age:(>=10 AND <20)');
        //TODO: grammar three is the current correct one
        expect(luceneQueryParser.rawAst['left']['field']).toBe('age');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe(10);
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe(20);
        expect(luceneQueryParser.rawAst['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['inclusive_max']).toBe(false);
    }); 

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('bytes:((>=1000 AND <=200000) OR >5000000)');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('bytes');
        expect(luceneQueryParser.rawAst['left']['left']['operator']).toBe('OR');
        expect(luceneQueryParser.rawAst['left']['left']['right']['term_min']).toBe(5000000);
        expect(luceneQueryParser.rawAst['left']['left']['right']['term_max']).toBe(Infinity);
        expect(luceneQueryParser.rawAst['left']['left']['right']['inclusive_min']).toBe(false);
        expect(luceneQueryParser.rawAst['left']['left']['right']['inclusive_max']).toBe(true);

        expect(luceneQueryParser.rawAst['left']['left']['left']['term_min']).toBe(1000);
        expect(luceneQueryParser.rawAst['left']['left']['left']['term_max']).toBe(200000);
        expect(luceneQueryParser.rawAst['left']['left']['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['left']['left']['inclusive_max']).toBe(true);
           
    }); 

    it("parses inclusive/exclusive unnbounded range expression", () => {
        luceneQueryParser.parse('bytes:((>=1000 AND <=200000) OR >5000000) AND wasFound:true');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('bytes');
        expect(luceneQueryParser.rawAst['left']['left']['operator']).toBe('OR');
        expect(luceneQueryParser.rawAst['left']['left']['right']['term_min']).toBe(5000000);
        expect(luceneQueryParser.rawAst['left']['left']['right']['term_max']).toBe(Infinity);
        expect(luceneQueryParser.rawAst['left']['left']['right']['inclusive_min']).toBe(false);
        expect(luceneQueryParser.rawAst['left']['left']['right']['inclusive_max']).toBe(true);

        expect(luceneQueryParser.rawAst['left']['left']['left']['term_min']).toBe(1000);
        expect(luceneQueryParser.rawAst['left']['left']['left']['term_max']).toBe(200000);
        expect(luceneQueryParser.rawAst['left']['left']['left']['inclusive_min']).toBe(true);
        expect(luceneQueryParser.rawAst['left']['left']['left']['inclusive_max']).toBe(true);


        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('wasFound');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('true');
    }); 
});

xdescribe("luceneQueryParser: Lucene Query syntax documentation examples", () => {
    let luceneQueryParser;
    
    beforeEach(() => {
        luceneQueryParser = new LuceneQueryParser();
    });

    /*
        Examples from Lucene documentation at

        http://lucene.apache.org/java/2_9_4/queryparsersyntax.html

        title:"The Right Way" AND text:go
        title:"Do it right" AND right
        title:Do it right

        te?t
        test*
        te*t

        roam~
        roam~0.8

        "jakarta apache"~10
        mod_date:[20020101 TO 20030101]
        title:{Aida TO Carmen}

        jakarta apache
        jakarta^4 apache
        "jakarta apache"^4 "Apache Lucene"
        "jakarta apache" jakarta
        "jakarta apache" OR jakarta
        "jakarta apache" AND "Apache Lucene"
        +jakarta lucene
        "jakarta apache" NOT "Apache Lucene"
        NOT "jakarta apache"
        "jakarta apache" -"Apache Lucene"
        (jakarta OR apache) AND website
        title:(+return +"pink panther")
    */

    it('parses example: title:"The Right Way" AND text:go', () => {
        luceneQueryParser.parse('title:"The Right Way" AND text:go');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('title');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('The Right Way');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('text');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('go');
    });

    it('parses example: title:"Do it right" AND right', () => {
        luceneQueryParser.parse('title:"Do it right" AND right');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('title');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('Do it right');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('right');
    });

    it('parses example: title:Do it right', () => {
        luceneQueryParser.parse('title:Do it right');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('title');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('Do');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');

        const rightNode = luceneQueryParser.rawAst['right'];

        expect(rightNode['left']['field']).toBe('<implicit>');
        expect(rightNode['left']['term']).toBe('it');
        expect(rightNode['operator']).toBe('<implicit>');

        expect(rightNode['right']['field']).toBe('<implicit>');
        expect(rightNode['right']['term']).toBe('right');
    });

    it('parses example: te?t', () => {
        luceneQueryParser.parse('te?t');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('te?t');
    });

    it('parses example: test*', () => {
        luceneQueryParser.parse('test*');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('test*');
    });

    it('parses example: te*t', () => {
        luceneQueryParser.parse('te*t');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('te*t');
    });

    it('parses example: roam~', () => {
        luceneQueryParser.parse('roam~');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('roam');
        expect(luceneQueryParser.rawAst['left']['similarity']).toBe(0.5);
    });

    it('parses example: roam~0.8', () => {
        luceneQueryParser.parse('roam~0.8');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('roam');
        expect(luceneQueryParser.rawAst['left']['similarity']).toBe(0.8);
    });

    it('parses example: "jakarta apache"~10', () => {
        luceneQueryParser.parse('"jakarta apache"~10');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['left']['proximity']).toBe(10);
    });

    it('parses example: mod_date:[20020101 TO 20030101]', () => {
        luceneQueryParser.parse('mod_date:[20020101 TO 20030101]');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('mod_date');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe('20020101');
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe('20030101');
        expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(true);
    });

    it('parses example: title:{Aida TO Carmen}', () => {
        luceneQueryParser.parse('title:{Aida TO Carmen}');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('title');
        expect(luceneQueryParser.rawAst['left']['term_min']).toBe('Aida');
        expect(luceneQueryParser.rawAst['left']['term_max']).toBe('Carmen');
        expect(luceneQueryParser.rawAst['left']['inclusive']).toBe(false);
    });

    it('parses example: jakarta apache', () => {
        luceneQueryParser.parse('jakarta apache');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('apache');
    });

    it('parses example: jakarta^4 apache', () => {
        luceneQueryParser.parse('jakarta^4 apache');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta');
        expect(luceneQueryParser.rawAst['left']['boost']).toBe(4);
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('apache');
    });

    it('parses example: "jakarta apache"^4 "Apache Lucene"', () => {
        luceneQueryParser.parse('"jakarta apache"^4 "Apache Lucene"');


        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['left']['boost']).toBe(4);
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('Apache Lucene');

    });

    it('parses example: "jakarta apache" jakarta', () => {
        luceneQueryParser.parse('"jakarta apache" jakarta');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('jakarta');
    });

    it('parses example: "jakarta apache" OR jakarta', () => {
        luceneQueryParser.parse('"jakarta apache" OR jakarta');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe('OR');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('jakarta');
    });

    it('parses example: "jakarta apache" AND "Apache Lucene"', () => {
        luceneQueryParser.parse('"jakarta apache" AND "Apache Lucene"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('Apache Lucene');
    });

    it('parses example: +jakarta lucene', () => {
        luceneQueryParser.parse('+jakarta lucene');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta');
        expect(luceneQueryParser.rawAst['left']['prefix']).toBe('+');
    });

    it('parses example: "jakarta apache" NOT "Apache Lucene"', () => {
        luceneQueryParser.parse('"jakarta apache" NOT "Apache Lucene"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe('NOT');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('Apache Lucene');
    });

    it('parses example: NOT "jakarta apache"', () => {
        luceneQueryParser.parse('NOT "jakarta apache"');
        // not a valid query, so operator is ignored.
        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe(undefined);
    });

    it('parses example: "jakarta apache" -"Apache Lucene"', () => {
        luceneQueryParser.parse('"jakarta apache" -"Apache Lucene"');

        expect(luceneQueryParser.rawAst['left']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['left']['term']).toBe('jakarta apache');
        expect(luceneQueryParser.rawAst['operator']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('Apache Lucene');
        expect(luceneQueryParser.rawAst['right']['prefix']).toBe('-');
    });

    it('parses example: (jakarta OR apache) AND website', () => {
        luceneQueryParser.parse('(jakarta OR apache) AND website');

        const leftNode = luceneQueryParser.rawAst['left'];
        expect(leftNode['left']['field']).toBe('<implicit>');
        expect(leftNode['left']['term']).toBe('jakarta');
        expect(leftNode['operator']).toBe('OR');
        expect(leftNode['right']['field']).toBe('<implicit>');
        expect(leftNode['right']['term']).toBe('apache');

        expect(luceneQueryParser.rawAst['operator']).toBe('AND');
        expect(luceneQueryParser.rawAst['right']['field']).toBe('<implicit>');
        expect(luceneQueryParser.rawAst['right']['term']).toBe('website');
    });

    it('parses example: title:(+return +"pink panther")', () => {
        luceneQueryParser.parse('title:(+return +"pink panther")');

        const leftNode = luceneQueryParser.rawAst['left'];

        expect(leftNode['left']['field']).toBe('<implicit>');
        expect(leftNode['left']['term']).toBe('return');
        expect(leftNode['left']['prefix']).toBe('+');
        expect(leftNode['operator']).toBe('<implicit>');
        expect(leftNode['right']['field']).toBe('<implicit>');
        expect(leftNode['right']['term']).toBe('pink panther');
        expect(leftNode['right']['prefix']).toBe('+');
        expect(leftNode['field']).toBe('title');
    });
  });

  xdescribe("luceneQueryParser: pending tests", () => {
    // see issue: https://github.com/thoward/lucene-query-parser.js/issues/1
    it("handles escaped quotes", () => {
      luceneQueryParser.parse('foo:"bar \"baz\""');

      expect(luceneQueryParser.rawAst['left']['field']).toBe('foo');
      expect(luceneQueryParser.rawAst['left']['term']).toBe('bar \"baz\"');
    });
  });
