/* eslint-disable no-console */

// @ts-ignore
import ttyTable from 'tty-table';
// @ts-ignore
import CliTable from 'cli-table3';
import easyTable from 'easy-table';
import prompts from 'prompts';
import { toTitleCase } from '@terascope/utils';

async function pretty(headerValues: any, rows: any) {
    const header: any[] = [];
    headerValues.forEach((item: any) => {
        const col: any = [];
        col.value = item;
        header.push(col);
    });

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

async function horizontal(rows: any, opts: any) {
    const table = new CliTable(opts);

    rows.forEach((item: any) => {
        table.push(item);
    });

    console.log(await table.toString());
}

async function vertical(header: any, rows: any, style: any) {
    rows.forEach((keys: any) => {
        const table = new CliTable(style);

        console.log(`\n${header} -> ${keys[header]}`);
        Object.entries(keys).forEach(([key, value]) => {
            const val: any = {};
            val[key] = value;
            table.push(val);
        });
        console.log(table.toString());
    });
}

async function text(headerValues: any, items: any) {
    const rows: any[] = [];
    items.forEach((item: any) => {
        const row = {};
        headerValues.forEach((headerValue: any) => {
            row[headerValue] = item[headerValue];
        });
        rows.push(row);
    });

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
async function parseResponse(header: any, response: any, active = false, id?: string) {
    const rows: any[] = [];
    Object.entries(response).forEach(([key, value]: [string, any]) => {
        let row: any[] = [];
        if (active) {
            value.active.forEach((activeValue: any) => {
                row = [];
                // filter by id
                if (id === undefined || activeValue.job_id === id || activeValue.ex_id === id) {
                    header.forEach((item: any) => {
                        if (item === 'teraslice_version') {
                            row.push(value.teraslice_version);
                        } else if (item === 'node_id') {
                            row.push(value.node_id);
                        } else if (item === 'hostname') {
                            row.push(value.hostname);
                        } else if (item === 'node_version') {
                            row.push(value.node_version);
                        } else {
                            row.push(activeValue[item]);
                        }
                    });
                    rows.push(row);
                }
            });
        } else {
            header.forEach((item: any) => {
                if (item === 'active') {
                    row.push(response[key][item].length);
                } else {
                    row.push(response[key][item]);
                }
            });
            rows.push(row);
        }
    });
    return rows;
}

export default function displayModule() {
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
    async function display(
        header: any,
        items: any,
        type: any,
        active = false,
        parse = false,
        id?: string
    ) {
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

    async function showPrompt(action: string, message = '') {
        const response = await prompts({
            type: 'confirm',
            name: 'continue',
            initial: false,
            style: 'default',
            message: `${toTitleCase(action)} ${message}`
        });

        return response.continue;
    }

    async function setAction(action: string, tense: string) {
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
