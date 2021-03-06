var account = require('./account'),
    project = require('./project');    



module.exports = function(app) {  
  
  function requireAuthentication(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    } else {
      return next();
    }
  };

  app.all('/project/*', requireAuthentication);
  app.all('/project', requireAuthentication);
  
  app.get('/', function(req, res){
    res.render('index', { title: 'CollabCode Editor' });
  });    
                    
  app.all('/login', account.login);                         
  app.get('/logout', account.logout);
  app.all('/signup', account.signup);
  app.get('/user', account.user);
  app.get('/users/list', account.list);
  app.get('/users/mentionList', account.mentionList);
  app.get('/project', project.show);
  app.get('/project/list', project.show);
  app.post('/project/new', project.new);
  app.post('/project/:name/new', project.files.new);
  app.post('/project/:name/saveXML', project.files.saveXML);
  app.get('/project/loadXML/:id', project.files.getContent);
  app.post('/project/:name/:id', project.files.share);
  app.get('/project/:path/augment', project.files.augmentMe);
  app.post('/project/:name/:id/delete', project.files.delete);
  app.post('/project/:name/rename', project.files.rename);
  app.post('/webRTCchat/createSession', project.chat.createRTCSession);
  app.post('/project/comment/:id/updateLineNumber', project.comment.updateLineNumber);
  app.post('/project/lockedCode/:id/updateLineNumber', project.lockedCode.updateLineNumber);
  // app.get('/project/:name/:id', project.files.findContent);
  // app.post('/project/syncToMongo', project.syncToMongo)  
  
}         


