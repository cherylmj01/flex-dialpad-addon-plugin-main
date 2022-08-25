const request = async (path, manager, params) =>{
    const body = {
        ...params,
        Token: manager.store.getState().flex.session.ssoTokenPayload.token
    };

    const options = {
        method: 'POST',
        body: new URLSearchParams(body),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
    };

    const serverlessDomain = manager.serviceConfiguration.ui_attributes.domainName;
    console.log('REQUEST BASE URL: ', serverlessDomain, ' PATH:', path);
    const resp = await fetch(`https://${serverlessDomain}/${path}`, options)
    return (await resp.json())
}

export {
    request
}