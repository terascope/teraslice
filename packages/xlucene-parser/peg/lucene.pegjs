/** Functions **/
{
    const {
        parseGeoPoint,
        coerceTermType,
        parseInferredTermType,
        isInferredTermType,
        propagateDefaultField,
        logger,
        getFieldType,
        throwOnOldGeoUsage
    } = makeContext(options.contextArg);
}


/** Control Flow **/
start
    = ws* negate:NegationExpression ws* EOF { return negate; }
    / ws* logic:LogicalGroup ws* EOF { return logic; }
    / ws* term:TermExpression ws* EOF { return term; }
    / ws* term:UnquotedTermType ws* EOF { return term; }
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
    = ParensStart ws* group:ParensGroup ws* ParensEnd {
        return group;
    }
    / ParensStart ws* group:LogicalGroup ws* ParensEnd {
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
        return [right];
    }
    // Implicit ORs only work with at least one quoted, field/value pair or parens group
    / left:TermGroup ws+ right:TermGroup {
        return [left, right];
    }

TermGroup
    = NegationExpression / ParensGroup / VariableType / TermExpression


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
    / VariableExpression
    / field:FieldName ws* FieldSeparator ws* range:RangeExpression {
        coerceTermType(range.left, field);
        coerceTermType(range.right, field);
        return {
            ...range,
            field,
        }
    }
    / field:FieldName ws* FieldSeparator ws* term:(RegexpType/QuotedStringType) {
        const node = { ...term, field };
        coerceTermType(node, field);
        return node;
    }
    / FunctionExpression
    // for backwards compatability
    / OldGeoTermExpression
    / FieldGroup
    / field:FieldName ws* FieldSeparator ws* term:(ParensStringType/WildcardType) {
        const node = { ...term, field };
        coerceTermType(node, field);
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
    / field:FieldName ws* FieldSeparator ws* term:(BooleanType / FloatType / IntegerType / RestrictedStringType) {
        const node = { ...term, field };
        coerceTermType(node, field);
        return node;
    }

VariableExpression
    = field:FieldName ws* FieldSeparator ws* VariableSign chars:VariableChar+ {
        const key = chars.join('');
        const node = {
            type: i.ASTType.Term,
            field,
            field_type: getFieldType(field),
            value: {
                type: 'variable',
                value: key,
            },
        };
        coerceTermType(node, field);
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

FunctionExpression
    = field:FieldName ws* FieldSeparator ws* term:FunctionTerm {
        const { name, params } = term;

        return {
            type: i.ASTType.Function,
            name,
            params,
            field,
        };
    }

FunctionTerm
    = name:RestrictedString ws* ParensStart ws* fnArgs:FunctionParams? ws* ParensEnd {
        const params = fnArgs || [];
        return { params, name };
    }

FunctionParams
    = param:TermListExpression ws* Comma* ws* params:FunctionParams? {
         if (params) return [param, ...params]
         return [param]
    }
    / param:FunctionTermExpression ws* Comma* ws* params:FunctionParams? {
         if (params) return [param, ...params]
         return [param]
    }

FunctionTermExpression
    = VariableExpression
    / TermExpression
// We are not currectly allowing this to be used across the whole system other than for geo points
// If we were to use this across the system TermListItem would become a grammar "type"
// Im keeping it contained for now until we see how this evolves for general use

TermListExpression
    = field:FieldName ws* FieldSeparator ws* ListStart ws* list:TermListItem* ws* ListEnd {
        const values = list && list.length > 0 ? list : [];
        return {
            type: i.ASTType.TermList,
            field,
            value: values
        }
    }

TermListItem
    = ws* Comma* ws* VariableSign chars:VariableChar ws* Comma* ws* {
        return { type: 'variable', value: chars.join('') }
    }
    / ws* Comma* ws* term:TermListTerm ws* Comma* ws* {
        return term.value
    }
    /  ws* Comma* ListStart ws* list:TermListItem* ws* ListEnd ws* Comma* ws* {
        // needs to recursive check to see if value is list
        return list
    }

TermListTerm
    = RegexpType
    / QuotedStringType
    / BooleanType
    / FloatType
    / IntegerType
    / RestrictedStringType

OldGeoTermExpression
    = field:FieldName ws* FieldSeparator ws* ParensStart ws* term:OldGeoTermType ws* ParensEnd {
        throwOnOldGeoUsage(term, field);
    }

ParensStringType
    = ParensStart ws* term:(QuotedStringType/UnquotedStringType) ws* ParensEnd {
        return term;
    }

UnquotedTermType
    = term:UnquotedStringType {
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

OldGeoTermType
    = point:OldGeoPoint ws* distance:OldGeoDistance {
        return {
            type: i.ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / distance:OldGeoDistance ws* point:OldGeoPoint {
        return {
            type: i.ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / topLeft:OldGeoTopLeft ws* bottomRight:OldGeoBottomRight {
        return {
            type: i.ASTType.GeoBoundingBox,
            ...topLeft,
            ...bottomRight
        }
    }
    / bottomRight:OldGeoBottomRight ws* topLeft:OldGeoTopLeft  {
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
    / VariableType
    / QuotedStringType
    / RestrictedStringType

// Term type that probably are right
TermType
    = VariableType
    / RegexpType
    / QuotedStringType
    / ParensStringType
    / WildcardType
    / BooleanType
    / FloatType
    / IntegerType
    / RestrictedStringType

NegativeInfinityType
    = '*' {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            value: {
                type: 'value',
                value: Number.NEGATIVE_INFINITY
            }
        }
    }

PostiveInfinityType
    = '*' {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            value: {
                type: 'value',
                value: Number.POSITIVE_INFINITY
            }
        }
    }

VariableType
    = VariableSign chars:VariableChar+ {
        const value = chars.join('');
        const node = {
            type: i.ASTType.Term,
            value: {
                type: 'variable',
                value
            },
        };

        return node;
    }

FloatType
    = value:Float {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.Float,
            value: {
                type: 'value',
                value
            }
        }
    }

IntegerType
    = value:Integer {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.Integer,
            value: {
                type: 'value',
                value
            }
        }
    }

BooleanType
  = value:Boolean &(EOF / ws+ / ParensEnd / ']') {
      return {
        type: i.ASTType.Term,
        field_type: xLuceneFieldType.Boolean,
        value: {
            type: 'value',
            value
        }
      }
  }

RegexpType
    = value:Regex {
        return {
            type: i.ASTType.Regexp,
            field_type: xLuceneFieldType.String,
            value: {
                type: 'value',
                value
            }
        }
    }

WildcardType
  = value:Wildcard {
       return {
           type: i.ASTType.Wildcard,
           field_type: xLuceneFieldType.String,
           value: {
                type: 'value',
                value
            }
       };
    }

QuotedStringType
    = value:QuotedTerm {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            value: {
                type: 'value',
                value
            }
        };
    }

UnquotedStringType
    = value:UnquotedTerm {
        return {
            type: i.ASTType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            value: {
                type: 'value',
                value
            }
        };
    }

RestrictedStringType
    = value:RestrictedString {
       return {
           type: i.ASTType.Term,
           field_type: xLuceneFieldType.String,
           restricted: true,
           quoted: false,
           value: {
                type: 'value',
                value
            }
       };
    }

FieldName
    = chars:FieldChar+ { return chars.join('') }

OldGeoPoint
    = OldGeoPointKeyword ws* FieldSeparator ws* term:QuotedStringType {
        if (term.value.type !== 'value') {
            throw new Error('Legacy xLucene geo point does not support variables');
        }
        return parseGeoPoint(term.value.value);
    }

OldGeoDistance
    = OldGeoDistanceKeyword ws* FieldSeparator ws* term:OldGeoDistanceType {
        if (term.value.type !== 'value') {
            throw new Error('Legacy xLucene geo distance does not support variables');
        }
        return { distance: term.value.value };
    }

OldGeoDistanceType
    = RestrictedStringType / QuotedStringType

OldGeoTopLeft
    = OldGeoTopLeftKeyword ws* FieldSeparator ws* term:QuotedStringType {
        if (term.value.type !== 'value') {
            throw new Error('Legacy xLucene geo top left does not support variables');
        }
         return {
             top_left: parseGeoPoint(term.value.value)
         }
    }

OldGeoBottomRight
    = OldGeoBottomRightKeyword ws* FieldSeparator ws* term:QuotedStringType {
         if (term.value.type !== 'value') {
            throw new Error('Legacy xLucene geo bottom right does not support variables');
        }
         return {
             bottom_right: parseGeoPoint(term.value.value)
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

ExistsKeyword
    = '_exists_'

// These will be depreciated
OldGeoPointKeyword
    = '_geo_point_'

OldGeoDistanceKeyword
    = '_geo_distance_'

OldGeoTopLeftKeyword
    = '_geo_box_top_left_'

OldGeoBottomRightKeyword
    = '_geo_box_bottom_right_'

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

ListStart
    = '['

ListEnd
    = ']'

Comma
    = ','

WildcardCharSet "wildcard"
  = $([^\?\*\( ]* ('?' / '*')+ [^\?\*\) ]*)

FieldChar "field"
  = [_a-zA-Z0-9-\.\?\*]

VariableChar
  = [_a-zA-Z0-9]

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
    = [^ \t\r\n\f\{\}\(\)\|/\\/^~\[\]\&\!\?\=\<\>]

QuotedTerm
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }

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

VariableSign
    = '$'

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
  / "'"
  / "?"
  / FieldChar
  / Escape
  / "&"
  / "|"
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
