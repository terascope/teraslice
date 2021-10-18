import { Maybe } from '@terascope/types';
import { isLessThan } from './equality';

export interface RedBlackNode<T> {
    color: 'RED'|'BLACK';
    key: number|bigint;
    value: T;
    left: RedBlackNode<T>|undefined;
    right: RedBlackNode<T>|undefined;
}

/**
 * A Binary Search Tree with optimization to know when a leaf nodes are all NIL (AKA black)
 * If one or both nodes are not nil, the color is red
*/
export class RedBlackTree<T> {
    root: RedBlackNode<Maybe<T>>|undefined = undefined;

    /**
     * Add an item to the tree
    */
    insert(key: number|bigint, value: Maybe<T>): this {
        if (this.root == null) {
            this.root = createNode(key, value);
            return this;
        }

        insertNode(this.root, key, value);
        return this;
    }
}

/**
 * Create new node, keep the keys ordered the same to ensure that
 * the values can be inlined
*/
function createNode<T>(key: number|bigint, value: T): RedBlackNode<T> {
    return {
        color: 'BLACK',
        key,
        value,
        left: undefined,
        right: undefined
    };
}

/**
 * Used for recursing down the tree find where to put the node
*/
function insertNode<T>(
    node: RedBlackNode<T>,
    key: number|bigint,
    value: T
): void {
    if (isLessThan(key, node.key)) {
        if (node.left == null) {
            if (value != null) {
                node.color = 'RED';
            }
            node.left = createNode(key, value);
            return;
        }
        insertNode(node.left, key, value);
        return;
    }

    if (node.right == null) {
        if (value != null) {
            node.color = 'RED';
        }
        node.right = createNode(key, value);
        return;
    }

    insertNode(node.right, key, value);
}
