import { state } from './state.js';
import QRCode from 'qrcode';

export function drawPhoneApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const centerX = bounds.minX + screenWidth / 2;
    const screenHeight = bounds.maxY - bounds.minY;
    const keypadTop = bounds.minY + screenHeight * 0.3;

    ctx.fillStyle = '#333';
    ctx.fillRect(bounds.minX, bounds.minY, screenWidth, screenHeight * 0.25);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(screenWidth/12)}px sans-serif`;
    ctx.fillText("555-4242", centerX, bounds.minY + screenHeight * 0.15);


    const buttons = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '*', '0', '#'
    ];
    const btnSize = screenWidth * 0.2;
    const gap = screenWidth * 0.05;
    const keypadWidth = 3 * btnSize + 2 * gap;
    const startX = centerX - keypadWidth / 2;

    for(let i=0; i<buttons.length; i++) {
        const row = Math.floor(i/3);
        const col = i % 3;
        const x = startX + col * (btnSize + gap);
        const y = keypadTop + row * (btnSize + gap);
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(x + btnSize/2, y + btnSize/2, btnSize/2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(btnSize/2)}px sans-serif`;
        ctx.fillText(buttons[i], x + btnSize/2, y + btnSize/2 + 5);
    }
}

export function drawMessagesApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const padding = screenWidth * 0.05;
    const itemHeight = 60;
    
    // If no friend is selected for chat, show friend list
    if (!state.activeChatFriend) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(screenWidth/15)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText("Messages", bounds.minX + screenWidth / 2, bounds.minY + padding*2);

        if (state.friends.length === 0) {
             ctx.font = `${Math.floor(screenWidth/20)}px sans-serif`;
             ctx.fillText("No friends added yet.", bounds.minX + screenWidth / 2, bounds.minY + 100);
             ctx.fillText("Go to the Friends app to connect.", bounds.minX + screenWidth / 2, bounds.minY + 130);
             return;
        }

        ctx.textAlign = 'left';
        state.friends.forEach((friend, i) => {
            const y = bounds.minY + padding * 3 + i * itemHeight;
            ctx.fillStyle = friend.open ? '#4CAF50' : '#f44336'; // Green for open, red for closed
            ctx.beginPath();
            ctx.arc(bounds.minX + padding + 10, y + itemHeight/2, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = `bold ${Math.floor(screenWidth/20)}px sans-serif`;
            const peerId = friend.peer;
            const displayName = `...${peerId.substring(peerId.length - 6)}`;
            ctx.fillText(displayName, bounds.minX + padding + 30, y + itemHeight/2 + 5);
        });
        return;
    }

    // Chat view with a specific friend
    const friendId = state.activeChatFriend;
    const chatHistory = state.messages[friendId] || [];

    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(screenWidth/15)}px sans-serif`;
    ctx.textAlign = 'center';
    const displayName = `...${friendId.substring(friendId.length - 6)}`;
    ctx.fillText(displayName, bounds.minX + screenWidth / 2, bounds.minY + padding*2);

    // Draw chat bubbles
    let currentY = bounds.minY + padding * 4;
    chatHistory.slice(-10).forEach(msg => { // Show last 10 messages
        const isUser = msg.sender === 'me';
        ctx.font = `${Math.floor(screenWidth/22)}px sans-serif`;
        const textMetrics = ctx.measureText(msg.text);
        const textWidth = textMetrics.width;
        const textHeight = screenWidth/22;
        const bubbleWidth = textWidth + padding*2;
        const bubbleHeight = textHeight + padding;
        const x = isUser ? bounds.maxX - bubbleWidth - padding : bounds.minX + padding;

        ctx.fillStyle = isUser ? '#007bff' : '#e5e5ea';
        ctx.beginPath();
        ctx.roundRect(x, currentY, bubbleWidth, bubbleHeight, 15);
        ctx.fill();

        ctx.fillStyle = isUser ? 'white' : 'black';
        ctx.textAlign = 'left';
        ctx.fillText(msg.text, x + padding, currentY + textHeight * 0.8 + padding/2);
        currentY += bubbleHeight + padding/2;
    });

    // Draw fake "Send" button
    const sendButtonY = bounds.maxY - 60;
    ctx.fillStyle = '#007bff';
    ctx.roundRect(bounds.minX + padding, sendButtonY, screenWidth - padding * 2, 50, 10);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(screenWidth/20)}px sans-serif`;
    ctx.fillText("Send 'Hello!'", bounds.minX + screenWidth/2, sendButtonY + 32);
}

function drawScannerApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const padding = screenWidth * 0.05;
    const centerX = bounds.minX + screenWidth / 2;
    const headerY = bounds.minY + padding * 3.5;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(screenWidth / 15)}px sans-serif`;
    ctx.fillText("Scan QR Code", centerX, headerY);

    // Back button
    ctx.textAlign = 'left';
    ctx.fillText("< Back", bounds.minX + padding, headerY);

    // Draw a frame to guide the user
    const frameSize = Math.min(screenWidth, bounds.maxY - bounds.minY) * 0.7;
    const frameX = centerX - frameSize / 2;
    const frameY = bounds.minY + (bounds.maxY - bounds.minY) / 2 - frameSize / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(frameX, frameY, frameSize, frameSize);
}

export function drawFriendsApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const padding = screenWidth * 0.05;
    const centerX = bounds.minX + screenWidth / 2;
    const itemHeight = 50;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(screenWidth/15)}px sans-serif`;

    if (state.appSubState === 'show_qr') {
        const headerY = bounds.minY + padding * 3.5;
        ctx.fillText("My QR Code", centerX, headerY);
        if (state.qrCodeImage) {
            const qrSize = screenWidth * 0.7;
            const screenHeight = bounds.maxY - bounds.minY;
            const qrY = (bounds.minY + screenHeight / 2) - (qrSize / 2);
            ctx.drawImage(state.qrCodeImage, centerX - qrSize/2, qrY, qrSize, qrSize);
        } else {
            ctx.fillText("Generating...", centerX, bounds.minY + 100);
            if (!state.qrCodeImage) { // Prevent multiple generations
                QRCode.toDataURL(state.peerId || '', { width: 512, margin: 1 })
                    .then(url => {
                        const img = new Image();
                        img.src = url;
                        img.onload = async () => {
                            state.qrCodeImage = img;
                            // Use dynamic import to avoid circular dependency
                            const { drawAppScreen } = await import('./renderer.js');
                            drawAppScreen('friends');
                        };
                    })
                    .catch(err => console.error(err));
            }
        }
         // Back button
         ctx.textAlign = 'left';
        ctx.fillText("< Back", bounds.minX + padding, headerY);

    } else if (state.appSubState === 'scan_qr') {
        drawScannerApp(ctx, bounds);
    } else { // Main view
        ctx.textAlign = 'center';
        ctx.fillText("Friends", centerX, bounds.minY + padding * 2);
        
        // Friend list
        if (state.friends.length === 0) {
            ctx.font = `${Math.floor(screenWidth/22)}px sans-serif`;
            ctx.fillText("No friends yet. Add one!", centerX, bounds.minY + padding * 4);
        } else {
            ctx.textAlign = 'left';
            state.friends.forEach((friend, i) => {
                 const y = bounds.minY + padding * 3 + i * itemHeight;
                 ctx.fillStyle = friend.open ? '#4CAF50' : '#f44336';
                 ctx.beginPath();
                 ctx.arc(bounds.minX + padding + 10, y + itemHeight/2, 10, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.fillStyle = 'white';
                 ctx.font = `bold ${Math.floor(screenWidth/20)}px sans-serif`;
                 ctx.fillText(friend.peer, bounds.minX + padding + 30, y + itemHeight/2 + 5, screenWidth - padding*2 - 30);
            });
        }
       
        // Buttons at the bottom
        const buttonY = bounds.maxY - 70;
        const buttonWidth = (screenWidth - padding * 3) / 2;
        ctx.fillStyle = '#007bff';
        ctx.roundRect(bounds.minX + padding, buttonY, buttonWidth, 50, 10);
        ctx.fill();
        
        ctx.fillStyle = '#4CAF50';
        ctx.roundRect(bounds.minX + padding * 2 + buttonWidth, buttonY, buttonWidth, 50, 10);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.floor(screenWidth/22)}px sans-serif`;
        ctx.fillText("My QR Code", bounds.minX + padding + buttonWidth / 2, buttonY + 32);
        ctx.fillText("Scan Friend", bounds.minX + padding * 2 + buttonWidth + buttonWidth / 2, buttonY + 32);
    }
}


export function drawMusicApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const centerX = bounds.minX + screenWidth / 2;

    ctx.fillStyle = '#c0392b';
    const artSize = screenWidth * 0.6;
    ctx.fillRect(centerX - artSize/2, bounds.minY + 50, artSize, artSize);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText("?", centerX, bounds.minY + 50 + artSize/2 + 10);

    ctx.font = `bold ${Math.floor(screenWidth/15)}px sans-serif`;
    ctx.fillText("AI Generated Tune", centerX, bounds.minY + 80 + artSize);
    ctx.font = `${Math.floor(screenWidth/20)}px sans-serif`;
    ctx.fillText("By The Circuits", centerX, bounds.minY + 110 + artSize);

    // Play button
    ctx.beginPath();
    ctx.arc(centerX, bounds.maxY - 80, 30, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, bounds.maxY - 95);
    ctx.lineTo(centerX + 15, bounds.maxY - 80);
    ctx.lineTo(centerX - 10, bounds.maxY - 65);
    ctx.closePath();
    ctx.fill();
}

export function drawBrowserApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const centerX = bounds.minX + screenWidth / 2;
    const padding = screenWidth * 0.05;

    // Address bar
    ctx.fillStyle = '#eee';
    ctx.fillRect(bounds.minX + padding, bounds.minY + padding, screenWidth - padding*2, 40);
    ctx.fillStyle = '#aaa';
    ctx.font = `16px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText("https://websim.ai", bounds.minX + padding*2, bounds.minY + padding + 26);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(screenWidth/12)}px sans-serif`;
    ctx.fillText("Welcome to the", centerX, bounds.minY + 150);
    ctx.fillText("Internet!", centerX, bounds.minY + 200);
}

export function drawCameraApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const centerX = bounds.minX + screenWidth / 2;

    ctx.fillStyle = '#333';
    ctx.fillRect(bounds.minX, bounds.minY, screenWidth, bounds.maxY - bounds.minY);

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.minX + screenWidth/3, bounds.minY);
    ctx.lineTo(bounds.minX + screenWidth/3, bounds.maxY);
    ctx.moveTo(bounds.minX + 2*screenWidth/3, bounds.minY);
    ctx.lineTo(bounds.minX + 2*screenWidth/3, bounds.maxY);
    ctx.moveTo(bounds.minX, bounds.minY + (bounds.maxY - bounds.minY)/3);
    ctx.lineTo(bounds.maxX, bounds.minY + (bounds.maxY - bounds.minY)/3);
    ctx.moveTo(bounds.minX, bounds.minY + 2*(bounds.maxY - bounds.minY)/3);
    ctx.lineTo(bounds.maxX, bounds.minY + 2*(bounds.maxY - bounds.minY)/3);
    ctx.stroke();

    // Shutter button
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, bounds.maxY - 60, 30, 0, Math.PI*2);
    ctx.stroke();
}

export function drawSettingsApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const padding = screenWidth * 0.05;
    const itemHeight = 50;

    const settings = ["Wi-Fi", "Bluetooth", "Cellular", "Display", "Sound"];

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.font = `${Math.floor(screenWidth/18)}px sans-serif`;

    for (let i = 0; i < settings.length; i++) {
        const y = bounds.minY + padding + i * itemHeight;
        ctx.fillText(settings[i], bounds.minX + padding, y + itemHeight/2 + 5);
        ctx.fillStyle = '#444';
        ctx.fillRect(bounds.minX, y + itemHeight, screenWidth, 1);
        ctx.fillStyle = 'white';
    }
}

export function drawMailApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const padding = screenWidth * 0.05;

    const emails = [
        { from: "Websim", subject: "Welcome!" },
        { from: "AI Weekly", subject: "New Models Available" },
        { from: "Team", subject: "Project Update" },
    ];

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    for (let i = 0; i < emails.length; i++) {
        const y = bounds.minY + padding + i * 80;
        ctx.font = `bold ${Math.floor(screenWidth/20)}px sans-serif`;
        ctx.fillText(emails[i].from, bounds.minX + padding, y + 30);
        ctx.font = `${Math.floor(screenWidth/25)}px sans-serif`;
        ctx.fillStyle = '#aaa';
        ctx.fillText(emails[i].subject, bounds.minX + padding, y + 55);
        ctx.fillStyle = '#444';
        ctx.fillRect(bounds.minX, y + 79, screenWidth, 1);
        ctx.fillStyle = 'white';
    }
}

export function drawClockApp(ctx, bounds) {
    const screenWidth = bounds.maxX - bounds.minX;
    const screenHeight = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + screenWidth / 2;
    const centerY = bounds.minY + screenHeight / 2;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Adjust font size to be more conservative to fit properly
    const fontSize = Math.max(12, Math.floor(Math.min(screenWidth / 6, screenHeight / 4)));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(timeString, centerX, centerY);
}