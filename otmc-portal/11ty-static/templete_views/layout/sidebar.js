import * as Vue from 'vue';

const SIDEBAR = {
  trace:true,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createSideBar_();
});

/*
const readMenuItemFromApp = async () => {
  let goodPath = document.location.pathname;
  if(goodPath === '/') {
    goodPath = '';
  }
  const sideMenuDataPath = `${goodPath}/appData.js`
  if(SIDEBAR.trace) {
    console.log('w-sidebar::readMenuItemFromApp::sideMenuDataPath=<',sideMenuDataPath,'>');
  }
  let sideMenuData = [];
  try {
    const smModule = await import(sideMenuDataPath);
    if(SIDEBAR.trace) {
      console.log('w-sidebar::readMenuItemFromApp::smModule=<',smModule,'>');
    }
    sideMenuData = smModule.SideMenuItems;
    if(SIDEBAR.trace) {
      console.log('w-sidebar::readMenuItemFromApp::sideMenuData=<',sideMenuData,'>');
    }
  } catch {
    
  }
  return sideMenuData;
}
*/

const readMenuItemFromApp = async () => {
  if(SIDEBAR.trace) {
    console.log('w-sidebar::readMenuItemFromApp::window.otmc=<',window.otmc,'>');
  }
  let sideMenuData = [];
  try {
    if(window.otmc && window.otmc.SideMenuItems) {
      sideMenuData = window.otmc.SideMenuItems;
    }
  } catch {
    
  }
  return sideMenuData;
}

const createSideBar_ = async ()=> {
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::window.otmc=<',window.otmc,'>');
  }
  const sideMenuData = await readMenuItemFromApp();
  const sbOption = {
    data() {
      const option = {
        menuTree:sideMenuData
      };
      return option;
    },
  };
  const app = Vue.createApp(sbOption);
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::app=<',app,'>');
  }
  const vmApp = app.mount('#vue-ui-sidebar');  
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::vmApp=<',vmApp,'>');
  }
}