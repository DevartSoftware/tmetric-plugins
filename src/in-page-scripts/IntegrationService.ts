module Integrations {

    export class IntegrationService {

        static affix = 'devart-timer-link';

        private static _allIntegrations = <WebToolIntegration[]>[];

        private static _possibleIntegrations: WebToolIntegration[];

        private static _escapedChars = '-\/\\^$+?.()|[\]{}';

        private static _escapeRegExp = new RegExp('[' + IntegrationService._escapedChars + '*]', 'g');

        private static _escapeAndKeepAsterisksRegExp = new RegExp('[' + IntegrationService._escapedChars + ']', 'g');

        private static _timer: Models.Timer;

        private static getSourceInfo(fullUrl: string): Source {
            // fullUrl:  http://rm.devart.local/redmine/issues/58480?tab=tabtime_time#tag
            // protocol: http://
            // host:     rm.devart.local
            // path:     /redmine/issues/58480

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

        static escapeRegExp(s: string) {
            return s.replace(this._escapeRegExp, '\\$&');
        }

        static register(integration: WebToolIntegration) {
            this._allIntegrations.push(integration);
        }

        static parsePage(checkAllIntegrations: boolean): { issues: WebToolIssue[], observeMutations: boolean } {
            var source = this.getSourceInfo(document.URL);

            if (!this._possibleIntegrations || checkAllIntegrations) {
                this._possibleIntegrations = this._allIntegrations;
            }

            this._possibleIntegrations = this._possibleIntegrations.filter(integration => {
                if (integration.matchUrl) {
                    var urls: string[];
                    if ((<string[]>integration.matchUrl) instanceof Array) {
                        urls = <string[]>integration.matchUrl;
                    }
                    else {
                        urls = [<string>integration.matchUrl];
                    }

                    if (urls.every(url => !new RegExp(url
                        .replace(this._escapeAndKeepAsterisksRegExp, '\\$&')
                        .replace(/\*/g, '.*')).test(source.fullUrl))) {
                        return false;
                    }
                }

                if (integration.matchSelector && !$$(integration.matchSelector) ||
                    integration.match && !integration.match(source)) {
                    return false;
                }

                return true;
            });
            var issues = [];

            this._possibleIntegrations.some(integration => {
                var elements: HTMLElement[];
                if (integration.issueElementSelector) {
                    elements = $$.all(integration.issueElementSelector);
                }
                else if (integration.matchSelector) {
                    elements = $$.all(integration.matchSelector);
                }
                else {
                    elements = [null];
                }

                elements.forEach(element => {
                    var oldLink: HTMLElement;
                    oldLink = $$('a.' + this.affix, element);

                    var newIssue = integration.getIssue(element, source);
                    if (newIssue) {
                        issues.push(newIssue);

                        var newIssueTimer = <WebToolIssueTimer>{
                            isStarted: !this.isIssueStarted(newIssue)
                        };
                        for (var i in newIssue) {
                            newIssueTimer[i] = newIssue[i];
                        }

                        if (oldLink) {
                            var oldIssueTimer = <WebToolIssueTimer>JSON.parse(oldLink.getAttribute('data-' + this.affix));
                        }

                        if (this.isSameIssue(oldIssueTimer, newIssueTimer) &&
                            newIssueTimer.isStarted == oldIssueTimer.isStarted) {
                            // Issue is not changed
                            return;
                        }

                        // Create new timer link
                        var newLink = document.createElement('a');
                        newLink.classList.add(this.affix);
                        newLink.classList.add(this.affix + (newIssueTimer.isStarted ? '-start' : '-stop'));
                        newLink.setAttribute('data-' + this.affix, JSON.stringify(newIssueTimer));
                        newLink.href = '#';
                        newLink.title = 'Track spent time via Devart Time Tracker service';
                        newLink.onclick = function () {
                            sendBackgroundMessage({ action: 'putTimer', data: newIssueTimer });
                            return false;
                        };
                        var spanWithIcon = document.createElement('span');
                        spanWithIcon.classList.add(this.affix + '-icon');
                        newLink.appendChild(spanWithIcon);
                        var span = document.createElement('span');
                        span.textContent = newIssueTimer.isStarted ? 'Start timer' : 'Stop timer';
                        newLink.appendChild(span);

                        integration.render(element, newLink);
                    }

                    this.removeLink(oldLink);
                });

                if (issues.length) {
                    this._possibleIntegrations = [integration];
                    return true;
                }
            });

            return { issues, observeMutations: this._possibleIntegrations.some(i => i.observeMutations) };
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

        static setTimer(timer: Models.Timer) {
            this._timer = timer;

            // Find 'Stop' link or 'Start' link associated with current timer.
            // If it is found we should refresh links on a page.
            if ($$.all('a.' + this.affix).some(link => {
                var linkTimer = <WebToolIssueTimer>JSON.parse(link.getAttribute('data-' + this.affix));
                if (!linkTimer.isStarted || this.isIssueStarted(linkTimer)) {
                    return true;
                }
            })) {
                this.parsePage(false);
            }
        }

        static clearPage() {
            $$.all('a.devart-timer-link').forEach(a => this.removeLink(a));
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

            return oldIssue &&
                oldIssue.issueId == newIssue.issueId &&
                normalizeName(oldIssue) == normalizeName(newIssue) &&
                normalizeServiceUrl(oldIssue) == normalizeServiceUrl(newIssue);
        }

        static isIssueStarted(issue: WebToolIssue): boolean {
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