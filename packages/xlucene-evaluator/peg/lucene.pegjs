/** Functions **/
{
    const {
        parseGeoPoint,
        parseGeoDistance,
        coerceTermType,
        parseInferredTermType,
        isInferredTermType,
        propagateDefaultField,
    } = makeContext(options.contextArg);
}


/** Control Flow **/
start
    = ws* negate:NegationExpression ws* EOF { return negate }
    / ws* logic:LogicalGroup ws* EOF { return logic; }
    / ws* term:UnqoutedTermType ws* EOF { return term; }
    / ws* term:TermExpression ws* EOF { return term; }
    / ws* group:ParensGroup ws* EOF { return group; }
    / ws* EOF {
        return {
            type: i.ASTType.Empty,
        }
    }

/** Expressions */
LogicalGroup
    // recursively go through and chain conjunctions together so
    // the operations evaluated. If any operation passes
    // then you can stop early.
   = !ConjunctionOperator conjunctions:Conjunction+ {
        return {
            type: i.ASTType.LogicalGroup,
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
            type: i.ASTType.Conjunction,
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
        return nodes.reduce((prev: any, current: any) => {
            current.forEach((node: any) => {
                prev.push({
                    type: i.ASTType.Conjunction,
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
    / left:FieldOrQuotedTermGroup ws+ right:FieldOrQuotedTermGroup {
        return [left, right]
    }
    / left:FieldOrQuotedTermGroup ws+ right:TermGroup {
        return [left, right]
    }
    / left:TermGroup ws+ right:FieldOrQuotedTermGroup {
        return [left, right]
    }
    // / left:TermGroup {
    //     return [left]
    // }

TermGroup
    = NegationExpression / ParensGroup / TermExpression

FieldOrQuotedTermGroup
    = ParensGroup / FieldOrQuotedTermExpression

NegationExpression
    = 'NOT' ws+ node:NegatedTermGroup {
        return {
            type: i.ASTType.Negation,
            node
        }
    }
    / '!' ws* node:NegatedTermGroup {
        return {
            type: i.ASTType.Negation,
            node
        }
    }
    / ParensStart ws* node:NegationExpression ws* ParensEnd {
        return node;
    }

NegatedTermGroup
    = node:ParensGroup / node:TermExpression

FieldGroup
    = field:FieldName ws* FieldSeparator ws* group:ParensGroup {
        const node = {
            ...group,
            type: i.ASTType.FieldGroup,
            field,
        };
        propagateDefaultField(group, field);
        return node;
    }

BaseTermExpression
    = ExistsKeyword ws* FieldSeparator ws* field:FieldName {
        return {
            type: i.ASTType.Exists,
            field,
        }
    }
    / field:FieldName ws* FieldSeparator ws* range:RangeExpression {
        coerceTermType(range.left, field);
        coerceTermType(range.right, field);
        return {
            ...range,
            field,
        }
    }
    / GeoTermExpression
    / FieldGroup
    / field:FieldName ws* FieldSeparator ws* term:InferredTermType {
        const node = { ...term, field };
        coerceTermType(node);
        return node;
    }
    / field:FieldName ws* FieldSeparator ws* value:RestrictedString &{
        return isInferredTermType(field);
    } {
        const term = parseInferredTermType(field, value);
        return {
            ...term,
            field,
        };
    }
    / field:FieldName ws* FieldSeparator ws* term:TermType {
        const node = { ...term, field };
        coerceTermType(node);
        return node;
    }

TermExpression
    = BaseTermExpression
    / range:RangeExpression {
        return {
            ...range,
            field: null,
        }
    }
    / term:TermType {
        return {
            ...term,
            field: null,
        }
    }
    / ParensStart ws* term:TermExpression ws* ParensEnd {
        return term;
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
    / ParensStart ws* term:QuotedStringType ws* ParensEnd {
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
            type: i.ASTType.Range,
            left,
            right,
        }
    }
    / operator:RangeOperator value:TermType {
        return {
            type: i.ASTType.Range,
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
            type: i.ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / distance:GeoDistance ws* point:GeoPoint {
        return {
            type: i.ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / topLeft:GeoTopLeft ws* bottomRight:GeoBottomRight {
        return {
            type: i.ASTType.GeoBoundingBox,
            ...topLeft,
            ...bottomRight
        }
    }
    / bottomRight:GeoBottomRight ws* topLeft:GeoTopLeft  {
        return {
            type: i.ASTType.GeoBoundingBox,
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

// Syntax inferred term types
InferredTermType
    = RegexpType
    / QuotedStringType
    / ParensStringType
    / WildcardType

// Term type that probably are right
TermType
    = InferredTermType
    / BooleanType
    / FloatType
    / IntegerType
    / RestrictedStringType

NegativeInfinityType
    = '*' {
        return {
            type: i.ASTType.Term,
            field_type: i.FieldType.Integer,
            value: Number.NEGATIVE_INFINITY
        }
    }

PostiveInfinityType
    = '*' {
        return {
            type: i.ASTType.Term,
            field_type: i.FieldType.Integer,
            value: Number.POSITIVE_INFINITY
        }
    }

FloatType
    = value:Float {
        return {
            type: i.ASTType.Term,
            field_type: i.FieldType.Float,
            value
        }
    }

IntegerType
    = value:Integer {
        return {
            type: i.ASTType.Term,
            field_type: i.FieldType.Integer,
            value
        }
    }

BooleanType
  = value:Boolean {
      return {
        type: i.ASTType.Term,
        field_type: i.FieldType.Boolean,
        value
      }
  }

RegexpType
    = value:Regex {
        return {
            type: i.ASTType.Regexp,
            field_type: i.FieldType.String,
            value
        }
    }

WildcardType
  = value:Wildcard {
       return {
           type: i.ASTType.Wildcard,
           field_type: i.FieldType.String,
           value
       };
    }

QuotedStringType
    = value:QuotedTerm {
        return {
            type: i.ASTType.Term,
            field_type: i.FieldType.String,
            quoted: true,
            value
        };
    }

UnqoutedStringType
    = value:UnquotedTerm {
       return {
           type: i.ASTType.Term,
           field_type: i.FieldType.String,
           quoted: false,
           value
       };
    }

RestrictedStringType
    = value:RestrictedString {
       return {
           type: i.ASTType.Term,
           field_type: i.FieldType.String,
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
    = GeoDistanceKeyword ws* FieldSeparator ws* term:GeoDistanceType {
        return parseGeoDistance(term.value);
    }

GeoDistanceType
    = RestrictedStringType / QuotedStringType

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
  = $([^\?\*\( ]* ('?' / '*')+ [^\?\*\) ]*)

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
    = [^ \t\r\n\f\{\}\(\)\|"/\\/^~\[\]\&\!\?\=\<\>]

QuotedTerm
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }
  / "'" chars:DoubleStringChar* "'" { return chars.join(''); }

DoubleStringChar
  = !('"' / "'" / Escape) char:. { return char; }
  / Escape sequence:ReservedChar { return '\\' + sequence; }

RegexStringChar
  = !('/' / Escape) char:. { return char; }
  / Escape sequence:ReservedChar { return '\\' + sequence; }

AndConjunctionOperator
    = 'AND' / '&&'

OrConjunctionOperator
    = 'OR' / '||'

ConjunctionOperator
    = AndConjunctionOperator / OrConjunctionOperator

NotOperator
    = 'NOT' / '!'

Zero
    = '0'

Escape ""
    = '\\'

OneToNine "a character between 1-9"
    = [1-9]

Digit "a character between 0-9"
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
  / ConjunctionOperator
  / NotOperator

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
