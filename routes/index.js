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
  app.get('/users/list', account.list);
  app.get('/project', project.show);
  app.get('/project/list', project.show);
  app.post('/project/new', project.new);
  app.post('/project/:name/new', project.files.new);
  app.post('/project/:name/:id', project.files.share);
  app.post('/project/:name/:id/delete', project.files.delete);
  app.post('/project/:name/rename', project.files.rename);
  // app.get('/project/:name/:id', project.files.findContent);
  // app.post('/project/syncToMongo', project.syncToMongo)
  
}         


