class BennerSiscon implements WebToolIntegration {

    showIssueId = true;

    observeMutations = true;

    matchUrl = [
        '*://*/siscon/e/solicitacoes/*'
    ];

    match(): boolean {
        return true;
    }

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        var host = $$('.dashboard-stat2');
        if (host) {

            linkElement.classList.add('btn');
            host.insertBefore(linkElement, host.firstChild);
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        
        var match = /(\d+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }

        var issueId = match[1];
        if (!issueId) {
            return;
        }

        var issueName = $$.try('#tabWIDGETID_DESCRICAO').textContent;
        if (!issueName) {
            return;
        }

        issueName = issueName.trim();

        var projectName = $$.try('#ctl00_Main_ucSolicitacao_WIDGETID_FORMSOLICITACAO_formView_PageControl_GERAL_GERAL_PROJETOSAUDE').textContent;

        projectName = projectName.trim();

        var serviceType = 'Siscon';

        var serviceUrl = source.protocol + source.host;


        var issueUrl = "siscon/e/solicitacoes/Solicitacao.aspx?key=" + issueId;

        var tagNames = [];
        tagNames.push($$.try('#ctl00_Main_ucSolicitacao_WIDGETID_FORMSOLICITACAO_formView_PageControl_GERAL_GERAL_SITUACAOATUAL').textContent);

        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}

IntegrationService.register(new BennerSiscon());