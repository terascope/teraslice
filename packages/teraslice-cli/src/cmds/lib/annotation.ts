import got from 'got';
import { parseError } from '@terascope/utils';
import Reply from './reply';

const reply = new Reply();
// @ts-ignore
async function send(host, key, tags, text) {
    const timestamp = +new Date();
    const url = `http://${host}/api/annotations`;
    const payload = {
        time: timestamp,
        type: 'event',
        tags,
        text
    };
    try {
        const response = await got.post<{ message: string }>(url, {
            headers: {
                Authorization: `Bearer ${key}`
            },
            responseType: 'json',
            json: payload,
        });
        if (response.body.message === 'Annotation added') {
            reply.green(`> Annotation: "${text}" Added`);
        }
    } catch (err) {
        reply.fatal(`> Annotation failed: ${parseError(err)}`);
    }
}
// @ts-ignore
export default async function annotate(cliConfig) {
    // @ts-ignore
    async function add(action, job = '') {
        let message = '';
        if (job === '') {
            message = `${action}ed all jobs on ${cliConfig.cluster}`;
        } else {
            message = `${action}ed ${job} on ${cliConfig.cluster}`;
        }
        await send(
            cliConfig.config.annotations[cliConfig.annotation_env].host,
            cliConfig.config.annotations[cliConfig.annotation_env].key,
            ['global', 'teraslice'],
            message
        );
    }
    return {
        add
    };
}
