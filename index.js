/* eslint-disable no-alert */
/* global hello, config */
/* exported connect disconnect online tokenValue sendData getData */

let response;

// Code to upload to Bangle.js check https://banglejs.com/reference#t_l_Bangle_accel
const BANGLE_CODE = `
Bangle.on('accel',function(a) {
  var d = [
    "A",
    Math.round(a.x*100),
    Math.round(a.y*100),
    Math.round(a.z*100),
    Math.round(a.diff*100),
    Math.round(a.mag*100)
    ];
  Bluetooth.println(d.join(","));
})
`;

// When we click the bangle connect button...
var connection;
document.getElementById('btConnect').addEventListener('click', function() {
  // disconnect if connected already
  if (connection) {
    connection.close();
    connection = undefined;
  }
  // Connect
  Puck.connect(function(c) {
    if (!c) {
      alert('Couldn\'t connect!');

      return;
    }
    connection = c;
    // Handle the data we get back, and call 'onLine'
    // whenever we get a line
    let buf = '';
    connection.on('data', function(d) {
      buf += d;
      const l = buf.split('\n');
      buf = l.pop();
      l.forEach(btOnline);
    });
    // First, reset the Bangle
    connection.write('reset();\n', function() {
      // Wait for it to reset itself
      setTimeout(function() {
        // Now upload our code to it
        connection.write('\x03\x10if(1){'+BANGLE_CODE+'}\n',
          function() { console.log('Ready...'); });
      }, 1500);
    });
  });
});

// When we get a line of data, check it and if it's
// from the accelerometer, update it
const btOnline = (line) => {
  console.log('RECEIVED:'+line);
  const d = line.split(',');
  if (d.length==4 && d[0]=='A') {
    // we have an accelerometer reading
    const accel = {
      x : parseInt(d[1]),
      y : parseInt(d[2]),
      z : parseInt(d[3])
    };
    // Update bar positions
    setBarPos('barX', accel.x);
    setBarPos('barY', accel.y);
    setBarPos('barZ', accel.z);
  }
};

// Set the position of each bar
const setBarPos =(id, d) => {
  const s = document.getElementById(id).style;
  if (d>175) { d=175; }
  if (d<-175) { d=-175; }
  if (d>=0) {
    s.left='175px';
    s.width=d+'px';
  } else { // less than 0
    s.left=(175+d)+'px';
    s.width=(-d)+'px';
  }
};


const displayConnected = () => {
  document.querySelector('#message').classList.add('connected');
  document.querySelector('.avatar').classList.add('connected');
};

const displayDisconnected = () => {
  document.querySelector('.avatar').classList.remove('connected');
};

const connect = () => {
  hello('connect').login()
    .then((res) => {
      response = res;
      console.log(response);
      displayConnected();
    });
};

const disconnect = () => {
  hello('connect').logout()
    .then(() => {
      location.href = '/';
    }, (err) => {
      console.log(err);
      alert('You did not sign in :-)');
    });
};

const online = (session) => {
  const currentTime = (new Date()).getTime() / 1000;

  return session && session.access_token && session.expires > currentTime;
};

const connectURL = 'https://connect-project.io';


const userId = (accessToken) => {

  const testGet = new XMLHttpRequest();
  testGet.open('GET', `${connectURL}/oauth/user`);
  testGet.setRequestHeader('Authorization', `Bearer ${accessToken}`);
  testGet.onreadystatechange = function () {
    if (testGet.readyState === 4) {
      console.log(testGet.status);
      console.log(testGet.responseText);
    }
  };
  testGet.send();
};

const sendData = () => {
  //const timeStamp = new Date();
  //alert(timeStamp);
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  //sendScore(accessToken);
  //const objectId = userId(accessToken);

  const sendScore = new XMLHttpRequest();
  sendScore.open('POST', `${connectURL}/parse/classes/GameScore`);

  sendScore.setRequestHeader('content-type', 'application/json');
  sendScore.setRequestHeader('x-parse-application-id', 'connect');
  sendScore.setRequestHeader('Authorization', `Bearer ${accessToken}`);

  sendScore.onreadystatechange = function () {
    if (sendScore.readyState === 4) {
      console.log(sendScore.status);
      console.log(sendScore.responseText);
    }
  };
  const data = `{
    "score":1024,
    "playerName":"rayito",
    "cheatMode":false
  }`;
  sendScore.send(data);
};

const initHello = () => {
  // configure Connect network
  hello.init({ connect: config.connectOAuth });

  // listen to login changes
  hello.on('auth.login', (auth) => {
    hello(auth.network).api('me')
      .then(function (r) {
        console.log('response:', r);
        let label = document.getElementById('profile_' + auth.network);
        if (!label) {
          label = document.createElement('div');
          label.id = 'profile_' + auth.network;
          document.getElementById('profile').appendChild(label);
        }
        label.innerHTML = '<img src="' + r.thumbnail + '" /> Hey ' + r.name;
      });
  });

  // configure client
  hello.init({
    connect: config.clientId
  }, {
    /* eslint-disable camelcase */
    oauth_proxy: config.oauthProxy,
    redirect_uri: config.redirectURI
    /* eslint-enable camelcase */
  });
};

const init = () => {
  initHello();

  const connectToken = hello('connect').getAuthResponse();

  const isConnected = online(connectToken);

  if (isConnected) {
    displayConnected();
  } else {
    displayDisconnected();
  }
};

init();

