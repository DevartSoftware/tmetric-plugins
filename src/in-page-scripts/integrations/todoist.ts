class Todoist implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*todoist.com/app*';

    issueElementSelector = '.task_item';

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.content > .text', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-todoist');
            host.insertBefore(linkElement, host.lastChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        // <li class="task_item" id= "item_123456789">
        let issueNumber = issueElement.id.split('_')[1];
        if (!issueNumber) {
            return;
        }

        let issueId = '#' + issueNumber;

        // <span class="text sel_item_content"> Task Name <a class="ex_link">LinkText</a> <b>Bold</b> ... </span>
        let issueName = $$
            .findAllNodes('.content > .text', null, issueElement)
            .filter(node => {
                if (node.nodeType == Node.TEXT_NODE) {
                    return true;
                }
                if (node.nodeType != Node.ELEMENT_NODE) {
                    return false;
                }
                let tag = <Element>node;
                if (['B', 'I', 'STRONG', 'EM'].indexOf(tag.tagName) >= 0) {
                    return true;
                }
                if (tag.tagName != 'A') {
                    return false;
                }
                if (tag.classList.contains('ex_link')) {
                    return true;
                }
                let href = tag.getAttribute('href');
                if (href && !href.indexOf("mailto:")) {
                    return true;
                }
            })
            .reduce((sumText, node) => {
                let text = node.textContent;
                if (text[0] == ' ' && sumText[sumText.length - 1] == ' ') {
                    text = text.substring(1);
                }
                return sumText + text;
            }, "");

        if (!issueName) {
            return;
        }

        let projectName =
            $$.try('.project_item__name', issueElement).textContent || // Today, 7 Days
            $$.try('.project_link').textContent || // Project tab (new design)
            $$.try('.pname', issueElement).textContent; // Project tab (old design)

        let serviceType = 'Todoist';
        let serviceUrl = source.protocol + source.host;
        let issueUrl = 'showTask?id=' + issueNumber;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}

IntegrationService.register(new Todoist());