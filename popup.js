document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.querySelector('.mb-1.mr-1.flex.h-8.w-8.items-center.justify-center.rounded-full.bg-black.text-white.transition-colors');
    const messageInput = document.getElementById('message');
    const chunkSizeInput = document.getElementById('chunk_size');

    console.log('Popup script loaded');
    console.log('Start button:', startButton);
    console.log('Message input:', messageInput);
    console.log('Chunk size input:', chunkSizeInput);

    if (startButton && messageInput && chunkSizeInput) {
        console.log('All elements found');
        startButton.addEventListener('click', () => {
            const message = messageInput.value;
            const chunkSize = parseInt(chunkSizeInput.value);

            console.log('Button clicked');
            console.log('Message:', message);
            console.log('Chunk size:', chunkSize);

            // Split the message into chunks
            const messageChunks = [];
            for (let i = 0; i < message.length; i += chunkSize) {
                messageChunks.push(message.substring(i, i + chunkSize));
            }

            // Send each chunk sequentially
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0].url.startsWith("https://chatgpt.com")) {
                    sendChunk(tabs[0].id, messageChunks, 0);
                } else {
                    console.error("This script can only be run on https://chatgpt.com");
                }
            });
        });
    } else {
        console.error('Could not find one or more required elements.');
    }
});

// Function to send a chunk and wait for the response before sending the next chunk
function sendChunk(tabId, chunks, index) {
    if (index >= chunks.length) {
        console.log('All chunks sent');
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (chunk, index) => {
            // Inject chunk into ChatGPT text area and simulate a click on the send button
            const messageInput = document.querySelector('textarea[placeholder="Message ChatGPT"]');
            const sendButton = document.querySelector('button.mb-1.mr-1.flex.h-8.w-8.items-center.justify-center.rounded-full.bg-black.text-white.transition-colors');

            if (messageInput && sendButton) {
                messageInput.value = chunk;

                // Create and dispatch an input event to make sure the textarea update is detected
                const inputEvent = new Event('input', { bubbles: true });
                messageInput.dispatchEvent(inputEvent);

                // Add a small delay before clicking the button
                setTimeout(() => {
                    sendButton.disabled = false;
                    sendButton.click();
                    console.log(`Chunk ${index + 1} sent`);

                    // Wait for the response to appear
                    const observer = new MutationObserver((mutationsList, observer) => {
                        for (const mutation of mutationsList) {
                            if (mutation.addedNodes.length) {
                                for (const node of mutation.addedNodes) {
                                    if (node.nodeType === 1 && node.getAttribute('data-message-author-role') === 'assistant') {
                                        console.log(`Response for chunk ${index + 1} received`);
                                        observer.disconnect();
                                        chrome.runtime.sendMessage({ action: "nextChunk", index: index + 1 });
                                    }
                                }
                            }
                        }
                    });

                    const chatContainer = document.querySelector('.react-scroll-to-bottom--css-duown-79elbk');
                    observer.observe(chatContainer, { childList: true, subtree: true });
                }, 500); // Delay of 500ms
            } else {
                console.error('Could not find the message input or send button');
            }
        },
        args: [chunks[index], index]
    }, (results) => {
        if (chrome.runtime.lastError) {
            console.error(`Script injection failed: ${chrome.runtime.lastError.message}`);
        } else {
            console.log(`Chunk ${index + 1}/${chunks.length} injected successfully`);
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "nextChunk") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendChunk(tabs[0].id, messageChunks, request.index);
        });
        sendResponse({ status: 'success' });
    }
});
