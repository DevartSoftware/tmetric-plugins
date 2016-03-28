
ExtensionBase.prototype.getIssuesDurations = (identifiers) => {
    var durations = identifiers.map(identifier => {
        return {
            serviceUrl: identifier.serviceUrl,
            issueUrl: identifier.issueUrl,
            duration: 3600000000
        };
    });
    return Promise.resolve(durations);
}
