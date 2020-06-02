$(document).ready(() => {

    function renderIntegrations(holder: string, integrations: Integration[]) {
        let content = integrations.map(item => $('<li>')
            .attr('title', item.serviceName)
            .append(`
<label class="logo-wrapper">
    <input type="checkbox" name="${item.serviceType}" />
    <span class="logo-area">
        <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
    </span>
    <button class="btn btn-icon show-popup" ${item.hasAdditionalOrigins ? '' : 'style="display:none"'}"><i class="fa fa-pencil"> Edit</i></button>
</label>`));
        $(holder).empty().append(content);
    }

    function setScrollArea() {
        let headerHeight = $('.header').outerHeight();
        let filterHeight = $('.filter-section').outerHeight();
        let bodyHeight = $(document).height();
        let containerMargins = 82;
        let scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
        $('.logos-section').css("height", scrollAreaHeight + "px");
    }

    function renderOriginListItem(origin: string) {
        return $('<li>').append(`
<input class="url" type="text" value="${origin}" readonly />
<button class="btn btn-icon edit-url"><i class="fa fa-pencil"></i></button>
<button class="btn btn-icon save-url" style="display:none"><i class="fa fa-check"></i></button>
<button class="btn btn-icon remove-url"><i class="fa fa-times"></i></button>`);
    }

    function initLogoClick() {

        let popup = '.location-popup';

        async function getOrigins(serviceType: string) {

            let integration = integrations.find(i => i.serviceType == serviceType);
            if (!integration) {
                return {};
            }

            let { origins = [], hasAdditionalOrigins } = integration;

            let services = await getServices();
            let service = services.find(service => service.serviceType == serviceType);
            if (service) {
                origins = service.serviceUrls;
            }

            return { origins, hasAdditionalOrigins };
        }

        async function showPopup(serviceType: string, origins: string[]) {

            $(popup).data('serviceType', serviceType);

            $('.add-url-input-holder input', popup).val('');

            $('.url-list', popup).empty().append(origins.map(renderOriginListItem));

            $('.location-popup, .overlay').addClass('visible');
        }

        function closePopup() {
            $('.location-popup, .overlay').removeClass('visible');
            updatePermissionCheckboxes();
        }

        $('.logo-wrapper').on('click', async function (event) {

            event.stopPropagation();

            const input = $(this).find('input:checkbox');
            const name = input.prop('name');
            const checked = input.prop('checked');

            const { origins, hasAdditionalOrigins } = await getOrigins(name);

            if (!checked && origins.length == 0 && hasAdditionalOrigins) {
                showPopup(name, origins);
            }
        });

        $('.logo-wrapper').on('click', '.show-popup', async function (event) {

            event.stopPropagation();

            const input = $(this).siblings('input:checkbox');
            const name = input.prop('name');

            const { origins, hasAdditionalOrigins } = await getOrigins(name);

            if (hasAdditionalOrigins) {
                showPopup(name, origins);
            }
        });

        $('.add-url', popup).click(function () {

            let input = $('input', $(this).parent('.add-url-input-holder'));
            let value = input.val();
            let origin = toOrigin(value);

            input.toggleClass('invalid', !origin);

            if (!origin) {
                return;
            }

            $('.url-list', popup).append(renderOriginListItem(origin));
        });

        $('.url-list', popup).on('click', '.edit-url', function () {
            $(this).siblings('input').prop('readonly', false).focus();
            $(this).siblings('.save-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.save-url', function () {

            let input = $(this).siblings('input');
            let value = input.val();
            let origin = toOrigin(value);

            input.toggleClass('invalid', !origin);

            if (!origin) {
                return;
            }

            $(this).siblings('input').prop('readonly', true);
            $(this).siblings('.edit-url').show();
            $(this).hide();
        });

        $('.url-list', popup).on('click', '.remove-url', function () {
            $(this).parent('li').remove();
        });

        $('.close-popup', popup).click(function () {
            closePopup();
        });

        $('.apply-popup', popup).click(async function () {

            let serviceType = $(popup).data('serviceType');
            let serviceUrls = $('.url-list .url', popup).toArray().map((el: HTMLInputElement) => el.value);
            let service: WebToolService = { serviceType, serviceUrls };

            if (await permissionsManager.requestPermissions([service])) {
                closePopup();
            }
        });
    }

    function setAllLogos() {
        $('.enable-all').click(async () => {

            let services = getIntegrations()
                .filter(i => i.origins.length)
                .map(i => (<WebToolService>{
                    serviceType: i.serviceType,
                    serviceUrls: i.origins
                }));

            await permissionsManager.requestPermissions(services);

            updatePermissionCheckboxes();
        });

        $('.disable-all').click(async () => {

            let services = getIntegrations()
                .map(i => (<WebToolService>{
                    serviceType: i.serviceType,
                    serviceUrls: i.origins
                }));

            await permissionsManager.removePermissions(services);

            updatePermissionCheckboxes();
        });
    }

    function initPermissionCheckboxes() {
        $('.logo-wrapper input').change(async event => {

            let input = <HTMLInputElement>event.currentTarget;
            let integration = integrations.find(i => i.serviceType == input.name);

            try {

                let service: WebToolService = {
                    serviceType: integration.serviceType,
                    serviceUrls: integration.origins
                };

                if (input.checked) {
                    await permissionsManager.requestPermissions([service]);
                } else {
                    await permissionsManager.removePermissions([service]);
                }

                updatePermissionCheckboxes();

            } catch (err) {
                console.error(err);
            }
        });

        updatePermissionCheckboxes();
    }

    function setPermissionCheckboxStatus(serviceType: string, checked: boolean) {
        $(`.logo-wrapper input[name='${serviceType}']`).prop('checked', checked);
    }

    async function updatePermissionCheckboxes() {

        const services = await getServices();
        const integrations = getIntegrations();

        integrations.forEach(integration => {

            const { serviceType } = integration;

            const service = services.find(s => s.serviceType == serviceType);

            if (service) {

                let permissions = <chrome.permissions.Permissions>{
                    origins: service.serviceUrls
                };

                chrome.permissions.contains(permissions, result => {
                    setPermissionCheckboxStatus(serviceType, result);
                });
            } else {
                setPermissionCheckboxStatus(serviceType, false);
            }
        });
    }

    function initClosePage() {
        $('.close-page').click(() => {
            chrome.tabs.getCurrent(tab => {
                chrome.tabs.remove(tab.id);
            });
        });
    }

    // init

    var permissionsManager = new PermissionManager();

    const integrations = getIntegrations().filter(i => i.serviceType && i.scripts);
    renderIntegrations('#integrations', integrations);

    setScrollArea();
    setAllLogos();
    initLogoClick();
    initPermissionCheckboxes();
    initClosePage();

    $(window).resize(function () {
        setScrollArea();
    });

});
