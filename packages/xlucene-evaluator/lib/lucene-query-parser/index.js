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

    walkLuceneAst(preCb, postCb) {
        const { _ast: ast } = this;
        //console.log('what is the ast', ast, cb)
        function walk(node, _field, depth) {
            //console.log('what is the node', node)
            const topField = node.field || _field;

            if (node.left) {
                walk(node.left, topField, depth + 1);
            } 
        
            preCb(node, topField, depth)
        
            if (node.right) {
                walk(node.right, topField, depth + 1);
            }
            if (postCb) postCb(node, topField, depth)
        }
        
       return walk(ast, null, );
    }
}

module.exports = LuceneQueryParser;
