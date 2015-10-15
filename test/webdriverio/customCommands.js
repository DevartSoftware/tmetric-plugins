var services = require('./services.conf');

browser.addCommand("login", function (serviceName) {
  var service = services[serviceName];
  var fullUrl;

  var normalizeUrl = function (url) {
    // remove double slashes and trailing slash
    return url.replace(/\/\//g, '/').replace(/\/$/, '').toUpperCase();
  }

  return this.url(service.login.url)
    .url(function (err, res) {
      fullUrl = normalizeUrl(res.value);
    })
    .setValue(service.login.usernameField, service.login.username)
    .setValue(service.login.passwordField, service.login.password)
    .click(service.login.submitButton)
    .waitUntil(function () {
      return browser.url().then(function (res) {
        return res && res.value && normalizeUrl(res.value) != fullUrl
      });
    }, 5000)
    .url(function (err, res) {
      if (normalizeUrl(res.value) == fullUrl) {
        // if we are on the same page, this means the login operation failed
        return new Error('Cannot login to ' + serviceName);
      }
    });
});