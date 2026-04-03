import Swal from "sweetalert2";

function toneToIcon(tone = "info") {
  if (tone === "success") return "success";
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  return "info";
}

export function showSweetToast(message, tone = "info", options = {}) {
  if (!message) return Promise.resolve();
  return Swal.fire({
    toast: true,
    position: "top-end",
    timer: options.timer ?? 1800,
    timerProgressBar: true,
    showConfirmButton: false,
    icon: toneToIcon(tone),
    title: message,
    customClass: {
      popup: "swal2-toast-popup",
    },
    ...options,
  });
}

export function showSweetAlert(message, tone = "info", options = {}) {
  if (!message) return Promise.resolve();
  return Swal.fire({
    icon: toneToIcon(tone),
    title: options.title || "Notice",
    text: message,
    confirmButtonText: options.confirmButtonText || "OK",
    ...options,
  });
}

export async function showSweetConfirm({
  title = "Are you sure?",
  text = "",
  tone = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  ...options
} = {}) {
  const result = await Swal.fire({
    icon: toneToIcon(tone),
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    ...options,
  });
  return result.isConfirmed;
}

export function showSweetPrompt({
  title = "Enter value",
  text = "",
  input = "text",
  inputValue = "",
  inputPlaceholder = "",
  confirmButtonText = "Save",
  cancelButtonText = "Cancel",
  ...options
} = {}) {
  return Swal.fire({
    title,
    text,
    input,
    inputValue,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    ...options,
  });
}

export function showSweetLoader(title = "Loading...", text = "Please wait.") {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeSweetLoader() {
  Swal.close();
}
