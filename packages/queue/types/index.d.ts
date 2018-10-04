// Type definitions for queue
// Project: @terascope/queue

export = Queue;

declare class Queue<T> {
    enqueue(value: T): void;
    unshift(value: T): void;
    exists(key: string, val: any): boolean;
    size(): number;
    extract(key: string, val: any): T | null;
    remove(id: string, keyForID?: string): void;
    each(fn: Function): void;
    dequeue(): T | null;
}

declare namespace Queue {
}
