import * as Vue from 'vue';
console.log('::Vue=:<',Vue,'>');
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadDidTeamApps(evt);
});
const edcryptKeyOption = {
  data() {
    return {
      hasAddress: false,
      address:{
        auth:'',
        recovery:'',
      },
      isMining: false,
      mining:{
        counter: 0,
      }
    };
  },
  methods: {
    clickStartMining(evt) {
      console.log('clickStartMining::this=:<',this,'>');
      const otmc = this.otmc;
      console.log('clickStartMining::otmc=:<',otmc,'>');
      this.isMining = true;
      otmc.startMining();
    },
  }  
}

const loadDidTeamApps = (evt) => {
  const appEdcryptKey = Vue.createApp(edcryptKeyOption);
  const edcryptKeyVM = appEdcryptKey.mount('#vue-ui-app-edcrypt-key');
  console.log('loadDidTeamApps::edcryptKeyVM=:<',edcryptKeyVM,'>');
  
  
  const otmc = new Otmc();
  console.log('loadDidTeamApps::otmc=:<',otmc,'>');
  otmc.on('address',(address)=>{
    onAddressRefresh(address,edcryptKeyVM);
  });
  otmc.on('mining',(mining)=>{
    console.log('loadDidTeamApps::mining=:<',mining,'>');
    edcryptKeyVM.mining = mining;
  });
  edcryptKeyVM.otmc = otmc;
}

const onAddressRefresh = (address,app) => {
  console.log('onAddressRefresh::address=:<',address,'>');  
  console.log('onAddressRefresh::app=:<',app,'>');
  app.hasAddress = true;
  app.isMining = false;
  app.address = address;
};