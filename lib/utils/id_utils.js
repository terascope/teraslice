'use strict';

var base64url = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '\-', '_'];

var hexadecimal = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

var HEXADECIMAL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];


function swapLastTwo(str) {
    var last = str.charAt(str.length - 1);
    var secondToLast = str.charAt(str.length - 2);

    return str.slice(0, -2) + last + secondToLast
}

function getKeyArray(opConfig) {
    if (opConfig.key_type === 'base64url') {
        return base64url;
    }
    if (opConfig.key_type === 'hexadecimal') {
        return hexadecimal;
    }
    if (opConfig.key_type === 'HEXADECIMAL') {
        return HEXADECIMAL;
    }
}

function transformIds(opConfig, arr) {
    var results = new Array(arr.length);
    var counter = 0;

    while (arr.length) {
        results[counter] = `${opConfig.type}#${arr.pop()}*`;
        counter++
    }

    return results;
}

module.exports = {
    base64url: base64url,
    hexadecimal: hexadecimal,
    HEXADECIMAL: HEXADECIMAL,
    getKeyArray: getKeyArray,
    swapLastTwo: swapLastTwo,
    transformIds: transformIds
};