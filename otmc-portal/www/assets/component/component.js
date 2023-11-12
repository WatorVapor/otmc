const maapComponent = {
  debug:false
};

import * as Vue from 'https://cdn.jsdelivr.net/npm/vue@3.2.37/dist/vue.esm-browser.prod.js';
const loadComponetHtml = async (url) => {
  const templateResp = await fetch(url);
  if(maapComponent.debug) {
    console.log('maapComponent::loadComponetHtml:templateResp:=<',templateResp,'>');
  }
  const templateText = await templateResp.text();
  if(maapComponent.debug) {
    console.log('maapComponent::loadComponetHtml:templateText:=<',templateText,'>');
  }
  return templateText;
}

const createMaapVueApp = async (tag,url,data,methods,props)=> {
  const templateText = await loadComponetHtml(url)
  if(maapComponent.debug) {
    console.log('maapComponent::createMaapVueApp:templateText:=<',templateText,'>');
  }
  const appOption = {
    data() {
     return data;
    },
  };
  const compOption = {
    data() {
     return data;
    },
    methods:methods,
    props:props,
    template:templateText
  };
  const vueApp = Vue.createApp(appOption);
  vueApp.component(tag,compOption);
  if(maapComponent.debug) {
    console.log('maapComponent::createMaapVueApp:vueApp:=<',vueApp,'>');
  }
  return vueApp;
}
export default createMaapVueApp;
