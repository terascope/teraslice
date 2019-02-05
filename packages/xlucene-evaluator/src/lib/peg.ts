
import { PegEngine } from './interfaces';

let parser: PegEngine;

try {
     // @ts-ignore because the types don't exist
    parser = require('../../peg/peg_engine');
} catch (err) {
    // @ts-ignore because the types don't exist
    parser = require('../../../peg/peg_engine');
}

export default parser;
