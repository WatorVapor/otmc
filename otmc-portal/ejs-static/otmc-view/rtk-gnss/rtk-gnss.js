import * as Vue from 'vue';
import { Otmc } from 'otmc';
const LOG = {
  trace:true,
  debug:false,
};
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMWM0MTFlOC04OTljLTQyZDEtOGRkYS00M2EyMWY1MDRhY2UiLCJpZCI6MTAxNzk1LCJpYXQiOjE2NTgyNzk5ODF9.wS71k-QxR6CLoJ5l3VuJeb07sE3qOkkSgy2MbmuLFWg`;


document.addEventListener('DOMContentLoaded', async (evt) => {
  loadRtkGnssApps(evt);
  createMapView(139.72861126666666,35.81373336666667);
});
const apps = {};

const loadRtkGnssApps = (evt) => {
  const appRtk = Vue.createApp(rtkGNSSOption);
  const appRtkVM = appRtk.mount('#vue-ui-app-rtk-input-device');
  if(LOG.trace0) {
    console.log('RTK-GNSS::loadRtkGnssApps::appRtkVM=:<',appRtkVM,'>');
  }

  const otmc = new Otmc();
  if(LOG.trace0) {
    console.log('RTK-GNSS::loadRtkGnssApps::otmc=:<',otmc,'>');
  }
  otmc.on('otmc:mqtt:app',(appMsg) => {
    if(LOG.trace0) {
      console.log('RTK-GNSS::loadRtkGnssApps::appMsg=:<',appMsg,'>');
    }
    onOTMCAppData(appMsg);
  });
  appRtkVM.otmc = otmc;
  apps.rtk = appRtkVM;
}

const rtkGNSSOption = {
  data() {
    return {
    };
  },
  methods: {
    clickSelectUSBSerialRtkDevice(evt) {
      if(LOG.trace0) {
        console.log('RTK-GNSS::clickSelectUSBSerialRtkDevice::this=:<',this,'>');
      }
      const otmc = this.otmc;
      if(LOG.trace0) {
        console.log('clickSelectUSBSerialRtkDevice::otmc=:<',otmc,'>');
      }
      createUSBSerialRtkDevice(otmc);
    },
    clickSelectBluetoothRtkDevice(evt) {
      if(LOG.trace0) {
        console.log('RTK-GNSS::clickSelectBluetoothRtkDevice::this=:<',this,'>');
      }
      const otmc = this.otmc;
      if(LOG.trace0) {
        console.log('RTK-GNSS::clickSelectBluetoothRtkDevice::otmc=:<',otmc,'>');
      }
    },
  }, 
}
const createUSBSerialRtkDevice = async (otmc) => {
  const filter = {};
  try {
    const device = await navigator.serial.requestPort();
    if(LOG.trace0) {
      console.log('createUSBSerialRtkDevice::device=:<',device,'>');
    }
    await device.open({ baudRate: 115200 });
    const writer = device.writable.getWriter()
    if(LOG.trace0) {
      console.log('createUSBSerialRtkDevice::writer=:<',writer,'>');
    }
    const reader = device.readable.getReader();
    if(LOG.trace0) {
      console.log('createUSBSerialRtkDevice::reader=:<',reader,'>');
    }
    apps.device = {
      writer:writer,
      reader:reader
    };
    setInterval(() =>{
      readSerialRtkDevice(reader)
    } ,200);
  } catch (err) {
    console.error('createUSBSerialRtkDevice::err=:<',err,'>');
  }  
}

const onOTMCAppData = (appMsg) => {
  if(LOG.trace0) {
    console.log('RTK-GNSS::onOTMCAppData::appMsg=:<',appMsg,'>');
  }
  if(appMsg.topic && appMsg.topic.endsWith('rtk-gnss/rtcm/3/base64')) {
    const payload = appMsg.payload;
    if(LOG.trace0) {
      console.log('RTK-GNSS::onOTMCAppData::payload=:<',payload,'>');
    }
    transferRtcm(payload)
  }
}

const transferRtcm = (rtcmMsg) => {
  if(LOG.trace0) {
    console.log('RTK-GNSS::transferRtcm::rtcmMsg=:<',rtcmMsg,'>');
  }
  if(typeof rtcmMsg === 'string') {
    rtcmMsg = JSON.parse(rtcmMsg);
  }
  if(LOG.trace0) {
    console.log('RTK-GNSS::transferRtcm::rtcmMsg=:<',rtcmMsg,'>');
  }
  if(rtcmMsg.base64) {
    const byteRtcm = base64ToUint8Array(rtcmMsg.base64);
    if(LOG.trace0) {
      console.log('RTK-GNSS::transferRtcm::byteRtcm=:<',byteRtcm,'>');
      console.log('RTK-GNSS::transferRtcm::apps.device=:<',apps.device,'>');
    }
    if(apps.device && apps.device.writer) {
      if(LOG.trace0) {
        console.log('RTK-GNSS::transferRtcm::apps.device.writer=:<',apps.device.writer,'>');
      }
      apps.device.writer.write(byteRtcm);
    }
  }
}

const base64ToUint8Array = (base64Str) => {
  const raw = atob(base64Str);
  return Uint8Array.from(Array.prototype.map.call(raw, (x) => { 
    return x.charCodeAt(0); 
  })); 
}

const decoder = new TextDecoder();
let gRemainText = '';
const readSerialRtkDevice = async (reader) => {
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::reader=:<',reader,'>');
  }
  const { value, done } = await reader.read();
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::value=:<',value,'>');
  }
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::done=:<',done,'>');
  }
  const textGnss = decoder.decode(value);
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::textGnss=:<',textGnss,'>');
  }
  const totalTextGnss = gRemainText + textGnss;
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::totalTextGnss=:<',totalTextGnss,'>');
  }
  const lastNL = totalTextGnss.lastIndexOf('\r\n');
  let toParseTextGnss = totalTextGnss.slice(0);
  if(lastNL > 0) {
    gRemainText = totalTextGnss.slice(lastNL);
    toParseTextGnss = totalTextGnss.slice(0,lastNL);
  }
  if(lastNL === -1) {
    return;
  }
  if(LOG.trace0) {
    console.log('RTK-GNSS::readSerialRtkDevice::lastNL=:<',lastNL,'>');
    console.log('RTK-GNSS::readSerialRtkDevice::toParseTextGnss=:<',toParseTextGnss,'>');
    console.log('RTK-GNSS::readSerialRtkDevice::gRemainText=:<',gRemainText,'>');
    console.log('RTK-GNSS::readSerialRtkDevice::GPS=:<',GPS,'>');
  }

  if(toParseTextGnss) {
    const textGnssLines = toParseTextGnss.split('\r\n');
    if(LOG.trace0) {
      console.log('RTK-GNSS::readSerialRtkDevice::textGnssLines=:<',textGnssLines,'>');
    }
    for(const textGnssLine of textGnssLines) {
      if(textGnssLine.startsWith('$')) {
        gGps.update(textGnssLine);
      }
    }
  }
}

const gGps = new GPS();
gGps.on('data', (parsed) => {
  onGPSData(parsed);
});

const onGPSData = (gpsData) => {
  if(LOG.trace0) {
    console.log('RTK-GNSS::onGPSData::gpsData=:<',gpsData,'>');
  }
  if(gpsData.type === 'GGA') {
    onGGAData(gpsData);
  }
}

const onGGAData = (ggaData) => {
  if(LOG.trace) {
    console.log('RTK-GNSS::onGGAData::ggaData=:<',ggaData,'>');
  }
}

let gGPSMap = false;
const createMapView = async (lat,lon) => {
  const options = {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    baseLayerPicker: true,
    timeline : false,
    animation : false,
    homeButton: false,
    vrButton: false,
    geocoder:false,
    sceneModePicker:false,
    navigationHelpButton:false,
  };
  gGPSMap = new Cesium.Viewer('view_map', options);
  const buildingTileset = await Cesium.createOsmBuildingsAsync();
  gGPSMap.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(lat, lon, 80),
    orientation : {
      heading : Cesium.Math.toRadians(0.0),
      pitch : Cesium.Math.toRadians(-90.0),
    }
  });
  gGPSMap.scene.primitives.add(buildingTileset);
}

