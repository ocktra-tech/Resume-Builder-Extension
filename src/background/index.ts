
const domain="http://127.0.0.1:5000/"

chrome.action.onClicked.addListener((tab) => {
    console.log('Action clicked');
    chrome.tabs.sendMessage(tab.id||0, {type: "SHOW_POPUP"});

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id || 0
        },
        func: () => {
            let lastUrl = location.href;

            const observer = new MutationObserver(() => {
                // Detect if the URL has changed
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    const domain = new URL(lastUrl).hostname;
                    console.log("domain   ", domain);
                    console.log("URL changed to:", lastUrl);
                    
                }
            });

            // Observe changes in the document body (look for dynamic updates)
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }).then(() => {
        console.log('Script executed successfully');
    }).catch((err) => {
        console.error('Script execution failed:', err);
    })
});



const generate_resume=()=>{
    return new Promise((resolve,reject)=>{
        chrome.storage.local.get(["accessToken","refreshToken"]).then((data)=>{
            const accessToken=data.accessToken
            const refreshToken=data.refreshToken

            chrome.storage.local.get(["jd"]).then((data)=>{
                const jd=data.jd
                
                fetch(domain+"api/generate",{
                    method:"POST",
                    headers:{
                        "Authorization":`Bearer ${accessToken}`,
                        "Content-Type":"application/json"
                    },
                    body: JSON.stringify({
                        // Add your request payload here
                        job_description:jd
                    })
                })
                .then(response=>response.json())
                .then(data=>{
                    resolve(data)
                })
            });
        })
    })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    switch (message.type) {
        case 'SAVE_TOKEN':
            const payload = message.payload;
            const accessToken=payload.access_token
            const refreshToken=payload.refresh_token
            chrome.storage.local.set({accessToken,refreshToken})
            sendResponse({message:"Token saved"})
            break;

        case 'GENERATE_RESUME':
            (async()=>{
                const data = await generate_resume()
                sendResponse(data)
            })();
            return true

        case "STORE_JD":
            const jd=message.payload
            chrome.storage.local.set({jd})
            break
        default:
            break;
    }
})








