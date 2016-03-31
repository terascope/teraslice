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
    var thisNode = this.head;
    var previousNode;
    var deletedNode = null;

    if (!thisNode) {
        return null;
    }

    //first node
    if (thisNode.value.id === id) {
        deletedNode = thisNode.value;
        this.head = this.head.next;

        if (this.head) {
            this.head.prev = null;
        }
        this._size--;
        return deletedNode;
    }

    while (thisNode.next) {
        if (thisNode.value.id === id) {
            deletedNode = thisNode.value;
            previousNode = thisNode.prev;
            if (previousNode) {
                previousNode.next = thisNode.next;
            }
            thisNode.next.prev = previousNode;
            this._size--;

            return deletedNode

        }
        else {
            previousNode = thisNode;
            thisNode = thisNode.next;
        }
    }

    //last node
    if (thisNode.value.id === id) {
        deletedNode = thisNode.value;
        previousNode.next = null;
        this.tail = previousNode;
        this._size--;
    }

    //if nothing was found
    return deletedNode;
};

Queue.prototype.size = function() {
    return this._size;
};

module.exports = Queue;
