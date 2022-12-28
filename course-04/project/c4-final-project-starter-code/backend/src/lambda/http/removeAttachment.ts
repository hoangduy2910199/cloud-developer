import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { removeS3Attachment } from '../dataLayer/attachment'
import 'source-map-support/register'
import { removeTodoAttachment } from '../businessLogic/todos'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../helpers/auth'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const payload = JSON.parse(event.body)
    // get todo ID and s3 key from front end.
    const { todoId, s3Key } = payload;
    const userId: string = getUserId(event);
    // Remove attachment in S3
    await removeS3Attachment(s3Key);
    // remove attachment url in dynamo DB
    await removeTodoAttachment(userId, todoId);

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
