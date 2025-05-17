if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(serviceWorker => {
      console.log("Service Worker registered: ", serviceWorker);
    })
    .catch(error => {
      console.error("Error registering the Service Worker: ", error);
    });
}


function loadPage(pageName) {
  fetch(`pages/${pageName}.html`)
    .then(response => {
      if (!response.ok) throw new Error("Nie znaleziono strony");
      return response.text();
    })
    .then(html => {
      document.getElementById("content").innerHTML = html;
    })
    .catch(error => {
      document.getElementById("content").innerHTML = "<p>Błąd ładowania strony.</p>";
      console.error(error);
    });
}

// Załaduj domyślną stronę
loadPage('search');