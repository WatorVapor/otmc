import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});

const apps = {};

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
      otmc.switchDidKey(this.didKeySelected);
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
      this.hasAddress = true;
    },
    clickJoinDidTeam(evt) {
      console.log('clickJoinDidTeam::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickJoinDidTeam::otmc=:<',otmc,'>');
      const didDoc = otmc.joinDidTeamAsAuth(this.did.id);
      console.log('clickJoinDidTeam::didDoc=:<',didDoc,'>');
      this.did.doc = JSON.stringify(didDoc,undefined,2);
      this.hasAddress = true;
    },
    clickRequestJoinTeam(evt) {
      console.log('clickRequestJoinTeam::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickRequestJoinTeam::otmc=:<',otmc,'>');
      const didDoc = otmc.requestJoinDidTeam();
    },
    clickCheckEvidenceChain(evt) {
      console.log('clickCheckEvidenceChain::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickCheckEvidenceChain::otmc=:<',otmc,'>');
      const didDoc = otmc.checkEvidenceChain();
    },
  }, 
}

const invitationOption = {
  data() {
    return {
      invitations:{},
    };
  },
  methods: {
    clickAcceptInvitationJoin(evt,address) {
      console.log('clickAcceptInvitationJoin::this=:<',this,'>');
      console.log('clickAcceptInvitationJoin::evt=:<',evt,'>');
      console.log('clickAcceptInvitationJoin::address=:<',address,'>');
      const otmc = this.otmc;
      otmc.acceptInvitation(address);
    },
    clickRejectInvitationJoin(evt,address) {
      console.log('clickRejectInvitationJoin::this=:<',this,'>');
      console.log('clickRejectInvitationJoin::evt=:<',evt,'>');
      console.log('clickRejectInvitationJoin::address=:<',address,'>');
      const otmc = this.otmc;
      otmc.rejectInvitation(address);
    },
  }, 
}


const loadDidTeamApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const edcryptKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::edcryptKeyVM=:<',edcryptKeyVM,'>');
  
  const appDidTeam = Vue.createApp(didTeamOption);
  const appDidVM = appDidTeam.mount('#vue-ui-app-did-team');
  console.log('loadDidTeamApps::appDidVM=:<',appDidVM,'>');

  const appInvitation = Vue.createApp(invitationOption);
  const appInvitationVM = appInvitation.mount('#vue-ui-app-invitation-join');
  console.log('loadDidTeamApps::appInvitationVM=:<',appInvitationVM,'>');
  
  
  const otmc = new Otmc();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,edcryptKeyVM);
    onDidKeyRefreshTeamApp(didKeyList,appDidVM);
  });
  otmc.on('edcrypt:didKeySelected',(didKeySelected)=>{
    edcryptKeyVM.didKeySelected = didKeySelected;
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
    appDidVM.did.id = didDoc.id;
    appDidVM.did.doc = JSON.stringify(didDoc,undefined,2);
    appDidVM.hasAddress = true;
  });
  otmc.on('didteam:join',(joinMsg) => {
    console.log('loadDidTeamApps::joinMsg=:<',joinMsg,'>');
  });
  otmc.on('didteam:joinLoaded',(invitationJoin) => {
    console.log('loadDidTeamApps::invitationJoin=:<',invitationJoin,'>');
    for(const addIndex in invitationJoin) {
      console.log('loadDidTeamApps::addIndex=:<',addIndex,'>');
      const join = invitationJoin[addIndex];
      if(join.authentication && join.authentication.length > 0) {
        invitationJoin[addIndex].invitationType = 'Auth Member';
      }
      if(join.capabilityInvocation && join.capabilityInvocation.length > 0) {
        invitationJoin[addIndex].invitationType = 'Capability Member';
      }
      console.log('loadDidTeamApps::invitationJoin=:<',invitationJoin,'>');
    }
    apps.invitation.invitations = invitationJoin;
  });
  otmc.on('otmc:mqtt:app',(appMsg) => {
    console.log('loadDidTeamApps::appMsg=:<',appMsg,'>');
  });
  /*
  otmc.on('otmc:mqtt:all',(mqttMsg) => {
    console.log('loadDidTeamApps::mqttMsg=:<',mqttMsg,'>');
  });
  */
  
  edcryptKeyVM.otmc = otmc;
  appDidVM.otmc = otmc;
  appInvitationVM.otmc = otmc;
  
  apps.edcrypt = edcryptKeyVM;
  apps.did = appDidVM;
  apps.invitation = appInvitationVM;

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

