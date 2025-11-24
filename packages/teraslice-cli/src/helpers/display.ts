/* eslint-disable no-console */

import ttyTable from 'tty-table';
import CliTable from 'cli-table3';
import easyTable from 'easy-table';
import prompts from 'prompts';
import { toTitleCase } from '@terascope/core-utils';
import { Action, Tense, UpdateActions } from '../interfaces.js';

function pretty(headerValues: string[], rows: string[]) {
    const header = headerValues.map((item): ttyTable.Header => ({
        value: String(item),
        width: 'auto',
        paddingTop: 0,
        paddingBottom: 0,
        align: 'left',
        formatter() {
            return String(item);
        },
    }));

    const table = ttyTable(header, rows, {
        borderStyle: 'solid',
        defaultValue: '',
    });

    console.log(table.render());
}

function horizontal(
    rows: CliTable.HorizontalTableRow[], opts: CliTable.TableConstructorOptions
) {
    const table = new CliTable(opts);

    rows.forEach((item: any) => {
        table.push(item);
    });

    console.log(table.toString());
}

function vertical(
    header: string, rows: CliTable.VerticalTableRow[], opts: CliTable.TableConstructorOptions
) {
    rows.forEach((keys: any) => {
        const table = new CliTable(opts);

        console.log(`\n${header} -> ${keys[header]}`);
        Object.entries(keys).forEach(([key, value]) => {
            const val: any = {};
            val[key] = value;
            table.push(val);
        });
        console.log(table.toString());
    });
}

async function text(headerValues: string[], items: Record<string, string>[]) {
    const rows: any[] = [];
    items.forEach((item) => {
        const row: Record<string, any> = {};
        headerValues.forEach((headerValue: any) => {
            row[headerValue] = item[headerValue];
        });
        rows.push(row);
    });

    console.log(easyTable.print(rows));
}

export default class Display {
    /**
     * Parses the teraslice client endpoint responses into an array used to generate
     * tables in command line output.
     *
     * @param header - Header values to include in output
     * @param response - Teraslice client response object
     * @param active - When set to true parse values in active list
     * @param id - id value used to filter results by job_id or ex_id
     * @returns Table content is an array of arrays with
     *                       each row an element in the array.
    */
    parseResponse(
        header: any[],
        response: Record<string, any>,
        active?: boolean,
        id?: string
    ): any[] {
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
                    } else if (item === 'error') {
                        // remove the stack trace from the error
                        row.push(response[key][item].split('\n')[0]);
                    } else {
                        row.push(response[key][item]);
                    }
                });
                rows.push(row);
            }
        });
        return rows;
    }

    /**
     * Display teraslice responses in a table
     *
     @param header - Header values to include in output
     @param items - Teraslice client response object
     @param type - Output table type
     @param active - Set to true use values in active list
     @param parse - Set to true to parse response
     @param id - id value used to filter results by job_id or ex_id
     */
    async display(

        header: any,
        items: any[] | any,
        type: string,
        active?: boolean,
        parse?: boolean,
        id?: string
    ): Promise<void> {
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
                    middle: ''
                },
                style: {
                    'padding-left': 1, 'padding-right': 1, head: ['white'], border: ['white']
                }
            };
            if (parse) {
                rows = this.parseResponse(header, items, active, id);
                horizontal(rows, opts);
            } else {
                horizontal(items, opts);
            }
        } else if (type === 'prettyHorizontal') {
            const opts = {
                head: header,
                style: { 'padding-left': 1, 'padding-right': 1, head: ['yellow'] }
            };
            if (parse) {
                rows = this.parseResponse(header, items, active, id);
                horizontal(rows, opts);
            } else {
                horizontal(items, opts);
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
                rows = this.parseResponse(header, items, active, id);
                vertical(header, rows, style);
            } else {
                vertical(header, items, style);
            }
        } else if (type === 'prettyVertical') {
            const style = {
                style: { 'padding-left': 0, 'padding-right': 0, head: ['blue'] }
            };
            if (parse) {
                rows = this.parseResponse(header, items, active, id);
                vertical(header, rows, style);
            } else {
                vertical(header, items, style);
            }
        } else {
            pretty(header, items);
        }
    }

    async showPrompt(action: string, message = ''): Promise<boolean> {
        const response = await prompts({
            type: 'confirm',
            name: 'continue',
            initial: false,
            style: 'default',
            message: `${toTitleCase(action)} ${message}`
        });

        return response.continue;
    }

    setAction(action: Action, tense: Tense): UpdateActions {
        if (action === 'stop' && tense === 'past') {
            return 'stopped';
        }
        if (action === 'stop' && tense === 'present') {
            return 'stopping';
        }
        if (action === 'start' && tense === 'past') {
            return 'started';
        }
        if (action === 'start' && tense === 'present') {
            return 'starting';
        }
        if (action === 'pause' && tense === 'past') {
            return 'paused';
        }
        if (action === 'pause' && tense === 'present') {
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
        throw new Error('Invalid action or tense');
    }
}
