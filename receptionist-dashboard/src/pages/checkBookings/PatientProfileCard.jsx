export default function PatientProfileCard({ patient }) {
  const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
  const age = dob ? Math.floor((new Date() - dob) / 31557600000) : "N/A"; // calculate age

  return (
    <div className="card p-3 mb-3 shadow-sm">
      <h5>Patient Details</h5>
      <p><strong>Name:</strong> {patient.fullName}</p>
      <p><strong>Age:</strong> {age}</p>
      <p><strong>Gender:</strong> {patient.gender}</p>
      <p><strong>Health ID:</strong> {patient.healthCardId}</p>
      <p><strong>Phone:</strong> {patient.phone}</p>
    </div>
  );
}
