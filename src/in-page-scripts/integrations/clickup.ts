class ClickUp implements WebToolIntegration {
    showIssueId = true;

    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = ["*://*.clickup.com/t/*"];

    /**
     * observeMutations = true means that the extension observes the page for
     * dynamic data loading. This means that, if the tool loads some parts of
     * the page with AJAX or generates dynamically, the TMetric extension waits
     * until all loading is done and then adds the button to the page.
     */
    observeMutations = true;

    /**
     * Extracts information about the issue (ticket or task) from a Web
     * page by querying the DOM model.
     */
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        var issueId = source.path.replace("/t/", "");
        var issueName = $$.try(".task-name-container .task-name__overlay")
            .textContent;
        var serviceUrl = source.protocol + source.host;
        var issueUrl = "#" + source.path;
        var projectName = assignTrimmedString(
            ".task-container__header .breadcrumbs .breadcrumbs__link:nth-of-type(2)"
        );

        var listName = assignTrimmedString(
            ".task-container__header .breadcrumbs .breadcrumbs__link:nth-of-type(3)"
        );

        var issueObj = {
            issueId,
            issueName,
            issueUrl,
            projectName: listName
                ? projectName + " - " + listName
                : projectName,
            serviceUrl,
            serviceType: "ClickUp"
        };

        function assignTrimmedString(str) {
            var text = $$.try(str);
            if (typeof text.textContent === "string") {
                return text.textContent
                    .replace(/[\n\r]+|[\s]{2,}/g, " ")
                    .trim();
            } else {
                return;
            }
        }

        console.log("issueObj:", issueObj);
        return issueObj;
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        console.log("render:", linkElement);
        var host = $$(".cu-task-info_task-created").parentNode;
        if (host) {
            var container = $$.create("div", "cu-task-info");
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }
}

IntegrationService.register(new ClickUp());
