import Node from './node.js';

/** A basic FIFO queue */
export class Queue<T> {
    head?: Node<T>;
    tail?: Node<T>;
    private _size = 0;

    /** A value to the end of the queue */
    enqueue(value: T): void {
        this.tail = new Node(value, this.tail);
        if (!this.head) {
            this.head = this.tail;
        }
        this._size += 1;
    }

    unshift(value: T): void {
        const currentNode = this.head;
        const node = new Node(value, undefined, currentNode);
        this.head = node;
        if (this.tail == null) {
            this.tail = node;
        }
        this._size += 1;
    }

    dequeue(): T | undefined {
        if (this._size === 0 || this.head == null) {
            return;
        }
        const node = this.head;
        this.head = node.next;
        if (node.next) {
            node.next = undefined;
            node.prev = undefined;
        }
        this._size -= 1;
        if (this._size === 1) {
            this.tail = this.head;
        } else if (this._size === 0) {
            this.head = undefined;
            this.tail = undefined;
        }

        return node.value;
    }

    /** Iterate over each value */
    each(fn: (value: T) => void): void {
        let currentNode = this.head;
        if (currentNode) {
            fn(currentNode.value);
        }
        while (currentNode && currentNode.next) {
            currentNode = currentNode.next;
            fn(currentNode.value);
        }
    }

    remove(id: string, keyForID?: string): void {
        const key = keyForID || 'id';
        if (this.head == null || !id) {
            return;
        }

        // fast forward head to right spot
        while (this.head && this.head.value[key as keyof T] === id) {
            this.head = this.head.next;
            this._size -= 1;
        }

        // if whole list is gone, set tail to undefined
        if (this.head == null) {
            this.tail = undefined;
            return;
        }

        // clean up prev
        this.head.prev = undefined;

        // there is anything left in list
        if (this.head) {
            let currentNode: Node<T> | undefined = this.head;

            while (currentNode) {
                const previousNode = currentNode.prev;
                const nextNode: Node<T> | undefined = currentNode.next;

                if (currentNode.value[key as keyof T] === id) {
                    if (nextNode) {
                        if (previousNode) {
                            previousNode.next = nextNode;
                            nextNode.prev = previousNode;
                        } else {
                            nextNode.prev = undefined;
                        }
                    } else if (previousNode) {
                        previousNode.next = undefined;
                        this.tail = previousNode;
                    }
                    this._size -= 1;
                    currentNode = nextNode;
                } else {
                    currentNode = nextNode;
                }
            }
        }
    }

    /**
     * Search the queue for a key that matches a value and return the match
    */
    extract(key: string, val: unknown): T | undefined {
        if (val == null) return;

        if (this.head) {
            let currentNode: Node<T> | undefined = this.head;
            let isFound = false;

            while (currentNode && !isFound) {
                const previousNode = currentNode.prev;
                const nextNode: Node<T> | undefined = currentNode.next;

                if (currentNode.value[key as keyof T] === val) {
                    const data = currentNode.value;
                    isFound = true;
                    if (nextNode) {
                        if (previousNode) {
                            previousNode.next = nextNode;
                            nextNode.prev = previousNode;
                        } else {
                            this.head = nextNode;
                            nextNode.prev = undefined;
                        }
                    } else if (previousNode) {
                        previousNode.next = undefined;
                        this.tail = previousNode;
                    }
                    this._size -= 1;
                    if (this._size === 1) {
                        this.tail = this.head;
                    } else if (this._size === 0) {
                        this.head = undefined;
                        this.tail = undefined;
                    }
                    return data;
                }

                currentNode = nextNode;
            }
        }
    }

    /**
     * Get the length of the queue
    */
    size(): number {
        return this._size;
    }

    /**
     * Search the queue to see if a key value pair exists
    */
    exists(key: string, val: unknown): boolean {
        let currentNode = this.head;
        if (val == null) {
            return false;
        }

        if (currentNode && currentNode.value[key as keyof T] === val) {
            return true;
        }

        while (currentNode && currentNode.next) {
            currentNode = currentNode.next;

            if (currentNode.value[key as keyof T] === val) {
                return true;
            }
        }
        return false;
    }
}
