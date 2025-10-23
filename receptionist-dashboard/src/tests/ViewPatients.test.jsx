import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ViewPatients from "../pages/ViewPatients";
import api from "../api/axiosInstance";
import { vi } from "vitest";

vi.mock("../../api/axiosInstance");

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
  it("renders table with patients", async () => {
    api.get.mockResolvedValueOnce({ data: mockPatients });
    render(<ViewPatients />);

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("opens modal on view click", async () => {
    api.get.mockResolvedValueOnce({ data: mockPatients });
    render(<ViewPatients />);

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
