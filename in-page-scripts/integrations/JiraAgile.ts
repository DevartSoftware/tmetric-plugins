/// <reference path="../../interfaces/integrations" />
/// <reference path="../IntegrationService" />
/// <reference path="../utils" />

module Integrations {
    class JiraAgileIntegration implements WebToolIntegration {
        protected _serviceType = 'Jira'

        match(source: Source): boolean {
            var jiraAppQuery = $$('meta[name=application-name]'); // base level for one method?
            if (jiraAppQuery) {
                return jiraAppQuery.getAttribute('content') == 'JIRA';
            }

            return false;
        }

        render(issueElement: HTMLElement, linkElement: HTMLElement) {
            console.info('=== START RENDER ===');
            var detailSection = $$('#ghx-detail-issue'); // :not(.tt-button) ??
            if (detailSection) {
                //$$('.ghx-group', detailSection).appendChild(linkElement);

                var head = $$('.ghx-group', detailSection);

                if (!head.appendChild) {
                    console.error('!head.appendChild');
                    return;
                }

                var emptyDiv = document.createElement('div');
                emptyDiv.innerHTML = 'linkElement is empty';

                console.info('Appending. LinkElement is ' + JSON.stringify(linkElement));
                head.appendChild(emptyDiv)
                //setTimeout(() => { head.appendChild(emptyDiv); console.info('===== setTimeout =====') }, 2000);
            }

            console.info('=== END RENDER ===');
        }
        /*
        
        togglbutton.render('#ghx-detail-issue:not(.toggl)', {observe: true}, function (elem) {
          var link, description,
            container = createTag('div', 'ghx-toggl-button'),
            titleElem = $('[data-field-id="summary"]', elem),
            numElem = $('.ghx-fieldname-issuekey a'),
            projectElem = $('.ghx-project', elem);
        
          description = titleElem.innerText;
          if (numElem !== null) {
            description = numElem.innerText + " " + description;
          }
        
          link = togglbutton.createTimerLink({
            className: 'jira',
            description: description,
            projectName: projectElem && projectElem.innerText
          });
                
        */

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
            //// seek specific element for Agile Desk
            //if (!!$$('#ghx-rabid'))
            //{
            //    return;
            //}

            // check if detail view is visible
            if ($$('#ghx-detail-view').style.display == 'none') {
                return;
            }

            var propertyLink = $$('dd[data-field-id=issuekey]');

            var issueId = propertyLink.textContent;

            var issueUrl = $$('a', propertyLink).getAttribute('href');

            var issueName = $$('dd[data-field-id=summary]').textContent;

            var projectName = $$('.ghx-project').textContent;

            var serviceUrl = source.protocol + source.host;

            console.info('Created object is');
            var cc = { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: this._serviceType };
            console.info(JSON.stringify(cc));

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: this._serviceType };
        }
    }

    IntegrationService.register(new JiraAgileIntegration());
}