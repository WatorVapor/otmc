const NAVBAR = {
  trace:false,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createTopNavBar_();
});

const createTopNavBar_ = async ()=> {
  const { default:createVueApp } = await import(`${constAppPrefix}/assets/component/navbar.js`);
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::createVueApp=<',createVueApp,'>');
  }
  const app = await createVueApp(gNavbarMethods);
  const vm = app.mount('#vue-navbar-top');  
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::vm=<',vm,'>');
  }
  
  const { DIDTeamAuth } = await import(`${constAppPrefix}/assets/js/did-team-auth.js`);
  if(NAVBAR.trace) {
    console.log('w-navbar::createTopNavBar_::DIDTeamAuth=<',DIDTeamAuth,'>');
  }
  window.vueVm = window.vueVm || {};
  window.vueVm.navbar = vm;

  vm.accout.name = DIDTeamAuth.name();
  const evt = document.createEvent('Event');
  evt.initEvent('TopMenuBarLoaded', true, true);
  document.dispatchEvent(evt);
}

const gNavbarMethods = {
  onClickChangeLang(lang) {
    if(NAVBAR.trace) {
      console.log('w-navbar::onClickChangeLang::lang=<',lang,'>');
    }    
    localStorage.setItem(constKeyLanguangeCode,lang);
    location.reload(true);
  },
};