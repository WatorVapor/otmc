const LOG = {
  trace0:false,
  trace:true,
  debug:true,
};
import fs from 'fs';
import { SerialPort } from 'serialport'
import { RtcmTransport } from '@gnss/rtcm'
import Projector from 'ecef-projector';
import { RedisPass } from './redisPass.mjs';
if(LOG.trace0) {
  console.log('::::RedisPass=<',RedisPass,'>');
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
if(LOG.trace0) {
  console.log('rtk-gnss::__dirname=<',__dirname,'>');
}
import { RedisPassProxy } from '../core.utils/redisPassProxy.mjs';
if(LOG.trace0) {
  console.log('rtk-gnss::RedisPassProxy=<',RedisPassProxy,'>');
}

import { OtmcConfig } from '../core.utils/otmcConfig.mjs';
if(LOG.trace0) {
  console.log('rtk-gnss::OtmcConfig=<',OtmcConfig,'>');
}
const gConf = OtmcConfig.load(__dirname);
if(LOG.trace0) {
  console.log('rtk-gnss::gConf=<',gConf,'>');
}

const onRedisReady = ()=>{
  if(LOG.trace0) {
    console.log('rtk-gnss::onRedisReady::redisProxy.ready=<',redisProxy.ready,'>');
  }
  createSubscriber();
  /*
  setTimeout(()=>{
    syncLocal2Clound();
  },1000);
  */
}

const redisProxy = new RedisPassProxy(gConf,onRedisReady,);
if(LOG.trace0) {
  console.log('rtk-gnss::redisProxy=<',redisProxy,'>');
}

const createSubscriber = ()=>{
  if(LOG.trace0) {
    console.log('rtk-gnss::createSubscriber::redisProxy.ready=<',redisProxy.ready,'>');
  }
  redisProxy.setPlainListener(plainCloudMsgListener);  
}

const plainCloudMsgListener = (topic,msg)=>{
  if(LOG.trace0) {
    console.log('rtk-gnss::plainCloudMsgListener::topic=<',topic,'>');
    console.log('rtk-gnss::plainCloudMsgListener::msg=<',msg,'>');
  }
}


/*
SerialPort.list((err, ports)=>{
  console.log('::::ports=<',ports,'>');  
});
*/

const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
if(LOG.trace0) {
  console.log('rtk-gnss::createSubscriber::port=<',port,'>');
}
port.on('data', (data) => {
  onRTCRawData(data);
});

const LC29H = {
  Base:{
    confirm:'$PQTMSAVEPAR*5A\r\n'
  }
};

const cutBadHead = () => {
  let count = 0;
  for(const binary of gRcvRtcmBuf) {
    if(binary === 0xd3) {
      break;
    }
    count++;
  }
  if(LOG.trace0) {
    console.log('rtk-gnss::cutBadHead::count=<',count,'>');
  }
  gRcvRtcmBuf = gRcvRtcmBuf.slice(count);
}

let gRcvRtcmBuf = Buffer.from('');;
const onRTCRawData = (rawData) => {
  if(LOG.trace0) {
    console.log('rtk-gnss::onRTCRawData::RtcmTransport.MAX_PACKET_SIZE=<',RtcmTransport.MAX_PACKET_SIZE,'>');
    console.log('rtk-gnss::onRTCRawData::rawData=<',rawData,'>');
    console.log('rtk-gnss::onRTCRawData::rawData=<',rawData.toString('utf-8'),'>');
  }
  const arr = [gRcvRtcmBuf, rawData];
  gRcvRtcmBuf = Buffer.concat(arr);
  if(LOG.trace0) {
    console.log('rtk-gnss::onRTCRawData::gRcvRtcmBuf=<',gRcvRtcmBuf,'>');
  }
  try {
    cutBadHead();
    const [ rtcmMsg, length ]= RtcmTransport.decode(gRcvRtcmBuf);
    if(LOG.trace0) {
      console.log('rtk-gnss::onRTCRawData::rtcmMsg=<',rtcmMsg,'>');
      console.log('rtk-gnss::onRTCRawData::length=<',length,'>');
    }
    const rtcmFrame = gRcvRtcmBuf.slice(0,length);
    if(rtcmFrame.length > 0) {
      onRtcmOneFrame(rtcmFrame);
    }
    gRcvRtcmBuf = gRcvRtcmBuf.slice(length)
  } catch (err) {
    //console.log('rtk-gnss::onRTCRawData::err=<',err,'>');
  }
}
const fConstUnitArpEcef = parseFloat(10000.0);
const onRtcmOneFrame = (rtcmFrame) => {
  if(LOG.trace0) {
    console.log('rtk-gnss::onRtcmOneFrame::rtcmFrame=<',rtcmFrame,'>');
  }
  if(LOG.trace0) {
    console.log('rtk-gnss::onRtcmOneFrame::rtcmFrame.length=<',rtcmFrame.length,'>');
  }
  try {
    const [ rtcmMsg, length ]= RtcmTransport.decode(rtcmFrame);
    if(LOG.trace0) {
      console.log('rtk-gnss::onRtcmOneFrame::rtcmMsg=<',rtcmMsg,'>');
      console.log('rtk-gnss::onRtcmOneFrame::typeof rtcmMsg=<',typeof rtcmMsg,'>');
    }
    if(LOG.trace0) {
      console.log('rtk-gnss::onRtcmOneFrame::length=<',length,'>');
    }
    const rtcmBase64 = rtcmFrame.toString('base64'); 
    if(LOG.trace0) {
      console.log('rtk-gnss::onRtcmOneFrame::rtcmBase64=<',rtcmBase64,'>');
    }
    if(redisProxy.ready) {
      const payload = {
        base64:rtcmBase64
      };
      if(LOG.trace0) {
        console.log('rtk-gnss::onRtcmOneFrame::payload=<',payload,'>');
      }
      redisProxy.pubBroadcast('rtk-gnss/rtcm/3/base64',payload);
      if(rtcmMsg.gpsIndicator || rtcmMsg.glonassIndicator || rtcmMsg.galileoIndicator || rtcmMsg.beidouIndicator) {
        const ecefX = parseFloat(rtcmMsg.arpEcefX/fConstUnitArpEcef);
        const ecefY = parseFloat(rtcmMsg.arpEcefY/fConstUnitArpEcef);
        const ecefZ = parseFloat(rtcmMsg.arpEcefZ/fConstUnitArpEcef);
        const lla = Projector.unproject(ecefX, ecefY, ecefZ);
        if(LOG.trace0) {
          console.log('rtk-gnss::onRtcmOneFrame::rtcmMsg=<',rtcmMsg,'>');
          console.log('rtk-gnss::onRtcmOneFrame::lla=<',lla,'>');
        }
        const payload2 = {
          rtcmMsg:rtcmMsg,
          refStation:{
            lla:lla
          }
        };
        if(LOG.trace0) {
          console.log('rtk-gnss::onRtcmOneFrame::payload2=<',payload2,'>');
        }
        redisProxy.pubBroadcast('rtk-gnss/rtcm/3/rtcmMsg',payload2);
      }
    }
  } catch (err) {
    console.log('rtk-gnss::onRtcmOneFrame::err=<',err,'>');
  }
};

