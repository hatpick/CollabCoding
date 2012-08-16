exports.show = function(req, res) {
  projectProvider = ProjectProvider.factory();
  if (req.url == '/project/list') {    
    projectProvider.findAll(function(error, result) { 
      res.send(result);
    });   
  } else {
    res.render('project/index');    
  }  
};

exports.new  = function(req, res) { 
  var project_name = req.body.pname;   
  projectProvider = ProjectProvider.factory();
  projectProvider.findByName(project_name, function(error, project){ 
    if (project) {
       res.render('project/index', {error: 'Duplicated Name'});
    } else {             
      // TODO: create, name get from params
      projectProvider.save({
                 name: project_name,
                 creator: req.session.user.name,
                 users: [{
                   name: 'Charlie'
                 }],
                 root: {
                   html: [],
                   css: [],
                   js:[],
                   files: []
                 }
              }, function(error, projects) { 
                res.render('project/index');   
              });
     res.render('project/index');
    }
  }); 
};    

exports.files = {};

exports.files.new = function(req, res, next) {
  console.log('project: ' + req.params['name']);  
  console.log('foler: ' + req.body.folder);
  console.log('file: ' + req.body.file); 
  var project_name = req.params['name'];
  var folder = req.body.folder;
  var file = req.body.file;
  projectProvider.update(project_name, {folder: folder, file: file});
                                           
  return next();
};

