import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import Axios from 'axios';

import { createLogger } from '../../utils/logger'
import { JwtToken } from '../../auth/JwtToken'

const logger = createLogger('auth')

// Update Auth0 certificate URL
const jwksUrl = 'https://dev-cwp9jszr.us.auth0.com/.well-known/jwks.json';

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

// Implement token verification
async function verifyToken(authHeader: string): Promise<JwtToken> {
  if (!authHeader)
    throw new Error('Authentication header is empty')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Authentication header is invalid')

  const split = authHeader.split(' ')
  const token = split[1];
  let certAlgorithm;
  let certInf: string;
  try {
    const res = await Axios.get(jwksUrl);
    const certKey = res['data']['keys'][0]['x5c'][0];
    certAlgorithm = res['data']['keys'][0]['alg'];
    certInf = `-----BEGIN CERTIFICATE-----\n${certKey}\n-----END CERTIFICATE-----`;
  } catch (err) {
    logger.error('can\'t get certificate from Auth0', err);
  }

  return verify(token, certInf, { algorithms: [certAlgorithm]}) as JwtToken;
}
