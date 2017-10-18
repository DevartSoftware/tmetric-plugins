class Bitrix24 implements WebToolIntegration {

    showIssueId = false;

    matchUrl = '*://*.bitrix24.com/*/tasks/';

    observeMutations = true;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        /*let host = $$('.pagetitle-inner-container');
        if (host) {
            host.appendChild(linkElement)
        }*/

        /*let host = $$('.task-detail-header');
        if (host) {
            console.log('host')
        }*/

        let iframe = <HTMLIFrameElement>$$('.slider-panel-iframe');
        console.log('iframe')
        if (iframe) {
            let header = iframe.contentDocument.querySelector('.task-detail-header');
            console.log('header')
            if (header) {
                let devartBtn = iframe.contentDocument.querySelector('a.devart-timer-link');
                if (devartBtn) {
                    header.insertBefore(devartBtn, header.firstElementChild);
                } else {
                    header.insertBefore(linkElement, header.firstElementChild);
                }
                console.log('btn')
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = 'test';

        //let iframe = <HTMLIFrameElement>$$('.slider-panel-iframe');
        //iframe.addEventListener('load', () => window.parsePage());

        return { issueName };

        /*let issueName = (<any>$$.try('#docs-titlebar .docs-title-input')).value;
        if (!issueName) {
            return;
        }

        let issueUrl: string;
        let issueId: string;

        let matches = source.fullUrl.match(/\/.+\/d\/([a-zA-Z0-9\-]+)\/edit/);

        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }

        var serviceUrl = source.protocol + source.host;

        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Bitrix24' };*/
    }
}

IntegrationService.register(new Bitrix24());