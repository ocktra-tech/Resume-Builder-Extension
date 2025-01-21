const decodeBase64PDF=(base64String:string)=>{
    const blob = new Blob([Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
    return blob
}

const createPopupElement=()=>{

}
// <div class="loader" id="loader">
//                 <div></div>
//                 <div></div>
//                 <div></div>
//                 <div></div>
//             </div>
const createMinPopupElement=()=>{
    const minPopup = document.createElement('div');
    minPopup.id = 'xpresscv-min-popup';
    minPopup.innerHTML = `
        
        <div class="xpresscv-logo">
            <img id="cv-logo" src="https://xpresscv.com/logo192_.png" alt="XpressCV Logo" />
        </div>
        <div class="xpresscv-op-options">
            
            <button id="xpresscv-download-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.44 8.90002C20.04 9.21002 21.51 11.06 21.51 15.11V15.24C21.51 19.71 19.72 21.5 15.25 21.5H8.73998C4.26998 21.5 2.47998 19.71 2.47998 15.24V15.11C2.47998 11.09 3.92998 9.24002 7.46998 8.91002" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 2V14.88" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.35 12.65L12 16L8.65002 12.65" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(minPopup);

    const minButton = document.getElementById('xpresscv-download-btn');
    if(minButton) {
        minButton.addEventListener('click', () => {
            minButton.style.display = 'none';
            chrome.runtime.sendMessage({ type: 'GENERATE_RESUME' },(response)=>{
                console.log('Response in context :', response);
                if(response.resume){
                    const pdfBlob = decodeBase64PDF(response.resume);
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const aElement = document.createElement('a');
                    aElement.href = pdfUrl;
                    aElement.download = 'resume.pdf';
                    aElement.click();
                    
                    minButton.style.display = 'block';

                }
            });
        })
    }
}

const attachPopup = () => {

    if(!document.getElementById('xpresscv-popup')) {
        const popup = document.createElement('div');
        popup.id = 'xpresscv-popup';
        popup.innerHTML = `
            <div class="xpresscv-options">
                <button class"options-btn" id="xpresscv-min-btn">-</button>
                <button class"options-btn" id="xpresscv-close-btn">X</button>
            </div>
            <div id="host-div">
                <iframe id="host-ext" src="http://localhost:3000/"></iframe>
            </div>
        `;

        document.body.appendChild(popup);
        const closeButton = document.getElementById("xpresscv-close-btn");
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                popup.remove();
                createMinPopupElement();
            })
        }
    }

}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    switch (message.type) {
        case 'SHOW_POPUP':
            const minPopup=document.getElementById('xpresscv-min-popup');
            if(minPopup){
                minPopup.remove();
            }
            attachPopup();
            break;
        default:
            break;
    }
});

window.addEventListener('message', (event) => {
    const allowedOrigins = ['http://localhost:3000'];

    if(event.origin!==allowedOrigins[0]) return;

    console.log('Message received from', event.origin);
    console.log('Message:', event.data);

    const { type, token } = event.data;
    if (type === 'TOKEN' && token) {
        // Send the token to the background script
        chrome.runtime.sendMessage({ 
            type: 'SAVE_TOKEN', 
            payload: token
        });
    }
    
    
})

const extractTextFromElement=(element:Element)=> {
    let textContent = '';

    // Loop through all child nodes
    element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // If it's a text node, add its content
            if (node.textContent) {
                textContent += node.textContent.trim() + '\n';
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // If it's an element node, recursively extract text from it
            textContent += extractTextFromElement(node as HTMLElement);
        }
    });

    return textContent.trim();
}

const handlePageLoad = () => {
    // Ensure the job content is loaded
    try{
        const element = document.querySelector('p[dir="ltr"]');
        if (element) {
            const extractedText=extractTextFromElement(element)
            console.log("extracted text : ",extractedText)
            chrome.runtime.sendMessage({type:"STORE_JD",payload:extractedText})
        } else {
            setTimeout(handlePageLoad, 1000);
        }
    }catch(err){
        console.log("error in handle page load : ",err)
    }
};


// Function to observe URL changes in the SPA and re-run the content script logic.
const observeUrlChanges = () => {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
        // Detect if the URL has changed
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log("URL changed to:", lastUrl);
            const downloadBtn = document.getElementById('xpresscv-download-btn');
            if (downloadBtn) {
                downloadBtn.removeAttribute('href');
            }
            handlePageLoad();  // Re-run your content script logic
        }
    });

    // Observe changes in the document body (look for dynamic updates)
    observer.observe(document.body, { childList: true, subtree: true });
};

// Initialize the URL change observer
observeUrlChanges();

