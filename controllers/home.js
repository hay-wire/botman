/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.privacyPolicy = function(req, res){
  res.render('privacypolicy', {
    title: 'Privacy Policy'
  });
};