import * as Vue from 'vue';
const SIDEBAR = {
  trace:true,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createSideBar_();
});

const menuItems = [
  {
    href:'./',
    title:'Top',
    icon1:'fa-solid fa-satellite',
    icon2:'fa-solid fa-tower-broadcast',
    icon3:'fa-regular fa-compass',
    subMenu : [
    ]
  },
];

const sbOption = {
  data() {
    const option = {
      menuTree:menuItems
    };
    return option;
  },
}


const createSideBar_ = async ()=> {
  const app = Vue.createApp(sbOption);
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::app=<',app,'>');
  }
  const vmApp = app.mount('#vue-ui-sidebar');  
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::vmApp=<',vmApp,'>');
  }
}
