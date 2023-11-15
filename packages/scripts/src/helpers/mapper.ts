export function kafkaVersionMapper(kafkaVersion: string): string {
    const kafkaMapper = {
        3: {
            0: '7.0.11',
            1: '7.1.9',
            2: '7.2.7',
            3: '7.3.5',
            4: '7.4.2',
            5: '7.5.1'
        },
        2: {
            4: '5.4.10',
            5: '5.5.12',
            6: '6.0.15',
            7: '6.1.13',
            8: '6.2.12'
        }
    };

    const cpKafkaVersion = kafkaMapper[kafkaVersion.charAt(0)][kafkaVersion.charAt(2)];
    if (!cpKafkaVersion) {
        throw new Error('Kafka version could not be mapped to cp-kafka version');
    }
    return cpKafkaVersion;
}
