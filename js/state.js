export const state = {
    phoneState: 'initial', // 'initial', 'generating', 'locked', 'unlocked', 'in-app'
    phoneBodyOverlay: null,
    screenBackground: null,
    screenBounds: null,
    iconBounds: [],
    currentApp: null,
    timeInterval: null,
    // PeerJS state
    peer: null,
    peerId: null,
    friends: [], // array of PeerJS connection objects
    messages: {}, // { friendId: [ { sender, text }, ... ] }
    // App-specific state
    appSubState: null, // e.g., for friends app: 'main', 'show_qr', 'scan_qr'
    qrCodeImage: null, // To store the generated QR code Image object
    activeChatFriend: null,
};

export function resetState() {
    state.phoneState = 'initial';
    state.phoneBodyOverlay = null;
    state.screenBackground = null;
    state.screenBounds = null;
    state.iconBounds = [];
    state.currentApp = null;
    if (state.timeInterval) {
        clearInterval(state.timeInterval);
        state.timeInterval = null;
    }
    // Reset app-specific state, but not peer connection
    state.appSubState = null;
    state.qrCodeImage = null;
    state.activeChatFriend = null;
}