import * as middy from 'middy';
import 'source-map-support/register';
import { createTodo } from '../businessLogic/todos';
import { cors, httpErrorHandler } from 'middy/middlewares';
import { getUserId } from '../../auth/utils'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


const logger = createLogger('TodoLogger');

// Implement add todo function
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newItem: CreateTodoRequest = JSON.parse(event.body);
    const userId: string = getUserId(event);
    logger.info('Adding new todo item');
    
    const todo = await createTodo(newItem, userId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: todo
      })
    }
  });

handler
  .use(httpErrorHandler())
  .use(
    cors({
      origin: "*",
      credentials: true
    })
  )
