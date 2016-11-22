module Integrations {

    export class IntegrationService {

        static session = Date.now();

        static affix = 'devart-timer-link';

        static register(...integrations: WebToolIntegration[]) {

            var convertPatternToRegExp = (matchPattern: string) => new RegExp(matchPattern
                .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
                .replace(/\*/g, '.*'));

            integrations.forEach(integration => {

                this._allIntegrations.push(integration);

                // convert all match patterns to array of regexps
                var matchUrl = integration.matchUrl;
                if (matchUrl) {
                    integration.matchUrl = (matchUrl instanceof Array ? <any[]>matchUrl : [<any>matchUrl])
                        .map(pattern => typeof pattern === 'string' ? convertPatternToRegExp(pattern) : pattern);
                }
            });
        }

        static setTimer(timer: Models.Timer) {
            this._timer = timer;
        }

        static needsUpdate() {
            // Find 'Stop' link or 'Start' link associated with current timer.
            // If it is found we should refresh links on a page.
            return $$.all('a.' + this.affix).some(link => {
                var linkTimer = <WebToolIssueTimer>JSON.parse(link.getAttribute('data-' + this.affix));
                return !linkTimer.isStarted || this.isIssueStarted(linkTimer);
            });
        }

        static updateLinks(checkAllIntegrations: boolean) {
            var source = this.getSourceInfo(document.URL);

            if (!this._possibleIntegrations || checkAllIntegrations) {
                this._possibleIntegrations = this._allIntegrations;
            }

            this._possibleIntegrations = this._possibleIntegrations.filter(integration =>
                (!integration.matchUrl || (<RegExp[]>integration.matchUrl).some(pattern => pattern.test(source.fullUrl))) &&
                (!integration.match || integration.match(source)));

            var issues = <WebToolIssue[]>[];
            var parsedIssues = <WebToolParsedIssue[]>[];

            this._possibleIntegrations.some(integration => {

                let elements = [<HTMLElement>null];
                let selector = integration.issueElementSelector;
                if (selector) {
                    if ((<() => HTMLElement[]>selector).apply) {
                        elements = (<() => HTMLElement[]>selector)();
                    }
                    else {
                        elements = $$.all(<string>selector);
                    }
                }

                elements.forEach(element => {
                    var issue = integration.getIssue(element, source);
                    if (issue) {

                        // normalize urls
                        issue.serviceUrl = issue.serviceUrl ? issue.serviceUrl.replace(/\/+$/, '') : issue.serviceUrl;
                        issue.issueUrl = issue.issueUrl ? issue.issueUrl.replace(/^\/*/, '/') : issue.issueUrl;

                        // trim all string values
                        issue.issueId = this.trimText(issue.issueId, Models.Limits.maxIssueId);
                        issue.issueName = this.trimText(issue.issueName, Models.Limits.maxTask);
                        issue.issueUrl = this.trimText(issue.issueUrl, Models.Limits.maxTaskRelativeUrl);
                        issue.serviceUrl = this.trimText(issue.serviceUrl, Models.Limits.maxIntegrationUrl);
                        issue.serviceType = this.trimText(issue.serviceType, Models.Limits.maxIntegrationType);
                        issue.projectName = this.trimText(issue.projectName, Models.Limits.maxProjectName);

                        // take issueId and issueUrl from started timer if workTask description matches issue name
                        if (!issue.issueUrl
                            && this._timer
                            && this._timer.isStarted) {

                            let workTask = this._timer.workTask;
                            if (workTask
                                && workTask.relativeIssueUrl
                                && workTask.description == issue.issueName) {

                                issue.issueUrl = workTask.relativeIssueUrl;
                                issue.issueId = workTask.externalIssueId;
                            }
                        }

                        if (!issue.issueUrl) {
                            issue.serviceUrl = undefined;
                            issue.serviceType = undefined;
                        }

                        issues.push(issue);
                        parsedIssues.push({ element, issue });
                    }
                });

                if (issues.length) {
                    this._possibleIntegrations = [integration];

                    this.getIssuesDurations(issues).then(durations => {
                        parsedIssues.forEach(({ element, issue }) => {
                            var duration = this.getIssueDuration(durations, issue);
                            this.updateLink(element, integration, issue, duration);
                        });
                    });

                    return true;
                }
            });

            return { issues, observeMutations: this._possibleIntegrations.some(i => i.observeMutations) };
        }

        private static _issuesDurationsResolver = <(value: WebToolIssueDuration[]) => void>null;

        static setIssuesDurations(durations) {
            if (this._issuesDurationsResolver) {
                this._issuesDurationsResolver(durations);
                this._issuesDurationsResolver = null;
            }
        }

        static getIssuesDurations(issues: WebToolIssueIdentifier[]): Promise<WebToolIssueDuration[]> {
            return new Promise(resolve => {
                sendBackgroundMessage({ action: 'getIssuesDurations', data: issues });
                this._issuesDurationsResolver = resolve;
            });
        }

        static getIssueDuration(durations: WebToolIssueDuration[], issue: WebToolIssueIdentifier) {
            for (var duration of durations) {
                if (duration.issueUrl == issue.issueUrl && duration.serviceUrl == issue.serviceUrl) {
                    return duration;
                }
            }
        }

        private static trimText(text: string, maxLength: number) {
            if (text) {
                text = text.trim();
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength - 2) + '..';
                }
            }
            return text || null;
        }

        private static durationToString(duration: number) {

            let sign = '';
            if (duration < 0) {
                duration = -duration;
                sign = '-';
            }

            let totalMinutes = Math.floor(duration / 60000);
            let hours = Math.floor(totalMinutes / 60);
            let minutes = totalMinutes % 60;

            return sign + hours + (minutes < 10 ? ':0' : ':') + minutes;
        }

        static updateLink(element: HTMLElement, integration: WebToolIntegration, newIssue: WebToolIssue, issueDuration: WebToolIssueDuration) {

            const HOUR = 1000 * 60 * 60;

            var oldLink = $$('a.' + this.affix, element);

            if (!newIssue) {
                this.removeLink(oldLink);
                return;
            }

            var isNewIssueStarted = this.isIssueStarted(newIssue);

            var newIssueTimer = <WebToolIssueTimer>{
                isStarted: !isNewIssueStarted
            };
            for (var i in newIssue) {
                newIssueTimer[i] = newIssue[i];
            }

            if (oldLink) {
                var oldIssueTimer = <WebToolIssueTimer>JSON.parse(oldLink.getAttribute('data-' + this.affix));
                var oldSession = parseInt(oldLink.getAttribute('data-session'));
            }

            if (this.isSameIssue(oldIssueTimer, newIssueTimer) &&
                newIssueTimer.isStarted == oldIssueTimer.isStarted &&
                newIssueTimer.projectName == oldIssueTimer.projectName &&
                oldSession == this.session
            ) {
                // Issue is not changed and belong to same session (#67711)
                return;
            }

            var duration = issueDuration && issueDuration.duration || 0;
            if (isNewIssueStarted && newIssue.issueId) {

                // Show zero duration if client clock is late (TMET-947)
                let timerDuration = Math.max(0, Date.now() - Date.parse(this._timer.startTime));

                if (timerDuration <= 10 * HOUR) { // add current timer duration if timer is not long running
                    duration += timerDuration;
                }
            }

            this.removeLink(oldLink);

            // Create new timer link
            var newLink = document.createElement('a');
            newLink.classList.add(this.affix);
            newLink.classList.add(this.affix + (newIssueTimer.isStarted ? '-start' : '-stop'));
            newLink.setAttribute('data-' + this.affix, JSON.stringify(newIssueTimer));
            newLink.setAttribute('data-session', this.session.toString());
            newLink.href = '#';
            newLink.title = 'Track spent time via TMetric service';
            newLink.onclick = function () {
                sendBackgroundMessage({ action: 'putTimer', data: newIssueTimer });
                return false;
            };
            var spanWithIcon = document.createElement('span');
            spanWithIcon.classList.add(this.affix + '-icon');
            newLink.appendChild(spanWithIcon);
            var span = document.createElement('span');
            span.textContent = newIssueTimer.isStarted ? 'Start timer' : 'Stop timer';
            if (duration) {
                span.textContent += ' (' + this.durationToString(duration) + ')';
            }
            newLink.appendChild(span);

            integration.render(element, newLink);
        }

        static clearPage() {
            $$.all('a.' + this.affix).forEach(a => this.removeLink(a));
        }

        static isSameIssue(oldIssue: Integrations.WebToolIssue, newIssue: Integrations.WebToolIssue) {

            function normalizeServiceUrl(issue: WebToolIssue) {
                var url = (issue.serviceUrl || '').trim();
                if (url.length && url[url.length - 1] == '/') {
                    return url.substring(0, url.length - 1);
                }
                return url;
            }

            function normalizeName(issue: WebToolIssue) {
                return (issue.issueName || '').trim();
            }

            if (oldIssue === newIssue) {
                return true;
            }

            return oldIssue &&
                oldIssue.issueId == newIssue.issueId &&
                normalizeName(oldIssue) == normalizeName(newIssue) &&
                normalizeServiceUrl(oldIssue) == normalizeServiceUrl(newIssue);
        }

        private static _allIntegrations = <WebToolIntegration[]>[];

        private static _possibleIntegrations: WebToolIntegration[];

        private static _timer: Models.Timer;

        private static getSourceInfo(fullUrl: string): Source {

            var host = fullUrl || '';

            var protocol = '';
            var path = '';

            var i = host.search(/[#\?]/);
            if (i >= 0) {
                host = host.substring(0, i);
            }

            i = host.indexOf(':');
            if (i >= 0) {
                i++;
                while (i < host.length && host[i] == '/') {
                    i++;
                }
                protocol = host.substring(0, i);
                host = host.substring(i);
            }

            i = host.indexOf('/');
            if (i >= 0) {
                path = host.substring(i);
                host = host.substring(0, i);
            }

            return { fullUrl, protocol, host, path };
        }

        private static removeLink(link: HTMLElement) {
            if (!link) {
                return;
            }
            var content = link;
            var container = link.parentElement;

            while (container && container.classList
                && container.classList.contains(this.affix + '-' + container.tagName.toLowerCase())) {
                content = container;
                container = container.parentElement;
            }

            if (container) {
                container.removeChild(content);
            }
        }

        private static isIssueStarted(issue: WebToolIssue): boolean {
            var timer = this._timer;
            if (!timer) {
                return false;
            }

            var task = timer.workTask;
            if (!task && !timer.isStarted) {
                return false;
            }

            var startedIssue = <WebToolIssue>{
                issueId: task.externalIssueId,
                issueName: task.description,
                issueUrl: task.relativeIssueUrl,
                serviceUrl: task.integrationUrl
            };

            return this.isSameIssue(startedIssue, issue);
        }
    }
}