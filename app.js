#!/usr/bin/env node

var express = require('express')
  , routes = require('./routes')  
  , sharejs = require('share').server
  , exec = require('child_process').exec
  , ProjectProvider = require(__dirname + '/models/projectprovider-mongodb').ProjectProvider;

var app = express();

app.configure(function() {  
  app.set('views', __dirname + '/views');
  app.set('prject', __dirname + '/views/project');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router); 
  app.use(require('stylus').middleware({
    src: __dirname + '/public',
    compress: true
  }));
  app.use(express.static(__dirname + '/public'));
});
   
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});
   
// exports.projectProvider =   
           
app.get('/', routes.index);   
app.post('/login', routes.login);      
app.get('/project', routes.project);
app.get('/project/list', routes.project);
app.post('/project/new', routes.project);
// app.get('/project',  function(req, res) { 
//    res.render('project/index');    
// });
//           
// app.get('/project/list',  function(req, res) { 
//       projectProvider.findAll(function(error, result) { 
//         res.send(result);
//       }); 
// 
// });     
// 
// app.post('/project/new',  function(req, res) { 
//     projectProvider.save({
//         name: req.body.name,
//         creator: 'Charlie',
//         users: [{
//           name: 'Charlie'
//         }]
//      }, function(error, projects) { 
//        res.render('project/index');   
//      });    
// });     

var options = {db: {type: 'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

try {
  require('redis');
  options.db = {type: 'redis'};
  exec('redis-server &', function(err, stdout, stderr) {
    console.log('stdout:' + stdout);
    console.log('stderr:' + stderr);
    if (error) {
      console.log('exec error:' + error);
    }
  });
} catch (e) {
}

options.auth = function(agent, action) {
  console.log(agent.sessionId);
  console.log(agent.remote);
  action.accept();
};
  

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(app, options);

app.listen(8001);
console.log('Server running at http://127.0.0.1:8001/');
