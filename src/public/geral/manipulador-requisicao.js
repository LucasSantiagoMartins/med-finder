async function manipuladorRequisicao(formOrUrl, useJson = false, options = {}) {
  let body;
  let headers = {};
  let url = "";
  let method = "";

  if (formOrUrl instanceof HTMLFormElement) {
    url = options.url || formOrUrl.action;
    method = (options.method || formOrUrl.method || "POST").toUpperCase();

    if (useJson) {
      const formData = new FormData(formOrUrl);
      const jsonData = {};
      formData.forEach((value, key) => {
        jsonData[key] = value;
      });
      body = JSON.stringify(jsonData);
      headers["Content-Type"] = "application/json";
    } else {
      body = new FormData(formOrUrl);
    }
  } else {
    url = formOrUrl;
    method = options.method ? options.method.toUpperCase() : "GET";

    if (options.body) {
      body = useJson ? JSON.stringify(options.body) : options.body;
      if (useJson) headers["Content-Type"] = "application/json";
    }
  }

  try {
    const response = await fetch(url, {
      method: method,
      body: body,
      headers: headers,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      console.error("Servidor não retornou JSON:", textError);
      throw new Error("O servidor retornou um erro inesperado.");
    }

    const result = await response.json();

    if (response.ok) {
      showToast("success", result.mensagem || "Operação realizada com sucesso");

      setTimeout(() => {
        if (result.redirectTo) {
          window.location.href = result.redirectTo;
        } else if (
          method === "DELETE" ||
          method === "PATCH" ||
          method === "PUT"
        ) {
          window.location.reload();
        }
      }, 1000);
    } else {
      showToast("error", result.mensagem || "Erro na resposta do servidor.");
    }
  } catch (err) {
    console.error(err);
    showToast("error", err.mensagem || "Erro ao processar a requisição.");
  }
}
