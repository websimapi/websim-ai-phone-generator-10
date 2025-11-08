import { state, resetState } from './js/state.js';
import * as ui from './js/ui.js';
import { generatePhoneImage } from './js/api.js';
import { getCanvas, clearCanvas } from './js/canvas.js';
import { processImage } from './js/imageProcessor.js';
import { startClock, drawHomeScreen, drawAppScreen } from './js/renderer.js';
import { initializePeer, connectToPeer, sendMessage } from './js/peer.js';
import { initScanner, startScanner, stopScanner } from './js/scanner.js';

function handleCanvasClick(e) {
    if (!state.phoneBodyOverlay) return; // Only return if no phone has been generated at all

    const rect = getCanvas().getBoundingClientRect();
    const scaleX = getCanvas().width / rect.width;
    const scaleY = getCanvas().height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!state.screenBounds) {
        if (state.phoneState === 'no-screen') return; // Do nothing for no-screen phones
        // If there's a phone body but no screen, any click should be ignored.
        // This effectively means clicks outside the phone body also do nothing
        // as the canvas is sized to the phone body.
        return;
    }

    // Clicks outside the interactive screen area should do nothing.
    if (x < state.screenBounds.minX || x > state.screenBounds.maxX || y < state.screenBounds.minY || y > state.screenBounds.maxY) {
        return;
    }

    if (state.phoneState === 'locked') {
        state.phoneState = 'unlocked';
        drawHomeScreen();
    } else if (state.phoneState === 'unlocked') {
        const clickedIcon = state.iconBounds.find(icon =>
            x >= icon.x && x <= icon.x + icon.size &&
            y >= icon.y && y <= icon.y + icon.size
        );
        if (clickedIcon) {
            state.phoneState = 'in-app';
            state.currentApp = clickedIcon.type;
            if (state.currentApp === 'friends') {
                state.appSubState = 'main';
            }
            drawAppScreen(state.currentApp);
        }
    } else if (state.phoneState === 'in-app') {
        const screenWidth = state.screenBounds.maxX - state.screenBounds.minX;
        const screenHeight = state.screenBounds.maxY - state.screenBounds.minY;
        const padding = screenWidth * 0.05;

        // Generic home button logic
        const homeButtonSize = screenWidth * 0.1;
        const homeButtonRadius = homeButtonSize / 2;
        const homeButtonCenterX = state.screenBounds.minX + screenWidth / 2;
        const homeButtonCenterY = state.screenBounds.maxY - homeButtonSize * 1.5 + homeButtonRadius;

        const dx = x - homeButtonCenterX;
        const dy = y - homeButtonCenterY;
        if (dx * dx + dy * dy <= homeButtonRadius * homeButtonRadius) {
            state.phoneState = 'unlocked';
            state.currentApp = null;
            state.appSubState = null;
            state.activeChatFriend = null;
            stopScanner(); // Ensure scanner is stopped if it was open
            drawHomeScreen();
            return; // Exit after handling home button
        }

        // App-specific click logic
        if (state.currentApp === 'friends') {
            if (state.appSubState === 'show_qr') {
                // Back button
                if (y < state.screenBounds.minY + padding * 3 && x < state.screenBounds.minX + padding * 5) {
                    state.appSubState = 'main';
                    drawAppScreen('friends');
                }
            } else if (state.appSubState === 'scan_qr') {
                 // Back button for scanner
                if (y < state.screenBounds.minY + padding * 3 && x < state.screenBounds.minX + padding * 5) {
                    stopScanner();
                    state.appSubState = 'main';
                    drawAppScreen('friends');
                }
            } else { // main view
                const buttonY = state.screenBounds.maxY - 70;
                if (y > buttonY && y < buttonY + 50) {
                    const buttonWidth = (screenWidth - padding * 3) / 2;
                    // "My QR Code" button
                    if (x > state.screenBounds.minX + padding && x < state.screenBounds.minX + padding + buttonWidth) {
                        state.appSubState = 'show_qr';
                        state.qrCodeImage = null; // Force regeneration
                        drawAppScreen('friends');
                    }
                    // "Scan Friend" button
                    if (x > state.screenBounds.minX + padding * 2 + buttonWidth && x < state.screenBounds.maxX - padding) {
                        state.appSubState = 'scan_qr';
                        drawAppScreen('friends'); // Draw the scanner UI first

                        // Calculate viewport position of the screen
                        const canvasRect = getCanvas().getBoundingClientRect();
                        const scaleX = canvasRect.width / getCanvas().width;
                        const scaleY = canvasRect.height / getCanvas().height;

                        const screenViewport = {
                            left: canvasRect.left + state.screenBounds.minX * scaleX,
                            top: canvasRect.top + state.screenBounds.minY * scaleY,
                            width: (state.screenBounds.maxX - state.screenBounds.minX) * scaleX,
                            height: (state.screenBounds.maxY - state.screenBounds.minY) * scaleY,
                        };

                        startScanner(
                            screenViewport,
                            (friendId) => {
                                alert(`Scanned ID: ${friendId}. Connecting...`);
                                connectToPeer(friendId);
                                state.appSubState = 'main';
                                drawAppScreen('friends');
                            },
                            (err) => {
                                alert(`Error starting scanner: ${err.message}`);
                            }
                        );
                    }
                }
            }
        } else if (state.currentApp === 'messages') {
             if (!state.activeChatFriend) {
                // Friend list view
                const itemHeight = 60;
                state.friends.forEach((friend, i) => {
                    const friendY = state.screenBounds.minY + padding * 3 + i * itemHeight;
                    if (y > friendY && y < friendY + itemHeight) {
                        state.activeChatFriend = friend.peer;
                        drawAppScreen('messages');
                    }
                });
            } else {
                // Chat view - Send button
                const sendButtonY = state.screenBounds.maxY - 60;
                if (y > sendButtonY && y < sendButtonY + 50) {
                     sendMessage(state.activeChatFriend, 'Hello!');
                }
                 // Back button (top left corner)
                if (y < state.screenBounds.minY + padding * 3 && x < state.screenBounds.minX + padding * 5) {
                    state.activeChatFriend = null;
                    drawAppScreen('messages');
                }
            }
        }
    }
}

async function generatePhone() {
    const userPrompt = ui.getPromptValue();
    if (!userPrompt) {
        alert('Please enter a description for the phone.');
        return;
    }

    state.phoneState = 'generating';
    resetState();
    ui.showControls(false);
    ui.setLoading(true);
    clearCanvas();

    try {
        const imageUrl = await generatePhoneImage(userPrompt);
        processImage(imageUrl, (foundScreen, error) => {
            ui.setLoading(false);
            if(error) {
                 ui.showControls(true);
                 return;
            }
            if (foundScreen) {
                state.phoneState = 'locked';
                initializePeer(); // Initialize PeerJS connection on first successful generation
                startClock();
            } else {
                state.phoneState = 'no-screen'; // Keep the static image, don't revert to initial.
            }
            ui.showResetButton(true);
        });
    } catch (error) {
        ui.setLoading(false);
        ui.showControls(true);
    }
}

function resetApp() {
    if (state.phoneBodyOverlay) {
        resetState();
        ui.showControls(true);
        ui.showResetButton(false);
        clearCanvas();
    }
}

function main() {
    ui.initUI(generatePhone, resetApp);
    initScanner();
    getCanvas().addEventListener('click', handleCanvasClick);
}

main();