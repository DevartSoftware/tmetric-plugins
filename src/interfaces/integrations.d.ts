declare module Integrations {

    interface WebToolIntegration {
        matchUrl?: string | RegExp | (string | RegExp)[];
        match?: (source: Source) => boolean;
        issueElementSelector?: string | (() => HTMLElement[]);
        observeMutations?: boolean;
        render(issueElement: HTMLElement, linkElement: HTMLElement);
        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue;
        showIssueId: boolean;
    }

    interface Source {

        /** Full url, e.g. http://rm.devart.local/redmine/issues/58480?tab=tabtime_time#tag */
        fullUrl: string;

        /** Protocol, e.g. http:// */
        protocol: string;

        /** Host, e.g. rm.devart.local */
        host: string;

        /** Path, e.g. /redmine/issues/58480 */
        path: string;
    }

    interface WebToolIssueIdentifier {
        serviceUrl?: string;
        issueUrl?: string;
    }

    interface WebToolIssueDuration extends WebToolIssueIdentifier {
        duration: number;
    }

    interface WebToolIssue extends WebToolIssueIdentifier {
        issueName: string;
        issueId?: string;
        serviceType?: string;
        projectName?: string;
        tagsNames?: string[];
    }

    interface WebToolIssueTimer extends WebToolIssue {
        isStarted: boolean;
        showIssueId?: boolean;
    }

    interface WebToolParsedIssue {
        element: HTMLElement;
        issue: WebToolIssue;
    }
}