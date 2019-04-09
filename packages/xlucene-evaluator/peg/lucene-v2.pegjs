/** Functions **/
{
    const x = require('xlucene-evaluator');

    /**
    * Propagate the default field on a field group expression
    * @todo use the types from the new xlucene-parse
    */
    function propagateDefaultField(node, field) {
       if (!node) return;

       const termTypes = ['term', 'regexp', 'range', 'wildcard'];
       if (termTypes.includes(node.type) && !node.field) {
           node.field = field;
           return;
       }

       if (node.type === 'negation') {
           propagateDefaultField(node.node, field);
           return;
       }

       const groupTypes = ['logical-group', 'field-group'];
       if (groupTypes.includes(node.type)) {
           for (const conj of node.flow) {
               propagateDefaultField(conj, field);
           }
           return;
       }

       if (node.type === 'conjunction') {
           for (const conj of node.nodes) {
               propagateDefaultField(conj, field);
           }
           return;
       }
    }

    function parseGeoPoint(str) {
        const [lon, lat] = x.parseGeoPoint(str);
        return { lat, lon };
    }
}


/** Control Flow **/
start
    = ws* negate:NegationExpression ws* EOF { return negate }
    / ws* logic:LogicalGroup ws* { return logic; }
    / ws* term:UnqoutedTermType ws* EOF { return term; }
    / ws* term:TermExpression ws* EOF { return term; }
    / ws* EOF {
        return {
            type: 'empty',
        }
    }

/** Expressions */
LogicalGroup
    // recursively go through and chain conjunctions together so
    // the operations evaluated. If any operation passes
    // then you can stop early.
   = conjunctions:Conjunction+ {
        return {
            type: 'logical-group',
            flow: [].concat(...conjunctions)
        };
   }

ParensGroup
    = ParensStart ws* group:LogicalGroup ws* ParensEnd {
        return group;
    }

Conjunction
    // group all AND nodes together
    = nodes:AndConjunctionStart+ {
        return [{
            type: 'conjunction',
            nodes: [].concat(...nodes),
        }]
    }
    /*
    * nodes:OrConjunction+ returns
    [
        // if not nested in an array, they will not be grouped together
        [ { "type": "term", ... } ]
        [
            // if there is a nest array those nodes ARE grouped together
            [{ "type": "term", ... }]
        ]
    ]
    **/
    / nodes:OrConjunction+ {
        return nodes.reduce((prev, current) => {
            current.forEach((node) => {
                prev.push({
                    type: 'conjunction',
                    nodes: Array.isArray(node) ? node : [node]
                })
            });
            return prev;
        }, []);
    }


AndConjunctionStart
    = left:TermGroup ws+ nodes:AndConjunction {
        return [left, ...nodes]
    }

AndConjunction
    // this implicitly converts NOT to an AND
    // IMPORTANT this does not consume `NOT` so negation can detect it
    = ws* &'NOT' ws* right:TermGroup nodes:AndConjunction? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }
    / ws* AndConjunctionOperator ws+ right:TermGroup nodes:AndConjunction? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }

OrConjunction
    = left:TermGroup ws+ OrConjunctionOperator ws+ right:TermGroup nodes:AndConjunction? {
        // if nodes exists that means the right should be joined with the next AND statements
        if (nodes) {
            return [ left, [ right, ...nodes ] ];
        }
        return [ left, right ];
    }
    / ws+ OrConjunctionOperator ws+ right:TermGroup nodes:AndConjunction? {
        // if nodes exists that means the right should be joined with the next AND statements
        if (nodes) {
            return [ [ right, ...nodes ] ];
        }
        return [right]
    }
    // Implicit ORs only work with at least one quoted, field/value pair or parens group
    / left:FieldOrQuotedTermGroup ws+ right:TermGroup {
        return [left, right]
    }
    / left:TermGroup ws+ right:FieldOrQuotedTermGroup {
        return [left, right]
    }

TermGroup
    = NegationExpression / ParensGroup / TermExpression

FieldOrQuotedTermGroup
    = ParensGroup / FieldOrQuotedTermExpression

NegationExpression
    = 'NOT' ws+ node:NegatedTermGroup {
        return {
            type: 'negation',
            node
        }
    }
    / '!' ws* node:NegatedTermGroup {
        return {
            type: 'negation',
            node
        }
    }

NegatedTermGroup
    = node:ParensGroup / node:TermExpression

FieldGroup
    = field:FieldName ws* FieldSeparator ws* group:ParensGroup {
        propagateDefaultField(group, field);
        return {
            ...group,
            type: 'field-group',
            field,
        }
    }

BaseTermExpression
    = ExistsKeyword ws* FieldSeparator ws* field:FieldName {
        return {
            type: 'exists',
            field,
        }
    }
    / field:FieldName ws* FieldSeparator ws* range:RangeExpression {
        return {
            ...range,
            field,
        }
    }
    / GeoTermExpression
    / FieldGroup
    / field:FieldName ws* FieldSeparator ws* term:TermType {
        return {
            ...term,
            field,
        }
    }

TermExpression
    = BaseTermExpression
    / range:RangeExpression {
        return {
            ...range,
            field: null,
        }
    }
    / term:WildcardType {
        return {
            ...term,
            field: null,
        }
    }
    / term:TermType {
        return {
            ...term,
            field: null,
        }
    }

FieldOrQuotedTermExpression
    = BaseTermExpression
    / term:QuotedStringType {
        return {
            ...term,
            field: null,
        }
    }

GeoTermExpression
    = field:FieldName ws* FieldSeparator ws* ParensStart ws* term:GeoTermType ws* ParensEnd {
        return {
            ...term,
            field,
        };
    }

ParensStringType
    = ParensStart ws* term:UnqoutedStringType ws* ParensEnd {
        return term;
    }

UnqoutedTermType
    = term:UnqoutedStringType {
        return {
            ...term,
            field: null,
        }
    }

RangeExpression
    = left:LeftRangeExpression ws+ RangeJoinOperator ws+ right:RightRangeExpression {
        return {
            type: 'range',
            left,
            right,
        }
    }
    / operator:RangeOperator value:TermType {
        return {
            type: 'range',
            left: {
                operator,
                ...value,
            },
        }
    }

LeftRangeExpression
    = operator:StartRangeChar ws* value:LeftRangeType {
        return {
            ...value,
            operator,
        }
    }

RightRangeExpression
    = ws* value:RightRangeType operator:EndRangeChar {
        return {
            ...value,
            operator,
        }
    }

GeoTermType
    = point:GeoPoint ws* distance:GeoDistance {
        return {
            type: 'geo-distance',
            ...point,
            ...distance
        }
    }
    / distance:GeoDistance ws* point:GeoPoint {
        return {
            type: 'geo-distance',
            ...point,
            ...distance
        }
    }
    / topLeft:GeoTopLeft ws* bottomRight:GeoBottomRight {
        return {
            type: 'geo-bounding-box',
            ...topLeft,
            ...bottomRight
        }
    }
    / bottomRight:GeoBottomRight ws* topLeft:GeoTopLeft  {
        return {
            type: 'geo-bounding-box',
            ...topLeft,
            ...bottomRight
        }
    }

LeftRangeType
    = NegativeInfinityType / RangeTermType

RightRangeType
    = PostiveInfinityType / RangeTermType

RangeTermType
    = FloatType
    / IntegerType
    / QuotedStringType
    / RestrictedStringType

TermType
    = FloatType
    / IntegerType
    / RegexpType
    / BooleanType
    / WildcardType
    / ParensStringType
    / QuotedStringType
    / RestrictedStringType

NegativeInfinityType
    = '*' {
        return {
            type: 'term',
            data_type: 'number',
            value: Number.NEGATIVE_INFINITY
        }
    }

PostiveInfinityType
    = '*' {
        return {
            type: 'term',
            data_type: 'number',
            value: Number.POSITIVE_INFINITY
        }
    }

FloatType
    = value:Float {
        return {
            type: 'term',
            data_type: 'float',
            value
        }
    }

IntegerType
    = value:Integer {
        return {
            type: 'term',
            data_type: 'integer',
            value
        }
    }

BooleanType
  = value:Boolean {
      return {
        type: 'term',
        data_type: 'boolean',
        value
      }
  }

RegexpType
    = value:Regex {
        return {
            type: 'regexp',
            data_type: 'string',
            value
        }
    }

WildcardType
  = value:Wildcard {
       return {
           type: 'wildcard',
           data_type: 'string',
           value
       };
    }

QuotedStringType
    = value:QuotedTerm {
        return {
            type: 'term',
            data_type: 'string',
            quoted: true,
            value
        };
    }

UnqoutedStringType
    = value:UnquotedTerm {
       return {
           type: 'term',
           data_type: 'string',
           quoted: false,
           value
       };
    }

RestrictedStringType
    = value:RestrictedString {
       return {
           type: 'term',
           data_type: 'string',
           restricted: true,
           quoted: false,
           value
       };
    }

FieldName
    = chars:FieldChar+ { return chars.join('') }

GeoPoint
    = GeoPointKeyword ws* FieldSeparator ws* term:QuotedStringType {
        return parseGeoPoint(term.value);
    }

GeoDistance
    = GeoDistanceKeyword ws* FieldSeparator ws* term:RestrictedStringType {
        return x.parseGeoDistance(term.value);
    }

GeoTopLeft
    = GeoTopLeftKeyword ws* FieldSeparator ws* term:QuotedStringType {
         return {
             top_left: parseGeoPoint(term.value)
         }
    }

GeoBottomRight
    = GeoBottomRightKeyword ws* FieldSeparator ws* term:QuotedStringType {
         return {
             bottom_right: parseGeoPoint(term.value)
         }
    }

UnquotedTerm
    = chars:TermChar+ {
        return chars.join('');
    }

RestrictedString
    = chars:RestrictedTermChar+ {
        return chars.join('');
    }

Wildcard
    = chars:WildcardCharSet+ {
        return chars.join('');
    }

Regex
  = '/' chars:RegexStringChar* '/' { return chars.join(''); }

Integer
   = int:$(Zero / OneToNine Digit*) &NumReservedChar { return parseInt(int, 10); }

Float
  = float:$(Digit* Dot Digit+) &NumReservedChar { return parseFloat(float) }

/** keywords **/
GeoPointKeyword
    = '_geo_point_'

GeoDistanceKeyword
    = '_geo_distance_'

GeoTopLeftKeyword
    = '_geo_box_top_left_'

GeoBottomRightKeyword
    = '_geo_box_bottom_right_'

ExistsKeyword
    = '_exists_'

Boolean
  = 'true' { return true }
  / 'false' { return false }

RangeOperator
    = '>=' { return 'gte' }
    / '>' { return 'gt' }
    / '<=' { return 'lte' }
    / '<' { return 'lt' }

StartRangeChar
    = '[' { return 'gte' }
    / '{' { return 'gt' }

EndRangeChar
    = ']' { return 'lte' }
    / '}' { return 'lt' }

RangeJoinOperator
    = 'TO'

/** Characters **/
ParensStart
    = '('

ParensEnd
    = ')'

WildcardCharSet "wildcard"
  = $([^\?\* ]* ('?' / '*')+ [^\?\* ]*)

FieldChar "field"
  = [_a-zA-Z0-9-\.\?\*]

FieldSeparator ""
  = ':'

TermChar
  = Escape sequence:ReservedChar { return '\\' + sequence; }
  / Dot / CharWithWS

Dot ""
    = '.'

CharWithWS "term"
    = [^:\*\?\{\}()"/^~\[\]]

RestrictedTermChar
  = Escape sequence:ReservedChar { return '\\' + sequence; }
  / Dot / CharWithoutWS

CharWithoutWS "term"
    = [^ \t\r\n\f\{\}\(\)\|"/\\/^~\[\]\&\!\?\=\<\>(AND)(OR)]

QuotedTerm
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / Escape) char:. { return char; }
  / Escape sequence:ReservedChar { return '\\' + sequence; }

RegexStringChar
  = !('/' / Escape) char:. { return char; }
  / Escape sequence:ReservedChar { return '\\' + sequence; }

AndConjunctionOperator
    = 'AND' / '&&'

OrConjunctionOperator
    = 'OR' / '||'

NotOperator
    = 'NOT' / '!'

Zero
    = '0'

Escape ""
    = '\\'

OneToNine
    = [1-9]

Digit
    = [0-9]

NumReservedChar
  = " "
  / "]"
  / "}"
  / ParensEnd
  / EOF

ReservedChar
  = "+"
  / "-"
  / ParensStart
  / ParensEnd
  / "{"
  / "}"
  / "["
  / "]"
  / "^"
  / "\""
  / "?"
  / FieldChar
  / Escape
  / "&"
  / "|"
  / "'"
  / "/"
  / "~"
  / "*"
  / " "
  / AndConjunctionOperator
  / OrConjunctionOperator
  / NotOperator

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
