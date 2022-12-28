import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'

import { updateTodo } from '../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../../auth/utils'
import { createLogger } from '../../utils/logger';
import { cors, httpErrorHandler } from 'middy/middlewares'


const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    logger.info('Updating current todo item ${todoId}', event);
    const userId: string = getUserId(event);
    const todoBody: UpdateTodoRequest = JSON.parse(event.body);

    const updateItem = await updateTodo(userId, todoId, todoBody);

    return {
      statusCode: 200,
      body: JSON.stringify({
        item: updateItem
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(cors(
    {
      origin: "*",
      credentials: true,
    }
  ))
