
'use strict';
var Queue = require('../../lib/utils/queue');

describe('Queue', function() {
    it('has methods enqueue, dequeue and size', function() {
        var queue = new Queue();

        expect(typeof queue.enqueue).toBe('function');
        expect(typeof queue.dequeue).toBe('function');
        expect(typeof queue.size).toBe('function');
    });

    it('can enqueue and dequeue', function() {
        var queue = new Queue();
        var isNull = queue.dequeue();
        queue.enqueue('first');
        queue.enqueue('second');
        var two = queue.size();
        var first = queue.dequeue();

        expect(isNull).toBeNull();
        expect(two).toEqual(2);
        expect(first).toEqual('first')
    })
});

