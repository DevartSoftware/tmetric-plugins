var services = require('./services.conf');

browser.addCommand("login", function(serviceName) {
  var service = services[serviceName];
  var fullUrl;
  return this.url(service.login.url)
    .url(function (err, res) {
      fullUrl = res.value.toUpperCase(); 
    })
    .setValue(service.login.usernameField, service.login.username)
    .setValue(service.login.passwordField, service.login.password)
    .click(service.login.submitButton)
    .url(function (err, res) {
      if (res.value.toUpperCase() == fullUrl) {
        // if we are on the same page, this means the login operation failed
        return new Error('Cannot login to ' + serviceName);
      }
    });
});