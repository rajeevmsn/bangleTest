/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable no-alert */
/* global hello, config, Puck */
/* exported connect disconnect previousData online tokenValue userId sendData getData displayHome guide sendAnnotations*/
/* exported bangleGestureData bangleRawData bangleClockDisplay bangleHRM bangleHRMdisplay bangleProcessedData */

//const { utils } = require('hellojs');

let response;
let bangleArray = [];
let connection;
let sendKey; //to Only send data when connected
let receiveStream = 0;
let receiveAnnotation = 0;

//Writng sensor data when a sudden movement happens (acceleromter and magnetometer for now) in the csv file in bangle local memory
const bangleGestureData =`
event = "ConnectDataGesture";

function gotGesture(d) {
  var gestureData = require("Storage").open(event+".csv", "a");
  //print("date, timestamp, x, y, z, mx, my, mz, mdx, mdy, mdz");
  gestureData.write("Date, number, x, y, z, mx, my, mz, mdx, mdy, mdz\\n");
  
  for (var j=0;j<d.length;j+=3) {
    c= Bangle.getCompass(); //compass
    t = Date.now(); //Gets the number of milliseconds elapsed since 1970 (or on embedded platforms, since startup)
    //print(j +", ", d[j] + ", " + d[j+1] + ", " + d[j+2]+"," + c.x +"," + c.y +"," + c.z +"," + c.dx +"," + c.dy +"," + c.dz );
    gestureData.write(t+ "," + j + ", " + d[j] + ", " + d[j+1] + ", " + d[j+2] +"," + c.x +"," + c.y +"," + c.z +"," + c.dx +"," + c.dy +"," + c.dz +"\\n" );
  }
}
Bangle.setCompassPower(1);
Bangle.on('gesture',gotGesture);
`;
//Writng sensor data (acceleromter and magnetometer for now) in the csv file in bangle local memory
const bangleRawData =`
g.clear();
g.setFont("Vector:30").setFontAlign(0,0);
Bangle.loadWidgets();
Bangle.drawWidgets();
Bangle.setLCDBrightness(0);
event = "connectRawData";
Bangle.setCompassPower(1);

var allData = require("Storage").open(event+".csv", "a");
var mem = require("Storage").getFree();
var flag =1;
Bangle.setHRMPower(1);
var timePast = Date.now();

Bangle.on('HRM-raw', function(hrm) {
  var hrmRaw = [
    "HRM:",
    hrm.raw,
    hrm.filt,
    hrm.bpm,
    hrm.confidence
  ];
  var c = Bangle.getCompass();
  var a = Bangle.getAccel();

  //Data order in the csv
  //timestamp, accelerometer[x,y,z], magentometr [x, y, g, dx, dy, dz], hrm [raw, filter, bpm, confidence]
  var line = [Math.floor(Date.now()),a.x,a.y,a.z,c.x,c.y,c.z,c.dx,c.dy,c.dz,hrm.raw,hrm.filt,hrm.bpm,hrm.confidence].map((o)=>parseInt(o*1000)/1000).join(",")+"\\n";
  mem = mem - line.length;
  if(Date.now()-timePast>100 & flag>0){
    if(mem > 550000){
      //1000000 Bytes = 1 MB (in decimal)
      allData.write(line);
    }
    else {
      var mem = require("Storage").getFree();
      if(mem < 650000){
        g.drawString("MemoryFull",50, 50);
      }
      else
      {
        g.clear();
      }
    }
    timePast = Date.now();}
}); // 10 times a second
`;

const bangleProcessedData = `
var img = require("heatshrink").decompress(atob("slkwhC/AH4A/AH4A/AH4A/AH4A/AH4A/AH4A2iIABF9kBGAQzsGAUikcikIypGAMSmYADmURiDDnGAoABmgymMQIwGAAKYBMUsjGJEzMkkBSY4ADmJkjiMTGJRkBGMYwLZIKWhShiWCGMSUMmcyS0MRkYxMZETGNAANBGOD6hfBr6igIx/GM8ykUiAoQEBkYxmiIABoQxDG4IJCkaV/GCURGKBnBGLgeBGISNBSgaWCkIHCGIRlbSYMxGIInCkUTLoYKBmURAoQzBGLcTEwUf//y/8xGIf/mQJBfII8BGMES//z/8SmUjGIM/A4PxAoIxeoYxCmMvMQMTGIQ6DBoRjiZAL+CGIb0CNIQxjAAYxDAAhuCGLkSGKUxiAxagERmQxRkIxdiQxQiSUbSwT0CGJ0RMThkCiIxQGDpkCGJzFdMggxOSj4xCFQ0TGI4wfSwIqHNYwxiiQxMmKUgZBD4oZBLGnZBEiSgsRMcUBSwsiHAkRSsYxBMgpiEiSWjiIABYpLTBSz5gBF4URLIJiGHYUhGTowDSYIkBS4syBgJjBGTxdFdwMRoYwEiUhHQZpBMTa9FK4USkQDBA4MxGIMxB4RlYQgkziZbBRQYABN4UxAYIxCMgIyWYgSLDkYmCAwVEHoZuCB4MzkTLWMIpTCRQQAIGIwyCMKb1EGITuEAA0hF4INBGIQ6BMiJhFAAIeBBI4/EF4IxFZYIyPgJhBkIjEA4IxLPAQxBDAj9QgIYBmSNEAgKeGMQgnBe4ZCEZR5YDJYMyDwMTmQlBZA4KBiYxBmI2DMohkNEocxkYbBiUTXQJNBS4o7CUQQwCIQoOBSppHDDYQcBdgQ4COQYGBAoMhB4IxGkTJPXoYxEWoYsCAAYJDUoYxDCQhkOKAQcDKAgmDaYIHDJAIxENIJgNS4yADEAT3GdogNCI4RoCGCKXEDYgyKFgIVBfQYYCGCRkCPgKZBmJMBYAiaFBgMBCgMykY5CACiXCQ4R+CMwUSkUiAoQLCb4bETS4wdBJoosCAAYUGHIgyYDiQ6HGSxNZAH4A/AH4A/AH4A/AH4A/AH4A/AH4A/AFIA="));

event = "connectAllData";
Bangle.setCompassPower(1);

var allData = require("Storage").open(event+".csv", "a");
Bangle.setHRMPower(1);

const buffer = {
  start: null,
  end: null,
  data: []
};
const maxSamples = 150;

const computeBufferAverage = () => {
  let sum = [], sum2=[], mean = [], std = [];
  const nrows = maxSamples;
  const ncols = buffer.data[0].length;
  for(let i=0;i<ncols;i++) {
    sum[i] = 0; sum2[i] = 0; mean[i] = 0; std[i] = 0;
  }
  
  for(const data of buffer.data){
  for(let i=0; i<ncols; i++)
  {
    sum[i] += data[i];
    sum2[i] += data[i]*data[i];
  }
  }
  
  for (let i=0; i<ncols; i++) {
    mean[i] = sum[i] / nrows;
    std[i] = Math.sqrt(nrows*sum2[i] - Math.pow(sum[i], 2))/(nrows-1);
  }
  return {mean: mean, std: std};
};

Bangle.on('HRM-raw', function(hrm) {
  var hrmRaw = [
    "HRM:",
    hrm.raw,
    hrm.filt,
    hrm.bpm,
    hrm.confidence
  ];
  var c = Bangle.getCompass();
  var a = Bangle.getAccel();

  //Data order in the csv
  //timestamp, accelerometer[x,y,z], magentometr [x, y, g, dx, dy, dz], hrm [raw, filter, bpm, confidence]

if (buffer.data.length === 0) {
    buffer.start = Math.floor(Date.now());
  }
  
  if (buffer.data.length < maxSamples) {
    buffer.data.push([
      a.x, a.y,a.z,c.x,c.y,c.z,c.dx,c.dy,c.dz,hrm.raw,hrm.filt,hrm.bpm,hrm.confidence
    ]);

  } else {
    buffer.end = Math.floor(Date.now());
    const result = computeBufferAverage(buffer.data);
    
    const str = [
      buffer.start,
      buffer.end,
      result.mean.join(","),
      result.std.join(",")
    ].join(",");
    allData = require("Storage").open(event+".csv", "a");
    allData.write(str);
    allData.write("\\n");
    buffer.data = []; //Empty data
  }
});
g.clear(1);
Bangle.loadWidgets();
Bangle.drawWidgets();
g.drawImage(img, 50,50);
`;

const getBangleData = `
//getting Data
flag =0;
const getBangle = require('Storage').open('connectRawData.csv', 'r');
var array = getBangle.readLine();
g.clear();
g.setFont("Vector:30").setFontAlign(0,0);
g.drawString("Sending",50, 50);
while (array != undefined) {
  Bluetooth.println("<data>\\n"+array+"\\n</data>");
  array = getBangle.readLine();
  g.drawString("Sending",50, 50);
}
//Removing Data
g.clear();
getBangle.erase();
var mem = require("Storage").getFree();
var allData = require("Storage").open("connectRawData.csv", "w");
flag=1;
`;

let messageFlag = false;
//const getsend = () => {
document.getElementById('get-send-delete').addEventListener('click', function() {

  bangleArray =[];
  // if(connection) { //only get bangle data if connected
  //   connection.write(`\x03\x10if(1){${getBangleData}}\n`);
  // }
});

// Get localStorage data if any, or initialize the localStorageObject
let localStorageObject;

const checkLocalStorage = () => {
  if (localStorage.bangle) {
    localStorageObject = JSON.parse(localStorage.bangle);
  } else {
    localStorageObject = {
      stream: [],
      events: []
    };
    localStorage.setItem('bangle', JSON.stringify(localStorageObject));
  }
};


// When we get a line of data from bangle, check it and update it to stream in localStorageObject
let savingDataFlag = false;
const btOnline = (lines) => {
  checkLocalStorage();
  let data = 0;
  for (const line of lines.split('\n')) {
    if (line.match('<data>')) {
      savingDataFlag = true;
      data+=1;
    } else if (line.match('</data>')) {
      savingDataFlag = false;
    } else if (savingDataFlag) {
      const cols = line.split(',');
      if (cols.length === 14) {
        localStorageObject.stream.push(cols.map((val) => Number(val)));
        messageFlag = true;
      }
    }
  }
  localStorage.bangle = JSON.stringify(localStorageObject);

  return data;
};

const connectURL = 'https://connect-project.io';

//if we want to send individual annotations
const sendAnnotations = (subjectiveState) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  //const date = new Date();
  //const currentTime = String(date.toISOString());

  const sendRequest = new XMLHttpRequest();
  sendRequest.open('POST', `${connectURL}/parse/classes/userSubjectivestate`);

  sendRequest.setRequestHeader('content-type', 'application/json');
  sendRequest.setRequestHeader('x-parse-application-id', 'connect');
  sendRequest.setRequestHeader('Authorization', `Bearer ${accessToken}`);

  sendRequest.onreadystatechange = function () {
    if (sendRequest.readyState === 4) {
      console.log(sendRequest.status);
      console.log(sendRequest.responseText);
    }
  };
  const data = {
    sessionId: 'BangleTest'
  };
  data.userEmotion = subjectiveState;

  const jsonData = JSON.stringify(data);
  console.log(data);
  sendRequest.send(jsonData);

};


const sendEvents = async (eventsArray) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;

  const url = `${connectURL}/parse/classes/userAnnotations`;
  const headers = {
    'Content-Type': 'application/json',
    'x-parse-application-id': 'connect',
    'Authorization': `Bearer ${accessToken}`
  };

  const data = {
    sessionId: 'BangleTest'
  };

  const events = eventsArray.map((a) => ({
    timeStamp: a[0],
    userAnnotation: a[1],
    confidence: a[2],
    activity: a[3]
  }));


  if (eventsArray.length > 0) {
    data.events = events;
    const jsonData = JSON.stringify(data);

    try {
      const responseA = await fetch(url, {
        method: 'POST',
        headers,
        body: jsonData
      });

      console.log(responseA.status);
      receiveAnnotation = responseA.status;
      console.log(await responseA.text());
    } catch (error) {
      console.error(error);
    }
  }

  return eventsArray.length;
};

const sendStream = async (stream) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  //const connectURL = 'YOUR_CONNECT_URL'; // Replace with your actual connect URL

  const batchSize = 1000; // Number of lines to send in each batch
  const totalLines = stream.length;
  const batchCount = Math.ceil(totalLines / batchSize);
  let sentCount = 0;

  for (let i = 0; i < batchCount; i++) {
    console.log('batch:'+i);
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalLines);
    const batchStream = stream.slice(start, end);

    const bangleStream = [];
    for (let l = 0; l < batchStream.length; l++) {
      const a = batchStream[l].map(Number);
      bangleStream[l] = {
        bufferStart: a[0],
        // eslint-disable-next-line camelcase, object-property-newline
        ax_M: a[1], ay_M: a[2], az_M: a[3], cx_M: a[4], cy_M: a[5], cz_M: a[6], cdx_M: a[7], cdy_M: a[8], cdz_M: a[9],
        // eslint-disable-next-line camelcase, object-property-newline
        hrmRaw_M: a[10], hrmFilt_M: a[11], hrmBPM_M: a[12], hrmConfidence_M: a[13]
      };
    }

    if (bangleStream.length > 0) {
      const dataBangle = {
        sessionId: 'BangleTest',
        bangle: bangleStream
      };

      const sendRequest = new XMLHttpRequest();
      sendRequest.open('POST', `${connectURL}/parse/classes/bangleStream`);
      sendRequest.setRequestHeader('Content-Type', 'application/json');
      sendRequest.setRequestHeader('X-Parse-Application-Id', 'connect');
      sendRequest.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      sendRequest.onreadystatechange = function () {
        if (sendRequest.readyState === 4) {
          console.log(sendRequest.status);
          //receiveStream = sendRequest.status;
          console.log(sendRequest.responseText);
          console.log(Response.status);
        }
      };

      const jsonData = JSON.stringify(dataBangle);
      sendRequest.send(jsonData);
      sentCount += bangleStream.length;
    }
  }
  console.log('sent:'+sentCount);

  return sentCount;
};


//Sending data from local memory to connect

document.getElementById('get-send-delete').addEventListener('click', async function() {
  if (sendKey > 0) {
    checkLocalStorage();
    const { events } = localStorageObject;
    const { stream } = localStorageObject;

    const aPromise = sendEvents(events);
    const sPromise = sendStream(stream);

    const [a, s] = await Promise.all([aPromise, sPromise]);

    if (a > 0 && s > 0) {
      alert('Thank you! ' + s + ' rows of watch data & ' + a + ' annotations are sent to the connect server');
      localStorage.clear();
      checkLocalStorage();
      receiveStream = 0;
    } else if (a > 0 && s === 0) {
      alert('Thank you ' + a + ' rows of annotations sent to the connect server');
      localStorage.clear();
      checkLocalStorage();
      receiveAnnotation = 0;
    } else if (a === 0 && s > 0) {
      alert('Thank you ' + s + ' rows of watch data are sent to the connect server');
      localStorage.clear();
      checkLocalStorage();
      receiveStream = 0;
    } else {
      alert('Sorry! Please try again');
    }
  } else {
    alert('Please log in to send data');
  }
});


const annotate = (subjectiveState) => {
  checkLocalStorage();
  const annotateArray = [Date.now(), subjectiveState];
  localStorageObject.events.push(annotateArray);
  localStorage.bangle = JSON.stringify(localStorageObject);
  alert('annotation recorded');
};

document.getElementById('calm').addEventListener('click', function() {
  annotate('calm');
});

// document.getElementById('angry').addEventListener('click', function() {
//   annotate('angry');
// });

document.getElementById('stress').addEventListener('click', function() {
  annotate('stressed');
});

// document.getElementById('happy').addEventListener('click', function() {
//   annotate('happy');
// });

const displayHome = () => {
  document.querySelector('#message').classList.remove('guide');
  document.querySelector('#message').classList.add('home');
};

// const guide = () => {
//   document.querySelector('#message').classList.remove('home');
//   document.querySelector('#message').classList.add('guide');
// };

const displayConnected = () => {
  document.querySelector('#home').classList.add('connected');
  //document.querySelector('.avatar').classList.add('connected');
};

const displayDisconnected = () => {
  //document.querySelector('#message').classList.remove('connected');
  //document.querySelector('.avatar').classList.remove('connected');
};

const previousData = () => {
  document.querySelector('#home').classList.remove('sendPreviousData');
  document.querySelector('#home').classList.add('enterPreviousData');
};

const oldannotate = (subjectiveState) => {
  checkLocalStorage();
  //const annotateArray = [Date.parse(subjectiveState[1]), subjectiveState[0]];
  const annotateArray = [subjectiveState[0], subjectiveState[1], subjectiveState[2], subjectiveState[3]];
  localStorageObject.events.push(annotateArray);
  console.log(annotateArray);
  localStorage.bangle = JSON.stringify(localStorageObject);
  alert('old annotation recorded');
};

document.querySelector('.oldData form').addEventListener('submit', function(event) {
  event.preventDefault(); // prevent the form from being submitted normally

  const subjectiveState = document.querySelector('input[name="subjectiveState"]:checked').value;
  let activity = document.getElementById('activity').value;
  const activitySliderValue = Number(document.getElementById('activitySlider').value);

  const stateTime = Date.parse(document.getElementById('stateTime').value);

  // If no text is entered in the activity field, set it to "default"
  if (!activity) {
    activity = 'default';
  }
  const output = [stateTime, subjectiveState, activitySliderValue, activity];
  oldannotate(output);
  event.preventDefault();
  document.querySelector('#home').classList.remove('enterPreviousData');
  document.querySelector('#home').classList.add('sendPreviousData');
});

const connect = () => {
  hello('connect').login()
    .then((res) => {
      response = res;
      sendKey = 1;
      console.log(response);
      displayConnected();
    });
};

const disconnect = () => {
  hello('connect').logout()
    .then(() => {
      location.href = './index.html';
      sendKey = 0;
    }, (err) => {
      console.log(err);
      alert('You did not sign in :-)');
    });
};

const online = (session) => {
  const currentTime = (new Date()).getTime() / 1000;

  return session && session.access_token && session.expires > currentTime;
};


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

const sendData = (sessionStatus) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  const date = new Date();
  const currentTime = String(date.toISOString());

  const status = sessionStatus;

  const sendRequest = new XMLHttpRequest();
  sendRequest.open('POST', `${connectURL}/parse/classes/sessionTimestamp`);

  sendRequest.setRequestHeader('content-type', 'application/json');
  sendRequest.setRequestHeader('x-parse-application-id', 'connect');
  sendRequest.setRequestHeader('Authorization', `Bearer ${accessToken}`);

  sendRequest.onreadystatechange = function () {
    if (sendRequest.readyState === 4) {
      console.log(sendRequest.status);
      console.log(sendRequest.responseText);
    }
  };
  const data = {
    sessionId: 'BangleTest'
  };
  data[status]= currentTime;


  const jsonData = JSON.stringify(data);
  console.log(data);
  sendRequest.send(jsonData);
};

// When we click the bangle connect button...
document.getElementById('btConnect').addEventListener('click', function() {
  console.log('bt connect');
  // disconnect if connected already
  if (connection) {
    connection.close();
    document.querySelector('#bt').classList.add('btdisconnected');
    sendData('sessionEnd');
    connection = null;
  }
  // Connect
  Puck.connect(function(c) {
    if (!c) {
      alert('Couldn\'t connect!');
      document.querySelector('#bt').classList.add('btdisconnected');

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
        const ts=Date.now()/1000;
        connection.write('\x03\x10if(1){setTime('+ts+');}\n');
        //connection.write('\x03\x10if(1){'+bangleHRM+bangleGestureData+'}\n',
        connection.write('\x03\x10if(1){'+bangleRawData+'}\n',
          function() {
            document.querySelector('#bt').classList.add('btconnected');
            alert('watch connected');
          });
      }, 1500);
    });
  });
});

document.getElementById('getWatchConnect').addEventListener('click', function() {
  if (connection) {
    console.log('geting stream from watch');
    bangleArray =[];
    connection.write(`\x03\x10if(1){${getBangleData}}\n`);
    if(messageFlag) {
      alert('received watch data');
      messageFlag =false;
    }
  } else {
    document.querySelector('#bt').classList.add('btdisconnected');
  }

});

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
        label.innerHTML = (r.thumbnail ? '<img src="' + r.thumbnail + ' /> ' : '')
        + 'Hey ' + (r.name || r.id);
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

