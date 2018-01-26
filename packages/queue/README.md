# queue
This is a typical FIFO queue implementation with a few extra helper methods

### API
| method | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
enqueue | will add any value to the queue| Any | Adds to end of queue
dequeue | will remove and return the head of the queue | no args | returns null if empty
unshift | will add value to queue and place it at head of queue| any | the value will cut ahead in the queue
each | calls a function on each value in the queue | Function | it does not return anything, it behaves similarly to [].each()
remove | iterates and removes any from the queue that matches the value passed in. | String, String | Looks at values located at the key 'id', if a second args is given then it will look at that key instead. Check the example for more details
size | returns the size of the queue | no args | returns a number, 0 if queue is empty
extract | removes and returns a particular value in the queue | String, String | The first parameter is the key of the object in which you will be checking, and the second is the actual value that you will be comparing
### Usage

```
var Queue = require('queue');
var queue = new Queue;

queue.enqueue({first: 1, id: 'someId'});
queue.enqueue({second: 2, id: 'anotherId'});
queue.enqueue({third: 3, id:, 'yetAnotherId'});

queue.size();  => 3

queue.dequeue();  => {first: 1}
queue.size();  => 2

// O(N)
queue.unshift({first: 1}) 
queue.size();  => 3

//takes in a function and calls it on each value in the queue
queue.each(obj => console.log(obj)); 
=> {first: 1, id: 'someId'}
=> {second: 2, id: 'anotherId'}
=> {third: 3, id:, 'yetAnotherId'}

//defaults to look at value placed at key of `id`
queue.remove('anotherId')
queue.size();  => 2

queue.each(obj => console.log(obj));
=> {first: 1, id: 'someId'}
=> {third: 3, id:, 'yetAnotherId'}

queue.enqueue({fourth: 4, anotherKey: 'someOtherKeyId'});

queue.each(obj => console.log(obj));
=> {first: 1, id: 'someId'}
=> {third: 3, id:, 'yetAnotherId'}
=> {fourth: 4, anotherKey: 'someOtherKeyId'}

// second argument will change what key it looks at
queue.remove('someOtherKeyId', 'anotherKey');

queue.each( obj => console.log(obj) ) 
=> {first: 1, id: 'someId'}
=> {third: 3, id:, 'yetAnotherId'}

var newQueue = new Queue();
newQueue.enqueue({job_id: 2});
newQueue.enqueue({ex_id: 3});
newQueue.size()).toEqual(2);
=> 2

newQueue.extract('ex_id', 3);
=> {ex_id: 3}

newQueue.size()
=> 1

newQueue.dequeue();
=> {job_id: 2}


```