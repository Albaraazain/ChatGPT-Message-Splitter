// Initialize a variable to store the received chunks
let receivedChunks = [];
let completeMessage = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startSending") {
        const { chunk, index } = request;
        console.log(`Background received chunk ${index + 1}:`, chunk);

        // Store the received chunk
        receivedChunks[index] = chunk;

        // Check if all chunks are received
        if (receivedChunks.length && !receivedChunks.includes(undefined)) {
            // Combine all chunks into the complete message
            completeMessage = receivedChunks.join('');
            console.log('Complete message:', completeMessage);

            // Clear the receivedChunks array for next message
            receivedChunks = [];
        }

        sendResponse({ status: 'success' });
    }
    return true; // Will respond asynchronously
});
