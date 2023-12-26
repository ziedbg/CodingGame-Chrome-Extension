function askChatGPT(question) {
    const url = 'http://localhost:3000/chat';
  
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: question })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        return data.message.content; // Extraire le contenu du message
      } else {
        return 'Aucune réponse pertinente reçue de ChatGPT';
      }
    })
    .catch(error => console.error('Erreur lors de l’appel à votre serveur Node.js:', error));
  }
  
  console.log("Background script chargé et exécuté");
  
  // Écouteur pour les messages entrants du script de contenu
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'INSTRUCTIONS') {
      console.log('Données reçues du script de contenu:', message.data);
  
      // Envoyer la question à ChatGPT via votre serveur Node.js et obtenir une réponse
      askChatGPT(message.data).then(response => {
        console.log('Réponse de ChatGPT:', response);
        chrome.tabs.sendMessage(sender.tab.id, { type: 'CHAT_RESPONSE', data: response });
      });
    }
  });
  