
import { PegEngine } from '../interfaces';

let parser: PegEngine;

try {
     // @ts-ignore because the types don't exist
    parser = require('../../peg/peg_engine-v2.js');
} catch (err) {
    // @ts-ignore because the types don't exist
    parser = require('../../../peg/peg_engine-v2.js');
}

export default parser;
