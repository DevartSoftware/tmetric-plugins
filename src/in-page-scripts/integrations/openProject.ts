module Integrations {
  class OpenProject implements WebToolIntegration {
    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = [
      '*://*.openproject.com/projects/*/work_packages/*',
      '*://*.openproject.com/work_packages/*'
    ];

    /**
     * If the service may be on a custom domain implement this method
     * to identify pages of the service by other features (e.g. meta-tags).
     */
    match(source: Source): boolean {
      return $$.getAttribute('body', 'ng-app') == 'openproject';
    }

    /**
     * observeMutations = true means that the extension observes the page for
     * dynamic data loading. This means that, if the tool loads some parts of
     * the page with AJAX or generates dynamically, the TMetric extension waits
     * until all loading is done and then adds the button to the page.
     */
    observeMutations = true;
    showIssueId = true;


    /**
     * Extracts information about the issue (ticket or task) from a Web
     * page by querying the DOM model.
     */
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
      let issueId = $$.try('.work-packages--info-row span')[0].textContent;
      let issueName = $$.try('span.subject').textContent;
      let serviceUrl = source.protocol + source.host;
      let issueUrl = source.path;
      let projectName =
          $$.try('#projects-menu .button--dropdown-text').textContent ||
          $$.try('.-project-context span a').textContent;
      let tagNames = $$.all('.labels').map(label => label.textContent);

      return {
        issueId,
        issueName,
        issueUrl,
        projectName,
        serviceUrl,
        serviceType: 'OpenProject',
        tagNames
      };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
      let host = $$('#toolbar-items');
      if (host) {
        var container = $$.create('li', 'toolbar-item');
        container.appendChild(linkElement);
        host.appendChild(container);
      }
    }
  }

  IntegrationService.register(new OpenProject());
}