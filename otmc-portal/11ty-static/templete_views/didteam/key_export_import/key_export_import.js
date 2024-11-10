import * as Vue from 'vue';
import { OtmcTeam } from 'otmcTeam';
const apps = {};
const TEAM = {
  trace:false,
};

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
      didKeyList:[
      ],
      didKeySelected: '',
      hasAddress: false,
      address:{
        auth:'',
        recovery:'',
      },
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

const loadDidTeamApps = (evt) => { 
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const appEdKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::appEdKeyVM=:<',appEdKeyVM,'>');
  const selectedKeyId = loadLastSavedKeyIdSelection();
  appEdKeyVM.didKeySelected = selectedKeyId;


  const otmc = new OtmcTeam();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,appEdKeyVM);
    otmc.switchDidKey(appEdKeyVM.didKeySelected);
  });
  otmc.on('edcrypt:address',(address)=>{
    onAddressRefreshKeyApp(address,appEdKeyVM);
  });


  
  appEdKeyVM.otmc = otmc;
  apps.edKey = appEdKeyVM;

}



const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
};


const onAddressRefreshKeyApp = (address,app) => {
  console.log('onAddressRefreshKeyApp::address=:<',address,'>');  
  console.log('onAddressRefreshKeyApp::app=:<',app,'>');
  app.hasAddress = true;
  app.address = address;
};
