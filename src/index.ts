/**
 * Aside from some helper functions in here this is just a typescript refactor of the 
 * examples provided by the oauth-1.0a library. See that package page for more detals.
 * 
 * https://www.npmjs.com/package/oauth-1.0a
 */

import Oauth, { RequestOptions, Options, Token} from "oauth-1.0a";
import { createHmac } from "crypto";

const options: Options = {
  consumer: {
    key: process.env.CONSUMER_KEY as string,
    secret: process.env.CONSUMER_SECRET as string,
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return createHmac("sha1", key).update(base_string).digest("base64");
  },
};

const getOauthInstance = () => {
  const oauth = new Oauth(options);
  return oauth;
};

export const parseRequestToken = (requestTokenResponse: string) : Token => {
  const kvp = requestTokenResponse.split('&');
  return {
    key: kvp[0].split('=')[1],
    secret: kvp[1].split('=')[1]
  }
}


/**
 * #getHeaders
 * 
 * @param request 
 * @param token 
 * 
 * Note: by providing a token the secret will be appended to the 
 * Consumer Secret per Oauth1 specification as follows:
 * ConsumerSecret&TokenSecret
 * 
 * The Token key will be added to the signature as a parameter
 * 
 * If adding oauth_verifier, add it to the RequestOptions.data property
 * example RequestOptions.data.oauth_verifier = 'from oauthConfirm callback'
 */
export const getHeaders = ( request: RequestOptions, token?: Token) => {
  const oauthInstance = getOauthInstance();
  const authorization = oauthInstance.authorize(request, token);
  return oauthInstance.toHeader(authorization)
}
