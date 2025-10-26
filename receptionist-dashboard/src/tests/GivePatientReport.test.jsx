import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import GivePatientReport from "../pages/doctor/GivePatientReport";
import api from "../api/axiosInstance";

// Mock the API
vi.mock("../api/axiosInstance");

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock React Icons
vi.mock("react-icons/fa", () => ({
  FaUserInjured: () => <div data-testid="user-injured-icon" />,
  FaFileMedical: () => <div data-testid="file-medical-icon" />,
  FaQrcode: () => <div data-testid="qrcode-icon" />,
  FaSearch: () => <div data-testid="search-icon" />,
  FaPlus: () => <div data-testid="plus-icon" />,
  FaHistory: () => <div data-testid="history-icon" />,
  FaStop: () => <div data-testid="stop-icon" />,
  FaIdCard: () => <div data-testid="id-card-icon" />,
  FaPhone: () => <div data-testid="phone-icon" />,
  FaMapMarkerAlt: () => <div data-testid="map-marker-alt-icon" />,
  FaVenusMars: () => <div data-testid="venus-mars-icon" />,
  FaCalendarAlt: () => <div data-testid="calendar-alt-icon" />,
}));

// Mock components
vi.mock("../components/Navbar", () => ({
  default: ({ name }) => <div data-testid="navbar">Navbar - {name}</div>
}));

vi.mock("../components/DoctorSidebar", () => ({
  default: () => <div data-testid="doctor-sidebar">Doctor Sidebar</div>
}));

// Mock Html5Qrcode
vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    scanResult: null,
  })),
}));

const mockPatient = {
  _id: "patient123",
  fullName: "Jane Doe",
  healthCardId: "HC456",
  gender: "Female",
  age: 30,
  phone: "0771234567",
  fullAddress: "123 Main St",
};

const mockAppointment = {
  _id: "appointment123",
  patientId: "patient123",
  doctorId: "doctor123",
  date: "2024-10-26",
};

const mockReports = [
  {
    _id: "report1",
    patientId: "patient123",
    doctorId: "doctor123",
    appointmentId: "appointment123",
    message: "Patient had a fever.",
    createdAt: "2024-10-20T10:00:00Z",
  },
  {
    _id: "report2",
    patientId: "patient123",
    doctorId: "doctor123",
    appointmentId: "appointment123",
    message: "Prescribed antibiotics.",
    createdAt: "2024-10-21T11:00:00Z",
  },
];

describe("GivePatientReport Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("doctor123");
    api.post.mockResolvedValue({ data: { patient: mockPatient, appointment: mockAppointment } });
    api.get.mockResolvedValue({ data: { reports: mockReports } });
  });

  it("renders the patient report page correctly", async () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    expect(screen.getByText("Patient Medical Reports")).toBeInTheDocument();
    expect(screen.getByText("Find Patient")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toHaveTextContent("Navbar - doctor123");
    expect(screen.getByTestId("doctor-sidebar")).toBeInTheDocument();
    expect(screen.getByText("No Patient Selected")).toBeInTheDocument();
  });

  it("searches for a patient by Health Card ID", async () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/doctor/patient", {
        healthCardId: "HC456",
        doctorId: "doctor123",
      });
      expect(screen.getByText("Patient loaded successfully")).toBeInTheDocument();
    });
  });

  it("displays patient information after successful search", async () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("Patient Information")).toBeInTheDocument();
    });
  });

  it("displays new report form after patient is loaded", async () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("New Medical Report")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter detailed medical report/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save Medical Report/i })).toBeInTheDocument();
    });
  });

  it("adds a new medical report successfully", async () => {
    api.post.mockResolvedValueOnce({ data: { patient: mockPatient, appointment: mockAppointment } }); // For initial patient fetch
    api.post.mockResolvedValueOnce({ data: { report: { _id: "report3", patientId: "patient123", doctorId: "doctor123", appointmentId: "appointment123", message: "New report added.", createdAt: new Date().toISOString() } } });
    api.get.mockResolvedValueOnce({ data: { reports: [...mockReports, { _id: "report3", patientId: "patient123", doctorId: "doctor123", appointmentId: "appointment123", message: "New report added.", createdAt: new Date().toISOString() }] } });

    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const reportTextarea = screen.getByPlaceholderText(/Enter detailed medical report/i);
    const saveReportButton = screen.getByRole("button", { name: /Save Medical Report/i });

    fireEvent.change(reportTextarea, { target: { value: "New report added." } });
    fireEvent.click(saveReportButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/doctor/report", {
        patientId: "patient123",
        doctorId: "doctor123",
        appointmentId: "appointment123",
        message: "New report added.",
      });
      expect(screen.getByText("Report added successfully")).toBeInTheDocument();
    });
  });

  it("displays past medical reports", async () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Patient had a fever.")).toBeInTheDocument();
      expect(screen.getByText("Prescribed antibiotics.")).toBeInTheDocument();
    });
  });

  it("handles patient not found error", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: "Patient not found" } } });

    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC999" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Patient not found")).toBeInTheDocument();
    });
  });

  it("shows empty state when no patient is selected", () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    expect(screen.getByText("No Patient Selected")).toBeInTheDocument();
    expect(screen.getByText("Use the search above or scan a QR code to load patient information")).toBeInTheDocument();
  });

  it("disables search button when input is empty", () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const searchButton = screen.getByRole("button", { name: /Search Patient/i });
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when input has value", () => {
    render(
      <MemoryRouter>
        <GivePatientReport />
      </MemoryRouter>
    );

    const healthIdInput = screen.getByPlaceholderText("Enter patient's Health Card ID");
    const searchButton = screen.getByRole("button", { name: /Search Patient/i });

    fireEvent.change(healthIdInput, { target: { value: "HC456" } });

    expect(searchButton).not.toBeDisabled();
  });
});