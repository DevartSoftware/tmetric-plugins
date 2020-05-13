const integrations = <IntegrationInfo[]>[
    {
        serviceName: "Asana",
        icon: "asana.svg"
    }
];

function renderIntegrations(holder: string) {
    let content = integrations.map(item => $('<span>')
        .attr('title', item.serviceName)
        .append(`<img src="../images/integrations/${item.icon}"/>`)
    );
    $(holder).empty().append(content);
}

renderIntegrations('#integrations');