'use strict';

var base64url = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '\-', '_'];

var hexadecimal = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9','A', 'B', 'C', 'D', 'E', 'F'];


function swapLastTwo(str) {
    var last = str.charAt(str.length - 1);
    var secondToLast = str.charAt(str.length - 2);

    return str.slice(0, -2) + last + secondToLast
}

function makeKeyList(opConfig, data) {
    var multiplier = opConfig.subslice_key_multiplier;
    var results = [];

    function recurse(arr) {
        return Promise.all(arr.map(function(key) {
                return getCount(opConfig, data, key)
                    .then(function(count) {
                        if (count >= opConfig.size * multiplier) {
                            return recurse(base64url.map(function(str) {
                                return swapLastTwo(key + str)
                            }))
                        }
                        else {
                            if (count !== 0) {
                                results.push({
                                    start: data.start.format(dateFormat),
                                    end: data.end.format(dateFormat),
                                    count: count,
                                    key: key
                                });
                            }
                        }
                    })
            })
        );
    }

    return recurse(base64url.map(function(key) {
        return opConfig.type + '#' + key + '*'
    })).then(function() {
        return results;
    });
}

module.exports = {
    base64url: base64url,
    hexadecimal: hexadecimal,
    swapLastTwo: swapLastTwo
};