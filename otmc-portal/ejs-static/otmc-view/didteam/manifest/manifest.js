import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamManifestApps(evt);
});

const apps = {};


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




const loadDidTeamManifestApps = (evt) => {
  const appManifest = Vue.createApp(manifestOption);
  const appManifestVM = appManifest.mount('#vue-ui-app-did-manifest');
  console.log('loadDidTeamManifestApps::appManifestVM=:<',appManifestVM,'>');
  
  
  const otmc = new Otmc();
  console.log('loadDidTeamManifestApps::otmc=:<',otmc,'>');
  otmc.on('edcrypt:address',(address)=>{
  });
  otmc.on('did:manifest',(manifest) => {
    console.log('loadDidTeamManifestApps::manifest=:<',manifest,'>');
    const manifestStr = JSON.stringify(manifest,undefined,2);
    console.log('loadDidTeamManifestApps::manifestStr=:<',manifestStr,'>');
    appManifestVM.manifest = manifestStr;
    loadCodeEditorApps(manifestStr);
  });
  appManifestVM.otmc = otmc;
  apps.manifest = appManifestVM;
}


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
