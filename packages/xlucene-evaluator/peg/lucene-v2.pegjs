// Start here
start
    = ws* value:UnqoutedString ws* {
        return {
            type: 'term',
            data_type: 'string',
            field: null,
            value: value
        }
    }

UnqoutedString
    = chars:SourceCharacter* {
      return chars.join("");
    }

SourceCharacter
  = .

// whitespace
ws
  = [ \t\r\n\f]+
