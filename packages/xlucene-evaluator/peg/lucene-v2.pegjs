/** Control Flow **/
start
    = TermExpression

/** Expressions */

TermExpression
    = ws* ExistsKeyword ws* FieldSeparator ws* field:FieldName ws* {
        return {
            type: 'exists',
            field
        }
    }
    / ws* field:FieldName ws* FieldSeparator ws* range:RangeExpression ws* {
        return {
            field,
            ...range
        }
    }
    / ws* field:FieldName ws* FieldSeparator ws* term:TermType ws* {
        return {
            field,
            ...term
        }
    }
    / ws* term:TermType ws* {
        return {
            field: null,
            ...term
        }
    }

RangeExpression
    = operator:RangeOperator type:NumberType {
        const result = {
            type: 'range',
            data_type: type.data_type,
        }
        result[operator] = type.value;
        return result;
    }

FieldSeparator
    = FieldSeparatorChar

TermType
    = NumberType
    / BooleanType
    / RegexpType
    / WildcardType
    / StringType

NumberType
    = value:FloatValue {
        return {
            type: 'term',
            data_type: 'float',
            value
        }
    }
    / value:IntegerValue {
        return {
           type: 'term',
           data_type: 'integer',
           value
       };
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
           quoted: false,
           value
       };
    }

StringType
    = QuotedStringType
    / UnqoutedStringType

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

FieldName
    = chars:FieldChar+ { return chars.join('') }

UnquotedTermValue
    = chars:TermChar+ {
        return chars.join('');
    }

WildcardValue
    = chars:WildcardCharSet+ {
        return chars.join('');
    }

RegexValue
  = '/' chars:RegexStringChar* '/' { return chars.join(''); }

IntegerValue
   = chars:Digit+ {
        const digits = chars.join("");
        return parseInt(digits, 10);
   }

FloatValue
  = value:$(Digit+ '.' Digit+) {
        return parseFloat(value, 10)
    }

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

/** Characters **/
WildcardCharSet
  = $([^\?\*]* ('?' / '*')+ [^\?\*]*)

FieldChar
  = [_a-zA-Z0-9-\.\?\*]

FieldSeparatorChar
  = ':'

TermChar
  =  "\\" sequence:EscapeSequence { return '\\' + sequence; }
  / '.' / [^:\{\}()"/^~\[\]]

QuotedTermValue
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return '\\' + sequence; }

RegexStringChar
  = !('/' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return '\\' + sequence; }

EscapeSequence
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

// whitespace
ws
  = [ \t\r\n\f]+

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
Digit
    = [0-9]
