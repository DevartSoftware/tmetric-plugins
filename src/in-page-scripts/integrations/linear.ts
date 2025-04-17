class Linear implements WebToolIntegration {
  showIssueId = true;

  matchUrl = ["*://linear.app/*"];

  match(source: Source): boolean {
    return source.host.includes("linear.app");
  }

  getIssue(
    _issueElement: HTMLElement,
    source: Source
  ): WebToolIssue | undefined {
    // Extract issue title
    const issueTitleElement = document.querySelector(
      'div[contenteditable="true"] > p'
    );
    const issueTitle = issueTitleElement?.textContent?.trim();

    
    const match = RegExp(/^\/([^/]+)\/issue\/([^/]+)\/(.+)$/).exec(source.path);
    if (!match) {
      return undefined;
    }
    
    const [, workspace, issueId, issueTitleUrl] = match;
    
    if (!issueId || !issueTitle) {
      return undefined;
    }
    // Try to extract project name
    const projectElement = document.querySelector(
      `[href^="/${workspace}/project/"]`
    );
    const projectName = projectElement?.textContent?.trim() ?? undefined;

    return {
      issueId,
      issueName: issueTitle,
      serviceType: "Linear",
      serviceUrl: `${source.protocol}//${source.host}`,
      issueUrl: `/${workspace}/issue/${issueId}/${issueTitleUrl}`,
      projectName,
    };
  }

  render(_issueElement: HTMLElement, linkElement: HTMLElement): void {
    // Insert the TMetric button into the header
    const header = document.querySelector("header");
    if (header) {
      header.appendChild(linkElement);
    }
  }
}

IntegrationService.register(new Linear());
