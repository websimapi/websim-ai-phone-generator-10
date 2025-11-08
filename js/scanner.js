import { Html5Qrcode } from 'html5-qrcode';

const scannerContainer = document.getElementById('scanner-container');
const closeScannerBtn = document.getElementById('close-scanner-btn');
let html5QrCode;

export function startScanner(onSuccess, onError) {
    scannerContainer.classList.remove('hidden');

    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        stopScanner();
        onSuccess(decodedText);
    };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.warn("Failed to start QR scanner with back camera, trying front.", err);
            html5QrCode.start({ }, config, qrCodeSuccessCallback)
                 .catch(err2 => {
                     console.error("Failed to start any camera", err2);
                     stopScanner();
                     onError(err2);
                 });
        });
}

export function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning stopped.");
        }).catch(err => {
            console.error("Failed to stop QR scanner.", err);
        });
    }
    scannerContainer.classList.add('hidden');
}

export function initScanner() {
    closeScannerBtn.addEventListener('click', stopScanner);
}

