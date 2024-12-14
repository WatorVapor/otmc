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
      didKeyList:[
      ],
      didKeySelected: '',
      hasAddress: false,
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
    changeDidKeySelected(evt) {
      console.log('changeDidKeySelected::this.didKeySelected=:<',this.didKeySelected,'>');
      const otmc = this.otmc;
      console.log('changeDidKeySelected::otmc=:<',otmc,'>');
      localStorage.setItem(appStoreDidKeySelected,this.didKeySelected);
      otmc.switchDidKey(this.didKeySelected);
    },
  }  
}

const didTeamOption = {
  data() {
    return {
      edKeyReady:false,
      hasAddress: false,
      isInTeam:false,
      teamType:'create',// 'create|join'
      createAsControlled:true,
      createAsRoot:true,
      status: {
        isController:false,
        isControllee:false,
        isProofed:false,
        isSeed:false,
        isBud:false,
      },
      did: {
        id:'',
        doc:'',
      },
      create: {
        control:'',// 'did'
        controls:'',// 'did'
      },
      join: {
        did:'',
      },
      teamOperation:'create',// 'create|join'
      teamType:{
        controller:true
      },
      growPolicy:{
        seedDogma:false,
        controllerDogma:false,
        proofChain:true,
      },
      guestPolicy:{
        open:false
      }
    };
  },
  methods: {
    clickAddSeedControl(evt) {
      console.log('clickAddSeedControl::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickAddSeedControl::otmc=:<',otmc,'>');
      console.log('clickAddSeedControl::this.create.controls=:<',this.create.controls,'>');
      let controllers = null;
      try { 
        controllers = JSON.parse(this.create.controls);
        console.log('clickAddSeedControl::controllers=:<',controllers,'>');
      } catch(err) {
        console.log('clickAddSeedControl::err=:<',err,'>');
        controllers = [];
      }
      controllers.push(this.create.control);
      this.create.controls = JSON.stringify(controllers);
    },
    clickCreateDidTeamSeedCtrler(evt) {
      console.log('clickCreateDidTeamSeedCtrler::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickCreateDidTeamSeedCtrler::otmc=:<',otmc,'>');
      let controllers = [];
      try {
        if(this.create.controls) {
          controllers = JSON.parse(this.create.controls);
          console.log('clickCreateDidTeamSeedCtrler::controllers=:<',controllers,'>');
        }
      } catch(err) {
        console.error('clickCreateDidTeamSeedCtrler::err=:<',err,'>');
        controllers = [];
      }
      controllers.push(this.create.control);
      if(this.create.control) {
        otmc.createDidTeamFromSeedCtrler(controllers);
      } else {
        otmc.createDidTeamFromSeedCtrler(controllers,true);
      }
    },
    clickCreateDidTeamSeedCtrlee(evt) {
      console.log('clickCreateDidTeamSeedCtrlee::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickCreateDidTeamSeedCtrlee::otmc=:<',otmc,'>');
      let controllers = [];
      try {
        if(this.create.controls) {
          controllers = JSON.parse(this.create.controls);
          console.log('clickCreateDidTeamSeedCtrlee::controllers=:<',controllers,'>');
        }
      } catch(err) {
        console.error('clickCreateDidTeamSeedCtrlee::err=:<',err,'>');
        controllers = [];
      }
      controllers.push(this.create.control);
      if(this.create.control) {
        otmc.createDidTeamFromSeedCtrlee(controllers);
      }
    },
    clickSendJoinRequest2Controller(evt) {
      console.log('clickSendJoinRequest2Controller::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickSendJoinRequest2Controller::otmc=:<',otmc,'>');
      otmc.createJoinTeamVCR(true);
    },
    clickSendJoinRequest2TeamMate(evt) {
      console.log('clickSendJoinRequest2TeamMate::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickSendJoinRequest2TeamMate::otmc=:<',otmc,'>');
      otmc.createJoinTeamVCR(false);
    },
    clickJoinDidTeam(evt) {
      console.log('clickJoinDidTeam::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickJoinDidTeam::otmc=:<',otmc,'>');
      const didDoc = otmc.joinDidTeamAsAuth(this.join.did);
      console.log('clickJoinDidTeam::didDoc=:<',didDoc,'>');
      this.did.doc = JSON.stringify(didDoc,undefined,2);
      this.hasAddress = true;
    },
    clickRequestJoinTeam(evt) {
      console.log('clickRequestJoinTeam::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickRequestJoinTeam::otmc=:<',otmc,'>');
      const didDoc = otmc.requestJoinDidTeam();
      console.log('clickRequestJoinTeam::didDoc=:<',didDoc,'>');
    },
    clickCheckEvidenceChain(evt) {
      console.log('clickCheckEvidenceChain::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickCheckEvidenceChain::otmc=:<',otmc,'>');
      const didDoc = otmc.checkEvidenceChain();
    },
  }, 
}

const loadDidTeamApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const edcryptKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::edcryptKeyVM=:<',edcryptKeyVM,'>');
  const selectedKeyId = loadLastSavedKeyIdSelection();
  edcryptKeyVM.didKeySelected = selectedKeyId;
  
  const appDidTeam = Vue.createApp(didTeamOption);
  const appDidVM = appDidTeam.mount('#vue-ui-app-did-team');
  console.log('loadDidTeamApps::appDidVM=:<',appDidVM,'>');

  const otmc = new OtmcTeam();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,edcryptKeyVM);
    onDidKeyRefreshTeamApp(didKeyList,appDidVM);
    otmc.switchDidKey(edcryptKeyVM.didKeySelected);
  });
  otmc.on('edcrypt:address',(address)=>{
    onAddressRefreshKeyApp(address,edcryptKeyVM);
    onAddressRefreshTeamApp(address,appDidVM);
  });
  otmc.on('edcrypt:mining',(mining)=>{
    console.log('loadDidTeamApps::mining=:<',mining,'>');
    edcryptKeyVM.mining = mining;
  });
  otmc.on('did:document',(didDoc)=>{
    console.log('loadDidTeamApps::didDoc=:<',didDoc,'>');
    if(didDoc) {
      appDidVM.did.id = didDoc.id;
      appDidVM.did.doc = JSON.stringify(didDoc,undefined,2);
      appDidVM.hasAddress = true;
      appDidVM.isInTeam = true;
    }
  });
  
  otmc.on('did:team:evidence.auth',(status) => {
    console.log('loadDidTeamApps::status=:<',status,'>');
    appDidVM.status = status;
  });
  otmc.on('did:team:document.auth.result',(authResult) => {
    console.log('loadDidTeamApps::authResult=:<',authResult,'>');
    const status = {
      isController: authResult.ctrler,
      isControllee: ! authResult.ctrler,
      isProofed: authResult.proofed,
      isSeed: authResult.seed,
      isBud: ! authResult.seed,
    }
    appDidVM.status = status;
  });  
  edcryptKeyVM.otmc = otmc;
  appDidVM.otmc = otmc;
  
  apps.edcrypt = edcryptKeyVM;
  apps.did = appDidVM;

}

const onAddressRefreshKeyApp = (address,app) => {
  console.log('onAddressRefreshKeyApp::address=:<',address,'>');  
  console.log('onAddressRefreshKeyApp::app=:<',app,'>');
  app.hasAddress = true;
  app.isMining = false;
};

const onAddressRefreshTeamApp = (address,app) => {
  console.log('onAddressRefreshTeamApp::address=:<',address,'>');  
  console.log('onAddressRefreshTeamApp::app=:<',app,'>');
  app.edKeyReady = true;
};


const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
  app.isMining = false;
};

const onDidKeyRefreshTeamApp = (didKeys,app) => {
  console.log('onDidKeyRefreshTeamApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshTeamApp::app=:<',app,'>');
};

