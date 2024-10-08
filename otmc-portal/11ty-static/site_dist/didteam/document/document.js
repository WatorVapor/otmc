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

const didTeamOption = {
  data() {
    return {
      did: {
        doc:'',
      },
    };
  },
  methods: {
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
    otmc.switchDidKey(edcryptKeyVM.didKeySelected);
  });
  otmc.on('did:document',(didDoc)=>{
    console.log('loadDidTeamApps::didDoc=:<',didDoc,'>');
    const didDocStr = JSON.stringify(didDoc,undefined,2);
    appDidVM.did.doc = didDocStr;
    loadCodeEditorApps(didDocStr);
  });

  
  appDidVM.otmc = otmc;
  apps.did = appDidVM;

}

const loadCodeEditorApps = (textMsg) => {
  const editorOption = {
    theme: "ace/theme/monokai",
    mode: "ace/mode/json",
    minLines: 32,
  };
  const editor = ace.edit('vue-ui-app-did-document-editor',editorOption);
  console.log('loadCodeEditorApps::editor=:<',editor,'>');
  console.log('loadCodeEditorApps::editor.session=:<',editor.session,'>');
  editor.session.insert({row:0, column:0}, textMsg);
  editor.setReadOnly(true);
}

const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
};
