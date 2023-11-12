import * as Vue from 'https://cdn.jsdelivr.net/npm/vue@3.2.37/dist/vue.esm-browser.prod.js';
document.addEventListener('TopMenuBarLoaded', (evt) => {
  createMultiLanguage_();
});
const multiLang = {
  trace:true,
  debug:true,
};

const appLangList = [];
const createMultiLanguage_ = async () => {
  let lang = localStorage.getItem(constKeyLanguangeCode);
  if(!lang) {
    lang = 'cn';
  }
  if(multiLang.trace) {
    console.log('::location=<',location,'>');
    console.log('::lang=<',lang,'>');
  }
  const langURL = `${location.pathname}lang_${lang}.js`;
  if(multiLang.trace) {
    console.log('::langURL=<',langURL,'>');
  }
  const langPromise = import(langURL);
  const langModule = await langPromise;
  if(multiLang.trace) {
    console.log('::langModule.data=<',langModule.data,'>');
  }
  const langCommonURL = `${constAppPrefix}/layout/lang_${lang}.js`;
  if(multiLang.trace) {
    console.log('::langCommonURL=<',langCommonURL,'>');
  }
  const langCommonPromise = import(langCommonURL);
  const langCommonModule = await langCommonPromise;
  if(multiLang.trace) {
    console.log('::langCommonModule.data=<',langCommonModule.data,'>');
  }
  const allData = {...langModule.data, ...langCommonModule.data}
  if(multiLang.trace) {
    console.log('::allData=<',allData,'>');
  }
  const langElem = document.querySelectorAll('.vue-lang');
  if(multiLang.trace) {
    console.log('createMultiLanguage_::langElem=<',langElem,'>');
  }
  langElem.forEach((el, i) => {
    if(multiLang.trace) {
      console.log('createMultiLanguage_::el=<',el,'>');
      console.log('createMultiLanguage_::allData=<',allData,'>');
    }
    const app = Vue.createApp({
      data() {
        return allData;
      },
      delimiters:['{%', '%}']
    });
    const vm = app.mount(el);
    appLangList.push(vm);
  });  
}

window.updateMultiLanguage = () => {
  if(multiLang.trace) {
    console.log('updateMultiLanguage::=<','','>');
  }
  createMultiLanguage_();
}