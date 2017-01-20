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

Queue.prototype.shift = function(value) {
    var currentNode = this.head;
    var node = new Node(value, null, currentNode);
    this.head = node;
    if (this.tail === null) {
        this.tail = node;
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

Queue.prototype.each = function(fn) {
    var currentNode = this.head;
    if (currentNode) {
        fn(currentNode.value);
    }
    while (currentNode && currentNode.next) {
        currentNode = currentNode.next;
        fn(currentNode.value)
    }
};

Queue.prototype.remove = function(id, keyForID) {
    var key = keyForID ? keyForID : 'id';
    if (this.head === null || !id) {
        return null;
    }

    //fast forward head to right spot
    while (this.head && this.head.value[key] === id) {
        this.head = this.head.next;
        this._size -= 1;
    }

    //if whole list is gone, set tail to null
    if (this.head === null) {
        this.tail = null;
        return;
    }

    //clean up prev
    this.head.prev = null;


    //there is anything left in list 
    if (this.head) {
        var currentNode = this.head;

        while (currentNode) {
            var previousNode = currentNode.prev;
            var nextNode = currentNode.next;

            if (currentNode.value[key] === id) {

                if (nextNode) {
                    if (previousNode) {
                        previousNode.next = nextNode;
                        nextNode.prev = previousNode;
                    }
                    else {
                        nextNode.prev = null;
                    }
                }
                else {
                    if (previousNode) {
                        previousNode.next = null;
                        this.tail = previousNode;
                    }
                }
                this._size--;
                currentNode = nextNode;
            }
            else {
                currentNode = nextNode;
            }
        }
    }
};

Queue.prototype.size = function() {
    return this._size;
};

module.exports = Queue;
