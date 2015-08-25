'use strict';

var Queue = function() {
    this.head = 0;
    this.tail = 0;
    this.list = {};
};

Queue.prototype.enqueue = function(value) {
    this.list[this.tail++] = value;
};

Queue.prototype.dequeue = function() {
    if (this.size()) {
        var results = this.list[this.head];
        delete this.list[this.head++];
        return results;
    }
    else {
        return null;
    }
};

Queue.prototype.size = function() {
    return this.tail - this.head;
};


module.exports =  Queue;