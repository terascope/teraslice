/** Control Flow **/
start
    = ws* dataType:String ws* {
        return {
            type: 'term',
            data_type: 'string',
            field: null,
            ...dataType
        }
    }

/** DataTypes **/

String
    = QuotedString
    / UnqoutedString

QuotedString
    = '"' chars:QuotedStringCharacter* '"' {
        return { quoted: true, value: chars.join("") };
    }

UnqoutedString
    = chars:SourceCharacter* {
       return { quoted: false, value: chars.join("") };
    }

/** Characters **/
QuotedStringCharacter
  = !('"' / "\\") SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

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

NonEscapeCharacter
  = !(EscapeCharacter) SourceCharacter { return text(); }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

DecimalDigit
  = [0-9]

SourceCharacter
  = .

// whitespace
ws
  = [ \t\r\n\f]+
