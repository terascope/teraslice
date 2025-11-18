import { xLuceneVariables, xLuceneTypeConfig } from '@terascope/types';
import { Node } from '../../src/index.js';

export type TestCase = [
    // when give query %s
    string,
    // it should be able to parse %s
    string,
    // toMatchObject(%j)
    Partial<Node>,
    // Type config to pass in
    xLuceneTypeConfig?,
    xLuceneVariables?,
    // to test resolveVariables separately
    Partial<Node>?,
    // to add more individualized tests
    ((val: Date, ast: Node) => void)?
];
