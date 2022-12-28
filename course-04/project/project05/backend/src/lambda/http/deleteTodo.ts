import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import 'source-map-support/register'

import { removeAttachment } from '../helpers/attachmentUtil'
import { deleteTodo } from '../businessLogic/todos'
import { getUserId } from '../../auth/utils'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteTodoLogger');

// Implement delete todo Item function
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    logger.info('Deleting todo Item ${todoId}')
    const userId: string = getUserId(event);
    await deleteTodo(userId, todoId);
    await removeAttachment(todoId);
    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors(
      {
        origin: "*",
        credentials: true,
      }
    )
  )
