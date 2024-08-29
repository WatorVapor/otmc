import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});

const apps = {};

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
  const appDidTeam = Vue.createApp(didTeamOption);
  const appDidVM = appDidTeam.mount('#vue-ui-app-did-team');
  console.log('loadDidTeamApps::appDidVM=:<',appDidVM,'>');
  const otmc = new Otmc();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
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
