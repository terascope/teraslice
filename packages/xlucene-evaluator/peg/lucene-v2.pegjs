/** Control Flow **/
start
    = ws* logic:LogicalGroup ws* { return logic; }
    / ws* term:UnqoutedTermType ws* EOF { return term; }
    / ws* term:RestrictedTermExpression ws* EOF { return term; }
    / EOF { return {} }


/** Expressions */
LogicalGroup
   = flow:Conjunction+ {
        return {
            type: 'logical-group',
            flow
        };
   }

Conjunction
    = nodes:AndConjunctionLeft+ {
        return {
            type: 'conjunction',
            operator: 'AND',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:OrConjunctionLeft+ {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:AndConjunctionRight+ {
        return {
            type: 'conjunction',
            operator: 'AND',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:OrConjunctionRight+ {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [].concat(...nodes),
        }
    }

AndConjunctionLeft
    = left:RestrictedTermExpression ws+ nodes:AndConjunctionRight {
        return [left, ...nodes]
    }

AndConjunctionRight
    = ws* AndConjunctionOperator ws+ right:RestrictedTermExpression nodes:AndConjunctionRight? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }

OrConjunctionLeft
    = left:RestrictedTermExpression ws+ nodes:OrConjunctionRight {
        return [left, ...nodes]
    }
    / left:OrTermExpression ws+ right:RestrictedTermExpression {
        return [left, right]
    }
    / left:RestrictedTermExpression ws+ right:OrTermExpression {
        return [left, right]
    }

OrConjunctionRight
    = ws* OrConjunctionOperator ws+ right:RestrictedTermExpression nodes:OrConjunctionRight? {
        if (!nodes) return [ right ];
        return [right, ...nodes];
    }

TermExpression
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
    / field:FieldName ws* FieldSeparator ws* term:TermType {
        return {
            ...term,
            field,
        }
    }
    / term:TermType {
        return {
            ...term,
            field: null,
        }
    }

RestrictedTermExpression
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
    / field:FieldName ws* FieldSeparator ws* term:RestrictedTermType {
        return {
            ...term,
            field,
        }
    }
    / term:RestrictedTermType {
        return {
            ...term,
            field: null,
        }
    }

OrTermExpression
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
    / field:FieldName ws* FieldSeparator ws* term:RestrictedTermType {
        return {
            ...term,
            field,
        }
    }
    / term:QuotedStringType {
        return {
            ...term,
            field: null,
        }
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
    / operator:RangeOperator value:RestrictedTermType {
        return {
            type: 'range',
            left: {
                operator,
                ...value,
            },
        }
    }

FieldSeparator
    = FieldSeparatorChar

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

LeftRangeType
    = NegativeInfinityType / RangeTermType

RightRangeType
    = PostiveInfinityType / RangeTermType

RangeTermType
    = FloatType
    / IntegerType
    / QuotedStringType
    / RestrictedStringType

RestrictedTermType
    = term:TermType {
        return { field: null, ...term };
    }
    / term:RestrictedStringType {
        return { field: null, ...term };
    }

TermType
    = FloatType
    / IntegerType
    / RegexpType
    / BooleanType
    / WildcardType
    / QuotedStringType

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
    = value:FloatValue {
        return {
            type: 'term',
            data_type: 'float',
            value
        }
    }

IntegerType
    = value:IntegerValue {
        return {
            type: 'term',
            data_type: 'integer',
            value
        }
    }

BooleanType
  = value:BooleanKeyword {
      return {
        type: 'term',
        data_type: 'boolean',
        value
      }
  }

RegexpType
    = value:RegexValue {
        return {
            type: 'regexp',
            data_type: 'string',
            value
        }
    }

WildcardType
  = value:WildcardValue {
       return {
           type: 'wildcard',
           data_type: 'string',
           value
       };
    }

QuotedStringType
    = value:QuotedTermValue {
        return {
            type: 'term',
            data_type: 'string',
            quoted: true,
            value
        };
    }

UnqoutedStringType
    = value:UnquotedTermValue {
       return {
           type: 'term',
           data_type: 'string',
           quoted: false,
           value
       };
    }

RestrictedStringType
    = value:RestrictedStringValue {
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

UnquotedTermValue
    = chars:TermChar+ {
        return chars.join('');
    }

RestrictedStringValue
    = chars:RestrictedTermChar+ {
        return chars.join('');
    }

WildcardValue
    = chars:WildcardCharSet+ {
        return chars.join('');
    }

RegexValue
  = '/' chars:RegexStringChar* '/' { return chars.join(''); }

IntegerValue
   = int:$('0' / OneToNine Digit*) &NumEndChar { return parseInt(int, 10); }

FloatValue
  = float:$(Digit* '.' Digit+) &NumEndChar { return parseFloat(float) }

/** keywords **/
ExistsKeyword
    = '_exists_'

BooleanKeyword
  = "true" { return true }
  / "false" { return false }

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
WildcardCharSet
  = $([^\?\*]* ('?' / '*')+ [^\?\*]*)

FieldChar
  = [_a-zA-Z0-9-\.\?\*]

FieldSeparatorChar
  = ':'

TermChar
  = "\\" sequence:EndChar { return '\\' + sequence; }
  / '.' / [^:\{\}()"/^~\[\]]

RestrictedTermChar
  =  "\\" sequence:EndChar { return '\\' + sequence; }
  / '.' / [^: \t\r\n\f\{\}()"/^~\[\]]

QuotedTermValue
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EndChar { return '\\' + sequence; }

RegexStringChar
  = !('/' / "\\") char:. { return char; }
  / "\\" sequence:EndChar { return '\\' + sequence; }

ConjunctionOperator
    = 'AND'
    / 'NOT'
    / 'OR'
    / 'AND NOT'
    / 'OR NOT'
    / '&&' { return 'AND' }
    / '||' { return 'OR' }

AndConjunctionOperator
    = 'AND'
    / 'NOT'
    / '&&'

OrConjunctionOperator
    = 'OR' / '||'

ZeroChar
    = '0'

OneToNine
    = [1-9]

Digit
    = [0-9]

NumEndChar
  = " "
  / "]"
  / "}"
  / ")"
  / EOF

EndChar
  = "+"
  / "-"
  / "!"
  / "("
  / ")"
  / "{"
  / "}"
  / "["
  / "]"
  / "^"
  / "\""
  / "?"
  / ":"
  / "\\"
  / "&"
  / "|"
  / "'"
  / "/"
  / "~"
  / "*"
  / " "
  / AndConjunctionOperator
  / OrConjunctionOperator

ReservedChars
    = [^(AND)(OR):&?\[\]\{\}\(\)\!]

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
