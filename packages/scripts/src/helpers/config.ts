import { address } from 'ip';

export const HOST_IP = address();
export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || `http://${HOST_IP}:9200`;
export const KAFKA_BROKER = process.env.ELASTICSEARCH_HOST || `${HOST_IP}:9092`;
