/* eslint-disable camelcase */

const config = require('./config-server.js');
const bodyParser = require('body-parser'),
  express = require('express'),
  oauthshim = require('oauth-shim');
//maker sure you installed oauth-shim,express and body-parser

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.all('/oauthproxy', oauthshim);

// Initiate the shim with Client ID's and secret, e.g.
oauthshim.init([
  {
    // id : secret
    client_id: config.clientId, //Enter your client id
    client_secret: config.secretKey, //Enter yout secret key
    // Define the grant_url where to exchange Authorisation codes for tokens
    grant_url: '',
    // Restrict the callback URL to a delimited list of callback paths
    domain: config.domain
  }
]);
app.listen(3500);
console.log('listening to port 3500');
//Note for beginners, don't forget to run your local sever (cd file location and node servername)
