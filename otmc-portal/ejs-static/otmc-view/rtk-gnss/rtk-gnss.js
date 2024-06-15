import * as Vue from 'vue';
import { Otmc } from 'otmc';

document.addEventListener('DOMContentLoaded', async (evt) => {
  loadRtkGnssApps(evt);
});

const loadRtkGnssApps = (evt) => {
  const otmc = new Otmc();
  console.log('loadRtkGnssApps::otmc=:<',otmc,'>');
  otmc.on('otmc:mqtt:app',(appMsg) => {
    console.log('loadRtkGnssApps::appMsg=:<',appMsg,'>');
  });
}
