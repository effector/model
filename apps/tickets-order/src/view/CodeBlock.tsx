import { useUnit } from 'effector-react';
import { Flex } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';

import { passengersList } from '../model/passengers.model';
import { errorsList } from '../model/errors.model';

export const CodeBlock = () => {
  const [errors, passengers] = useUnit([
    errorsList.$items,
    passengersList.$items,
  ]);
  return (
    <Flex direction="row">
      <CodeHighlight
        flex="1"
        code={JSON.stringify(passengers, null, 2)}
        language="json"
      />
      <CodeHighlight
        flex="1"
        code={JSON.stringify(errors, null, 2)}
        language="json"
      />
    </Flex>
  );
};
