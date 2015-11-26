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
            url: '/login', // baseUrl from wdio.conf.js is prepended

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

    GitLab: {
        login: {
            url: 'http://gitlab.com/users/sign_in',
            usernameField: '#user_login',
            passwordField: '#user_password',
            submitButton: '.btn.btn-save'
        }
    },

    GitHub: {
        login: {
            url: 'https://github.com/login',
            usernameField: '#login_field',
            passwordField: '#password',
            submitButton: 'input[name=commit]'
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

    Redmine: {
        login: {
            url: 'http://demo.redmine.org/login',
            usernameField: '#username',
            passwordField: '#password',
            submitButton: 'input[type=submit]'
        }
    },

    TFS: {
        login: {
            url: 'https://login.live.com/login.srf',
            usernameField: 'input[type=email]',
            passwordField: 'input[type=password]',
            submitButton: 'input[type=submit]'
        }
    },

    Trello: {
        login: {
            url: 'https://trello.com/login',
            usernameField: '#user',
            passwordField: '#password',
            submitButton: '#login'
        }
    }
};

services = deepmerge(services, logins);

module.exports = services;