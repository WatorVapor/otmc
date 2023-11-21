self.trace = true;
self.debug = true;


self.addEventListener('message', (evt) =>{
  if(self.trace) {
    console.log('otmc.worker.mqtt::::evt=:<',evt,'>');
  }
  onMessage(evt.data);
});
const onMessage = async (msg) => {
  if(self.trace) {
    console.log('otmc.worker.mqtt::onMessage::msg=:<',msg,'>');
  }
}
