var account = require('./account');

module.exports = function(app) { 
  app.get('/', function(req, res){
    res.render('index', { title: 'CollabCode Editor' });
  });    

                    
  app.get('/login', account.login);                         
  app.post('/login', account.login);     
  
    
  app.get('/signup', account.signup);
  app.post('/signup',account.signup);
  
  
  app.get('/project', function(req, res) {
    if (!req.session.user) res.redirect('/login') ;
    projectProvider = ProjectProvider.factory();
    if (req.url == '/project/list') {    
      projectProvider.findAll(function(error, result) { 
        res.send(result);
      });   
    } else {
      res.render('project/index');    
    }  
  });
  
  app.post('/project', function(req, res) {
    if (!req.session.user) res.redirect('/login') ;
    projectProvider = ProjectProvider.factory();
    projectProvider.findByName(req.body.name, function(error, project){ 
      console.log(project);  
      if (project) {
         res.render('project/index', {error: 'Duplicated Name'});
      } else {             
        // TODO: create, name get from params
        projectProvider.save({
                   name: req.body.name,
                   creator: 'Charlie',
                   users: [{
                     name: 'Charlie'
                   }]
                }, function(error, projects) { 
                  res.render('project/index');   
                });     
      }
    }); 
  });          
}