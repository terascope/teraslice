/** Functions **/
{
    const {
        ASTType,
        parseGeoPoint,
        parseGeoDistance,
        FieldType,
        typeConfig = {}
    } = options.context;

    /**
    * Propagate the default field on a field group expression
    */
    function propagateDefaultField(node, field) {
       if (!node) return;

       const termTypes = [
           ASTType.Term,
           ASTType.Regexp,
           ASTType.Range,
           ASTType.Wildcard,
           ASTType.GeoDistance,
           ASTType.GeoBoundingBox
       ];
       if (termTypes.includes(node.type) && !node.field) {
           node.field = field;
           return;
       }

       if (node.type === ASTType.Negation) {
           propagateDefaultField(node.node, field);
           return;
       }

       const groupTypes = [ASTType.LogicalGroup, ASTType.FieldGroup];
       if (groupTypes.includes(node.type)) {
           for (const conj of node.flow) {
               propagateDefaultField(conj, field);
           }
           return;
       }

       if (node.type === ASTType.Conjunction) {
           for (const conj of node.nodes) {
               propagateDefaultField(conj, field);
           }
           return;
       }
    }

    const supportedFieldTypes = [FieldType.String];

    function getFieldType(field) {
        const fieldType = typeConfig[field];
        if (!fieldType) return;
        return fieldType;
    }

    function hasSupportedFieldType(field) {
        return supportedFieldTypes.includes(getFieldType(field));
    }

    function parseTermForFieldType(field, value) {
        const fieldType = getFieldType(field);
        const term = {
            type: ASTType.Term,
            field_type: fieldType,
        };
        if (fieldType === FieldType.String) {
            term.quoted = false;
            term.value = `${value}`;
            return term;
        }

        throw new Error(`Unsupported Field Type ${fieldType}`);
    }
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
            type: ASTType.Empty,
        }
    }

/** Expressions */
LogicalGroup
    // recursively go through and chain conjunctions together so
    // the operations evaluated. If any operation passes
    // then you can stop early.
   = !ConjunctionOperator conjunctions:Conjunction+ {
        return {
            type: ASTType.LogicalGroup,
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
            type: ASTType.Conjunction,
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
                    type: ASTType.Conjunction,
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

TermGroup
    = NegationExpression / ParensGroup / TermExpression

FieldOrQuotedTermGroup
    = ParensGroup / FieldOrQuotedTermExpression

NegationExpression
    = 'NOT' ws+ node:NegatedTermGroup {
        return {
            type: ASTType.Negation,
            node
        }
    }
    / '!' ws* node:NegatedTermGroup {
        return {
            type: ASTType.Negation,
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
        propagateDefaultField(group, field);
        return {
            ...group,
            type: ASTType.FieldGroup,
            field,
        }
    }

BaseTermExpression
    = ExistsKeyword ws* FieldSeparator ws* field:FieldName {
        return {
            type: ASTType.Exists,
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
    / field:FieldName ws* FieldSeparator ws* value:RestrictedString &{
        return hasSupportedFieldType(field);
    } {
        const term = parseTermForFieldType(field, value);
        return {
            ...term,
            field,
        }
    }
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
            type: ASTType.Range,
            left,
            right,
        }
    }
    / operator:RangeOperator value:TermType {
        return {
            type: ASTType.Range,
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
            type: ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / distance:GeoDistance ws* point:GeoPoint {
        return {
            type: ASTType.GeoDistance,
            ...point,
            ...distance
        }
    }
    / topLeft:GeoTopLeft ws* bottomRight:GeoBottomRight {
        return {
            type: ASTType.GeoBoundingBox,
            ...topLeft,
            ...bottomRight
        }
    }
    / bottomRight:GeoBottomRight ws* topLeft:GeoTopLeft  {
        return {
            type: ASTType.GeoBoundingBox,
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
    = QuotedStringType
    / FloatType
    / IntegerType
    / RegexpType
    / BooleanType
    / ParensStringType
    / WildcardType
    / RestrictedStringType

NegativeInfinityType
    = '*' {
        return {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            value: Number.NEGATIVE_INFINITY
        }
    }

PostiveInfinityType
    = '*' {
        return {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            value: Number.POSITIVE_INFINITY
        }
    }

FloatType
    = value:Float {
        return {
            type: ASTType.Term,
            field_type: FieldType.Float,
            value
        }
    }

IntegerType
    = value:Integer {
        return {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            value
        }
    }

BooleanType
  = value:Boolean {
      return {
        type: ASTType.Term,
        field_type: FieldType.Boolean,
        value
      }
  }

RegexpType
    = value:Regex {
        return {
            type: ASTType.Regexp,
            field_type: FieldType.String,
            value
        }
    }

WildcardType
  = value:Wildcard {
       return {
           type: ASTType.Wildcard,
           field_type: FieldType.String,
           value
       };
    }

QuotedStringType
    = value:QuotedTerm {
        return {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: true,
            value
        };
    }

UnqoutedStringType
    = value:UnquotedTerm {
       return {
           type: ASTType.Term,
           field_type: FieldType.String,
           quoted: false,
           value
       };
    }

RestrictedStringType
    = value:RestrictedString {
       return {
           type: ASTType.Term,
           field_type: FieldType.String,
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
