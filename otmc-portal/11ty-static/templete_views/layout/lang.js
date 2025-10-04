const multiLang = {
  trace:true,
  debug:true,
};

import * as Vue from 'vue';
document.addEventListener('TopMenuBarLoaded', (evt) => {
  createMultiLanguage_();
});
document.addEventListener('DOMContentLoaded', (evt) => {
  //createMultiLanguage_();
});

const appLangList = [];
const createMultiLanguage_ = async () => {
  let lang = localStorage.getItem(constKeyLanguangeCode);
  if(!lang) {
    lang = 'cn';
  }
  if(multiLang.trace) {
    console.log('multiLang::location=<',location,'>');
    console.log('multiLang::lang=<',lang,'>');
  }
  const langURL = `${location.pathname}lang_${lang}.js`;
  if(multiLang.trace) {
    console.log('multiLang::langURL=<',langURL,'>');
  }
  try {
    const langPromise = import(langURL);
    const langModule = await langPromise;
    if(multiLang.trace) {
      console.log('multiLang::langModule.data=<',langModule.data,'>');
    }
    const langCommonURL = `${constAppPrefix}/layout/lang_${lang}.js`;
    if(multiLang.trace) {
      console.log('multiLang::langCommonURL=<',langCommonURL,'>');
    }
    const langCommonPromise = import(langCommonURL);
    const langCommonModule = await langCommonPromise;
    if(multiLang.trace) {
      console.log('multiLang::langCommonModule.data=<',langCommonModule.data,'>');
    }
    const allData = {...langModule.data, ...langCommonModule.data}
    if(multiLang.trace) {
      console.log('multiLang::allData=<',allData,'>');
    }
    const langElem = document.querySelectorAll('.vue-lang');
    if(multiLang.trace) {
      console.log('multiLang::langElem=<',langElem,'>');
    }
    langElem.forEach((el, i) => {
      if(multiLang.trace) {
        console.log('multiLang::el=<',el,'>');
        console.log('multiLang::allData=<',allData,'>');
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
  } catch (error) {
    console.log('multiLang::error=<',error,'>');
  }
}

window.updateMultiLanguage = () => {
  if(multiLang.trace) {
    console.log('multiLang::updateMultiLanguage=<','','>');
  }
  createMultiLanguage_();
}