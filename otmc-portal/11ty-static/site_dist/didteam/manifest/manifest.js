import * as Vue from 'vue';
import { OtmcTeam } from 'otmcTeam';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamManifestApps(evt);
});

const apps = {
  trace0: false,
  trace: true,
  debug: true,
};
const TEAM = {
  trace:false,
};

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


const manifestOption = {
  data() {
    return {
      manifest:`{}`,
    };
  },
  methods: {
    clickSaveManifest(evt) {
      if(apps.trace0) {
        console.log('clickSaveManifest::evt=:<',evt,'>');
        console.log('clickSaveManifest::this=:<',this,'>');
      }
      const otmc = this.otmc;
      const editor = this.editorManifest;
      if(apps.trace0) {
        console.log('clickSaveManifest::otmc=:<',otmc,'>');
        console.log('clickSaveManifest::editor=:<',editor,'>');
      }
      const textManifest = editor.getValue();
      if(apps.trace0) {
        console.log('clickSaveManifest::textManifest=:<',textManifest,'>');
      }
      try {
        const jsonManifest = JSON.parse(textManifest);
        if(apps.trace) {
          console.log('clickSaveManifest::jsonManifest=:<',jsonManifest,'>');
        }
        otmc.updateManifest(jsonManifest);
      } catch (err) {
        console.log('clickSaveManifest::err=:<',err,'>');
      }
    },
    clickCheckManifest(evt) {
      if(apps.trace0) {
        console.log('clickCheckManifest::evt=:<',evt,'>');
        console.log('clickCheckManifest::this=:<',this,'>');
      }
      const otmc = this.otmc;
    },
  }, 
}




const loadDidTeamManifestApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const appEdKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::appEdKeyVM=:<',appEdKeyVM,'>');
  const selectedKeyId = loadLastSavedKeyIdSelection();
  appEdKeyVM.didKeySelected = selectedKeyId;


  const appManifest = Vue.createApp(manifestOption);
  const appManifestVM = appManifest.mount('#vue-ui-app-did-manifest');
  if(apps.trace) {
    console.log('loadDidTeamManifestApps::appManifestVM=:<',appManifestVM,'>');
  }
  
  const otmc = new OtmcTeam();
  if(apps.trace) {
    console.log('loadDidTeamManifestApps::otmc=:<',otmc,'>');
  }
  otmc.on('edcrypt:didKeyList',(didKeyList)=>{
    onDidKeyRefreshKeyApp(didKeyList,appEdKeyVM);
    otmc.switchDidKey(appEdKeyVM.didKeySelected);
  });
  otmc.on('did:manifest',(manifest) => {
    if(apps.trace) {
      console.log('loadDidTeamManifestApps::manifest=:<',manifest,'>');
    }
    const manifestStr = JSON.stringify(manifest,undefined,2);
    if(apps.trace) {
      console.log('loadDidTeamManifestApps::manifestStr=:<',manifestStr,'>');
    }
    appManifestVM.manifest = manifestStr;
    loadCodeEditorApps(manifestStr,appManifestVM);
    loadResultEditorApps('',appManifestVM);
  });

  appEdKeyVM.otmc = otmc;
  apps.edKey = appEdKeyVM;
  
  appManifestVM.otmc = otmc;
  apps.manifest = appManifestVM;
  
}


const loadCodeEditorApps = (textMsg,vm) => {
  const editorOption = {
    theme: "ace/theme/monokai",
    mode: "ace/mode/json",
    minLines: 32,
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
  };
  const editor = ace.edit('app-did-manifest-editor',editorOption);
  if(apps.trace) {
    console.log('loadCodeEditorApps::editor=:<',editor,'>');
    console.log('loadCodeEditorApps::editor.session=:<',editor.session,'>');
  }
  editor.session.insert({row:0, column:0}, textMsg)
  vm.editorManifest = editor;
}

const loadResultEditorApps = (textMsg,vm) => {
  const editorOption = {
    theme: "ace/theme/monokai",
    mode: "ace/mode/json",
    minLines: 32,
  };
  const editor = ace.edit('app-did-manifest-result',editorOption);
  if(apps.trace) {
    console.log('loadResultEditorApps::editor=:<',editor,'>');
    console.log('loadResultEditorApps::editor.session=:<',editor.session,'>');
  }
  editor.session.insert({row:0, column:0}, textMsg)
  editor.setReadOnly(true);
  vm.editorCheck = editor;
}

const onDidKeyRefreshKeyApp = (didKeys,app) => {
  console.log('onDidKeyRefreshKeyApp::didKeys=:<',didKeys,'>');  
  console.log('onDidKeyRefreshKeyApp::app=:<',app,'>');
  app.didKeyList = didKeys;
};
