class MicrosoftToDo implements WebToolIntegration {
    matchUrl = [
        'https://to-do.live.com/tasks/*',
        'https://to-do.office.com/tasks/*'
    ];

    issueElementSelector = () => $$.all('.taskItem-body')
        .concat($$.all('.details-body'));

    showIssueId = false;

    render(issueElement: HTMLElement, linkElement: HTMLElement) {

        if (issueElement.className == 'taskItem-body') {
            linkElement.classList.add('devart-timer-link-microsoft-todo');
            linkElement.lastElementChild.textContent = '';
            issueElement.appendChild(linkElement);
        }

        if (issueElement.className == 'details-body') {
            linkElement.classList.add('section-title', 'devart-timer-link-microsoft-todo-details');

            let section = $$.all('.section', issueElement)[1];
            if (section) {
                let sectionItem = $$.create('div', 'section-item');
                let btn = $$.create('button', 'section-innerClick');
                let sectionInner = $$.create('div', 'section-inner');

                sectionInner.appendChild(linkElement);

                btn.appendChild(sectionInner);
                sectionItem.appendChild(btn);
                section.appendChild(sectionItem);
            }
        }
    }
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let issueName = $$.try('.taskItem-titleWrapper > .taskItem-title', issueElement).textContent;
        if (!issueName) {
            // try get name from details
            issueName = $$.try('.detailHeader-title', issueElement).textContent;
        }

        if (!issueName) {
            return;
        }

        let serviceUrl = source.protocol + source.host;

        return { issueName, serviceUrl, serviceType: 'MicrosoftToDo' };
    }
}

IntegrationService.register(new MicrosoftToDo());