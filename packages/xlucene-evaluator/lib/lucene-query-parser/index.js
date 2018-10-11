'use strict';

const parser = require('./peg_engine');

class LuceneQueryParser {
    constructor() {
        this.rawAst = null;
        this.parsedAst = null;
    }
    parse(luceneStr) {
        this.rawAst = parser.parse(luceneStr);
    }
}

module.exports = LuceneQueryParser;
