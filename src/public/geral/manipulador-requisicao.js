async function manipuladorRequisicao(formOrUrl, useJson = false, options = {}) {
  let body;
  let headers = {};
  let url = "";
  let method = "";
  const silent = options.silent || false;

  if (formOrUrl instanceof HTMLFormElement) {
    url = options.url || formOrUrl.action;
    method = (options.method || formOrUrl.method || "POST").toUpperCase();

    const formData = new FormData(formOrUrl);

    const temArquivo = Array.from(formData.values()).some(
      (value) => value instanceof File && value.name !== "",
    );

    if (useJson && !temArquivo) {
      const jsonData = {};
      formData.forEach((value, key) => {
        jsonData[key] = value;
      });
      body = JSON.stringify(jsonData);
      headers["Content-Type"] = "application/json";
    } else {
      body = formData;
    }
  } else {
    url = formOrUrl;
    method = options.method ? options.method.toUpperCase() : "GET";

    if (options.body) {
      if (useJson && !(options.body instanceof FormData)) {
        body = JSON.stringify(options.body);
        headers["Content-Type"] = "application/json";
      } else {
        body = options.body;
      }
    }
  }

  try {
    const fetchOptions = {
      method: method,
      body: body,
      credentials: "include",
    };

    if (Object.keys(headers).length > 0) {
      fetchOptions.headers = headers;
    }

    const response = await fetch(url, fetchOptions);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      throw new Error("O servidor retornou um erro inesperado.");
    }

    const result = await response.json();

    if (response.ok) {
      if (!silent) {
        showToast("success", result.mensagem || "Sucesso");
        setTimeout(() => {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          } else if (["DELETE", "PATCH", "PUT"].includes(method)) {
            window.location.reload();
          }
        }, 1000);
      }
      return result;
    } else {
      if (!silent) {
        showToast("error", result.mensagem || "Erro na resposta.");
      }
      return result;
    }
  } catch (err) {
    console.log(err.message);
    if (!silent) {
      showToast("error", err.message || "Erro ao processar.");
    }
    return { sucesso: false, mensagem: err.message };
  }
}
