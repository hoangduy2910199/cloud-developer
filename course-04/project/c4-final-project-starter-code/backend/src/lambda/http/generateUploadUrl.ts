import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { cors, httpErrorHandler } from 'middy/middlewares';
import * as middy from 'middy';

import { createLogger } from '../../utils/logger';
import { createAttachmentPresignedUrl } from '../helpers/attachmentUtil';

const logger = createLogger('attachmentLogger');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    logger.info('Generating attachment URL for todo Item ${todoId} ', event);
    const attahcmentURL = createAttachmentPresignedUrl(todoId);

    logger.info('Upload url: %s', attahcmentURL);

    return {
      statusCode: 202,
      body: JSON.stringify({
        attahcmentURL
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

