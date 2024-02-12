$(document).ready(async () => {

    const permissionsManager = new PermissionManager();

    const integratedServices = await new Promise<ServiceTypesMap>(resolve => {
        chrome.runtime.sendMessage({ action: 'getIntegratedServices' }, resolve);
    });

    const integratedServiceUrls = WebToolManager.getServiceUrls(integratedServices);

    function renderIntegrations(holder: string, items: WebToolDescription[]) {
        const content = items.map(item => $('<li>')
            .data('keywords', [item.serviceName].concat(item.keywords || []).map(k => k.toLowerCase()))
            .append(`
<span title="${item.serviceName}" class="logo-wrapper">
    <input type="checkbox" name="${item.serviceType}" />
    <span class="logo-area">
        <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
    </span>
    <button class="switch"></button>
    <button class="btn btn-default show-popup" ${item.hasAdditionalOrigins ? '' : 'style="display:none"'}"><i class="fa fa-pencil"></i> Edit</button>
</span>`));
        $(holder).empty().append(content);
    }

    function renderUrlListItem(url: string) {
        return $('<li>').append(`
<input class="url input form-control" type="text" value="${url}" readonly />
<button class="btn btn-icon edit-url"><i class="fa fa-pencil"></i></button>
<button class="btn btn-icon save-url" style="display:none"><i class="fa fa-check"></i></button>
<button class="btn btn-icon remove-url"><i class="fa fa-times"></i></button>`);
    }

    function setPermissionCheckboxStatus(serviceType: string, serviceUrls: string[], checked: boolean) {
        $(`.logo-wrapper input[name='${serviceType}']`)
            .prop('checked', checked)
            .data('serviceUrls', serviceUrls);
    }

    async function updatePermissionCheckboxes() {

        await WebToolManager.cleanupServiceTypes();

        let isAllEnabled = true;
        let isAllDisabled = true;

        const serviceUrlsMap = WebToolManager.getServiceUrls();
        const webToolDescriptions = getWebToolDescriptions();

        webToolDescriptions.forEach(webToolDescription => {

            const { serviceType } = webToolDescription;

            const serviceUrls = serviceUrlsMap[serviceType];

            if (serviceUrls) {
                setPermissionCheckboxStatus(serviceType, serviceUrls, true);
                isAllDisabled = false;
            } else {
                setPermissionCheckboxStatus(serviceType, webToolDescription.origins, false);
                if (webToolDescription.origins.length > 0) {
                    isAllEnabled = false;
                }
            }
        });

        if (isAllEnabled) {
            $('.enable-all').attr('disabled', '');
        } else {
            $('.enable-all').removeAttr('disabled');
        }

        if (isAllDisabled) {
            $('.disable-all').attr('disabled', '');
        } else {
            $('.disable-all').removeAttr('disabled');
        }

    }

    function setScrollArea() {
        if ($('.permissions-page').length > 0) {
            const headerHeight = $('.header').outerHeight();
            const filterHeight = $('.filter-section').outerHeight();
            const bodyHeight = $(document).height();
            const containerMargins = 82;
            const scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
            $('.logos-section').css("height", scrollAreaHeight + "px");
        }
    }

    function setAllLogos() {

        $('.enable-all').click(async () => {
            let map = WebToolManager.toServiceTypesMap(getWebToolDescriptions());
            map = Object.assign(map, integratedServices);
            await permissionsManager.requestPermissions(map);

            updatePermissionCheckboxes();
        });

        $('.disable-all').click(async () => {

            const map: ServiceTypesMap = {};

            const webTools = getWebToolDescriptions();
            webTools.forEach(webTool => webTool.origins.map(origin => map[origin] = webTool.serviceType));

            const serviceTypes = WebToolManager.serviceTypes;
            Object.keys(serviceTypes).forEach(serviceUrl => map[serviceUrl] = serviceTypes[serviceUrl]);
            await permissionsManager.removePermissions(map);
            await permissionsManager.cleanupPermissions();

            updatePermissionCheckboxes();
        });
    }

    function initLogoClick() {

        const popup = '.location-popup';

        function getServiceUrls(serviceType: string) {

            const webToolDescription = getWebToolDescriptions().find(i => i.serviceType == serviceType);
            if (!webToolDescription) {
                return {};
            }

            const { origins = [], hasAdditionalOrigins } = webToolDescription;

            const serviceUrlsMap = WebToolManager.getServiceUrls();
            const serviceUrls = serviceUrlsMap[serviceType] || origins;

            return { serviceUrls, hasAdditionalOrigins };
        }

        async function updatePermissions(input: JQuery) {
            try {

                const checked = input.prop('checked');
                const serviceType = input.prop('name');
                const serviceUrls = input.data('serviceUrls');
                const map = serviceUrls.reduce((map, url) => (map[url] = serviceType) && map, {} as ServiceTypesMap);

                if (checked) {
                    await permissionsManager.requestPermissions(map);
                } else {
                    await permissionsManager.removePermissions(map);
                }

                updatePermissionCheckboxes();
            } catch (err) {
                console.error(err);
            }
        }

        async function showPopup(serviceType: string, serviceUrls: string[]) {

            $(popup).data('serviceType', serviceType);
            $(popup).data('serviceUrlsInitial', serviceUrls);

            $('.add-url-input-holder input', popup).val('');

            $('.add-url-input-holder input', popup).attr('placeholder', `https://${serviceType.toLowerCase()}.server.com`);

            $('.url-list', popup).empty().append(serviceUrls.map(renderUrlListItem));

            $('.location-popup, .overlay').addClass('visible');
        }

        function togglePermissionCheckbox(input: JQuery) {

            const name = input.prop('name');
            const checked = input.prop('checked');

            input.prop('checked', !checked);

            const urlsData = getServiceUrls(name);
            const hasAdditionalOrigins = urlsData.hasAdditionalOrigins;
            let serviceUrls = urlsData.serviceUrls || [];

            if (integratedServiceUrls[name] && !checked) {
                serviceUrls = integratedServiceUrls[name].reduce((map, serviceUrl) => {
                    if (serviceUrls.indexOf(serviceUrl) === -1) {
                        map.push(serviceUrl);
                    }
                    return map;
                }, serviceUrls).sort();
            }
            if (!checked && hasAdditionalOrigins) {
                showPopup(name, serviceUrls);
            } else {
                updatePermissions(input);
            }
        }

        function closePopup() {
            $('.location-popup, .overlay').removeClass('visible');
            updatePermissionCheckboxes();
        }

        $('.logo-wrapper').on('click', '.switch', function (this: HTMLElement, event) {

            event.stopPropagation();

            const input = $(this).siblings('input:checkbox');

            togglePermissionCheckbox(input);
        });

        $('.logo-wrapper').on('click', '.logo-area', function (this: HTMLElement, event) {

            event.stopPropagation();

            const input = $(this).siblings('input:checkbox');
            const checked = input.prop('checked');

            if (!checked) {
                togglePermissionCheckbox(input);
            }
        });

        $('.logo-wrapper').on('click', '.show-popup', function (this: HTMLElement, event) {

            event.stopPropagation();

            const input = $(this).siblings('input:checkbox');
            const name = input.prop('name');

            const { serviceUrls, hasAdditionalOrigins } = getServiceUrls(name);

            if (hasAdditionalOrigins) {
                showPopup(name, serviceUrls);
            }
        });

        $('.add-url', popup).click(function (this: HTMLElement) {

            const input = $('input', $(this).parent('.add-url-input-holder'));
            const value = input.val();
            const serviceUrl = WebToolManager.toServiceUrl(value);

            input.toggleClass('invalid', !serviceUrl);

            if (!serviceUrl) {
                return;
            }

            const existingUrls = $('.url-list .url', popup).toArray().map((el: HTMLInputElement) => el.value);
            if (existingUrls.indexOf(serviceUrl) > -1) {
                return;
            }

            $('.url-list', popup).append(renderUrlListItem(serviceUrl));
        });

        $('.url-list', popup).on('click', '.edit-url', function (this: HTMLElement) {
            $(this).siblings('input').prop('readonly', false).focus();
            $(this).siblings('.save-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.save-url', function (this: HTMLElement) {

            const input = $(this).siblings('input');
            const value = input.val();
            const serviceUrl = WebToolManager.toServiceUrl(value);

            input.toggleClass('invalid', !serviceUrl);

            if (!serviceUrl) {
                return;
            }

            $(this).siblings('input').prop('readonly', true);
            $(this).siblings('.edit-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.remove-url', function (this: HTMLElement) {
            $(this).parent('li').remove();
        });

        $('.close-popup', popup).click(function () {
            closePopup();
        });

        $('.apply-popup', popup).click(async function () {

            const serviceType = $(popup).data('serviceType');
            const urlsAfter = $('.url-list .url', popup).toArray().map((el: HTMLInputElement) => el.value);

            const input = $('.add-url-input-holder input', popup);
            const value = input.val();
            const serviceUrl = WebToolManager.toServiceUrl(value);
            if (serviceUrl && urlsAfter.indexOf(serviceUrl) < 0) {
                urlsAfter.push(serviceUrl);
            }

            const urlsBefore: string[] = $(popup).data('serviceUrlsInitial') || [];

            const urlsAdded = urlsAfter
                .reduce((map, url) => (map[url] = serviceType) && map, {} as ServiceTypesMap);

            const urlsRemoved = urlsBefore
                .filter(url => urlsAfter.indexOf(url) < 0)
                .reduce((map, url) => (map[url] = serviceType) && map, {} as ServiceTypesMap);

            await permissionsManager.updatePermissions(urlsAdded, urlsRemoved);

            closePopup();
        });
    }

    function initSearch() {

        let search: string;

        function containSearch(keyword: string) {
            return !search || keyword.indexOf(search) >= 0;
        }

        function checkKeywords(this: HTMLElement) {
            const keywords: string[] = $(this).data('keywords');
            if (keywords.some(containSearch)) {
                $(this).show(500);
            } else {
                $(this).hide(500);
            }
        }

        $('.search-input').on('input', function (this: HTMLElement) {
            search = ('' + $(this).val()).toLowerCase();
            $('.logos-section ul li').each(checkKeywords);
        }).focus();
    }

    function initClosePage() {
        $('.close-page').click(() => {
            chrome.tabs.getCurrent(tab => {
                const tabId = tab?.id;
                tabId != null && chrome.tabs.remove(tabId);
            });
        });
    }

    // init

    renderIntegrations('#integrations', getWebToolDescriptions());

    setScrollArea();
    setAllLogos();
    initLogoClick();
    initSearch();
    initClosePage();

    updatePermissionCheckboxes();

    $(window).resize(function () {
        setScrollArea();
    });
});
