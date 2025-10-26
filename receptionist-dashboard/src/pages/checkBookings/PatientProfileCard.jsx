export default function PatientProfileCard({ patient }) {
  const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
  const age = dob ? Math.floor((new Date() - dob) / 31557600000) : "N/A";

  return (
    <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
      <div className="card-header bg-primary text-white py-3">
        <h5 className="mb-0">
          <i className="fas fa-user-injured me-2"></i>
          Patient Details
        </h5>
      </div>
      <div className="card-body p-4">
        <div className="row g-3">
          <div className="col-12">
            <div className="d-flex align-items-center p-3 bg-light rounded-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="fas fa-user fs-5"></i>
              </div>
              <div>
                <h6 className="mb-1 text-muted">Full Name</h6>
                <h5 className="mb-0 text-dark">{patient.fullName}</h5>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="p-3 border rounded-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-birthday-cake text-primary me-2"></i>
                <h6 className="mb-0 text-muted">Age</h6>
              </div>
              <p className="mb-0 fs-5 fw-semibold text-dark">{age} years</p>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="p-3 border rounded-3 h-100">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-venus-mars text-primary me-2"></i>
                <h6 className="mb-0 text-muted">Gender</h6>
              </div>
              <p className="mb-0 fs-5 fw-semibold text-dark">{patient.gender}</p>
            </div>
          </div>
          
          <div className="col-12">
            <div className="p-3 border rounded-3">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-id-card text-primary me-2"></i>
                <h6 className="mb-0 text-muted">Health ID</h6>
              </div>
              <p className="mb-0 fs-6 fw-semibold text-dark font-monospace">{patient.healthCardId}</p>
            </div>
          </div>
          
          <div className="col-12">
            <div className="p-3 border rounded-3">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-phone text-primary me-2"></i>
                <h6 className="mb-0 text-muted">Phone Number</h6>
              </div>
              <p className="mb-0 fs-5 fw-semibold text-dark">
                <a href={`tel:${patient.phone}`} className="text-decoration-none text-dark">
                  {patient.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}