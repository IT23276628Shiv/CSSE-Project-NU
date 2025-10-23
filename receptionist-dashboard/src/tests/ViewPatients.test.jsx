import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom"; // ✅ add this
import ViewPatients from "../pages/ViewPatients";
import api from "../api/axiosInstance";

vi.mock("../api/axiosInstance");

const mockPatients = [
  {
    _id: "1",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "0711234567",
    healthCardId: "HC123",
  },
];

describe("ViewPatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with patients", async () => {
    api.get.mockResolvedValueOnce({ data: mockPatients });
    render(
      <MemoryRouter>
        <ViewPatients />
      </MemoryRouter>
    );

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("opens modal on view click", async () => {
    api.get.mockResolvedValueOnce({ data: mockPatients });
    render(
      <MemoryRouter>
        <ViewPatients />
      </MemoryRouter>
    );

    const viewButton = await screen.findByText("View");
    api.get.mockResolvedValueOnce({
      data: { fullName: "John Doe", healthCardId: "HC123", qrCode: "data:image/png;base64,xyz" },
    });

    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText("Patient Details")).toBeInTheDocument();
      expect(screen.getByText("HC123")).toBeInTheDocument();
    });
  });
});
