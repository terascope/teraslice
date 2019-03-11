/* eslint-disable no-console */

'use strict';

const chalk = require('chalk');
const _ = require('lodash');

module.exports = () => {
    function formatErr(err) {
        return _.toString(_.get(err, 'message', err));
    }

    function fatal(err) {
        if (process.env.TJM_TEST_MODE) {
            throw formatErr(err);
        } else {
            console.error(chalk.red(formatErr(err)));
            process.exit(1);
        }
    }

    function error(err) {
        console.error(chalk.red(formatErr(err)));
    }

    function info(message) {
        console.log(_.toString(message));
    }

    function warning(message) {
        console.log(chalk.yellow(formatErr(message)));
    }

    function green(message) {
        if (!process.env.TJM_TEST_MODE) {
            console.log(chalk.green(message));
        }
    }

    function yellow(message) {
        if (!process.env.TJM_TEST_MODE) {
            console.log(chalk.yellow(message));
        }
    }

    return {
        fatal,
        error,
        green,
        yellow,
        info,
        warning
    };
};
