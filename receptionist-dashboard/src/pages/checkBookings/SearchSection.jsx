import React, { useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/axiosInstance";

export default function SearchSection({ setPatientData }) {
  const [healthId, setHealthId] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!healthId) return;
    try {
      setLoading(true);
      const res = await api.get(`/patient/${healthId}`);
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

          // fetch patient data by scanned ID
          try {
            setLoading(true);
            const res = await api.get(`/patient/${decodedText}`);
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
    <div className="card p-3 mb-3 shadow-sm">
      <div className="mb-2">
        <label>Enter Health Card ID:</label>
        <input
          type="text"
          className="form-control"
          value={healthId}
          onChange={(e) => setHealthId(e.target.value)}
        />
        <button className="btn btn-primary mt-2" onClick={handleSearch} disabled={!healthId || loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div className="mt-3">
        <button className="btn btn-success" onClick={startScanner}>
          Scan QR
        </button>
        <div id="qr-reader" style={{ width: "300px", marginTop: "10px" }}></div>
        {scanResult && <div className="alert alert-success mt-2">QR Scanned: {scanResult}</div>}
      </div>
    </div>
  );
}
