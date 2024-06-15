const LOG = {
  trace0:false,
  trace:true,
  debug:true,
};
import fs from 'fs';
import { SerialPort } from 'serialport'
import { RtcmTransport } from '@gnss/rtcm'
import { RedisRelay } from './redisRelay.mjs';
if(LOG.trace0) {
  console.log('::::RedisRelay=<',RedisRelay,'>');
}

const gConf = {};
try {
  const configPath = './config.json';
  const configText = fs.readFileSync(configPath);
  const config = JSON.parse(configText);
  if(LOG.trace0) {
    console.log('::::config=<',config,'>');
  }
  gConf.store = config.store;
  fs.mkdirSync(`${gConf.store}/secretKey`, { recursive: true },);
} catch ( err ) {
  console.error('::::err=<',err,'>');
}

const redis = new RedisRelay(gConf,()=>{
  if(LOG.trace0) {
    console.log('::::redis.ready=<',redis.ready,'>');
  }
});
//console.log('::::redis=<',redis,'>');
/*
SerialPort.list((err, ports)=>{
  console.log('::::ports=<',ports,'>');  
});
*/

const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
if(LOG.trace0) {
  console.log('::::port=<',port,'>');
}
port.on('data', (data) => {
  onRTCRawData(data);
});

const LC29H = {
  Base:{
    confirm:'$PQTMSAVEPAR*5A\r\n'
  }
};
/*
setTimeout(()=>{
  port.write(LC29H.Base.confirm,(err) => {
    if(LOG.trace0) {
      console.log('::write::err=<',err,'>');
    }
    setTimeout(()=>{
      const result = port.read(1024);
      if(LOG.trace0) {
        console.log('::read::result=<',result,'>');
      }
    },2000)
  });
},3000)
*/

const cutBadHead = () => {
  let count = 0;
  for(const binary of gRcvRtcmBuf) {
    if(binary === 0xd3) {
      break;
    }
    count++;
  }
  if(LOG.trace0) {
    console.log('::cutBadHead::count=<',count,'>');
  }
  gRcvRtcmBuf = gRcvRtcmBuf.slice(count);
}

let gRcvRtcmBuf = Buffer.from('');;
const onRTCRawData = (rawData) => {
  if(LOG.trace0) {
    console.log('::onRTCRawData::RtcmTransport.MAX_PACKET_SIZE=<',RtcmTransport.MAX_PACKET_SIZE,'>');
    console.log('::onRTCRawData::rawData=<',rawData,'>');
    console.log('::onRTCRawData::rawData=<',rawData.toString('utf-8'),'>');
  }
  const arr = [gRcvRtcmBuf, rawData];
  gRcvRtcmBuf = Buffer.concat(arr);
  if(LOG.trace0) {
    console.log('::onRTCRawData::gRcvRtcmBuf=<',gRcvRtcmBuf,'>');
  }
  try {
    cutBadHead();
    const [ rtcmMsg, length ]= RtcmTransport.decode(gRcvRtcmBuf);
    if(LOG.trace0) {
      console.log('::onRTCRawData::rtcmMsg=<',rtcmMsg,'>');
      console.log('::onRTCRawData::length=<',length,'>');
    }
    const rtcmFrame = gRcvRtcmBuf.slice(0,length);
    if(rtcmFrame.length > 0) {
      onRtcmOneFrame(rtcmFrame);
    }
    gRcvRtcmBuf = gRcvRtcmBuf.slice(length)
  } catch (err) {
    //console.log('::onRTCRawData::err=<',err,'>');
  }
}
const onRtcmOneFrame = (rtcmFrame) => {
  if(LOG.trace0) {
    console.log('::onRtcmOneFrame::rtcmFrame=<',rtcmFrame,'>');
  }
  if(LOG.trace0) {
    console.log('::onRtcmOneFrame::rtcmFrame.length=<',rtcmFrame.length,'>');
  }
  try {
    const [ rtcmMsg, length ]= RtcmTransport.decode(rtcmFrame);
    if(LOG.trace0) {
      console.log('::onRtcmOneFrame::rtcmMsg=<',rtcmMsg,'>');
    }
    if(LOG.trace0) {
      console.log('::onRtcmOneFrame::length=<',length,'>');
    }
  } catch (err) {
    console.log('::onRtcmOneFrame::err=<',err,'>');
  }
  const rtcmBase64 = rtcmFrame.toString('base64'); 
  if(LOG.trace0) {
    console.log('::onRtcmOneFrame::rtcmBase64=<',rtcmBase64,'>');
  }
  if(redis.ready) {
    const payload = {
      base64:rtcmBase64
    };
    if(LOG.trace0) {
      console.log('::onRtcmOneFrame::payload=<',payload,'>');
    }
    redis.pubBroadcast('rtk-gnss/rtcm/3/base64',payload);
  }
};

