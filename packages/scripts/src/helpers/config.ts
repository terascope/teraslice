import { address } from 'ip';

export const HOST_IP = address();
export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || `http://${HOST_IP}:49200`;
export const KAFKA_BROKER = process.env.KAFKA_BROKER || `${HOST_IP}:49092`;
