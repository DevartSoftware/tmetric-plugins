class Todoist implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://*todoist.com/app*';

    // Order must be preserved
    // because overview item searches project name
    // in links parsed on task items
    issueElementSelector = [
        '.task_item, .task_list_item',
        '.side_panel .item_detail, .detail_modal .item_detail'
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            let host = $$('.task_item_details_bottom, .task_list_item__info_tags', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist');
                host.insertBefore(linkElement, $$('.column_project, .task_list_item__project', host));
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            let host = $$('.item_overview_sub', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueNumber: string, issueId: string, issueName: string, projectName: string, tagNames: string[];

        if (issueElement.matches(this.issueElementSelector[0])) {

            // Release:
            // <li class="task_item" id="item_123456789">
            // Beta, section Upcoming:
            // <li class="task_list_item" data-item-id="3523828033">
            issueNumber = issueElement.id.split('_')[1] || issueElement.getAttribute('data-item-id');
            if (!issueNumber) {
                return;
            }

            issueId = '#' + issueNumber;

            // Release:
            // <span class="text sel_item_content">
            //      <span class="task_item_content_text"> Task Name <a class="ex_link">LinkText</a> <b>Bold</b > </span>
            //      ...
            // </span>
            // Beta, section Upcoming:
            // <div class="task_list_item__content">
            //    <div class="task_content">
            //        <span>Task Name</span>
            //    </div>
            //    ...
            //</div>
            issueName = $$.try('.content > .text .task_item_content_text, .task_list_item__content .task_content', issueElement).textContent;

            if (!issueName) {
                issueName = $$
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
                    }, '');
            }

            projectName =
                $$.try('.project_item__name', issueElement).textContent || // Today, 7 Days
                $$.try('.project_link').textContent || // Project tab (new design)
                $$.try('.task_list_item__project', issueElement).textContent || // Upcoming
                $$.try('.pname', issueElement).textContent; // Project tab (old design)

            tagNames = $$.all('.label, .task_list_item__info_tags__label', issueElement).map(label => label.textContent);

        } else if (issueElement.matches(this.issueElementSelector[1])) {

            issueNumber = $$.getAttribute('ul[data-subitem-list-id]', 'data-subitem-list-id', issueElement);
            if (!issueNumber) {
                return;
            }

            issueId = '#' + issueNumber;

            issueName = $$.try('.item_overview_content', issueElement).textContent;

            let issue = $$.all('.devart-timer-link-todoist').map(_ => {
                let timer: WebToolIssueTimer;
                try {
                    timer = JSON.parse(_.getAttribute('data-devart-timer-link'));
                } finally {
                    return timer;
                }
            }).filter(_ => !!_).find(_ => _.issueId == issueId);

            if (issue) {
                projectName = issue.projectName;
            }

            tagNames = $$.all('.item_overview_label', issueElement).map(label => label.textContent);
        }

        if (!issueNumber || !issueName) {
            return;
        }

        let serviceType = 'Todoist';
        let serviceUrl = source.protocol + source.host;
        let issueUrl = 'showTask?id=' + issueNumber;

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new Todoist());