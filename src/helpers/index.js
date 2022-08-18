export const fetchJsonWithReject = (url, config, attempts = 0) => {
    return fetch(url, config)
            .then(response => {
                if (!response.ok){
                    throw response;
                }
                return response.json();
            })
            .catch(async (error) => {
                try{
                    if(error.status === 429 && attempts < 10){
                        await delay(random(100, 750) + (attempts * 100));
                        return await fetchJsonWithReject<T>(url, config, attempts + 1);
                    }
                    return error.json().then((response) => {
                        throw response;
                    });
                }
                catch (e){
                    throw error;
                }
            });
}