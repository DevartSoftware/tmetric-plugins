declare interface ServiceConfigs {
    [serviceName: string]: ServiceConfig
}

declare interface ServiceConfig {
    login: {
        url: string;
        usernameField: string;
        passwordField: string;
        submitButton: string;
        username: string;
        password: string;
    }
}