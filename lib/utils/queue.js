'use strict';

function Node(data, prev, next) {
    this.next = next;
    if (next) {
        next.prev = this;
    }
    this.prev = prev;
    if (prev) {
        prev.next = this;
    }
    this.value = data
}

var Queue = function() {
    this.head = null;
    this.tail = null;
    this._size = 0;
};

Queue.prototype.enqueue = function(value) {
    this.tail = new Node(value, this.tail, null);
    if (!this.head) {
        this.head = this.tail;
    }
    this._size++;
};

Queue.prototype.dequeue = function() {
    if (this._size === 0) {
        return null
    }
    var head = this.head;
    this.head = head.next;
    if (head.next) {
        head.next = this.head.prev = null
    }
    this._size--;
    if (this._size === 1) {
        this.tail = this.head
    }
    else if (this._size === 0) {
        this.head = this.tail = null
    }

    return head.value;
};

Queue.prototype.remove = function(id) {

    var currentNode = this.head;
    var previousNode;

    if (!currentNode || !id) {
        return null;
    }

    //move head to correct spot
    while (currentNode.value.id === id) {
        this.head = currentNode.next;
        this._size--;

        if (this.head) {
            this.head.prev = null;
        }
        else {
            //there is no next, set tail to null
            this.tail = null;
            return;
        }
        currentNode = currentNode.next;
    }

    // if it runs here, then head.value.id !== id, so we check rest of queue after it
    while (currentNode && currentNode.next) {
        previousNode = currentNode;
        currentNode = currentNode.next;

        if (currentNode && currentNode.value.id === id) {
            previousNode.next = currentNode.next;

            if (currentNode.next) {
                currentNode.next.prev = previousNode;
            }
            else {
                this.tail = previousNode;
            }
            this._size--;
        }
    }
};

Queue.prototype.size = function() {
    return this._size;
};

module.exports = Queue;
