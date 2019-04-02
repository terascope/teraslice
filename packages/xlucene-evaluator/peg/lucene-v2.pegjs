// Start here
start
    = ws* value:ImplicitString ws* {
        return {
            type: 'term',
            data_type: 'string',
            field: null,
            value: value
        }
    }

ImplicitString
    = chars:SourceCharacter* {
      return chars.join("");
    }


SourceCharacter
  = .

// whitespace
ws
  = [ \t\r\n\f]+
