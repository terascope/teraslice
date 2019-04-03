/** Control Flow **/
start
    = TermExpression

/** Expressions */

TermExpression
    = ws* ExistsKeyword TermOperator field:FieldName ws* {
        return {
            type: 'exists',
            field
        }
    }
    / ws* field:FieldName TermOperator term:TermValue ws* {
        return {
            field,
            ...term
        }
    }
    / ws* term:TermValue ws* {
        return {
            field: null,
            ...term
        }
    }

TermOperator
    = ws* TermOperatorChar ws*

TermValue
    = Number
    / Boolean
    / Regexp
    / Wildcard
    / String

Number
    = value:Integer {
        return {
           type: 'term',
           data_type: 'number',
           value
       };
    }

Integer
   = chars:Digit+ {
        const digits = chars.join("");
        return parseInt(digits, 10);
   }

Boolean
  = value:BooleanKeyword {
      return {
        type: 'term',
        data_type: 'boolean',
        value
      }
  }

Regexp
    = value:RegexTerm {
        return {
            type: 'regexp',
            data_type: 'string',
            value
        }
    }

Wildcard
  = value:WildcardTerm {
       return {
           type: 'wildcard',
           data_type: 'string',
           quoted: false,
           value
       };
    }


String
    = QuotedString
    / UnqoutedString

QuotedString
    = value:QuotedTerm {
        return {
            type: 'term',
            data_type: 'string',
            quoted: true,
            value
        };
    }

UnqoutedString
    = value:UnquotedTerm {
       return {
           type: 'term',
           data_type: 'string',
           quoted: false,
           value
       };
    }

UnquotedTerm
    = chars:TermChar+ {
        return chars.join('');
    }

WildcardTerm
    = chars:WildcardCharSet+ {
        return chars.join('');
    }

FieldName
    = chars:FieldChar+ { return chars.join('') }

ExistsKeyword
    = '_exists_'

BooleanKeyword
  = "true" { return true }
  / "false" { return false }

/** Characters **/

WildcardCharSet
  = $([^\?\*]* ('?' / '*')+ [^\?\*]*)

FieldChar
  = [_a-zA-Z0-9-\.\?\*]

TermOperatorChar
  = ':'

TermChar
  =  "\\" sequence:EscapeSequence { return '\\' + sequence; }
  / '.' / [^:\{\}()"/^~\[\]]

QuotedTerm
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return '\\' + sequence; }

RegexTerm
  = '/' chars:RegexStringChar* '/' { return chars.join(''); }

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
