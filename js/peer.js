import Peer from 'peerjs';
import { state } from './state.js';
import { drawAppScreen, drawHomeScreen } from './renderer.js';

let peer;

export function initializePeer() {
    if (peer && !peer.destroyed) {
        return; // Already initialized
    }
    if(peer) peer.destroy();

    peer = new Peer({
        // For development, replace with a local PeerServer if needed.
        // Using the cloud PeerServer can be unreliable.
    });
    state.peer = peer;

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        state.peerId = id;
    });

    peer.on('connection', (conn) => {
        console.log('Incoming connection from', conn.peer);
        if (state.friends.some(f => f.peer === conn.peer)) {
             console.log("Connection from this peer already exists.");
             conn.close();
             return;
        }
        setupConnectionEventHandlers(conn);
        state.friends.push(conn);
        conn.on('open', () => { // Wait for connection to be open before redrawing
            if (state.currentApp === 'friends') {
                drawAppScreen('friends');
            }
        });
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        // Avoid alerting for common network issues that are often recoverable
        if(err.type !== 'peer-unavailable' && err.type !== 'network') {
          alert(`PeerJS Error: ${err.type}`);
        }
    });

     peer.on('disconnected', () => {
        console.log('PeerJS disconnected. Attempting to reconnect...');
        peer.reconnect();
    });
}

function setupConnectionEventHandlers(conn) {
    conn.on('data', (data) => {
        console.log('Received:', data);
        if (data.type === 'message') {
            if (!state.messages[conn.peer]) {
                state.messages[conn.peer] = [];
            }
            state.messages[conn.peer].push({ sender: 'friend', text: data.payload });

            if (state.currentApp === 'messages' && state.activeChatFriend === conn.peer) {
                 drawAppScreen('messages');
            }
        }
    });

    conn.on('close', () => {
        console.log('Connection closed with', conn.peer);
        state.friends = state.friends.filter(f => f.peer !== conn.peer);
        if (state.currentApp === 'friends') {
            drawAppScreen('friends');
        } else if (state.currentApp === 'messages' && state.activeChatFriend === conn.peer) {
            state.activeChatFriend = null; // Go back to friends list
            drawAppScreen('messages');
        }
    });

     conn.on('error', (err) => {
        console.error('PeerJS connection error:', err);
    });
}

export function connectToPeer(friendId) {
    if (!peer || peer.destroyed) {
        console.error("PeerJS not initialized.");
        return;
    }
    if (state.friends.some(f => f.peer === friendId) || friendId === state.peerId) {
        console.log("Already connected or connecting to self.");
        return;
    }
    console.log('Attempting to connect to', friendId);
    const conn = peer.connect(friendId, { reliable: true });
    setupConnectionEventHandlers(conn);

    conn.on('open', () => {
        if (!state.friends.some(f => f.peer === conn.peer)) {
             state.friends.push(conn);
        }
        if (state.currentApp === 'friends') {
            drawAppScreen('friends');
        }
    });
}

export function sendMessage(friendId, message) {
    const friendConn = state.friends.find(f => f.peer === friendId);
    if (friendConn && friendConn.open) {
        const data = { type: 'message', payload: message };
        friendConn.send(data);
        if (!state.messages[friendId]) {
            state.messages[friendId] = [];
        }
        state.messages[friendId].push({ sender: 'me', text: message });
        drawAppScreen('messages');
    } else {
        console.error('No open connection to friend', friendId);
        alert('Could not send message. Friend is not connected.');
    }
}