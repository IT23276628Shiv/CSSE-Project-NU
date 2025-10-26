import React, { useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/axiosInstance";
import "./SearchSection.css"; // 👈 add this line

export default function SearchSection({ setPatientData }) {
  const [healthId, setHealthId] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!healthId) return;
    try {
      setLoading(true);
      const res = await api.get(`/receptionist/patient/${healthId}`);
      setPatientData(res.data.patient);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    const html5Qrcode = new Html5Qrcode("qr-reader");
    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          setScanResult(decodedText);
          html5Qrcode.stop();
          try {
            setLoading(true);
            const res = await api.get(`/receptionist/patient/${decodedText}`);
            setPatientData(res.data.patient);
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Patient not found");
          } finally {
            setLoading(false);
          }
        }
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="search-card shadow-sm p-4">
      <h5 className="section-title mb-3">
        🏥 Patient Lookup
      </h5>

      <div className="search-input-group mb-4">
        <label className="form-label">Health Card ID</label>
        <div className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Enter Health ID..."
            value={healthId}
            onChange={(e) => setHealthId(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={!healthId || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      <div className="qr-section text-center">
        <h6 className="text-muted mb-2">or</h6>
        <button className="btn btn-success scan-btn" onClick={startScanner}>
          <i className="bi bi-qr-code-scan me-2"></i> Scan QR Code
        </button>

        <div id="qr-reader" className="qr-reader-box mt-3"></div>

        {scanResult && (
          <div className="alert alert-success mt-3 mb-0">
            ✅ QR Scanned: <strong>{scanResult}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
