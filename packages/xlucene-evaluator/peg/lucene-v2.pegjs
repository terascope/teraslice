/** Control Flow **/
start
    = TermExpression

/** Expressions */

TermExpression
    = ws* leftHand:Field rightHand:Value ws* {
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
    = chars:FieldChar+ ':' {
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
    = '"' chars:Char+ '"' {
        return {
            data_type: 'string',
            quoted: true,
            value: chars.join("")
        };
    }

WildcardString
  = &WildcardChar+ chars:Char* {
       return {
           data_type: 'wildcard',
           quoted: false,
           value: chars.join("")
       };
    }

UnqoutedString
    = chars:Char* {
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
WildcardChar
    = [\?\*]

FieldChar
  = [_a-zA-Z0-9-\.\?\*]

TermOperatorChar
  = ':'

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b"; }
  / "f"  { return "\f"; }
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }
  / "v"  { return "\v"; }

Char
  = UnescapedChar
  / EscapeChar
    sequence:SingleEscapeCharacter {
        return sequence;
    }

EscapeChar
  = "\\"

UnescapedChar
  = [^\0-\x1F\x22\x5C]

// whitespace
ws
  = [ \t\r\n\f]+

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT
    = [0-9]
HEXDIG
    = [0-9a-f]i
