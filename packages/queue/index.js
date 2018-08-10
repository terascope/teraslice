'use strict';

/* eslint-disable func-names */

function Node(data, prev, next) {
    this.next = next;
    if (next) {
        next.prev = this;
    }
    this.prev = prev;
    if (prev) {
        prev.next = this;
    }
    this.value = data;
}

const Queue = function () {
    this.head = null;
    this.tail = null;
    this._size = 0;
};

Queue.prototype.enqueue = function (value) {
    this.tail = new Node(value, this.tail, null);
    if (!this.head) {
        this.head = this.tail;
    }
    this._size += 1;
};

Queue.prototype.unshift = function (value) {
    const currentNode = this.head;
    const node = new Node(value, null, currentNode);
    this.head = node;
    if (this.tail === null) {
        this.tail = node;
    }
    this._size += 1;
};

Queue.prototype.dequeue = function () {
    if (this._size === 0) {
        return null;
    }
    const node = this.head;
    this.head = node.next;
    if (node.next) {
        node.next = null;
        this.head.prev = null;
    }
    this._size -= 1;
    if (this._size === 1) {
        this.tail = this.head;
    } else if (this._size === 0) {
        this.head = null;
        this.tail = null;
    }

    return node.value;
};

Queue.prototype.each = function (fn) {
    let currentNode = this.head;
    if (currentNode) {
        fn(currentNode.value);
    }
    while (currentNode && currentNode.next) {
        currentNode = currentNode.next;
        fn(currentNode.value);
    }
};

Queue.prototype.remove = function (id, keyForID) {
    const key = keyForID || 'id';
    if (this.head === null || !id) {
        return;
    }

    // fast forward head to right spot
    while (this.head && this.head.value[key] === id) {
        this.head = this.head.next;
        this._size -= 1;
    }

    // if whole list is gone, set tail to null
    if (this.head === null) {
        this.tail = null;
        return;
    }

    // clean up prev
    this.head.prev = null;


    // there is anything left in list
    if (this.head) {
        let currentNode = this.head;

        while (currentNode) {
            const previousNode = currentNode.prev;
            const nextNode = currentNode.next;

            if (currentNode.value[key] === id) {
                if (nextNode) {
                    if (previousNode) {
                        previousNode.next = nextNode;
                        nextNode.prev = previousNode;
                    } else {
                        nextNode.prev = null;
                    }
                } else if (previousNode) {
                    previousNode.next = null;
                    this.tail = previousNode;
                }
                this._size -= 1;
                currentNode = nextNode;
            } else {
                currentNode = nextNode;
            }
        }
    }
};

Queue.prototype.extract = function (key, val) {
    if (this.head) {
        let currentNode = this.head;
        let isFound = false;

        while (currentNode && !isFound) {
            const previousNode = currentNode.prev;
            const nextNode = currentNode.next;

            if (currentNode.value[key] === val) {
                const data = currentNode.value;
                isFound = true;
                if (nextNode) {
                    if (previousNode) {
                        previousNode.next = nextNode;
                        nextNode.prev = previousNode;
                    } else {
                        this.head = nextNode;
                        nextNode.prev = null;
                    }
                } else if (previousNode) {
                    previousNode.next = null;
                    this.tail = previousNode;
                }
                this._size -= 1;
                if (this._size === 1) {
                    this.tail = this.head;
                } else if (this._size === 0) {
                    this.head = null;
                    this.tail = null;
                }
                return data;
            }

            currentNode = nextNode;
        }
    }

    return null;
};

Queue.prototype.size = function () {
    return this._size;
};

Queue.prototype.exists = function (key, val) {
    let currentNode = this.head;

    if (currentNode && currentNode.value[key] === val) {
        return true;
    }

    while (currentNode && currentNode.next) {
        currentNode = currentNode.next;

        if (currentNode.value[key] === val) {
            return true;
        }
    }
    return false;
};

module.exports = Queue;
