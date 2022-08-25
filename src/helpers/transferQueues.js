import { Manager } from '@twilio/flex-ui';

import { utils } from '../helpers';

const manager = Manager.getInstance();

const generateStaticQueueFilterExpression = () => {
  const hiddenTransferQueues = manager.serviceConfiguration.ui_attributes?.internalTransferAddonsPlugin?.hiddenTransferQueues;

  let expression = "";

  if (!Array.isArray(hiddenTransferQueues) || hiddenTransferQueues.length === 0) {
    expression = "";
  } else if (hiddenTransferQueues.length <= 29) {
    expression = `data.queue_name NOT_IN ${JSON.stringify(hiddenTransferQueues)}`;
  } else {
    const maxExpressionArraySize = 29;
    const hiddenQueueChunks = utils.sliceArrayIntoChunks(hiddenTransferQueues, maxExpressionArraySize);

    for (let i = 0; i < hiddenQueueChunks.length; i++) {
      const chunk = hiddenQueueChunks[i];
      expression += `data.queue_name NOT_IN ${JSON.stringify(chunk)}`;

      if (i + 1 < hiddenQueueChunks.length) {
        expression += ' AND ';
      }
    }
  }

  return expression;
}

export const getQueueFilterExpression = () => {
  const staticQueueFilterExpression = generateStaticQueueFilterExpression();

  // Setting to an empty string if the status queue filter expression is null
  // in case other filter expressions need to be appended in the future
  let finalQueueFilterExpression = staticQueueFilterExpression
    ? `(${staticQueueFilterExpression})`
    : ''

  return finalQueueFilterExpression;
}
