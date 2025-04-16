class Linear implements WebToolIntegration {
  matchUrl = ["*://linear.app/*"];

  match(source: Source): boolean {
    return source.host.includes("linear.app");
  }

  getIssue(
    _issueElement: HTMLElement,
    source: Source
  ): WebToolIssue | undefined {
    // Extract issue ID
    const issueIdElement = document.querySelector('a[href*="/issue/"] span');
    console.log(`issueIdElement: ${issueIdElement?.outerHTML}`);
    const issueId = issueIdElement?.textContent?.trim();
    console.log(`issueId: ${issueId}`);

    // Extract issue title
    const issueTitleElement = document.querySelector(
      'div[contenteditable="true"] > p'
    );
    const issueTitle = issueTitleElement?.textContent?.trim();

    if (!issueId || !issueTitle) {
      return undefined;
    }

    return {
      issueId,
      issueName: issueTitle,
      serviceType: "Linear",
      serviceUrl: source.protocol + "//" + source.host,
      projectName:
        document
          .querySelector('[aria-label="Project"] span')
          ?.textContent?.trim() ?? undefined, // Linear does not seem to have a direct project name in the provided HTML
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
