var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Nuget-Docker',
  description: 'Nuget to docker wrapper.',
  script: 'C:\\Users\\Administrator\\nuget-docker\\index.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();