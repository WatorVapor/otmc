import * as Vue from 'vue';
import * as ElementPlus from 'elementPlus';
import * as ElementPlusLocaleZhCn from 'elementPlusZh';
//import { default  } from 'elementPlusZh';


const NAVBAR = {
  trace:true,
  debug:true,
}
const activeIndex = Vue.ref('1')
const handleSelect = (key, keyPath) => {
  if(NAVBAR.trace) {
    console.log('w-navbar::handleSelect::key=<',key,'>');
    console.log('w-navbar::handleSelect::keyPath=<',keyPath,'>');
  }
}

if(NAVBAR.trace) {
  console.log('w-navbar::::Vue=<',Vue,'>');
  console.log('w-navbar::::activeIndex=<',activeIndex,'>');
  console.log('w-navbar::::ElementPlus=<',ElementPlus,'>');
  console.log('w-navbar::::ElementPlusLocaleZhCn=<',ElementPlusLocaleZhCn,'>');
}

window.addEventListener('DOMContentLoaded', async (evt) => {
  createTopNavBar_();
});

const epOption = {
  locale: ElementPlusLocaleZhCn.default
};

if(NAVBAR.trace) {
  console.log('w-navbar::::epOption=<',epOption,'>');
}

const appOption = {
  data() {
    return {
      app:{
        
      },
      accout: {
        name:'',
      },
    };
  },
  methods: {
    handleSelect(lang) {
      if(NAVBAR.trace) {
        console.log('w-navbar::handleSelect::lang=<',lang,'>');
      }    
      const activeIndex = Vue.ref('1');
    },
  }
}

const langOption = {
  data() {
    return {
    };
  },
  methods: {
    onClickChangeLang(lang) {
      if(NAVBAR.trace) {
        console.log('w-navbar::onClickChangeLang::lang=<',lang,'>');
      }    
      localStorage.setItem(constKeyLanguangeCode,lang);
      location.reload(true);
    },
  }  
}

const teamOption = {
  data() {
    return {
      accout: {
        name:'',
      },
    };
  },
}


const createTopNavBar_ = async ()=> {
  const app = Vue.createApp(appOption);
  app.use(ElementPlus,epOption);
  const vmApp = app.mount('#vue-ui-navbar');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vmApp=<',vmApp,'>');
  }
/*
  const lang = Vue.createApp(langOption);
  const vmLang = lang.mount('#vue-ui-navbar-top-lang');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vmLang=<',vmLang,'>');
  }

  const team = Vue.createApp(teamOption);
  const vmTeam = team.mount('#vue-ui-navbar-top-team');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vmTeam=<',vmTeam,'>');
  }
*/
  
  /*
  window.vueVm = window.vueVm || {};
  window.vueVm.navbar = vm;

  const evt = document.createEvent('Event');
  evt.initEvent('TopMenuBarLoaded', true, true);
  document.dispatchEvent(evt);
  */
}
