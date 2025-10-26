import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import AddLeaves from "../pages/doctor/AddLeaves";
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
  FaCalendarPlus: () => <div data-testid="calendar-plus-icon" />,
  FaCalendarCheck: () => <div data-testid="calendar-check-icon" />,
  FaHistory: () => <div data-testid="history-icon" />,
  FaUmbrellaBeach: () => <div data-testid="umbrella-beach-icon" />,
  FaCheckCircle: () => <div data-testid="check-circle-icon" />,
  FaTimesCircle: () => <div data-testid="times-circle-icon" />,
}));

// Mock components
vi.mock("../components/Navbar", () => ({
  default: ({ name }) => <div data-testid="navbar">Navbar - {name}</div>
}));

vi.mock("../components/DoctorSidebar", () => ({
  default: () => <div data-testid="doctor-sidebar">Doctor Sidebar</div>
}));

const mockLeaves = [
  {
    _id: "1",
    startDate: "2024-02-01",
    endDate: "2024-02-03",
    reason: "Personal leave",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    _id: "2", 
    startDate: "2024-01-10",
    endDate: "2024-01-12",
    reason: "Medical appointment",
    createdAt: "2024-01-05T10:00:00Z"
  }
];

describe("AddLeaves Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("doctor123");
    
    // Mock successful API responses
    api.get.mockResolvedValue({ data: { leaves: mockLeaves } });
    api.post.mockResolvedValue({ data: { success: true } });
  });

  it("renders the leave management page correctly", async () => {
    render(
      <MemoryRouter>
        <AddLeaves />
      </MemoryRouter>
    );

    // Check page title and description
    expect(screen.getByText("Leave Management")).toBeInTheDocument();
    expect(screen.getByText("Request time off and manage your leave schedule")).toBeInTheDocument();

    // Check form elements
    expect(screen.getByText("New Leave Request")).toBeInTheDocument();
    expect(screen.getByText("Start Date *")).toBeInTheDocument();
    expect(screen.getByText("End Date *")).toBeInTheDocument();
    expect(screen.getByText("Reason for Leave")).toBeInTheDocument();
    expect(screen.getByText("Submit Leave Request")).toBeInTheDocument();

    // Check summary section
    expect(screen.getByText("Leave Summary")).toBeInTheDocument();
    expect(screen.getByText("Leave History")).toBeInTheDocument();
  });

  it("displays leave statistics correctly", async () => {
    render(
      <MemoryRouter>
        <AddLeaves />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Upcoming Leaves")).toBeInTheDocument();
      expect(screen.getByText("Past Leaves")).toBeInTheDocument();
      expect(screen.getByText("Total Leave Days")).toBeInTheDocument();
    });
  });

  it("displays leave history table", async () => {
    render(
      <MemoryRouter>
        <AddLeaves />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Personal leave")).toBeInTheDocument();
      expect(screen.getByText("Medical appointment")).toBeInTheDocument();
    });
  });

  it("shows empty state when no leaves exist", async () => {
    api.get.mockResolvedValueOnce({ data: { leaves: [] } });

    render(
      <MemoryRouter>
        <AddLeaves />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No leave requests yet")).toBeInTheDocument();
      expect(screen.getByText("Submit your first leave request using the form above")).toBeInTheDocument();
    });
  });

  it("handles missing doctor ID", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <MemoryRouter>
        <AddLeaves />
      </MemoryRouter>
    );

    // Component should still render even without doctor ID
    expect(screen.getByText("Leave Management")).toBeInTheDocument();
  });
});