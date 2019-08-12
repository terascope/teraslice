import { useMutation } from 'react-apollo';
import { ModelName } from '@terascope/data-access';
import { getModelConfig } from '../config';
import { SubmitVars } from './interfaces';

type Props = {
    id?: string;
    modelName: ModelName;
};

export function useFormMutation<T>({ modelName, id }: Props) {
    const config = getModelConfig(modelName);
    const update = Boolean(id);
    const refetchQueries: any[] = [{ query: config.listQuery }];

    if (update) {
        refetchQueries.push({ query: config.updateQuery, variables: { id } });
    }

    const MUTATION = update ? config.updateMutation : config.createMutation;
    const [action, result] = useMutation<{ result: Response }, SubmitVars<T>>(MUTATION, {
        refetchQueries,
    });

    const queryResult: any = result;
    const data = result && result.data && result.data.result;

    if (data) {
        queryResult.data = data;
    }

    return [action, queryResult];
}
