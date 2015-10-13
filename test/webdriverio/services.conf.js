// This module exports the list of web applications that WebDriverIO will connect while
// running the tests. The list is an associative array, where the service name is the key.

var deepmerge = require('deepmerge'); // A library for deep (recursive) merging of Javascript objects
var logins = require('./logins.conf');

var services = {
	TimeTracker: {
		//
		// =====
		// login
		// =====
		// The object, contanining all information required for WebDriverIO to connect
		// the service automatically.
		login: {
			//
			// ===
			// url
			// ===
			// The address of the login page of the service.
			url: '/account/login', // baseUrl from wdio.conf.js is prepended
			
			//
			// =============
			// usernameField
			// =============
			// The CSS selector that unambiguously resolves the user name input field
			// on the login page.
			usernameField: '#Email',
			
			//
			// ========
			// username
			// ========
			// The value for the the user name input field. Must represent a valid account.
			username: undefined,
			
			//
			// =============
			// passwordField
			// =============
			// The CSS selector that unambiguously resolves the password input field
			// on the login page.
			passwordField: '#Password',
			
			//
			// ========
			// password
			// ========
			// The value for the the password input field. Must represent a valid password
			// for the account.
			password: undefined,
			
			//
			// =============
			// submitButton
			// =============
			// The CSS selector that unambiguously resolves the submit button on the login page.
			submitButton: 'input[type=submit]'
		}
	},
	
	Jira: {
		login: {
			url: 'https://id.atlassian.com/login',
			usernameField: '#username',
			passwordField: '#password',
			submitButton: '#login-submit'
		}
	},
	Tfs: {
		login: {
			url: 'https://devart.visualstudio.com',
			usernameField: '#username',
			passwordField: '#password',
			submitButton: '#login-submit'
		}
	},
	
	// Add new services below
	// ...
};

services = deepmerge(services, logins);

module.exports = services;