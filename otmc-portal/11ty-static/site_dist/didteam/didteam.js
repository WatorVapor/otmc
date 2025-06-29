const TEAM = {
  trace:false,
};
import * as Vue from 'vue';
import { OtmcTeam } from 'otmcTeam';
import { OtmcMqtt } from 'otmcMqtt';
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
        controller:true,
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

const teamPropertyOption = {
  data() {
    return {
      team:{
        name: '',
      },
      member:{
        name: '',
      },
      members:{},
    };
  },
  methods: {
    changeTeamSpaceName(evt) {
      console.log('v::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('changeTeamSpaceName::otmc=:<',otmc,'>');
      const teamProperty = {
        team: this.team,
      };
      otmc.changeTeamProperty(teamProperty);
    },
    changeTeamMemberName(evt) {
      console.log('v::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('changeTeamMemberName::otmc=:<',otmc,'>');
      const teamProperty = {
        member: this.member,
      };
      otmc.changeTeamProperty(teamProperty);
    },
  }  
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

  const appTeamProperty = Vue.createApp(teamPropertyOption);
  const appPropertyVM = appTeamProperty.mount('#vue-ui-app-did-property');
  console.log('loadDidTeamApps::appPropertyVM=:<',appPropertyVM,'>');

  const otmc = new OtmcTeam();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  const mqtt = new OtmcMqtt();
  console.log('loadDidTeamApps::mqtt=:<',mqtt,'>');

  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,edcryptKeyVM);
    onDidKeyRefreshTeamApp(didKeyList,appDidVM);
    otmc.switchDidKey(edcryptKeyVM.didKeySelected);
    mqtt.switchDidKey(edcryptKeyVM.didKeySelected);
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
  otmc.on('did:team:document.auth.result',(status) => {
    console.log('loadDidTeamApps::status=:<',status,'>');
    appDidVM.status = status;
  });  
  otmc.on('did:team:property',(property)=>{
    console.log('loadDidTeamApps::property=:<',property,'>');
    apps.accountProperty = JSON.parse(JSON.stringify(property));
    appPropertyVM.team = property.team;
    appPropertyVM.member = property.member;
    appPropertyVM.members = property.members;
  });

  mqtt.on('otmc.mqtt.encrypt.channel.refresh',(evtMqtt) => {
    console.log('loadDidTeamApps::evtMqtt=:<',evtMqtt,'>');
    onMqttEncrypteChannelRefresh(mqtt,otmc,appPropertyVM);
  });

  mqtt.on('otmc:mqtt:all',(msgMqtt) => {
    console.log('loadDidTeamApps::msgMqtt=:<',msgMqtt,'>');
    if(msgMqtt.sTopic.endsWith('secret/team/property/sync')) {
      onRemotePropertySync(msgMqtt.msg,appPropertyVM);
    }
  });
  mqtt.on('otmc:mqtt:encrypt:channel',(msgMqttEC) => {
    console.log('loadDidTeamApps::msgMqttEC=:<',msgMqttEC,'>');
  });
  console.log('loadDidTeamApps::mqtt=:<',mqtt,'>');


  edcryptKeyVM.otmc = otmc;
  appDidVM.otmc = otmc;
  appPropertyVM.otmc = otmc;
  appPropertyVM.mqtt = mqtt;
  
  apps.edcrypt = edcryptKeyVM;
  apps.did = appDidVM;
  apps.property = appPropertyVM;

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

const onMqttEncrypteChannelRefresh = (mqtt,otmc) => {
  console.log('onMqttEncrypteChannelRefresh::mqtt=:<',mqtt,'>');
  console.log('onMqttEncrypteChannelRefresh::otmc=:<',otmc,'>');
  console.log('onMqttEncrypteChannelRefresh::apps.accountProperty=:<',apps.accountProperty,'>');
  const syncMsg = { 
    topic:'team/property/sync',
    payload:apps.accountProperty,
  };
  mqtt.publishSecretMsg(syncMsg);
}

