
import yargs from 'yargs';

// export interface CMD {
//     command: string;
//     desc: string;
//     exclude?: string;
//     builder: Builder;
//     handler: Handler;
// }
// TODO: desc => describe ??
export type CMD = yargs.CommandModule;
