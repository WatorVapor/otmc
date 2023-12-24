import * as Vue from 'vue';
const NAVBAR = {
  trace:true,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createTopNavBar_();
});
const appOption = {
  data() {
    return {
      app:{
        
      },
    };
  },
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
  const vmApp = app.mount('#vue-ui-navbar-top-app');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vmApp=<',vmApp,'>');
  }

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

  
  /*
  window.vueVm = window.vueVm || {};
  window.vueVm.navbar = vm;

  const evt = document.createEvent('Event');
  evt.initEvent('TopMenuBarLoaded', true, true);
  document.dispatchEvent(evt);
  */
}
