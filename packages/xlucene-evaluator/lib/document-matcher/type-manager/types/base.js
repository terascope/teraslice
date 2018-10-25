'use strict';

class BaseType {
    constructor(fnBaseName) {
        this.fnID = 0;
        this.injectorFns = {};
        this.fnBaseName = fnBaseName;

        this.filterFnBuilder = (cb) => {
            this.fnID += 1;
            this.injectorFns[`${this.fnBaseName}${this.fnID}`] = cb;
        }
    
        this.createParsedField = (field) => {
            const { fnBaseName, fnID } = this;
            return `${fnBaseName}${fnID}(data.${field})`;
        }
    
        this.injectTypeFilterFns = () => {
            const { injectorFns } = this;
            return Object.keys(injectorFns).length > 0 ? injectorFns : null;
        }
    }
    //TODO: look to see if this can be combined with other walkAst method
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
