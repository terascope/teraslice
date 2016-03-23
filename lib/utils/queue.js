'use strict';

var Queue = function() {
    this.list = {head: null, tail: null};
    this._size = 0;
};

Queue.prototype.enqueue = function(value) {
    var node = {previous: null, value: value, next: null};
    var list = this.list;

    if (list.tail === null) {
        list.tail = node;
        list.head = list.tail;
    }
    else {
        node.previous = list.tail;
        list.tail.next = node;
        list.tail = node;
    }
    this._size++;
};

Queue.prototype.dequeue = function() {
    var list = this.list;
    if (list.head) {
        var prevNode = list.head.value;
        list.head = list.head.next;
        this._size--;

        return prevNode;
    }
    else {
        return null;
    }
};

Queue.prototype.remove = function(id) {
    var thisNode = this.list.head;
    var previousNode;
    var deletedNode = null;


    if (!thisNode) {
        return null;
    }

    //first node
    if (thisNode.value.id === id) {
        deletedNode = thisNode.value;
        thisNode = thisNode.next;

        if (thisNode) {
            thisNode.previous = null
        }

        this._size--;
        return deletedNode;
    }

    while (thisNode.next) {
        if (thisNode.value.id === id) {
            deletedNode = thisNode.value;
            previousNode = thisNode.previous;
            previousNode.next = thisNode.next;
            thisNode.next.previous = previousNode;
            this._size--;
            return deletedNode

        }
        else {
            previousNode = thisNode;
            thisNode = thisNode.next;
        }
    }

    //last node
    if (thisNode.value.id === id){
        deletedNode = thisNode.value;
        previousNode.next = null;
        this._size--
    }

    //if nothing was found
        return deletedNode;
};

Queue.prototype.size = function() {
    return this._size;
};


module.exports = Queue;