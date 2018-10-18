'use strict';

const ast = {
    "left": {
        "left": {
            "operator": "OR",
            "left": {
                "term_min": 1000,
                "term_max": 200000,
                "inclusive_min": true,
                "inclusive_max": true
            },
            "right": {
                "term_min": 5000000,
                "term_max": Infinity,
                "inclusive_min": false,
                "inclusive_max": true
            }
        },
        "field": "bytes"
    }
};

function _parseRange(node, topFieldName) {
    let {
        inclusive_min: incMin,
        inclusive_max: incMax,
        term_min: minValue,
        term_max: maxValue,
        field = topFieldName
    } = node;

    if (minValue === '*') minValue = -Infinity;
    if (maxValue === '*') maxValue = Infinity;

    // ie age:>10 || age:(>=10 AND <20)
    if (!incMin && incMax) {
        if (maxValue === Infinity) {
            return `data.${field} > ${minValue}`
        }
       return  `((${maxValue} >= data.${field}) && (data.${field}> ${minValue}))`
    }
    // ie age:<10 || age:(<=10 AND >20)
    if (incMin && !incMax) {
        if (minValue === -Infinity) {
            return `data.${field} < ${maxValue}`
        }
       return  `((${minValue} <= data.${field}) && (data.${field} < ${maxValue}))`
    }

    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
    if (incMin && incMax) {
        if (maxValue === Infinity) {
            return `data.${field} >= ${minValue}`
        }
        if (minValue === -Infinity) {
            return `data.${field} <= ${maxValue}`
        }
       return  `((${maxValue} >= data.${field}) && (data.${field} >= ${minValue}))`
    }

    // ie age:(>10 AND <20)
    if(!incMin && !incMax) {
        return  `((${maxValue} > data.${field}) && (data.${field} > ${minValue}))`
    }
}

function fnBuilder(ast) {
    let str = '';
    let addParens = false;

    function strBuilder(ast, _field) {
        const topField = ast.field || _field;
        if (ast.field && ast.term) {
            if (ast.field === '_exists_') {
                str += `data.${ast.term} != null`
            } else {
                str += `data.${ast.field} == "${ast.term}"`
            }
        }
        if (ast.term_min) {
            str += _parseRange(ast, topField)
        }

        if (ast.operator) {
            let opStr = ' || ';
    
            if (ast.operator === 'AND') {
                addParens = true;
                opStr = ' && ('
            }
    
            str += opStr;
        }
        if (addParens) {
            addParens = false;
            str += ')'
        }
    }

    _walkLuceneAst(ast, strBuilder);
    return str;
}

function _walkLuceneAst(ast, cb, _field) {
    const topField = ast.field || _field;

    if (ast.left) {
        _walkLuceneAst(ast.left, cb, topField);
    } 

    cb(ast, topField)

    if (ast.right) {
        _walkLuceneAst(ast.right, cb, topField);
    } 
}

// function _walkLuceneAst(ast, fnStr, _field) {
//     let addParens = false;
//     const topField = ast.field || _field;

//     if (ast.field && ast.term) {
//         if (ast.field === '_exists_') {
//             fnStr += `data.${ast.term} != null`
//         } else {
//             fnStr += `data.${ast.field} == "${ast.term}"`
//         }
//     }

//     if (ast.term_min) {
//         fnStr += _parseRange(ast, topField)
//     }

//     if (ast.left) {
//         fnStr += _walkLuceneAst(ast.left, '', topField);
//     } 

//     if (ast.operator) {
//         let opStr = ' || ';

//         if (ast.operator === 'AND') {
//             addParens = true;
//             opStr = ' && ('
//         }

//         fnStr += opStr;
//     }

//     if (ast.right) {
//         fnStr += _walkLuceneAst(ast.right, '', topField);
//         if (addParens) {
//             addParens = false;
//             fnStr += ')'
//         }
//     } 

//     return fnStr;
// }
//const str = _walkLuceneAst(ast, '')
const str = fnBuilder(ast)
//((200000 >= data.bytes) && (data.bytes >= 1000)) || ((null >= data.bytes) && (data.bytes> 5000000))
console.log('results', str)