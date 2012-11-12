var CT = require('../modules/country-list');
var AM = require('../models/accountprovider-mongodb');
var EM = require('../modules/email-dispatcher');         


exports.login = function(req, res) {  
  if (req.method == 'GET') {
      if (req.cookies.user == undefined || req.cookies.pass == undefined){
        res.render('account/login', { title: 'Hello - Please Login To Your Account' });
      } else{
    // attempt automatic login //
        AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
          if (o != null){
            req.session.user = o;
            res.redirect('/project');
          } else{
            res.render('account/login', { title: 'Hello - Please Login To Your Account' });
          }
        });
      }
  } else {        
    if (req.param('email') != null){
      AM.getEmail(req.param('email'), function(o){
        if (o){
          res.send('ok', 200);
          EM.send(o, function(e, m){ console.log('error : '+e, 'msg : '+m)}); 
        } else{
          res.send('email-not-found', 400);
        }
      });
    } else{
    // attempt manual login //  
      AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
        if (!o){
          res.render('account/login', {title: 'Hello - Please Login To Your Account', error: "User not found"});
        } else{
            req.session.user = o;
          if (req.param('remember-me') == 'true'){
            res.cookie('user', o.user, { maxAge: 900000 });
            res.cookie('pass', o.pass, { maxAge: 900000 });
          }     
          res.redirect('/project');
        }
      });
    }
  }
};       

exports.user = function(req, res) {
    res.json(req.session.user);
}

exports.logout = function(req, res) {
  res.clearCookie('user');
  res.clearCookie('pass');
  req.session.destroy(function(e){ res.redirect('/') });
};


exports.signup = function(req, res) {
  if (req.method == 'GET') {
    res.render('account/signup',  { title: 'Signup', countries : CT });
  } else {
    AM.signup({
      name  : req.param('name'),
      email   : req.param('email'),
      user  : req.param('user'),
      pass  : req.param('pass'),
      country : req.param('country')
    }, function(e, o){
      if (e){
        res.send(e, 400);
      } else{
        res.send('ok', 200);
      }
    });
  }
};     


exports.list = function(req, res) {
  AM.getAllRecords(function(err, result) {
     res.json(result);
  });
};