class Megaplan implements WebToolIntegration{
   
    showIssueId = false;
    observeMutations = true;
    matchUrl = '*.megaplan.ru/task/*/card';
    
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$.try('._1XKpckMR-iqskJqYp7ANvs.undefinedChild.LI-DbNJ989DALGWiPbU2N._1RspPkSKS8mI1tTV5bPJOK');

if (host) {
	console.log(host);
	linkElement.classList.add('devart-timer-link-todoist');
        host.parentElement.appendChild(linkElement);
    }
    }
    getIssue(issueElement: HTMLElement, source: Source) : WebToolIssue{
	console.log("Checking");
        let issueObj = $$.try('._1XKpckMR-iqskJqYp7ANvs.undefinedChild.LI-DbNJ989DALGWiPbU2N._1RspPkSKS8mI1tTV5bPJOK');
	if (!issueObj){
		return;
	}
	let issueName='';
	let issueNumber = source.path.split('/')[2]; 
	if (!issueNumber) {
            return;
        }
        
	let issueId = '#' + issueNumber;
	if ('firstChild' in issueObj){
	 issueName=issueObj.firstChild.textContent;
	} else return;

        let projectName = $$.try('._3bCrSGVnXH5AUbZRlD6TbT').textContent;
	if (!projectName) {projectName='';}
        let serviceType = 'Megaplan';
        let serviceUrl = source.protocol + source.host;
        let issueUrl = 'showTask?id=' + issueNumber;
        let tagNames = $$.all('.labels_holder .label:not(.label_sep)', issueElement).map(label => label.textContent);
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Megaplan());
