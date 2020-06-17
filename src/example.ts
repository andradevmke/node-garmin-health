require("dotenv").config();

import http from "http";
import express, { Request, Response } from "express";
import { RequestOptions, Token } from "oauth-1.0a";
import axios, { AxiosRequestConfig } from "axios";
import { getHeaders, parseRequestToken } from "./index";

const app = express();

const PORT = process.env.PORT;

const GARMIN_REQUEST_TOKEN_URL = process.env.GARMIN_REQUEST_TOKEN_URL || "";
const GARMIN_ACCESS_TOKEN_URL = process.env.GARMIN_ACCESS_TOKEN_URL || "";
const GARMIN_CONFIRMATION_URL = process.env.GARMIN_CONFIRMATION_URL || "";
const GARMIN_USERID_REQUEST_URL = process.env.GARMIN_USERID_REQUEST_URL || "";
const CALLBACK = `http://localhost:${PORT}/`;

let anonymousRequestToken: Token; // DONT DO THIS IN A REAL IMPLEMENTATION. Store to DB, session specific cache, or other

// Oauth process is kicked off by hitting the redirect endpoint
// 1. Acquire anonymous request token
// 2. Use RequestToken to create Oauth Url for Garmin

// User is redirected to the URL and once confirmed will be redirected to callback url
// which is set to localhost:PORT/

app.get("/redirect", async (req: Request, res: Response) => {
  const oauthRequestOptions: RequestOptions = {
    url: GARMIN_REQUEST_TOKEN_URL,
    method: "POST",
  };

  const requestConfig: AxiosRequestConfig = {
    headers: getHeaders(oauthRequestOptions),
  };

  try {
    const requestTokenResponse = await axios.post<string>(
      GARMIN_REQUEST_TOKEN_URL,
      null,
      requestConfig
    );

    anonymousRequestToken = parseRequestToken(requestTokenResponse.data);

    const confirmationUrl = `${GARMIN_CONFIRMATION_URL}?oauth_token=${anonymousRequestToken.key}&oauth_callback=${CALLBACK}`;
    res.redirect(confirmationUrl);
  } catch (error) {
    res.json(error);
  }
});

// Completion of Oauth process by taking incoming verifier and token
// and sending request to AccessToken endpoint.

app.get("/", async (req: Request, res: Response) => {
  const { oauth_token, oauth_verifier } = req.query;

  const accessTokenOauthRequestOptions: RequestOptions = {
    url: GARMIN_ACCESS_TOKEN_URL,
    method: "POST",
    data: {
      oauth_verifier,
    },
  };

  const accessTokenRequestConfig: AxiosRequestConfig = {
    headers: getHeaders(accessTokenOauthRequestOptions, {
      key: oauth_token,
      secret: anonymousRequestToken.secret,
    }),
  };

  try {
    // The Token pair we receive from this request we want to save in a db securely
    const accessTokenResponse = await axios.post<string>(
      GARMIN_ACCESS_TOKEN_URL,
      null,
      accessTokenRequestConfig
    );

    const userToken = parseRequestToken(accessTokenResponse.data);

    // Now that you have a token for the user let's get their UserId to pair with the user's token data.
    interface User {
      userId: string;
      token?: Token;
    }

    const userOAuthRequestOptions = {
      url: GARMIN_USERID_REQUEST_URL,
      method: "GET",
    };

    const userRequestConfig: AxiosRequestConfig = {
      headers: getHeaders(
        userOAuthRequestOptions,
        userToken
      ),
    };

    const userIdResponse = await axios.get<User>(
      GARMIN_USERID_REQUEST_URL,
      userRequestConfig
    );

    // We'll package it all up to show that it works
    const user = userIdResponse.data
    user.token = userToken;

    res.json(user); // Please don't return the token in a deployed app.
  } catch (error) {
    res.json(error);
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
