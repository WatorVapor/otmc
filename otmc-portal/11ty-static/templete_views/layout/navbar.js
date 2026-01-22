import * as Vue from 'vue';
const NAVBAR = {
  trace:false,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createTopNavBar_();
});

const appsData = [
  {
    href:'rtk-gnss/',
    icon1:'fa-solid fa-satellite',
    icon2:'fa-solid fa-tower-broadcast',
    icon3:'fa-regular fa-compass',
  },
  {
    href:'misc/private-ca/',
    icon1:'fa-solid fa-satellite',
    icon2:'fa-solid fa-tower-broadcast',
    icon3:'fa-regular fa-compass',
  },
];
const appOption = {
  data() {
    return {
      apps:appsData
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
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::app=<',app,'>');
  }
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
}
