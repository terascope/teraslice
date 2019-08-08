#!/usr/bin/env node

'use strict';

const path = require('path');

// this path.join is only used for pkg asset injection
path.join(__dirname, '../package.json');
// eslint-disable-next-line import/no-unresolved
require('../dist/src/command');
