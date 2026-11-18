import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { bookingHandlers } from "./handlers/bookings";
import { movieHandlers } from "./handlers/movies";
import { showtimeHandlers } from "./handlers/showtimes";

export const worker = setupWorker(...authHandlers, ...movieHandlers, ...showtimeHandlers, ...bookingHandlers);
