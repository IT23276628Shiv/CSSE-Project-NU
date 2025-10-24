export default function BookingTable({ bookings, onCheckDoctor }) {
  if (!bookings || bookings.length === 0) return <p>No bookings found</p>;

  return (
    <div className="card p-3 mb-3 shadow-sm">
      <h5>Bookings</h5>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Doctor ID</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Check Doctor</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.doctor?._id || "N/A"}</td>
              <td>{new Date(b.date).toLocaleDateString()}</td>
              <td>{b.timeSlot ? `${b.timeSlot.start} - ${b.timeSlot.end}` : "N/A"}</td>
              <td>{b.status}</td>
              <td>
                <button className="btn btn-outline-primary btn-sm" onClick={() => onCheckDoctor(b)}>
                  Check Availability
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
