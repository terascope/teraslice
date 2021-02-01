import * as p from 'xlucene-parser';

export function makeNodeWalker() {
    return function astWalker(node: p.Node): boolean {
        if (p.isTermType(node)) {
            return true;
        }
        return false;
    };
}
