// This module exports the logins for third-party serivces that WebDriverIO will connect while running the tests.
// The file is automatically merged with 'services.conf.js' and must have the same structure.
// See 'services.conf.js' file for the documentation.
//
// IMPORTANT:
// DON'T commit this file to the repository. This will expose the login information to public.
module.exports = {
	TimeTracker: {
		login: {
			username: '',
			password: ''
		}
	},
	
	Jira: {
		login: {
			username: '',
			password: ''
		}
	},
	
	GitLab: {
		login: {
			username: '',
			password: ''
		}
	},
	
	Redmine: {
		login: {
			username: '',
			password: ''
		}
	}
}
