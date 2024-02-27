class Todoist implements WebToolIntegration {

    showIssueId = false;

    matchUrl = [
        '*://*todoist.com/app*',
        '*://*.todoist.com/app*'
    ]; 

    listItemSelector = '.task_item, .task_list_item';

    dialogSelector = '.side_panel, .detail_modal, div[role=dialog]';

    issueElementSelector() {
        return [
            ...$$
                .all(this.listItemSelector),
            ...$$
                .all('.item_detail, .task-overview-main')
                .map(e => $$.closest(this.dialogSelector, e))
        ];
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        if (issueElement.matches(this.listItemSelector)) {
            let host = $$('.task_item_details_bottom, .task_list_item__info_tags', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist');
                host.insertBefore(linkElement, $$('.column_project, .task_list_item__project', host));
            }
        } else {
            let host = $$('.item_overview_sub', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist', 'icon_pill');
                host.insertBefore(linkElement, host.firstElementChild);
                return;
            }
            host = $$('*[data-testid=button-container]', issueElement);
            if (host) {
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }
    }

    getProjectName(taskDialog: HTMLElement) {
        if (!taskDialog) {
            return;
        }
        const projectIcon = $$('.item_detail_parent_name, .project_icon', taskDialog);
        if (projectIcon) {
            return $$.closest('a', projectIcon)?.textContent;
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
       
        let issueNumber: string
        let issueId: string;
        let issueName: string;
        let projectName: string
        let tagNames: string[];

        if (issueElement.matches(this.listItemSelector)) {

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
                this.getProjectName($$.closest(this.dialogSelector, issueElement)) ||
                $$.try('.project_item__name', issueElement).textContent || // Today, 7 Days
                $$.try('.project_link').textContent || // Project tab (new design)
                $$.try('.task_list_item__project', issueElement).textContent || // Upcoming
                $$.try('.pname', issueElement).textContent || // Project tab (old design)
                $$.try('.view_header .view_header__content .simple_content').textContent || // project tab and inbox
                $$.try('div[data-testid="large-header"] h1').textContent;

            if (projectName) {
                projectName = projectName.split("/")[0];
            }

            tagNames = $$.all('.label, .task_list_item__info_tags__label .simple_content', issueElement).map(label => label.textContent);
        } else {

            issueNumber = $$.getAttribute('ul[data-subitem-list-id]', 'data-subitem-list-id', issueElement);
            if (!issueNumber) {
                issueNumber = $$.getAttribute('div[data-item-id]', 'data-item-id', issueElement);
            }
            if (!issueNumber) {
                return;
            }

            issueId = '#' + issueNumber;
            issueName = $$.try('.task-overview-content .task_content', issueElement).textContent;
            projectName = $$.try('div[data-testid="task-detail-default-header"] a', issueElement).textContent;
            tagNames = $$
                .all('.item_overview_sub .label_pill .simple_content, a[data-item-label-name]', issueElement)
                .map(label => label.textContent);
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
