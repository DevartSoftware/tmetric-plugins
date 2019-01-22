class SalesforceClassic implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*.salesforce.com';

    issueElementSelector = [
        '.bPageTitle', // page title
        '.bMyTask .list tr.dataRow', // task from my tasks area in calendar
        '.x-grid3-col-TASK_SUBJECT', // task in activity list view (My Activities)
        '.x-grid3-col-Subject' // task in activity list view (Today's Tasks)
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            let host = $$('.pageType', issueElement);
            if (host) {
                linkElement.style.marginLeft = '0.5rem';
                host.appendChild(linkElement);
            }
        } else {
            let host: HTMLElement;
            if (issueElement.matches(this.issueElementSelector[1])) {
                host = $$.try('.actionColumn', issueElement);
            } else if (issueElement.matches(this.issueElementSelector[2]) || issueElement.matches(this.issueElementSelector[3])) {
                host = issueElement;
            }

            if (host) {
                linkElement.classList.add('devart-timer-link-minimal');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let serviceType = 'SalesforceClassic';

        let serviceUrl = source.protocol + source.host;

        let issueName: string;
        let issueId: string;
        let issueUrl: string;

        if (issueElement.matches(this.issueElementSelector[0])) {
            let match = /^\/(\w+)$/.exec(source.path);
            if (match) {
                issueName = $$.try('.pageDescription', issueElement).textContent;
                issueId = match[1];
            }
        } else {
            let anchor: HTMLAnchorElement;
            if (issueElement.matches(this.issueElementSelector[1])) {
                anchor = <HTMLAnchorElement>$$.try('.dataCell a', issueElement);
            } else if (issueElement.matches(this.issueElementSelector[2]) || issueElement.matches(this.issueElementSelector[3])) {
                anchor = <HTMLAnchorElement>$$.try('a:not(.devart-timer-link)', issueElement);
            }

            let match = /\/(\w+)$/.exec(anchor.href);
            if (match) {
                issueName = anchor.textContent;
                issueId = match[1];
            }
        }

        if (!issueName) {
            return;
        }

        if (issueId) {
            issueUrl = '/' + issueId;
        }

        return { serviceType, serviceUrl, issueName, issueId, issueUrl };
    }
}

IntegrationService.register(new SalesforceClassic());

class SalesforceLightning implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    // https://eu16.lightning.force.com/lightning/r/PAGE/IDENTIFIER/view
    matchUrl = '*://*.lightning.force.com';

    issueElementSelector = [
        '.slds-page-header', // page header
        '#activityPanelContainer .primaryField', // task from activity panel on page
        '.runtime_sales_activitiesTaskContentFields .subject' // task on tasks tab in split view
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            let host = $$.try('.forceActionsContainer', issueElement);
            if (host) {
                linkElement.style.marginRight = '0.5rem';
                linkElement.style.alignSelf = 'center';
                host.insertBefore(linkElement, host.firstElementChild);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            let host = $$.try('a', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-minimal');
                linkElement.style.marginLeft = '0.5rem';
                host.parentElement.insertBefore(linkElement, host.nextElementSibling);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            let host = $$.try('.primaryField ', issueElement);
            if (host) {
                linkElement.style.marginLeft = '1rem';
                host.parentElement.appendChild(linkElement);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let serviceType = 'SalesforceLightning';

        let serviceUrl = source.protocol + source.host;

        let issueName: string;
        let issueId: string;
        let issueUrl: string;

        if (issueElement.matches(this.issueElementSelector[0])) {
            let match = /\/lightning\/r\/(\w+)\/(\w+)\/view$/.exec(source.path);
            if (match) {
                issueName = $$.try('h1 .uiOutputText', issueElement).textContent;
                issueId = match[2];
            }
        } else {
            let anchor: HTMLAnchorElement;
            if (issueElement.matches(this.issueElementSelector[1])) {
                anchor = <HTMLAnchorElement>$$.try('a', issueElement);
            } else if (issueElement.matches(this.issueElementSelector[2])) {
                anchor = <HTMLAnchorElement>$$.try('a', issueElement);
            }

            let match = /\/lightning\/r\/(\w+)\/view/.exec(anchor.href);
            if (match) {
                issueName = anchor.textContent;
                issueId = match[1];
            }
        }

        if (!issueName) {
            return;
        }

        if (issueId) {
            issueUrl = `/lightning/r/${issueId}/view`;
        }

        return { serviceType, serviceUrl, issueName, issueId, issueUrl };
    }
}

IntegrationService.register(new SalesforceLightning());