import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});

const apps = {};

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
      this.hasAddress = true;
    },
  }, 
}

const manifestOption = {
  data() {
    return {
      manifest:`{}`,
    };
  },
  methods: {
    clickSaveManifest(evt) {
      console.log('clickSaveManifest::this=:<',this,'>');
      const otmc = this.otmc;
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

  const appManifest = Vue.createApp(manifestOption);
  const appManifestVM = appManifest.mount('#vue-ui-app-did-manifest');
  console.log('loadDidTeamApps::appManifestVM=:<',appManifestVM,'>');
  
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
  otmc.on('did:document',(didDoc)=>{
    console.log('loadDidTeamApps::didDoc=:<',didDoc,'>');
    appDidVM.did.id = didDoc.id;
    appDidVM.did.doc = JSON.stringify(didDoc,undefined,2);
    appDidVM.hasAddress = true;
  });
  otmc.on('did:manifest',(manifest) => {
    console.log('loadDidTeamApps::manifest=:<',manifest,'>');
    const manifestStr = JSON.stringify(manifest,undefined,2);
    console.log('loadDidTeamApps::manifestStr=:<',manifestStr,'>');
    appManifestVM.manifest = manifestStr;
    loadCodeEditorApps(manifestStr);
    /*
    console.log('loadDidTeamApps::editorObject.editor=:<',editorObject.editor,'>');
    editorObject.editor.setValue(manifestStr);
    */
  });
  
  edcryptKeyVM.otmc = otmc;
  appDidVM.otmc = otmc;
  appManifestVM.otmc = otmc;
  
  apps.edcrypt = edcryptKeyVM;
  apps.did = appDidVM;
  apps.manifest = appManifestVM;

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

const loadCodeEditorApps = (textMsg) => {
  const editorOption = {
    theme: "ace/theme/monokai",
    mode: "ace/mode/json",
    minLines: 32,
  };
  const editor = ace.edit('vue-ui-app-did-manifest-editor',editorOption);
  console.log('loadCodeEditorApps::editor=:<',editor,'>');
  console.log('loadCodeEditorApps::editor.session=:<',editor.session,'>');
  editor.session.insert({row:0, column:0}, textMsg)
}
