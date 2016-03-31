
'use strict';
var Queue = require('../../lib/utils/queue');

describe('Queue', function() {
    it('has methods enqueue, dequeue and size', function() {
        var queue = new Queue();

        expect(typeof queue.enqueue).toBe('function');
        expect(typeof queue.dequeue).toBe('function');
        expect(typeof queue.size).toBe('function');
        expect(typeof queue.remove).toBe('function');
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
    });

    it('can remove from queue based on id', function(){
        var queue = new Queue();
        queue.enqueue({data: 'first', id: 'id1'});
        queue.enqueue({data:'second', id: 'id2'});
        queue.enqueue({data:'three', id: 'id3'});

        var len = queue.size();

        var removed = queue.remove('id2');

        expect(len).toEqual(3);
        expect(removed).toEqual({data:'second', id: 'id2'});
        expect(queue.size()).toEqual(2);
        expect(queue.dequeue()).toEqual({data: 'first', id: 'id1'});
        expect(queue.dequeue()).toEqual({data: 'three', id: 'id3'});
    });

});

