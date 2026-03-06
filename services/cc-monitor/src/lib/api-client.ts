import ky from "ky";

export const apiClient = ky.create({
  prefixUrl: "/api",
  timeout: 10_000,
});
