if (typeof document !== 'undefined')
{
    /**
     * Retrieves messages from background script.
     */
    function onBackgroundMessage(message: ITabMessage)
    {
        if (message.action == 'setTimer')
        {
            Integrations.IntegrationService.setTimer(message.data);
        }
    }

    /**
     * Sends message to background script.
     */
    var sendBackgroundMessage: (message: ITabMessage) => void = self.chrome && self.chrome.runtime && self.chrome.runtime.sendMessage;

    if (sendBackgroundMessage)
    {
        chrome.runtime.onMessage.addListener(onBackgroundMessage);
    }
    else
    {
        sendBackgroundMessage = self.postMessage;
        self.on('message', onBackgroundMessage);
    }

    var oldUrl = '';
    var oldTitle = '';
    var changeCheckerHandle: number;

    function parsePage()
    {
        var url = document.URL;
        var title = document.title;

        oldUrl = url;
        oldTitle = title;

        var issues = Integrations.IntegrationService.parsePage();
        var issue: Integrations.WebToolIssue = null;
        if (issues)
        {
            issue = issues[0];
            if (issues.length > 1)
            {
                // If page contains several issues, keep project only
                var projectName = issue.projectName;
                issue = { issueName: '' };

                if (projectName && issues.every(i => i.projectName == projectName))
                {
                    issue.projectName = issue.projectName;
                }
            }
        }

        var message = <ITabMessage>{ action: 'setTabInfo', data: <ITabInfo>{ url, title, issue } };

        try {
            sendBackgroundMessage(message);
        }
        catch (e)
        {
            // When Chrome extension unintalled/upgraded, content scripts still execute, but cannot
            // access to background script, just stop listening in that case.
            window.removeEventListener('focus', startCheckChanges);
            if (changeCheckerHandle != null)
            {
                clearInterval(changeCheckerHandle);
                changeCheckerHandle = null;
            }
        }
    }

    function startCheckChanges()
    {
        if (changeCheckerHandle == null)
        {
            changeCheckerHandle = setInterval(() =>
            {
                if (document.title != oldTitle || document.URL != oldUrl)
                {
                    parsePage();
                }
                if (!document.hasFocus())
                {
                    clearInterval(changeCheckerHandle);
                    changeCheckerHandle = null;
                }
            }, 100);
        }
    }

    window.addEventListener('focus', startCheckChanges);

    if (document.hasFocus())
    {
        startCheckChanges();
    }

    Integrations.IntegrationService.clearPage();
    parsePage();

    sendBackgroundMessage({ action: 'getTimer' });
}