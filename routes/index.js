exports.index = function(req, res){
  res.render('index', { title: 'CollabCode Editor' });
};    


exports.login = function(req, res) {  
   // TODO: check
   res.redirect('project'); 
};                         


exports.project = function(req, res) { 
  projectProvider = ProjectProvider.factory();
  if (req.method == 'POST') {   
    projectProvider.findByName(req.body.name, function(error, project){ 
      console.log(project);  
      if (project) {
         res.render('project/index', {error: 'Duplicated Name'});
      } else {
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
  

  } else if (req.method == 'GET') { 
      if (req.url == '/project/list') {    
        projectProvider.findAll(function(error, result) { 
          res.send(result);
        });   
      } else {
        res.render('project/index');    
      }
   }
};