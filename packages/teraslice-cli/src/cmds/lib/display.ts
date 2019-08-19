/* tslint:disable */
// @ts-ignore
import ttyTable from 'tty-table';
// @ts-ignore
import CliTable from 'cli-table3';
// @ts-ignore
import easyTable from 'easy-table';
import _ from 'lodash';
// @ts-ignore
import prompts from 'prompts';
// @ts-ignore
async function pretty(headerValues, rows) {
    // @ts-ignore
    const header = [];
    _.each(headerValues, (item) => {
        // @ts-ignore
        const col = [];
        // @ts-ignore
        col.value = item;
        // @ts-ignore
        header.push(col);
    });
// @ts-ignore
    const table = ttyTable(header, rows, {
        borderStyle: 1,
        paddingTop: 0,
        paddingBottom: 0,
        headerAlign: 'left',
        align: 'left',
        defaultValue: ''
    });
    console.log(table.render());
}
// @ts-ignore
async function horizontal(rows, opts) {
    const table = new CliTable(opts);

    _.each(rows, (item) => {
        table.push(item);
    });

    console.log(await table.toString());
}
// @ts-ignore
async function vertical(header, rows, style) {
    _.each(rows, (keys) => {
        const table = new CliTable(style);
        console.log(`\n${header} -> ${keys[header]}`);
        _.each(keys, (value, key) => {
            const val = {};
            val[key] = value;
            // @ts-ignore
            table.push(val);
        });
        console.log(table.toString());
    });
}
// @ts-ignore
async function text(headerValues, items) {
    // @ts-ignore
    const rows = [];
    _.each(items, (item) => {
        const row = {};
        _.each(headerValues, (headerValue) => {
            row[headerValue] = item[headerValue];
        });
        rows.push(row);
    });
    // @ts-ignore
    console.log(easyTable.print(rows));
}

/**
     * Parses the teraslice client endpoint responses into an array used to generate
     * tables in command line output.
     *
     @param {Array} header - Header values to include in output
     @param {Object} response - Teraslice client response object
     @param {Boolean} active - When set to true parse values in active list
     @param {String} id - id value used to filter results by job_id or ex_id
     @returns {Array} rows - Table content is an array of arrays with
     *                       each row an element in the array.
*/
// @ts-ignore
async function parseResponse(header, response, active = false, id?:string) {
    // @ts-ignore
    const rows = [];
    _.each(response, (value, key) => {
        // @ts-ignore
        let row = [];
        if (active) {
            _.each(response[key].active, (activeValue) => {
                row = [];
                // filter by id
                if (id === undefined || activeValue.job_id === id || activeValue.ex_id === id) {
                    _.each(header, (item) => {
                        if (item === 'teraslice_version') {
                            row.push(response[key].teraslice_version);
                        } else if (item === 'node_id') {
                            row.push(response[key].node_id);
                        } else if (item === 'hostname') {
                            row.push(response[key].hostname);
                        } else if (item === 'node_version') {
                            row.push(response[key].node_version);
                        } else {
                            row.push(activeValue[item]);
                        }
                    });
                    // @ts-ignore
                    rows.push(row);
                }
            });
        } else {
            _.each(header, (item) => {
                if (item === 'active') {
                    row.push(response[key][item].length);
                } else {
                    row.push(response[key][item]);
                }
            });
            // @ts-ignore
            rows.push(row);
        }
    });
    // @ts-ignore
    return rows;
}

export default function module() {
    /**
     * Display teraslice responses in a table
     *
     @param {Array} header - Header values to include in output
     @param {Object} response - Teraslice client response object
     @param {String} type - Output table type
     @param {Boolean} active - Set to true use values in active list
     @param {Boolean} parse - Set to true to parse response
     @param {String} id - id value used to filter results by job_id or ex_id
     */
    // @ts-ignore
    async function display(header, items, type, active? = false, parse? = false, id?:string) {
        let rows;
        if (type === 'txt') {
            await text(header, items);
        } else if (type === 'txtHorizontal') {
            const opts = {
                head: header,
                chars: {
                    top: '',
                    'top-mid': '',
                    'top-left': '',
                    'top-right': '',
                    bottom: '',
                    'bottom-mid': '',
                    'bottom-left': '',
                    'bottom-right': '',
                    left: '',
                    'left-mid': '',
                    mid: '',
                    'mid-mid': '',
                    right: '',
                    'right-mid': '',
                    middle: ' '.repeat(2)
                },
                style: {
                    'padding-left': 0, 'padding-right': 0, head: ['white'], border: ['white']
                }
            };
            if (parse) {
                rows = await parseResponse(header, items, active, id);
                await horizontal(rows, opts);
            } else {
                await horizontal(items, opts);
            }
        } else if (type === 'prettyHorizontal') {
            const opts = {
                head: header,
                style: { 'padding-left': 0, 'padding-right': 0, head: ['blue'] }
            };
            if (parse) {
                rows = await parseResponse(header, items, active, id);
                await horizontal(rows, opts);
            } else {
                await horizontal(items, opts);
            }
        } else if (type === 'txtVertical') {
            const style = {
                chars: {
                    top: '',
                    'top-mid': '',
                    'top-left': '',
                    'top-right': '',
                    bottom: '',
                    'bottom-mid': '',
                    'bottom-left': '',
                    'bottom-right': '',
                    left: '',
                    'left-mid': '',
                    mid: '',
                    'mid-mid': '',
                    right: '',
                    'right-mid': '',
                    middle: ' '.repeat(3)
                },
                style: {
                    'padding-left': 0, 'padding-right': 0, head: ['white']
                }
            };
            if (parse) {
                rows = await parseResponse(header, items, active, id);
                await vertical(header, rows, style);
            } else {
                await vertical(header, items, style);
            }
        } else if (type === 'prettyVertical') {
            const style = {
                style: { 'padding-left': 0, 'padding-right': 0, head: ['blue'] }
            };
            if (parse) {
                rows = await parseResponse(header, items, active, id);
                await vertical(header, rows, style);
            } else {
                await vertical(header, items, style);
            }
        } else {
            await pretty(header, items);
        }
    }
    // @ts-ignore
    async function showPrompt(action, message = '') {
        const response = await prompts({
            type: 'confirm',
            name: 'continue',
            initial: false,
            style: 'default',
            message: `${_.startCase(action)} ${message}`
        });

        return response.continue;
    }
// @ts-ignore
    async function setAction(action, tense) {
        if (action === 'stop' && tense === 'past') {
            return 'stopped';
        }
        if (action === 'stop' && tense === 'present') {
            return 'stopping';
        }
        if (action === 'start' && tense === 'past') {
            return 'started';
        }
        if (action === 'stop' && tense === 'present') {
            return 'starting';
        }
        if (action === 'pause' && tense === 'past') {
            return 'paused';
        }
        if (action === 'stop' && tense === 'present') {
            return 'pausing';
        }
        if (action === 'restart' && tense === 'past') {
            return 'restarted';
        }
        if (action === 'restart' && tense === 'present') {
            return 'restarting';
        }
        if (action === 'resume' && tense === 'past') {
            return 'resumed';
        }
        if (action === 'resume' && tense === 'present') {
            return 'resuming';
        }

        return action;
    }

    return {
        display,
        parseResponse,
        showPrompt,
        setAction
    };
}
