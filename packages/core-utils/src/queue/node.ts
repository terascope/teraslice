export default class Node<T> {
    value: T;
    next?: Node<T>;
    prev?: Node<T>;

    constructor(value: T, prev?: Node<T>, next?: Node<T>) {
        this.next = next;
        if (next) {
            next.prev = this;
        }
        this.prev = prev;
        if (prev) {
            prev.next = this;
        }
        this.value = value;
    }
}
