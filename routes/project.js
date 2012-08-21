var hat = require('hat');
exports.show = function(req, res) {
  projectProvider = ProjectProvider.factory();
  if (req.url == '/project/list') {    
    projectProvider.findAll(function(error, result) { 
      res.json(result);
    });   
  } else {    
    var project_name = req.query.name;
    console.log('project_name:' + project_name);
    if (project_name) {
      projectProvider.findByName(project_name, function(error, result) {
        console.log('result: '  + result);
        res.json(result); 
      });
    } else {
      res.render('project/index');
    }
  }  
};

exports.new  = function(req, res) { 
  var project_name = req.body.pname;   
  projectProvider = ProjectProvider.factory();
  projectProvider.findByName(project_name, function(error, project){ 
    console.log(project);
    if (project) {
        console.log('error: duplicated');
       res.render('project/index', {error: 'Duplicated Name'});
    } else {             
      // TODO: create, name get from params
      projectProvider.save({
                 name: project_name,
                 creator: req.session.user.name,
                 users: [{
                   name: req.session.user.name
                 }],
                 root: {
                   html: [],
                   css: [],
                   js:[],
                   files: [{
                     name: 'index.html', 
                     type: "file",
                     shareJSId: hat(), // FIXME check unique id or not
                     created_on: new Date(),
                     last_modified_on: new Date()
                   }]
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

  var project_name = req.params['name'];
    
  var obj = {};                      
  obj.paths = req.body.paths;
  obj.name = req.body.name;
  obj.type = req.body.type;
  obj.shareJSId = hat(); // FIXME check unique id or not
  obj.created_on = new Date();
  obj.last_modified_on = new Date();
  
  projectProvider.new(project_name, obj, function(error, project) {
     if (error) {
       res.send(404, {error: error});
     }
     res.send(200);
  });
  
}; 


exports.files.rename = function(req, res, next) {
   var project_name = req.params['name'];
   var obj = {};
   obj.old_name = req.body.old_name;
   obj.new_name = req.body.new_name;
}

