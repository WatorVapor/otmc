import * as Vue from 'vue';
import { OtmcTeam } from 'otmcTeam';
const TEAM = {
  trace:false,
};
const apps = {};
document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});

const appStoreDidKeySelected = 'otmc/team/didkey/selected';

const loadLastSavedKeyIdSelection = () => {
  try {
    const didKeySelected = localStorage.getItem(appStoreDidKeySelected);
    if(TEAM.trace) {
      console.log('loadLastSavedKeyIdSelection::didKeySelected=:<',didKeySelected,'>');
    }
    return didKeySelected;
  } catch(err) {
    console.error('loadLastSavedKeyIdSelection::err=:<',err,'>');
  }
  return null;
}


const edcryptKeyOption = {
  data() {
    return {
      didKeyList:[],
      didKeySelected: '',
    };
  },
  methods: {
    changeDidKeySelected(evt) {
      console.log('changeDidKeySelected::this.didKeySelected=:<',this.didKeySelected,'>');
      const otmc = this.otmc;
      console.log('changeDidKeySelected::otmc=:<',otmc,'>');
      localStorage.setItem(appStoreDidKeySelected,this.didKeySelected);
      otmc.switchDidKey(this.didKeySelected);
    },
  }  
}


const joinRequestOption = {
  data() {
    return {
      joinRequests:{},
    };
  },
  methods: {
    clickAcceptJoinRequest(evt,storeKey) {
      console.log('clickAcceptJoinRequest::this=:<',this,'>');
      console.log('clickAcceptJoinRequest::evt=:<',evt,'>');
      console.log('clickAcceptJoinRequest::storeKey=:<',storeKey,'>');
      const otmc = this.otmc;
      otmc.acceptJoinRequest(storeKey);
    },
    clickRejectJoinRequest(evt,storeKey) {
      console.log('clickRejectJoinRequest::this=:<',this,'>');
      console.log('clickRejectJoinRequest::evt=:<',evt,'>');
      console.log('clickRejectJoinRequest::storeKey=:<',storeKey,'>');
      const otmc = this.otmc;
      otmc.rejectJoinRequest(storeKey);
    },
  }, 
}


const loadDidTeamApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const edcryptKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::edcryptKeyVM=:<',edcryptKeyVM,'>');
  const selectedKeyId = loadLastSavedKeyIdSelection();
  edcryptKeyVM.didKeySelected = selectedKeyId;
  

  const appJoin = Vue.createApp(joinRequestOption);
  const appJoinVM = appJoin.mount('#vue-ui-app-join-request');
  console.log('loadDidTeamApps::appJoinVM=:<',appJoinVM,'>');
  
  
  const otmc = new OtmcTeam();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,edcryptKeyVM);
    otmc.switchDidKey(edcryptKeyVM.didKeySelected);
  });
  otmc.on('didteam:join',(joinMsg) => {
    console.log('loadDidTeamApps::joinMsg=:<',joinMsg,'>');
  });
  otmc.on('didteam:joinLoaded',(joinRequestList) => {
    console.log('loadDidTeamApps::joinRequestList=:<',joinRequestList,'>');
    for(const storeKey in joinRequestList) {
      console.log('loadDidTeamApps::storeKey=:<',storeKey,'>');
      const joinRequest = joinRequestList[storeKey];
      const showAddress = JSON.stringify(joinRequest.credentialRequest.claims.memberAsAuthentication,undefined,2);
      joinRequestList[storeKey].showAddress = showAddress;
      //joinRequestList[storeKey].showAddress = showAddress.replace('[','').replace(']','').replace('#','#\n').trim();
    }
    /*
    Object.keys(joinRequestList).forEach((joinRequest, index) => {
      const showAddress = JSON.stringify(joinRequest.credentialRequest.claims.memberAsAuthentication,undefined,2);
      joinRequestList[index].showAddress = showAddress.replace('[','').replace(']','').replace('#','#\n').trim();
    });
    */
    apps.join.joinRequests = joinRequestList;
  });
  
  
  edcryptKeyVM.otmc = otmc;
  appJoinVM.otmc = otmc;
  
  apps.edcrypt = edcryptKeyVM;
  apps.join = appJoinVM;

}



const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
};
