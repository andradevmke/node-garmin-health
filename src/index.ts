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

export const getHeaders = ( request: RequestOptions, token?: Token) => {
  const oauthInstance = getOauthInstance();
  const authorization = oauthInstance.authorize(request, token);
  return oauthInstance.toHeader(authorization)
}
