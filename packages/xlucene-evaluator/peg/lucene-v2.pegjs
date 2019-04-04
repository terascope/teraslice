/** Control Flow **/
start
    = ws* logic:LogicalGroup ws* { return logic; }
    / term:TermExpression { return term; }

/** Expressions */
LogicalGroup
   = flow:Conjunction {
        return {
            type: 'logical-group',
            flow: [flow]
        };
   }

Conjunction
    = left:TermExpression ws* AndConjunctionOperator ws* right:TermExpression {
        return {
            type: 'conjunction',
            operator: 'AND',
            nodes: [
                left,
                right
            ]
        };
    }
    / left:TermExpression ws* OrConjunctionOperator ws* right:TermExpression {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [
                left,
                right
            ]
        };
    }

TermExpression
    = ExistsKeyword ws* FieldSeparator ws* field:FieldName {
        return {
            type: 'exists',
            field
        }
    }
    / field:FieldName ws* FieldSeparator ws* range:RangeExpression {
        return {
            field,
            ...range
        }
    }
    / field:FieldName ws* FieldSeparator ws* term:TermType {
        return {
            field,
            ...term
        }
    }
    / term:TermType {
        return {
            field: null,
            ...term
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
    / operator:RangeOperator value:RangeType {
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
            operator,
            ...value,
        }
    }

RightRangeExpression
    = ws* value:RightRangeType operator:EndRangeChar {
        return {
            operator,
            ...value,
        }
    }

LeftRangeType
    = NegativeInfinityType / RangeType

RightRangeType
    = PostiveInfinityType / RangeType

RangeType
    = FloatType
    / IntegerType
    / QuotedStringType
    / RestrictedTermType

TermType
    = FloatType
    / IntegerType
    / BooleanType
    / RegexpType
    / WildcardType
    / QuotedStringType
    / UnqoutedStringType

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

RestrictedTermType
    = value:RestrictedTermValue {
       return {
           type: 'term',
           data_type: 'string',
           restricted: true,
           value
       };
    }

FieldName
    = chars:FieldChar+ { return chars.join('') }

UnquotedTermValue
    = chars:TermChar+ {
        return chars.join('');
    }

RestrictedTermValue
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
    = 'OR'
    / '||'
    / 'AND NOT'
    / 'OR NOT'
    / '&&' { return 'AND' }
    / '||' { return 'OR' }

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

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
