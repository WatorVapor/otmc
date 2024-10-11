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
  const selectedKeyId = loadLastSavedKeyIdSelection();
  edcryptKeyVM.didKeySelected = selectedKeyId;
  

  const appInvitation = Vue.createApp(invitationOption);
  const appInvitationVM = appInvitation.mount('#vue-ui-app-invitation-join');
  console.log('loadDidTeamApps::appInvitationVM=:<',appInvitationVM,'>');
  
  
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
    /*
    joinRequestList.forEach((joinRequest, index) => {
      const showAddress = JSON.stringify(joinRequest.credentialRequest.claims.memberAsAuthentication,undefined,2);
      joinRequestList[index].showAddress = showAddress.replace('[','').replace(']','').replace('#','#\n').trim();
    });
    */
    apps.invitation.invitations = joinRequestList;
  });
  
  
  edcryptKeyVM.otmc = otmc;
  appInvitationVM.otmc = otmc;
  
  apps.edcrypt = edcryptKeyVM;
  apps.invitation = appInvitationVM;

}



const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
};
