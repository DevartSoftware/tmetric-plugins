/// <reference path="../typings/jasmine/jasmine" />
/// <reference path="../in-page-scripts/IntegrationService" />

describe("Extension correctly parses", () =>
{
    describe("Jira", () =>
    {
        it("standalone task page", () =>
        {
            // https://testdevart1.atlassian.net/browse/TT-1
            addTemplateToBrowser('testJira.html');

            var result = Integrations.IntegrationService.parsePage();
            expect(result.length).toBe(1);
            console.log(result[0]);
            expect(result[0]).toBe({
                issueId: 'TT-1',
                issueName: 'Create integration with Jira',
                issueUrl: '/browse/TT-1',
                projectName: 'Time Tracker',
                serviceUrl: 'http://localhost:9876',
                serviceType: 'Jira'
            });
        });

        xit("standalone task page", () =>
        {
            // https://testdevart1.atlassian.net/servicedesk/agent/DESK/queues/1/DESK-1
            addTemplateToBrowser('jiraServiceDesk.html');

            var result = Integrations.IntegrationService.parsePage();
            expect(result.length).toBe(1);
            //expect(result[0]).toBe({
            //    issueId: 'TT-1',
            //    issueName: 'Create integration with Jira',
            //    issueUrl: '/browse/TT-1',
            //    projectName: 'Time Tracker',
            //    serviceUrl: 'http://localhost:9876',
            //    serviceType: 'Jira'
            //});
        });
    });
});


var addTemplateToBrowser = (templateName: string) =>
{
    var pathToTemplate = 'base/spec/templates/' + templateName;

    var file = $.ajax(pathToTemplate, { async: false, type: 'GET' });

    var content = file.responseText;
    expect(content).toBeDefined();

    // remove all <script> tags
    content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, '');

    // remove all <link> tags
    content = content.replace(/<link.*>/gim, '');

    document.body.innerHTML = content;
}