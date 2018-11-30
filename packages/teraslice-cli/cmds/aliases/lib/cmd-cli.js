'use strict';

/** 
 * This is an example of a command level args parser module, the alias actions
 * don't share any common options at the moment so there is nothing here other
 * than passing through the options as an example.  Once other examples exist
 * it is OK to remove this and the requires that use it.
 */

exports.args = (yargs) => {
    return yargs.option;
};
