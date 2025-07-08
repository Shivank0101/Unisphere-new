import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';

const QRScanner = ({ onClose, onSuccess }) => {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        if (videoRef.current) {
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            result => handleScan(result.data),
            {
              onDecodeError: err => {
                // Ignore decode errors - they're normal when no QR code is visible
                console.log('Decode error (normal):', err);
              },
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment', // Use back camera if available
            }
          );

          await qrScannerRef.current.start();
          setError('');
        }
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to access camera. Please check permissions and try again.');
      }
    };

    if (scanning && !loading) {
      initializeScanner();
    }

    // Cleanup function
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [scanning, loading]);

  const handleScan = async (data) => {
    if (data && scanning) {
      setScanning(false);
      setLoading(true);
      setError('');

      // Stop the scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }

      try {
        const token = localStorage.getItem("token");
        
        console.log('📤 Sending QR data:', data); // Debug log
        
        // Send the QR data to mark attendance - FIXED URL
        const response = await axios.post(
          "http://unisphere-backend-o6o2.onrender.com/api/v1/attendance/qr/mark", // Fixed: was /mark-qr
          { qrData: data },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );

        console.log('✅ Response received:', response.data); // Debug log

        if (response.data.success) {
          onSuccess && onSuccess(response.data.message || 'Attendance marked successfully!');
        }
      } catch (err) {
        console.error('QR Scan Error:', err);
        setError(
          err.response?.data?.message || 
          'Failed to mark attendance. Please try again.'
        );
        setScanning(true); // Allow retry
      } finally {
        setLoading(false);
      }
    }
  };

  const retryScanning = () => {
    setError('');
    setScanning(true);
    setLoading(false);
  };

  const handleClose = () => {
    // Clean up scanner before closing
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {scanning && !loading && (
          <>
            <div className="mb-4 relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg"
                playsInline
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none opacity-50"></div>
            </div>
            <p className="text-gray-300 text-sm text-center">
              Position the QR code within the frame to mark your attendance
            </p>
          </>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Processing attendance...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={retryScanning}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mr-2"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
