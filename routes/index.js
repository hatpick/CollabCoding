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
  app.get('/project', project.show);
  app.post('/project/new', project.new);
  app.post('/project/:name/new', project.files.new);
  
}         


