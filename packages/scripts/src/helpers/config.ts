import { address } from 'ip';

export const LOCAL_IP = address();
export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || `http://${LOCAL_IP}:9200`;
export const KAFKA_BROKER = process.env.ELASTICSEARCH_HOST || `${LOCAL_IP}:9092`;
