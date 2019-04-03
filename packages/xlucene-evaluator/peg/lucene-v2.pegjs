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
    = chars:FieldChar+ TermOperatorChar {
       return { field: chars.join("") }
    }

Value
    = Integer
    / String

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
  = chars:WildcardCharSet+ {
       return {
           data_type: 'wildcard',
           quoted: false,
           value: chars.join('')
       };
    }

UnqoutedString
    = chars:TermChar+ {
       return {
           data_type: 'string',
           quoted: false,
           value: chars.join("")
       };
    }

Integer
    = chars:DIGIT+ {
        const digits = chars.join("");
        const num = parseInt(digits, 10);
        return {
           data_type: 'number',
           value: num
       };
    }

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
