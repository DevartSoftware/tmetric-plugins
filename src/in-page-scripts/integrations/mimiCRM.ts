class MimiCRM implements WebToolIntegration {

    showIssueId = true;

    /**
     * The array of URLs (with wildcards) that are used to identify
     * pages as those that belong to the service.
     */
    matchUrl = [
        '*://*/orders/edit/*',
        '*://*/simple_orders/edit/*',
        '*://*/tickets/edit/*',
        '*://*/contacts/edit/*',
        '*://*/tasks/edit/*'
    ];

    /**
     * If the service may be on a custom domain implement this method
     * to identify pages of the service by other features (e.g. meta-tags).
     */
    /*match = {
        return false;
}*/

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
        /*https://rw.mimicrm.com/orders/edit/56194*/
        var matches = source.fullUrl.match(/(?:\/\/(.*)\.mimicrm\.com\/(orders|simple_orders|tickets|contacts|tasks))\/edit\/(\d+)/);
        if (!(!!matches && !!matches[3])) {
            return null;
        }

        var a = source.fullUrl;

        console.log('a 1-st iteration');
        console.log(a);
        a.match(/(?:\/\/(.*)\.mimicrm\.com\/(orders|simple_orders|tickets|contacts|tasks))\/edit\/(\d+)/);
        console.log('a 2-nd iteration');
        console.log(a);
        //var projectName: string = matches[1].toUpperCase();
        /*https://rw.mimicrm.com/orders/edit/56194    matches[1] = rw*/
        var projectName: string = matches[1].toUpperCase();
        /*https://rw.mimicrm.com/orders/edit/56194    matches[3] = 56194*/
        var issueId = matches[3];
        var issueUrl: string = '/' + matches[2] + '/edit/' + issueId;
        var serviceUrl: string = source.protocol + source.host;
        var issueName: string;
        var desc = $$.try("#tmetric-description").textContent;
        if (matches[2] == 'tickets') {
            issueName = ` [ticket] ${desc}`;
        }
        if (matches[2] == 'orders') {
            issueName = ` [order] ${desc}`;
        }
        if (matches[2] == 'simple_orders') {
            issueName = ` [simple_order] ${desc}`;
        }
        if (matches[2] == 'contacts') {
            issueName = ` [contact] ${desc}`;
        }
        if (matches[2] == 'tasks') {
            issueName = `[task] ${desc}`;
        }

        //issueName = matches[2] + " - " + issueId;
        return {
            issueId,
            issueName,
            issueUrl,
            serviceUrl,
            projectName,
            serviceType: 'MimiCRM'
        };
    }

    /**
     * Inserts the timer button for the identified issue into a Web page.
     */
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let host = $$("#tmetric-button-anchor");
        if (!host) {
            return;
        }
        /*let container = $$.create('div');
        container.appendChild(linkElement);*/
        host.appendChild(linkElement);
    }
}

IntegrationService.register(new MimiCRM());
