function showToast(type, message) {
  document.querySelectorAll(".toast-message").forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;

  let iconClass = "fa-exclamation-circle";
  if (type === "success") {
    iconClass = "fa-check-circle";
  } else if (type === "info") {
    iconClass = "fa-info-circle";
  }

  const icon = document.createElement("i");
  icon.className = `m-2 fas icon ${iconClass}`;

  const text = document.createElement("span");
  text.className = "message-text";
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.offsetWidth;
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");

    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 5000);
}

function redirect(url, args) {

  if (args) {
    Object.entries(args).forEach(([key, value]) => {
      url += "/" + key + "/" + value;
    });
  }

}

function hide(element) {
  $(element).fadeOut(200);
}
function show(element) {
  $(element).fadeIn(200);
}
