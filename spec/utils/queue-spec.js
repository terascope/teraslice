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

    it('can shift', function() {
        var queue = new Queue();
        queue.enqueue(2);
        queue.enqueue(3);
        queue.shift(1);

        expect(queue.size()).toEqual(3);
        expect(queue.dequeue()).toEqual(1);
        expect(queue.dequeue()).toEqual(2);
        expect(queue.dequeue()).toEqual(3);
        expect(queue.dequeue()).toEqual(null);
    });

    it('has an each method', function() {
        var results = [];
        var queue = new Queue();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        queue.each(function(val) {
            results.push(val)
        });

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual(1);
        expect(results[1]).toEqual(2);
        expect(results[2]).toEqual(3);
    });

    it('can remove from queue based on id', function() {
        var queue = new Queue();
        queue.enqueue({data: 'first', id: 'id1'});
        queue.enqueue({data: 'second', id: 'id2'});
        queue.enqueue({data: 'third', id: 'id3'});
        queue.enqueue({data: 'fourth', id: 'id2'});

        var len = queue.size();

        queue.remove('id2');

        expect(len).toEqual(4);
        expect(queue.size()).toEqual(2);
        expect(queue.dequeue()).toEqual({data: 'first', id: 'id1'});
        expect(queue.dequeue()).toEqual({data: 'third', id: 'id3'});
    });

    it('can remove from queue based on a key and id', function() {
        var queue = new Queue();
        queue.enqueue({data: 'first', id: 'id1'});
        queue.enqueue({data: 'second', id: 'id2'});
        queue.enqueue({data: 'third', ex_id: 'id3'});
        queue.enqueue({data: 'fourth', job_id: 'id2'});

        var len = queue.size();

        queue.remove('id2', 'job_id');

        expect(len).toEqual(4);
        expect(queue.size()).toEqual(3);
        expect(queue.dequeue()).toEqual({data: 'first', id: 'id1'});
        expect(queue.dequeue()).toEqual({data: 'second', id: 'id2'});
        expect(queue.dequeue()).toEqual({data: 'third', ex_id: 'id3'});
    });
});

