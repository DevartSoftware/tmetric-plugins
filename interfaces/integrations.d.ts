declare module Integrations {
  interface WebToolIntegration {
    matchUrl?: string | string[];
    matchSelector?: string;
    match?: (source: Source) => boolean;
    issueElementSelector?: string;
    render(issueElement: HTMLElement, linkElement: HTMLElement);
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue;
  }

  interface Source {
    fullUrl: string;
    protocol: string;
    host: string;
    path: string;
  }

  interface WebToolIssue {
    issueName: string;
    issueId?: string;
    issueUrl?: string;
    serviceUrl?: string;
    serviceType?: string;
    projectName?: string;
  }

  interface WebToolIssueTimer extends WebToolIssue {
    isStarted: boolean;
  }
}