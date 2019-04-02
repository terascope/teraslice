/** Control Flow **/
start
    = TermExpression

/** Expressions */

TermExpression
    = ws* leftHand:Field rightHand:String ws* {
        return {
            type: 'term',
            data_type: 'string',
            ...leftHand,
            ...rightHand
        }
    }
    / ws* rightHand:String ws* {
        return {
            type: 'term',
            data_type: 'string',
            field: null,
            ...rightHand
        }
    }

/** Entities? **/

Field
    = chars:FieldChar+ ':' {
       return { field: chars.join("") }
    }

String
    = QuotedString
    / UnqoutedString

QuotedString
    = '"' chars:Char* '"' {
        return { quoted: true, value: chars.join("") };
    }

UnqoutedString
    = chars:Char* {
       return { quoted: false, value: chars.join("") };
    }

/** Characters **/

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
