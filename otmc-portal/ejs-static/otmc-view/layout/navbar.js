import * as Vue from 'vue';
const NAVBAR = {
  trace:true,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createTopNavBar_();
});
const navbarOption = {
  data() {
    return {
      accout: {
        name:'',
      }
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

const createTopNavBar_ = async ()=> {
  const app = Vue.createApp(navbarOption);
  const vm = app.mount('#vue-navbar-top');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vm=<',vm,'>');
  }
  /*
  window.vueVm = window.vueVm || {};
  window.vueVm.navbar = vm;

  const evt = document.createEvent('Event');
  evt.initEvent('TopMenuBarLoaded', true, true);
  document.dispatchEvent(evt);
  */
}
