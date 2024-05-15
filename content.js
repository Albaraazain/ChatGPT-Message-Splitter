function splitMessage(message, chunkSize) {
    let chunks = [];
    for (let i = 0; i < message.length; i += chunkSize) {
        chunks.push(message.slice(i, i + chunkSize));
    }
    return chunks;
}

async function sendChunks(chunks) {
    for (let i = 0; i < chunks.length; i++) {
        // Find the textarea and submit button
        const textarea = document.querySelector('textarea[placeholder="Message ChatGPT"]');
        const submitButton = document.querySelector('button:not([disabled]) .icon-2xl').parentElement;

        if (textarea && submitButton) {
            console.log(`Sending chunk ${i + 1}/${chunks.length}:`, chunks[i]);
            
            // Set the chunk in the textarea
            textarea.value = chunks[i];
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            // Click the submit button
            console.log('Clicking submit button');
            submitButton.click();

            // Wait for the response to appear before continuing
            console.log('Waiting for response');
            await new Promise((resolve) => {
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            const addedNode = mutation.addedNodes[0];
                            if (addedNode.querySelector('.text-token-text-primary')) { // Adjust the condition as needed
                                observer.disconnect();
                                console.log('Response received');
                                resolve();
                            }
                        }
                    }
                });

                observer.observe(document.querySelector('main'), { childList: true, subtree: true });
            });
        } else {
            console.error('Textarea or submit button not found');
            break;
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startSending") {
        console.log('Received startSending request');
        const chunks = splitMessage(request.message, request.chunkSize);
        sendChunks(chunks);
        sendResponse({ status: "started" });
    }
});
