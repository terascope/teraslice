import 'jest-extended';
import { Queue } from '../src/queue/index.js';

describe('Queue', () => {
    it('has methods enqueue, dequeue and size', () => {
        const queue = new Queue<any>();

        expect(queue.enqueue).toBeFunction();
        expect(queue.dequeue).toBeFunction();
        expect(queue.size).toBeFunction();
        expect(queue.remove).toBeFunction();
        expect(queue.extract).toBeFunction();
        expect(queue.exists).toBeFunction();
    });

    it('can enqueue and dequeue', () => {
        const queue = new Queue<any>();
        const isNull = queue.dequeue();
        expect(isNull).toBeNil();

        queue.enqueue('first');
        queue.enqueue('second');
        const two = queue.size();
        const first = queue.dequeue();

        expect(two).toEqual(2);
        expect(first).toEqual('first');
    });

    it('can unshift', () => {
        const queue = new Queue<any>();
        queue.enqueue(2);
        queue.enqueue(3);
        queue.unshift(1);

        expect(queue.size()).toEqual(3);
        expect(queue.dequeue()).toEqual(1);
        expect(queue.dequeue()).toEqual(2);
        expect(queue.dequeue()).toEqual(3);
        expect(queue.dequeue()).toBeNil();
        expect(queue.size()).toEqual(0);
    });

    it('has an each method', () => {
        const results: any[] = [];
        const queue = new Queue<any>();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        queue.each((val) => {
            results.push(val);
        });

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual(1);
        expect(results[1]).toEqual(2);
        expect(results[2]).toEqual(3);
    });

    it('can remove from queue based on id', () => {
        const queue = new Queue<any>();
        queue.enqueue({ data: 'first', id: 'id1' });
        queue.enqueue({ data: 'second', id: 'id2' });
        queue.enqueue({ data: 'third', id: 'id3' });
        queue.enqueue({ data: 'fourth', id: 'id2' });

        const len = queue.size();

        queue.remove('id2');

        expect(len).toEqual(4);
        expect(queue.size()).toEqual(2);
        expect(queue.dequeue()).toEqual({ data: 'first', id: 'id1' });
        expect(queue.dequeue()).toEqual({ data: 'third', id: 'id3' });
        expect(queue.size()).toEqual(0);
    });

    it('can remove from queue based on a key and id', () => {
        const queue = new Queue<any>();
        queue.enqueue({ data: 'first', id: 'id1' });
        queue.enqueue({ data: 'second', id: 'id2' });
        queue.enqueue({ data: 'third', ex_id: 'id3' });
        queue.enqueue({ data: 'fourth', job_id: 'id2' });

        const len = queue.size();

        queue.remove('id2', 'job_id');

        expect(len).toEqual(4);
        expect(queue.size()).toEqual(3);
        expect(queue.extract('job_id', 'id2')).toBeNil();
        expect(queue.dequeue()).toEqual({ data: 'first', id: 'id1' });
        expect(queue.dequeue()).toEqual({ data: 'second', id: 'id2' });
        expect(queue.dequeue()).toEqual({ data: 'third', ex_id: 'id3' });
        expect(queue.size()).toEqual(0);
    });

    it('can extract from queue based on a key and id', () => {
        const queue1 = new Queue<any>();
        // @ts-expect-error
        expect(queue1.extract()).toBeNil();
        expect(queue1.size()).toEqual(0);

        const queue2 = new Queue<any>();
        queue2.enqueue({ job_id: 2 });
        expect(queue2.size()).toEqual(1);
        expect(queue2.extract('job_id', 2)).toEqual({ job_id: 2 });
        expect(queue2.extract('job_id', 2)).toBeNil();
        expect(queue2.size()).toEqual(0);
        expect(queue2.dequeue()).toBeNil();

        const queue3 = new Queue<any>();
        queue3.enqueue({ job_id: 2 });
        queue3.enqueue({ ex_id: 3 });
        expect(queue3.size()).toEqual(2);
        expect(queue3.extract('ex_id', 3)).toEqual({ ex_id: 3 });
        expect(queue3.extract('ex_id', 3)).toBeNil();
        expect(queue3.size()).toEqual(1);
        expect(queue3.dequeue()).toEqual({ job_id: 2 });
        expect(queue3.dequeue()).toBeNil();

        const queue4 = new Queue<any>();
        queue4.enqueue({ data: 'first', id: 'id1' });
        queue4.enqueue({ data: 'second', id: 'id2' });
        queue4.enqueue({ data: 'third', ex_id: 'id3' });
        queue4.enqueue({ data: 'fourth', job_id: 'id2' });

        const len = queue4.size();

        const data = queue4.extract('id', 'id2');

        expect(len).toEqual(4);
        expect(queue4.size()).toEqual(3);
        expect(data).toEqual({ data: 'second', id: 'id2' });
        expect(queue4.dequeue()).toEqual({ data: 'first', id: 'id1' });
        expect(queue4.dequeue()).toEqual({ data: 'third', ex_id: 'id3' });
        expect(queue4.dequeue()).toEqual({ data: 'fourth', job_id: 'id2' });
    });

    it('can extract only once from a queue', () => {
        const queue = new Queue<any>();
        queue.enqueue({ job_id: 1 });
        queue.enqueue({ job_id: 2 });
        expect(queue.size()).toEqual(2);
        expect(queue.extract('job_id', 1)).toEqual({ job_id: 1 });
        expect(queue.size()).toEqual(1);
        expect(queue.extract('job_id', 1)).toBeNil();
    });

    it('can check for the existence of a node given a key and value', () => {
        const queue = new Queue<any>();

        queue.enqueue({ id: 'some-random-id' });
        queue.enqueue({ id: 'example-id' });
        queue.enqueue({ id: 'some-other-id' });

        expect(queue.exists('id', 'example-id')).toEqual(true);
        expect(queue.exists('id', 'missing-id')).toEqual(false);
    });
});
