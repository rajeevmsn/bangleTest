/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable no-alert */
/* global hello, config, Puck */
/* exported connect disconnect previousData online tokenValue userId sendData getData displayHome guide sendAnnotations*/
/* exported bangleGestureData bangleRawData bangleClockDisplay bangleHRM bangleHRMdisplay */

//const { utils } = require('hellojs');

let response;
let bangleArray = [];
let connection;

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
Bangle.loadWidgets();
Bangle.drawWidgets();
//Bangle.setLCDBrightness(0);
event = "connectRawData";
Bangle.setCompassPower(1);

var allData = require("Storage").open(event+".csv", "a");
Bangle.setHRMPower(1);

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
  allData.write(Math.floor(Date.now()),a.x, a.y,a.z,c.x,c.y,c.z,c.dx,c.dy,c.dz,hrm.raw,hrm.filt,hrm.bpm,hrm.confidence);
  //allData.write([Math.floor(Date.now()),a.x, a.y,a.z,c.x,c.y,c.z,c.dx,c.dy,c.dz,hrm.raw,hrm.filt,hrm.bpm,hrm.confidence].map((o)=>parseInt(o*1000)/1000).join(","));
  allData.write("\\n");
}, 1000); // every 1 second
`;
const bangleClockDisplay = `
// Load fonts
require("Font7x11Numeric7Seg").add(Graphics);
// position on screen
const X = 130, Y = 110;

function draw() {
  // work out how to display the current time
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var time = (" "+h).substr(-2) + ":" + ("0"+m).substr(-2);
  // Reset the state of the graphics library
  g.reset();
  // draw the current time (4x size 7 segment)
  g.setFont("7x11Numeric7Seg",4);
  g.setFontAlign(1,1); // align right bottom
  g.drawString(time, X, Y, true /*clear background*/);
  // draw the seconds (2x size 7 segment)
  g.setFont("7x11Numeric7Seg",2);
  g.drawString(("0"+d.getSeconds()).substr(-2), X+30, Y, true /*clear background*/);
  // draw the date, in a normal font
  g.setFont("6x8");
  g.setFontAlign(0,1); // align center bottom
  // pad the date - this clears the background if the date were to change length
  var dateStr = "    "+require("locale").date(d)+"    ";
  g.drawString(dateStr, g.getWidth()/2, Y+15, true /*clear background*/);
}

// Clear the screen once, at startup
g.clear();
// draw immediately at first
draw();
var secondInterval = setInterval(draw, 1000);
// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (secondInterval) clearInterval(secondInterval);
  secondInterval = undefined;
  if (on) {
    Bangle.setLCDBrightness(0);
    secondInterval = setInterval(draw, 1000);
    draw(); // draw immediately
  }
});
// Show launcher when middle button pressed
//Bangle.setUI("clock");
// Load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();
`;

//to obtain HRM from Bangle.js check https://banglejs.com/reference#l_Bangle_HRM-raw
const bangleHRM = `
Bangle.setHRMPower(1)
Bangle.on('HRM-raw', function(hrm){
  var hrmRaw = [
    "HRM:",
    hrm.raw,
    hrm.filt,
    hrm.bpm,
    hrm.confidence
  ];
  Bluetooth.println(hrmRaw.join(","));
})
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
const getBangle = require('Storage').read('connectAllData.csv\\1');
//Sending Data
Bluetooth.println("<data>\\n"+getBangle+"\\n</data>");
//Removing Data
require("Storage").erase('connectAllData.csv\\1');

//var array = getBangle.split("\\n");
//Bluetooth.println(array);
`;

//for HRM display on bangle screen
//Shamelessly copied from https://forum.espruino.com/conversations/367186/
const bangleHRMdisplay = `

Bangle.setLCDPower(1);
Bangle.setLCDTimeout(0);
Bangle.setHRMPower(1);
var hrmInfo, hrmOffset = 0;
var hrmInterval;
var btm = g.getHeight()-1;
        
function onHRM(h) {
  if (counter!==undefined) {
    // the first time we're called remove
    // the countdown
    counter = undefined;
    g.clear();
  }
  hrmInfo = h;
  /* On 2v09 and earlier firmwares the only solution for realtime
  HRM was to look at the 'raw' array that got reported. If you timed
  it right you could grab the data pretty much as soon as it was written.
  In new firmwares, '.raw' is not available. */
  if (hrmInterval) clearInterval(hrmInterval);
  hrmInterval = undefined;
  if (hrmInfo.raw) {
    hrmOffset = 0;
    setTimeout(function() {
      hrmInterval = setInterval(readHRM,41);
    }, 40);
  }
        
  var px = g.getWidth()/2;
  g.setFontAlign(0,0);
  g.clearRect(0,24,239,80);
  g.setFont("6x8").drawString("Confidence "+hrmInfo.confidence+"%", px, 75);
  var str = hrmInfo.bpm;
  g.setFontVector(40).drawString(str,px,45);
  px += g.stringWidth(str)/2;
  g.setFont("6x8");
  g.drawString("BPM",px+15,45);
}
Bangle.on('HRM', onHRM);
/* On newer (2v10) firmwares we can subscribe to get HRM events as they happen */
Bangle.on('HRM-raw', function(v) {
  hrmOffset++;
  if (hrmOffset>g.getWidth()) {
    hrmOffset=0;
    g.clearRect(0,80,239,239);
    g.moveTo(-100,0);
  }
  y = E.clip(btm-v.filt/4,btm-10,btm);
  g.setColor(1,0,0).fillRect(hrmOffset,btm, hrmOffset, y);
  y = E.clip(170 - (v.raw/2),80,btm);
  g.setColor(g.theme.fg).lineTo(hrmOffset, y);
  if (counter !==undefined) {
    counter = undefined;
    g.clear();
  }
});
// It takes 5 secs for us to get the first HRM event
var counter = 5;
function countDown() {
  if (counter) {
    g.drawString(counter--,g.getWidth()/2,g.getHeight()/2, true);
    setTimeout(countDown, 1000);
  }
}
g.clear().setFont("6x8",2).setFontAlign(0,0);
g.drawString("Please wait...",g.getWidth()/2,g.getHeight()/2 - 16);
countDown();
var wasHigh = 0, wasLow = 0;
var lastHigh = getTime();
var hrmList = [];
var hrmInfo;

function readHRM() {
  if (!hrmInfo) return;
  if (hrmOffset==0) {
    g.clearRect(0,100,239,239);
    g.moveTo(-100,0);
  }
for (var i=0;i<2;i++) {
  var hrmData = hrmInfo.raw[hrmOffset];
  hrmOffset++;
  y = E.clip(170 - (hrmData*2),100,230);
  g.setColor(g.theme.fg).lineTo(hrmOffset, y);
  var print = ["HRM", hrmData ];
    Bluetooth.println(
      print.join(",")
      );
}
}
`;


//const getsend = () => {
document.getElementById('get-send-delete').addEventListener('click', function() {

  bangleArray =[];
  //console.log('Sent');
  connection.write(`\x03\x10if(1){${getBangleData}}\n`);
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


// When we get a line of data, check it and if it's
// from the accelerometer, update it
let savingDataFlag = false;
const btOnline = (lines) => {
  // const d = lines.split('\n');
  checkLocalStorage();

  for (const line of lines.split('\n')) {
    if (line.match('<data>')) {
      savingDataFlag = true;
    } else if (line.match('</data>')) {
      //localStorage.setItem('bangleArray', JSON.stringify(bangleArray));
      localStorageObject.stream.push(bangleArray);
      //localStorageObject.stream.concat(bangleArray);
      //localStorage.setItem('bangle', JSON.stringify(bangleArray));
      localStorage.bangle = JSON.stringify(localStorageObject);
      //bangleArray.push(line);
      savingDataFlag = false;
    } else if (savingDataFlag) {
      const cols = line.split(',');
      if (cols.length === 14) {
        bangleArray.push(cols.map((val) => Number(val)));
      }
    }
  }

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

//User annotation from local storage to connect
const sendEvents=(eventsArray) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  const sendRequest = new XMLHttpRequest();
  sendRequest.open('POST', `${connectURL}/parse/classes/userAnnotations`);

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
  const events =[];
  for (let l = 0; l < eventsArray.length; l++) {
    const a = eventsArray[l];
    events[l] = {
      timeStamp: a[0],
      userAnnotation: a[1]
    };
  }
  if(eventsArray.length>0) {
    data.events = events;
    const jsonData = JSON.stringify(data);
    sendRequest.send(jsonData);
  }

  return eventsArray.length;
};

//bangle data (stream) from local storage to connect
const sendStream=(stream) => {
  const sessionInfo = hello('connect').getAuthResponse();
  const accessToken = sessionInfo.access_token;
  const sendRequest = new XMLHttpRequest();
  sendRequest.open('POST', `${connectURL}/parse/classes/bangleStream`);

  sendRequest.setRequestHeader('content-type', 'application/json');
  sendRequest.setRequestHeader('x-parse-application-id', 'connect');
  sendRequest.setRequestHeader('Authorization', `Bearer ${accessToken}`);

  sendRequest.onreadystatechange = function () {
    if (sendRequest.readyState === 4) {
      console.log(sendRequest.status);
      console.log(sendRequest.responseText);
    }
  };

  const dataBangle = {
    sessionId: 'BangleTest'
  };
  const bangleStream =[];
  const combinedstream = [];
  let swapstream =[];
  //To merge all arrays to a single combined array
  for (let l = 0; l < stream.length; l++) {
    let c = [];
    swapstream = stream[l];
    for (let j = 0; j < swapstream.length; j++) {
      c = swapstream[j];
      combinedstream.push(c);
    }
  }

  for (let l = 0; l < combinedstream.length; l++) {
    const a = combinedstream[l].map(Number);
    bangleStream[l] = {
      bufferStart: a[0],
      bufferStop: a[1],
      //Accelerometer and gyroscope mean values
      // eslint-disable-next-line camelcase, object-property-newline
      ax_M: a[2], ay_M: a[3], az_M: a[4], cx_M: a[5], cy_M: a[6], cz_M: a[7], cdx_M: a[8], cdy_M: a[9], cdz_M: a[10],
      //Heart rate monitor mean values
      // eslint-disable-next-line camelcase, object-property-newline
      hrmRaw_M: a[11], hrmFilt_M: a[12], hrmBPM_M: a[13], hrmConfidence_M: a[14],
      //Accelerometer and gyroscope standar deviation values
      // eslint-disable-next-line camelcase, object-property-newline
      ax_S: a[15], ay_S: a[16], az_S: a[17], cx_S: a[18], cy_S: a[19], cz_S: a[20], cdx_S: a[21], cdy_S: a[22], cdz_S: a[23],
      //Heart rate monitor standard deviation values
      // eslint-disable-next-line camelcase, object-property-newline
      hrmRaw_S: a[24], hrmFilt_S: a[25], hrmBPM_S: a[26], hrmConfidence_S: a[27]
    };
  }
  if(combinedstream.length>0) {
    dataBangle.bangle = bangleStream;
    const jsonData = JSON.stringify(dataBangle);
    sendRequest.send(jsonData);
  }

  return combinedstream.length;
};

//Sending data from local memory to connect
document.getElementById('get-send-delete').addEventListener('click', function() {

  checkLocalStorage();
  const {events} = localStorageObject;
  const {stream} = localStorageObject;
  const a = sendEvents(events);
  const s= sendStream(stream);
  if(a>0 && s>0) {
    alert('Thank you! ' + s + ' rows of watch data & ' + a +' annotations are sent to connect server');
  } else if (a>0 && s===0) {
    alert('Thank you ' + a +' rows of annotations sent to connect server');
  } else if (a===0 && s>0) {
    alert('Thank you ' + s + ' rows of watch data is sent to connect server');
  } else {
    alert('Sorry! No data to send');
  }

});

document.getElementById('viewData').addEventListener('click', function() {
  alert('Sorry! currently we are working on dashboard, in the next version you will be use it');
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

document.getElementById('angry').addEventListener('click', function() {
  annotate('angry');
});

document.getElementById('stress').addEventListener('click', function() {
  annotate('stressed');
});

document.getElementById('happy').addEventListener('click', function() {
  annotate('happy');
});

const displayHome = () => {
  document.querySelector('#message').classList.remove('guide');
  document.querySelector('#message').classList.add('home');
};

const guide = () => {
  document.querySelector('#message').classList.remove('home');
  document.querySelector('#message').classList.add('guide');
};

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

const form=document.querySelector('form');
form.addEventListener('submit', (event) => {
  const data = new FormData(form);
  const output = [];
  //let output = '';
  let i =0;
  for (const entry of data) {
    output[i] = `${entry[1]}`;
    //output[i]=entry[1];
    i += 1;
  }
  console.log(output);
  event.preventDefault();
  document.querySelector('#home').classList.remove('enterPreviousData');
  document.querySelector('#home').classList.add('sendPreviousData');
},

false
);


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
      location.href = './index.html';
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
      connection.write(`\x03\x10if(1){setTime(${Date.now()}/1000);`);
      setTimeout(function() {
        // Now upload our code to it
        //connection.write('\x03\x10if(1){'+bangleHRM+bangleGestureData+'}\n',
        connection.write('\x03\x10if(1){'+bangleProcessedData+bangleRawData+'}\n',
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

