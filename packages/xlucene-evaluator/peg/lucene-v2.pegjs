/** Control Flow **/
start
    = ws* negate:NegationExpression ws* EOF { return negate }
    / ws* logic:LogicalGroup ws* { return logic; }
    / ws* term:UnqoutedTermType ws* EOF { return term; }
    / ws* term:TermExpression ws* EOF { return term; }
    / ws* EOF { return {} }

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
    / nodes:AndConjunctionRight+ {
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
    / nodes:OrConjunctionRight+ {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [].concat(...nodes),
        }
    }

ParensGroup
    = '(' ws* group:LogicalGroup ws* ')' {
        return group;
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

AndConjunctionLeft
    = left:TermGroup ws+ nodes:AndConjunctionRight {
        return [left, ...nodes]
    }

AndConjunctionRight
    = ws* &'NOT' ws* right:TermGroup nodes:AndConjunctionRight? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }
    / ws* AndConjunctionOperator ws+ right:TermGroup nodes:AndConjunctionRight? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }

OrConjunctionLeft
    = left:TermGroup ws+ nodes:OrConjunctionRight {
        return [left, ...nodes]
    }
    / left:FieldOrQuotedTermGroup ws+ right:TermGroup {
        return [left, right]
    }
    / left:TermGroup ws+ right:FieldOrQuotedTermGroup {
        return [left, right]
    }

OrConjunctionRight
    = ws* OrConjunctionOperator ws+ right:TermGroup nodes:OrConjunctionRight? {
        if (!nodes) return [ right ];
        return [right, ...nodes];
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
    / field:FieldName ws* FieldSeparator ws* group:ParensGroup {
        return {
            ...group,
            type: 'field-group',
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

FieldOrQuotedTermExpression
    = BaseTermExpression
    / term:QuotedStringType {
        return {
            ...term,
            field: null,
        }
    }

ParensStringType
    = '(' ws* term:UnqoutedStringType ws* ')' {
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
   = int:$('0' / OneToNine Digit*) &NumReservedChar { return parseInt(int, 10); }

FloatValue
  = float:$(Digit* '.' Digit+) &NumReservedChar { return parseFloat(float) }

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

FieldSeparator
  = ':'

TermChar
  = "\\" sequence:ReservedChar { return '\\' + sequence; }
  / '.' / [^:\{\}()"/^~\[\]]

RestrictedTermChar
  =  "\\" sequence:ReservedChar { return '\\' + sequence; }
  / '.' / [^: \t\r\n\f\{\}()"/^~\[\]]

QuotedTermValue
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:ReservedChar { return '\\' + sequence; }

RegexStringChar
  = !('/' / "\\") char:. { return char; }
  / "\\" sequence:ReservedChar { return '\\' + sequence; }

AndConjunctionOperator
    = 'AND' / '&&'

OrConjunctionOperator
    = 'OR' / '||'

NotOperator
    = 'NOT' / '!'

ZeroChar
    = '0'

OneToNine
    = [1-9]

Digit
    = [0-9]

NumReservedChar
  = " "
  / "]"
  / "}"
  / ")"
  / EOF

ReservedChar
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
  / NotOperator

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
