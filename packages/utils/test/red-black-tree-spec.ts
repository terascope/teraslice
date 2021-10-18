import 'jest-extended';
import {
    RedBlackTree
} from '../src/red-black-tree';

describe('RedBlackTree', () => {
    describe('when adding one item', () => {
        let tree: RedBlackTree<string>;
        beforeAll(() => {
            tree = new RedBlackTree();
            tree.insert(2, 'hi');
        });

        it('should have written the root node', () => {
            expect(tree.root).toMatchSnapshot();
        });
    });

    describe('when adding three items', () => {
        let tree: RedBlackTree<string>;
        beforeAll(() => {
            tree = new RedBlackTree();
            tree.insert(2, 'hi');
            tree.insert(3, 'hello');
            tree.insert(10, 'howdy');
        });

        it('should have written a tree of nodes', () => {
            expect(tree.root).toMatchSnapshot();
        });
    });

    describe('when adding 10 items', () => {
        let tree: RedBlackTree<string>;
        beforeAll(() => {
            tree = new RedBlackTree();
            tree.insert(5, 'hello');
            tree.insert(18, 'howdy');
            tree.insert(2, 'hi');
            tree.insert(10, 'howdy there');
            tree.insert(200, 'hello friend');
            tree.insert(60, 'aloha');
            tree.insert(30, 'hello person');
            tree.insert(90, 'sup');
            tree.insert(3, 'hi');
            tree.insert(33, 'oh hey');
        });

        it('should have written a tree of nodes', () => {
            expect(tree.root).toMatchSnapshot();
        });
    });

    describe('when adding 10 items and some values are null', () => {
        let tree: RedBlackTree<string>;
        beforeAll(() => {
            tree = new RedBlackTree();
            tree.insert(5, 'hello');
            tree.insert(18, 'howdy');
            tree.insert(2, 'hi');
            tree.insert(10, null);
            tree.insert(200, null);
            tree.insert(60, 'aloha');
            tree.insert(30, null);
            tree.insert(90, 'sup');
            tree.insert(3, 'hi');
            tree.insert(33, null);
        });

        it('should have written a tree of nodes', () => {
            expect(tree.root).toMatchSnapshot();
        });
    });
});
