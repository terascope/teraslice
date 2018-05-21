'use strict';

const chalk = require('chalk');

module.exports = () => {
    function error(err) {
        console.log(chalk.red(err));
        process.exit(1);
    }

    function success(message) {
        console.log(chalk.green(message));
    }

    function warning(message) {
        console.log(chalk.yellow(message));
    }

    return {
        error,
        success,
        warning
    };
};

