// Type definitions for queue
// Project: @terascope/queue

export = Queue;

declare class Queue {
    enqueue(value: any): void;
    unshift(value: any): void;
    exists(key: string, val: any): boolean;
    size(): number;
    extract(key: string, val: any): any | null;
    remove(id: string, keyForID?: string): void;
    each(fn: Function): void;
    dequeue(): any | null;
}

declare namespace Queue {
}
