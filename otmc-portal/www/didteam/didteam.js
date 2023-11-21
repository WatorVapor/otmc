import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});

const edcryptKeyOption = {
  data() {
    return {
      hasAddress: false,
      address:{
        auth:'',
        recovery:'',
      },
      isMining: false,
      mining:{
        counter: 0,
      }
    };
  },
  methods: {
    clickStartMining(evt) {
      console.log('clickStartMining::this=:<',this,'>');
      this.isMining = true;
      const otmc = this.otmc;
      console.log('clickStartMining::otmc=:<',otmc,'>');
      otmc.startMining();
    },
  }  
}

const didTeamOption = {
  data() {
    return {
      edKeyReady:false,
      hasAddress: false,
      did: {
        id:'',
        doc:'',
      },
    };
  },
  methods: {
    clickCreateDidTeamSeed(evt) {
      console.log('clickCreateDidTeamSeed::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickCreateDidTeamSeed::otmc=:<',otmc,'>');
      const didDoc = otmc.createDidTeamFromSeed();
      console.log('clickCreateDidTeamSeed::didDoc=:<',didDoc,'>');
      this.did.id = didDoc.id;
      this.did.doc = JSON.stringify(didDoc,undefined,2);
    },
  }  
}


const loadDidTeamApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const edcryptKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::edcryptKeyVM=:<',edcryptKeyVM,'>');
  
  const appDidTeam = Vue.createApp(didTeamOption);
  const appDidVM = appDidTeam.mount('#vue-ui-app-did-team');
  console.log('loadDidTeamApps::appDidVM=:<',appDidVM,'>');
  
  const otmc = new Otmc();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:address',(address)=>{
    onAddressRefreshKeyApp(address,edcryptKeyVM);
    onAddressRefreshTeamApp(address,appDidVM);
  });
  otmc.on('edcrypt:mining',(mining)=>{
    console.log('loadDidTeamApps::mining=:<',mining,'>');
    edcryptKeyVM.mining = mining;
  });
  edcryptKeyVM.otmc = otmc;
  appDidVM.otmc = otmc;

}

const onAddressRefreshKeyApp = (address,app) => {
  console.log('onAddressRefreshKeyApp::address=:<',address,'>');  
  console.log('onAddressRefreshKeyApp::app=:<',app,'>');
  app.hasAddress = true;
  app.isMining = false;
  app.address = address;
};

const onAddressRefreshTeamApp = (address,app) => {
  console.log('onAddressRefreshTeamApp::address=:<',address,'>');  
  console.log('onAddressRefreshTeamApp::app=:<',app,'>');
  app.edKeyReady = true;
};