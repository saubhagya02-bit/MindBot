export function getApiErrorMessage(data, fallback = "Something went wrong.") {
  const err = data?.error;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object" && err.message) return err.message;
  if (typeof data?.message === "string" && data.message) return data.message;
  return fallback;
}
