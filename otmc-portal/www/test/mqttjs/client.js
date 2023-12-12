
const mqttWorker = new SharedWorker('./mqtt.shared.worker.js',{type:'module',name:'otmc.mqtt.worker'});
mqttWorker.port.start();
mqttWorker.port.addEventListener('message', message => {
  console.log('::mqttWorker.message:message=:<',message,'>');
});
mqttWorker.port.postMessage(['I have a nice message for all']);

/*
const mqttWorker = new Worker('./mqtt.shared.worker.js',{type:'module'});
*/
console.log(':::mqttWorker=:<',mqttWorker,'>');
mqttWorker.onerror = (err) => {
  console.log('::mqttWorker.onerror:err=:<',err,'>');
}
