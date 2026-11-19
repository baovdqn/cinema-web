import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/types/api";
import { bookingApi } from "./api";
import { usePayFlow } from "./use-pay-flow";

vi.mock("./api", () => ({ bookingApi: { pay: vi.fn() } }));
const pay = vi.mocked(bookingApi.pay);

const booking = (status: Booking["status"]) => ({ id: 1, status }) as unknown as Booking;
const networkError = () => new AxiosError("Network Error", "ERR_NETWORK");
const httpError = (status: number) =>
  new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: { message: "Hết thời gian" },
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

function setup() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return renderHook(() => usePayFlow("1"), { wrapper });
}

const keyOf = (call: number) => pay.mock.calls[call][1];

describe("usePayFlow idempotency key", () => {
  beforeEach(() => pay.mockReset());

  it("reuses the same key after a network error", async () => {
    pay.mockRejectedValueOnce(networkError()).mockResolvedValueOnce({ status: 200, booking: booking("CONFIRMED"), message: undefined });
    const { result } = setup();
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.retrying).toBe(true));
    act(() => result.current.submit());
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it("uses a new key after a declined result (200 still HELD)", async () => {
    pay.mockResolvedValue({ status: 200, booking: booking("HELD"), message: "Thẻ bị từ chối" });
    const { result } = setup();
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.declined).toBe("Thẻ bị từ chối"));
    act(() => result.current.submit());
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("uses a new key after an HTTP error response", async () => {
    pay.mockRejectedValueOnce(httpError(409)).mockRejectedValueOnce(httpError(409));
    const { result } = setup();
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.network).toBe(false);
    act(() => result.current.submit());
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });

  it("uses a new key after success", async () => {
    pay.mockResolvedValue({ status: 202, booking: booking("PAYING"), message: undefined });
    const { result } = setup();
    act(() => result.current.submit());
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    act(() => result.current.submit());
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(2));
    expect(keyOf(1)).not.toBe(keyOf(0));
  });
});
