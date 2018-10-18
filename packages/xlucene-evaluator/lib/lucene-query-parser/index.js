'use strict';

const parser = require('./peg_engine');

class LuceneQueryParser {
    constructor() {
        this._ast = null;
    }
    parse(luceneStr) {
       // console.log('has parse been called?', luceneStr)
        this._ast = parser.parse(luceneStr);
    }

    walkLuceneAst(cb) {
        const { _ast: ast } = this;
        //console.log('what is the ast', ast, cb)
        function walk(node, _field) {
            //console.log('what is the node', node)
            const topField = node.field || _field;

            if (node.left) {
                walk(node.left, topField);
            } 
        
            cb(node, topField)
        
            if (node.right) {
                _walkLuceneAst(node.right, topField);
            } 
        }
        
       return walk(ast);
    }
}

module.exports = LuceneQueryParser;
