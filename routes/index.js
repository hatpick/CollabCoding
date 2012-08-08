exports.index = function(req, res){
  res.render('index', { title: 'CollabCode Editor' });
};    


exports.login = function(req, res) {
   // TODO
   res.redirect('index.html');
};