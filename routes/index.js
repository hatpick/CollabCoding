exports.index = function(req, res){
  res.render('index', { title: 'CollabCode Editor' });
};    


exports.login = function(req, res) {
   // TODO
   console.log(req.body.user_name);
   res.redirect('index.html'); 
};