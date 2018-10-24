'use strict';

class BaseType {

    walkAst(ast, cb) {
        function walk(ast, _field) {
            const topField = ast.field || _field;
            const node = cb(ast, topField);
    
            if (node.right) {
                node.right = walk(node.right, topField)
            }
    
            if (node.left) {
                node.left = walk(node.left, topField)
            }
            return node;
        }
    
       return walk(ast)
      
    }

    processAst(ast) {
        return ast;
    }

    formatData(data) {
        return data;
    }

}

module.exports = BaseType;