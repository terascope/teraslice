/*
 * Lucene Query Grammar for PEG.js
 * ========================================
 *
 * This grammar supports many of the constructs contained in the Lucene Query Syntax.
 *
 * Supported features:
 * - conjunction operators (AND, OR, ||, &&, NOT, !)
 * - prefix operators (+, -)
 * - quoted values ("foo bar")
 * - named fields (foo:bar)
 * - range expressions (foo:[bar TO baz], foo:{bar TO baz})
 * - proximity search expressions ("foo bar"~5)
 * - boost expressions (foo^5, "foo bar"^5)
 * - fuzzy search expressions (foo~, foo~0.5)
 * - parentheses grouping ( (foo OR bar) AND baz )
 * - field groups ( foo:(bar OR baz) )
 *
 * The grammar will create a parser which returns an AST for the query in the form of a tree
 * of nodes, which are dictionaries. There are three basic types of expression dictionaries:
 *
 * A node expression generally has the following structure:
 *
 * {
 *     'left' : dictionary,     // field expression or node
 *     'operator': string,      // operator value
 *     'right': dictionary,     // field expression OR node
 *     'field': string          // field name (for field group syntax) [OPTIONAL]
 * }
 *
 *
 * A field expression has the following structure:
 *
 * {
 *     'field': string,         // field name
 *     'term': string,          // term value
 *     'prefix': string         // prefix operator (+/-) [OPTIONAL]
 *     'boost': float           // boost value, (value > 1 must be integer) [OPTIONAL]
 *     'similarity': float      // similarity value, (value must be > 0 and < 1) [OPTIONAL]
 *     'proximity': integer     // proximity value [OPTIONAL]
 * }
 *
 *
 * A range expression has the following structure:
 *
 * {
 *     'field': string,         // field name
 *     'term_min': string,      // minimum value (left side) of range
 *     'term_max': string,      // maximum value (right side) of range
 *     'inclusive': boolean     // inclusive ([...]) or exclusive ({...})
 * }
 *
 * Other Notes:
 *
 * - For any field name, unnamed/default fields will have the value "<implicit>".
 * - Wildcards (fo*, f?o) and fuzzy search modifiers (foo~.8) will be part of the term value.
 * - Escaping is not supported and generally speaking, will break the parser.
 * - Conjunction operators that appear at the beginning of the query violate the logic of the
 *   syntax, and are currently "mostly" ignored. The last element will be returned.
 *
 *   For example:
 *       Query: OR
 *       Return: { "operator": "OR" }
 *
 *       Query: OR AND
 *       Return: { "operator": "AND" }
 *
 *       Query: OR AND foo
 *       Return: { "left": { "field": "<implicit>", "term": "foo" } }
 *
 *  To test the grammar, use the online parser generator at http://pegjs.majda.cz/online
 *
 */

 {
	const geoParameters = {
		_geo_point_: 'geo_point',
		_geo_distance_: 'geo_distance',
		_geo_box_top_left_: 'geo_box_top_left',
		_geo_box_bottom_right_: 'geo_box_bottom_right',
	};

	function isGeoExpression(node) {
		return geoParameters[node.field] != null;
	}

	function walkAst(node, fn, accum){
		fn(node, accum)
		if (node.left) walkAst(node.left, fn, accum)
		if (node.right) walkAst(node.right, fn, accum)
	}

	function getGeoData(node, accum) {
		if (isGeoExpression(node)) {
			accum[geoParameters[node.field]] = node.term;
		}
	}

	function parseGeoQuery(node) {
		if (node.left && isGeoExpression(node.left)) {
			const parsedGeoNode = { field: node.field };
			walkAst(node, getGeoData, parsedGeoNode);
            parsedGeoNode.type = 'geo';
            return parsedGeoNode;
		}

		return node;
	}

    function isNumber(input) {
        return typeof input === 'number' && !Number.isNaN(input);
    }

    function toNumber(input) {
        const num = Number(input);
        if (isNumber(num)) return num;
        return false;
    }

    function getTypeOf(input, defaultType='string') {
        if (typeof input === 'string') return 'string';
        if (isNumber(input)) return 'number';
        if (typeof input === 'boolean') return 'boolean';
        return defaultType;
    }

    function coerceValue(input) {
        if (typeof input !== 'string') return input;

        if (input === 'false') return false;
        if (input === 'true') return true;

        const num = toNumber(input);
        if (num !== false) return num;

        return input;
    }
}

start
    = _* node:node+
        {
            return node[0];
        }
    / _*
        {
            return {};
        }
    / EOF
        {
            return {};
        }

node
    = operator:operator_exp EOF
        {
            return {
                 type: 'operator',
                 operator
            };
        }
    / rangeExp1:range_operator_exp _* operator:operator_exp _* rangeExp2:range_term _*
    	{
            const results = {
                type: 'operator',
            	left: rangeExp1,
                operator,
                right: rangeExp2
            };

            return results;
        }
    / rangeExp1:range_term _* operator:operator_exp _* rangeExp2:range_operator_exp _*
    	{
            const results = {
                type: 'operator',
            	left: rangeExp1,
                operator,
                right: rangeExp2
            };

            return results;
        }
    / type:range_exp_op range_value:rangevalue _* operator_exp _* type2:range_exp_op range_value2:rangevalue _*
        {
            const results = {
                type: getTypeOf(range_value),
                term_min: range_value,
                term_max: Infinity,
                inclusive_min: false,
                inclusive_max: false
            };

            const args = {};
            args[type] = range_value;
            args[type2] = range_value2;

            if (args['>=']) {
                results.inclusive_min = true;
                results.term_min = args['>='];
            }

            if (args['>']) {
                results.term_min = args['>'];
            }

            if (args['<=']) {
                results.inclusive_max = true;
                results.term_max = args['<='];
            }

            if (args['<']) {
                results.term_max = args['<'];
            }

            return results;
        }
    / operator:operator_exp right:node
        {
            return right;
        }

    / left:group_exp operator:operator_exp* right:node*
        {
            const node = {
                type: 'operator',
                left
            };

            const rightExp =
                    right.length == 0
                    ? null
                    : right[0]['right'] == null
                        ? right[0]['left']
                        : right[0];

            if (rightExp != null) {
                node.operator = operator=='' || operator==undefined ? '<implicit>' : operator[0];
                node.right = rightExp;
            }

            return node;
        }

group_exp
    = field_exp:field_exp _*
        {
            return field_exp;
        }
    / paren_exp

paren_exp
    = "(" _* node:node+ _* ")" _*
        {
            const results = node[0];
            // only mark if there is further logic to group
            if (results.left || results.right) results.parens = true;
            return results;
        }

field_exp
    = fieldname:fieldname? range:range_operator_exp
        {
            range['field'] =
                fieldname == '' || fieldname == undefined
                    ? "<implicit>"
                    : fieldname;

            return range;
        }
    / fieldname:fieldname? node:paren_exp operator:operator_exp range_exp:range_term _*
        {
        	return {
                operator,
                left: node,
                right: range_exp
            };
        }
    / fieldname:fieldname? node:paren_exp
        {
            node.field = fieldname;
            return parseGeoQuery(node);
        }
    / fieldname:fieldname range_exp:range_term
        {
            range_exp.field = fieldname;
            return range_exp;
        }
    / fieldname:fieldname? term:term
        {
            const fieldexp = {
                'field':
                    fieldname == '' || fieldname == undefined
                        ? "<implicit>"
                        : fieldname
                };

            for(var key in term)
                fieldexp[key] = term[key];

            return fieldexp;
        }


range_exp_op
	= optype:">=" { return optype; }
    / optype:"<=" { return optype; }
	/ optype:"<" { return optype; }
    / optype:">" { return optype; }
    / faulty_range_term
 		{
            const error = new Error('malformed range syntax, please use (<=, >=) and not(=<, =>)');
            error.name = 'SyntaxError';
            throw error;
        }

range_term
    = type:range_exp_op _+ value:rangevalue
        {
            const error = new Error('cannot have a space between a (<, <=, >, >=) and the value')
            error.name = 'SyntaxError';
            throw error
        }
    / type:range_exp_op value:rangevalue _*
        {
            if(type === '>') {
                return {
                    term_min: value,
                    term_max: Infinity,
                    inclusive_min: false,
                    inclusive_max: true
                };
            }
            if(type === '>=') {
                return {
                    term_min: value,
                    term_max: Infinity,
                    inclusive_min: true,
                    inclusive_max: true
                };
            }
            if(type === '<') {
                return {
                    term_min: -Infinity,
                    term_max: value,
                    inclusive_min: true,
                    inclusive_max: false
                };
            }
            if(type === '<=') {
                return {
                    term_min: -Infinity,
                    term_max: value,
                    inclusive_min: true,
                    inclusive_max: true
                };
            }
    }

rangevalue
    = termValue:range_chars
        {
            const { term } = termValue;
            const num = toNumber(term);
            if (num !== false) return num;
            return term
        }
   / termValue:quoted_term
        {
            return termValue
        }

fieldname
    = fieldname:unquoted_restricted_term _* [:] _*
        {
            return fieldname;
        }

term
    = op:prefix_operator_exp? term:quoted_term proximity:proximity_modifier? boost:boost_modifier? _*
        {
            const type = getTypeOf(term);
            const result = {
                type,
                term,
                regexpr: false,
                wildcard: false,
            };

            if('' != proximity) {
                result.proximity = proximity;
            }

            if('' != boost) {
                result.boost = boost;
            }

            if('' != op) {
                result.prefix = op;
            }

            return result;
        }
    / op:prefix_operator_exp? term:unquoted_term similarity:fuzzy_modifier? boost:boost_modifier? _*
        {
            const termValue = coerceValue(term);
            const type = getTypeOf(termValue);
            const result = {
                term: termValue,
                type,
                unrestricted: false,
            };

            if (type === 'string') {
                result.wildcard = /[\?\*]/.test(termValue);
                result.regexpr = false;
            }

            if('' != similarity) {
                result.similarity = similarity;
            }

            if('' != boost) {
                result.boost = boost;
            }

            if('' != op) {
                result.prefix = op;
            }

            return result;
        }
    / op:prefix_operator_exp? term:unquoted_restricted_term similarity:fuzzy_modifier? boost:boost_modifier? _*
        {

            const termValue = coerceValue(term)
            const result = {
                term: termValue,
                type: getTypeOf(termValue),
                unrestricted: true,
            };

            if('' != similarity) {
                result.similarity = similarity;
            }

            if('' != boost) {
                result.boost = boost;
            }

            if('' != op) {
                result.prefix = op;
            }

            return result;
        }
    / op:prefix_operator_exp? term:regexpr_term boost:boost_modifier? _*
        {
            const result = {
                term,
                type: 'string',
                wildcard: false,
                'regexpr': true
            };

            if('' != boost) {
                result.boost = boost;
            }
            if('' != op) {
                result.prefix = op;
            }

            return result;
        }

range_chars
    =  term_start:term_start_char terms:guarded_char*
        {
            const term = term_start + terms.join('');
            return { term };
        }

unquoted_restricted_term
    = term_start:term_start_char term:field_char*
        {
            const res = term_start + term.join('');

            if (/^(?:AND|OR|NOT|\|\||&&)$/.test(res)) {
                const e = new Error('Term can not be AND, OR, NOT, ||, &&')
                e.name = 'SyntaxError'
                e.column = location
                throw e
            }

            return res
        }

unquoted_term
    = term_start:term_start_char term:term_char*
        {
            const res = term_start + term.join('');

            if (/^(?:AND|OR|NOT|\|\||&&)$/.test(res)) {
                const e = new Error('Term can not be AND, OR, NOT, ||, &&')
                e.name = 'SyntaxError'
                e.column = location
                throw e
            }

            return res
        }

term_start_char
    = '.' / term_escaping_char / [^: \t\r\n\f\{\}()"+-/^~\[\]]

term_escaping_char
    = '\\' escaping_char:[: \t\r\n\f\{\}()"/^~\[\]]
        {
            return '\\' + escaping_char;
        }

field_char
    = '+' / '-' / term_escaping_char / term_start_char

term_char
    = field_char / other_chars

other_chars
    = guarded_char / ['\[''\{''\]''\}''\*']

guarded_char
    = [A-Z_a-z:0-9,'\_''\-''\+''\:''\.']

regexpr_term
    = '/' term:regexpr_char+ '/'
        {
            return term.join('').replace('\\/', '/');
        }

regexpr_char
    = '.' / '\\/' / [^/]


quoted_term
    = '"' term:[^"]+ '"'
        {
            return term.join('');
        }

proximity_modifier
    = '~' proximity:int_exp
        {
            return proximity;
        }

boost_modifier
    = '^' boost:decimal_or_int_exp
        {
            return boost;
        }

fuzzy_modifier
    = '~' fuzziness:decimal_exp?
        {
            return fuzziness == '' || fuzziness == undefined ? 0.5 : fuzziness;
        }

decimal_or_int_exp
    = decimal_exp
    / int_exp

decimal_exp
    = '0.' val:[0-9]+ _*
        {
            return parseFloat(`0.${val.join('')}`);
        }

int_exp
    = val:[0-9]+ _*
        {
            return parseInt(val.join(''));
        }

range_operator_exp
    = '[' term_min:rangevalue _* 'TO' _+ term_max:rangevalue ']'
        {
            return {
                term_min,
                term_max,
                inclusive: true,
                inclusive_min: true,
                inclusive_max: true
            };
        }
    / '{' term_min:rangevalue _* 'TO' _+ term_max:rangevalue '}'
        {
            return {
                term_min,
                term_max,
                inclusive: false,
                inclusive_min: false,
                inclusive_max: false
            };
        }
    / '{' term_min:rangevalue _* 'TO' _+ term_max:rangevalue ']'
        {
            return {
                term_min,
                term_max,
                inclusive: false,
                inclusive_min: false,
                inclusive_max: true
            };
        }
    / '[' term_min:rangevalue _* 'TO' _+ term_max:rangevalue '}'
        {
            return {
                term_min,
                term_max,
                inclusive: false,
                inclusive_min: true,
                inclusive_max: false
            };
        }

operator_exp
 	= _* operator1:operator _* operator2:operator _*
        {
        	if (operator1 === 'AND' && operator2 === 'NOT') return 'NOT';
            throw new Error(`cannot combine operators ${operator1} and ${operator2} together`)
        }
    / _* operator:operator _+
        {
            return operator;
        }
    / _* operator:operator EOF
        {
            return operator;
        }

operator
    = 'OR'
    / 'AND'
    / 'NOT'
    / '||' { return 'OR'; }
    / '&&' { return 'AND'; }
    / '!' { return 'NOT'}

prefix_operator_exp
    = _* operator:prefix_operator
        {
            return operator;
        }

faulty_range_term
	= '=>'
    / '=<'

prefix_operator
    = '+'
    / '-'

_ "whitespace"
    = [ \t\r\n\f]+

EOF
    = !.
