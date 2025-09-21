const LOG = {
  trace:true,
  trace0:false,
  trace10:false,
  debug:false,
};
import * as Vue from 'vue';
import { OtmcMqtt } from 'otmcMqtt';

Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMWM0MTFlOC04OTljLTQyZDEtOGRkYS00M2EyMWY1MDRhY2UiLCJpZCI6MTAxNzk1LCJpYXQiOjE2NTgyNzk5ODF9.wS71k-QxR6CLoJ5l3VuJeb07sE3qOkkSgy2MbmuLFWg`;


const appStoreDidSelected = 'otmc/rtk/did/selected/station';

const loadLastSavedDidSelection = () => {
  try {
    const didSelected = localStorage.getItem(appStoreDidSelected);
    if(LOG.trace) {
      console.log('DidTeam::loadLastSavedKeyIdSelection::didSelected=:<',didSelected,'>');
    }
    return didSelected;
  } catch(err) {
    console.error('DidTeam::loadLastSavedKeyIdSelection::err=:<',err,'>');
  }
  return null;
}



document.addEventListener('DOMContentLoaded', async (evt) => {
  loadRtkGnssApps(evt);
  createMapView(35.81373336666667,139.72861126666666);
});
const apps = {};

const loadRtkGnssApps = (evt) => {
  const appRtk = Vue.createApp(rtkGNSSOption);
  const appRtkVM = appRtk.mount('#vue-ui-app-rtk-space');
  if(LOG.trace0) {
    console.log('RTK-GNSS-STATION::loadRtkGnssApps::appRtkVM=:<',appRtkVM,'>');
  }
  const didSelected = loadLastSavedDidSelection();
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::loadRtkGnssApps::didSelected=:<',didSelected,'>');
  }
  appRtkVM.didSelected = didSelected;
  apps.didSelected = didSelected;

  const otmc = new OtmcMqtt();
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::loadRtkGnssApps::otmc=:<',otmc,'>');
  }

  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::didKeyList=:<',didKeyList,'>');
    }
    apps.didKeyList = didKeyList;
    otmc.switchDidTeam(didSelected);
  });
  otmc.on('did:team:switch.did.authKey.RC',(keyidRCs)=>{
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::keyidRCs=:<',keyidRCs,'>');
    }
    apps.keyidRCs = keyidRCs;
    const keyidSelected = doDidAuthKeyMatch(apps);
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::keyidSelected=:<',keyidSelected,'>');
    }
    if(keyidSelected) {
      otmc.switchDidKey(keyidSelected);
    }
  });

  otmc.on('did:team:all:property',(propertyList)=>{
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::propertyList=:<',propertyList,'>');
    }
    // filter propertyList
    const propertyRtkBaseList = propertyList.filter((property) => {
      return property.team.identification.startsWith('RTK_BS_');
    });
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::propertyRtkBaseList=:<',propertyRtkBaseList,'>');
    }
    for(const account of propertyRtkBaseList) {
      account.selected = false;
      if(account.did === appRtkVM.didSelected) {
        account.selected = true;
      }
    }
    if(propertyRtkBaseList.length === 1) {
      propertyRtkBaseList[0].selected = true;
    }
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::propertyRtkBaseList=:<',propertyRtkBaseList,'>');
    }
    appRtkVM.accountList = propertyRtkBaseList;
  });

  otmc.on('otmc:mqtt:app',(appMsg) => {
    if(LOG.trace) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::appMsg=:<',appMsg,'>');
    }
  });

  otmc.on('otmc:mqtt:all',(msgMqtt) => {
    if(LOG.trace10) {
      console.log('RTK-GNSS-STATION::loadRtkGnssApps::msgMqtt=:<',msgMqtt,'>');
    }
    if(msgMqtt.sTopic.includes('rtk-gnss/rtcm/3/')) {
      onOTMCAppData(msgMqtt.msg,appRtkVM);
    }
  });

  setTimeout(()=>{
    otmc.readAllAccountInfo();
  },100);
  
  
  appRtkVM.otmc = otmc;
  apps.rtk = appRtkVM;


}

const rtkGNSSOption = {
  data() {
    return {
      accountList:[],
      didSelected:'',
    };
  },
  methods: {
    changeDidSelected(evt) {
      if(LOG.trace0) {
        console.log('RTK-GNSS-STATION::changeDidSelected::this=:<',this,'>');
      }
      localStorage.setItem(appStoreDidSelected,this.didSelected);
      otmc.switchDid(this.didSelected);
    },
  }, 
}

const onOTMCAppData = (appMsg) => {
  if(LOG.trace0) {
    console.log('RTK-GNSS-STATION::onOTMCAppData::appMsg=:<',appMsg,'>');
  }
  if(appMsg.topic && appMsg.topic.endsWith('rtk-gnss/rtcm/3/rtcmMsg')) {
    const payload = appMsg.payload;
    if(LOG.trace0) {
      console.log('RTK-GNSS-STATION::onOTMCAppData::payload=:<',payload,'>');
    }
    analyzeRtcm(payload)
  }
}


const analyzeRtcm = (rtcmMsg) => {
  if(LOG.trace10) {
    console.log('RTK-GNSS-STATION::analyzeRtcm::rtcmMsg=:<',rtcmMsg,'>');
  }
  if(typeof rtcmMsg === 'string') {
    rtcmMsg = JSON.parse(rtcmMsg);
  }
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::analyzeRtcm::rtcmMsg=:<',rtcmMsg,'>');
  }
  if(rtcmMsg.refStation && rtcmMsg.refStation.lla) {
    const lla = rtcmMsg.refStation.lla;
    if(LOG.trace0) {
      console.log('RTK-GNSS-STATION::analyzeRtcm::lla=:<',lla,'>');
    }
    onRefStationArpLla(lla[0],lla[1],lla[2]);
  }
}


const fConstArpHeightOffset = 5.0

const onRefStationArpLla = (latArp,lonArp,altArp) => {
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::onRefStationArpLla::latArp=:<',latArp,'>');
    console.log('RTK-GNSS-STATION::onRefStationArpLla::lonArp=:<',lonArp,'>');
    console.log('RTK-GNSS-STATION::onRefStationArpLla::altArp=:<',altArp,'>');
  }
  if(apps.mapView && apps.anchorLabels) {
    const entity = {
      position: Cesium.Cartesian3.fromDegrees(lonArp,latArp,altArp + fConstArpHeightOffset),
      text  : `${lonArp.toFixed(4)}\n${latArp.toFixed(4)}`,
      fillColor : Cesium.Color.GREEN,
    };
    apps.anchorLabels.add(entity);
    if(LOG.trace0) {
      console.log('RTK-GNSS-STATION::onRefStationArpLla::apps.anchorLabels=:<',apps.anchorLabels,'>');
    }
  }
  if(apps.mapView && apps.billboards) {
    const entity = {
      position: Cesium.Cartesian3.fromDegrees(lonArp,latArp,altArp + fConstArpHeightOffset),
      image : 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/tower-cell.svg',
      scale : 0.25,
    };
    apps.billboards.add(entity);
    if(LOG.trace0) {
      console.log('RTK-GNSS-STATION::onRefStationArpLla::apps.billboards=:<',apps.billboards,'>');
    }
  }
}


//https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/tower-cell.svg


const createMapView = async (lat,lon) => {
  const options = {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  };
  apps.mapView = new Cesium.Viewer('view_map', options);
  apps.mapView.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(lon,lat,100),
    orientation : {
      heading : Cesium.Math.toRadians(0.0),
      pitch : Cesium.Math.toRadians(-90.0),
    }
  });
  //const buildingTileset = await Cesium.createOsmBuildingsAsync();
  //apps.mapView.scene.primitives.add(buildingTileset);
  apps.mapPoints = apps.mapView.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  apps.anchorLabels = apps.mapView.scene.primitives.add(new Cesium.LabelCollection());
  apps.billboards = apps.mapView.scene.primitives.add(new Cesium.BillboardCollection());
}


const doDidAuthKeyMatch = (apps) => {
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::doDidAuthKeyMatch::apps=:<',apps,'>');
  }
  const keysOfMine = [];
  for(const keyidRC of apps.keyidRCs) {
      if(LOG.trace) {
        console.log('RTK-GNSS-STATION::doDidAuthKeyMatch::keyidRC=:<',keyidRC,'>');
      }
      for(const didKey of apps.didKeyList) {
        if(LOG.trace) {
          console.log('RTK-GNSS-STATION::doDidAuthKeyMatch::didKey=:<',didKey,'>');
        }
        if(keyidRC === didKey.auth.idOfKey) {
          keysOfMine.push(keyidRC);
        }
    }
  }
  if(LOG.trace) {
    console.log('RTK-GNSS-STATION::doDidAuthKeyMatch::keysOfMine=:<',keysOfMine,'>');
  }
  if(keysOfMine.length > 1) {
    for(const keyidRC of keysOfMine) {
      if(LOG.trace) {
        console.log('RTK-GNSS-STATION::doDidAuthKeyMatch::keyidRC=:<',keyidRC,'>');
      }
      if(apps.didSelected.endswith(keyidRC)) {
        return keyidRC;
      }
    }
  }
  if(keysOfMine.length === 1) {
    return keysOfMine[0];
  }
  return null;
}