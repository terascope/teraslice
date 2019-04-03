/** Control Flow **/
start
    = TermExpression

/** Expressions */

TermExpression
    = ws* leftHand:Field ws* rightHand:Value ws* {
        return {
            type: 'term',
            ...leftHand,
            ...rightHand
        }
    }
    / ws* rightHand:Value ws* {
        return {
            type: 'term',
            field: null,
            ...rightHand
        }
    }

/** Entities? **/

Field
    = field:FieldName TermOperatorChar {
       return { field }
    }

Value
    = Number
    / Boolean
    / String

Boolean
  =  value:BooleanKeyword {
      return {
        data_type: 'boolean',
        value
      }
  }

String
    = QuotedString
    / WildcardString
    / UnqoutedString

QuotedString
    = value:QuotedTerm {
        return {
            data_type: 'string',
            quoted: true,
            value
        };
    }

WildcardString
  = value:WildcardTerm {
       return {
           data_type: 'wildcard',
           quoted: false,
           value
       };
    }

UnqoutedString
    = value:UnquotedTerm {
       return {
           data_type: 'string',
           quoted: false,
           value
       };
    }

Number
    = value:Integer {
        return {
           data_type: 'number',
           value
       };
    }

Integer
   = chars:DIGIT+ {
        const digits = chars.join("");
        return parseInt(digits, 10);
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
DIGIT
    = [0-9]
HEXDIG
    = [0-9a-f]i
