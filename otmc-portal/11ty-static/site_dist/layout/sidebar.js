import * as Vue from 'vue';
const SIDEBAR = {
  trace:true,
  debug:true,
}
window.addEventListener('DOMContentLoaded', async (evt) => {
  createSideBar_();
});
const sbOption = {
  data() {
    const option = {};
    return option;
  },
}


const createSideBar_ = async ()=> {
  const app = Vue.createApp(sbOption);
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::app=<',app,'>');
  }
  const vmApp = app.mount('#vvue-ui-sidebar');  
  if(SIDEBAR.trace) {
    console.log('w-sidebar::createSideBar_::vmApp=<',vmApp,'>');
  }
}
