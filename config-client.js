/* eslint-disable camelcase */
// eslint-disable-next-line no-unused-vars
const config = {
  connectOAuth: {
    name: 'connect',
    oauth: {
      version: 2,
      auth: 'https://connect-project.io/authorize',
      grant: 'https://connect-project.io/oauth/token',
      response_type: 'token'
      // the response_type in the connect configuration must be set to 'token' instead of 'code'
    },
    base: 'https://connect-project.io/',
    get: { me: 'profile' }
  },
  clientId: 'pub_4d4a2d500c784f4098215d25263736d0', //connectApp
  //clientId: 'pub_7c86d46ef00845449f1af4b71f659148', //Test19/01
  oauthProxy: 'http://localhost:3500/oauthproxy',
  redirectURI: 'redirect.html'
};
