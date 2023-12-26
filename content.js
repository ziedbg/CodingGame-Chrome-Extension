// Fonction pour extraire les instructions du jeu
function getGameInstructions() {
  // Sélectionner l'élément par l'attribut aria-label
  const element = document.querySelector('div[aria-label="Instructions"]');

  console.log("Element trouvé:", element); // Pour le débogage

  if (element) {
    return element.innerHTML;
  }

  return null;
}
document.addEventListener("DOMContentLoaded", () => {
  const savedModel =
    localStorage.getItem("chatGptModel") || "gpt-3.5-turbo-1106"; // Modèle par défaut
  updateModelDisplay(savedModel);
});

function sendInstructionsToBackground() {
  const instructions = getGameInstructions();
  const mcqAnswer = getMcqAnswer();
  const codeAnswer = getCodeAnswer();
  const questionDomain = getQuestionDomain();

  const combinedContent = `Dans le domaine de ${questionDomain}, répondre à cette question en incorporant , si demandé, le code complet et optimisé tel qu'un expert en ${questionDomain} l'aurait developpé. ${instructions} ${mcqAnswer} ${codeAnswer}`;

  console.log("Contenu combiné à envoyer:", combinedContent);

  if (combinedContent) {
    showLoadingMessage();
    const selectedModel =
      localStorage.getItem("chatGptModel") || "gpt-3.5-turbo-1106";
    chrome.runtime.sendMessage({
      type: "INSTRUCTIONS",
      data: instructions,
      model: selectedModel,
    });
  }
}

function getQuestionDomain() {
  const headerElement = document.querySelector(
    'header[data-test="QuestionHeader"] h3'
  );
  if (headerElement) {
    const headerText = headerElement.textContent;
    const domainMatch = headerText.match(/- (.+)$/); // Utilisez une expression régulière pour extraire le domaine
    return domainMatch ? domainMatch[1] : "";
  }
  return "";
}

function getMcqAnswer() {
  const mcqElement = document.querySelector(
    'div[data-test="Answer"][data-test-type="Mcq"]'
  );
  return mcqElement ? mcqElement.innerHTML : "";
}

function getCodeAnswer() {
  // Sélectionnez d'abord l'élément parent 'Code'
  const codeParentElement = document.querySelector(
    'div[data-test="Answer"][data-test-type="Code"]'
  );

  if (codeParentElement) {
    // Ensuite, sélectionnez l'élément enfant spécifique
    const codeElement = codeParentElement.querySelector(
      "div.view-lines.monaco-mouse-cursor-text"
    );
    return codeElement ? codeElement.innerHTML : "";
  }

  return "";
}

// Utiliser MutationObserver pour observer les changements dans le DOM
const observer = new MutationObserver((mutations, obs) => {
  const instructionsElement = document.querySelector(
    'div[aria-label="Instructions"]'
  );
  if (instructionsElement) {
    console.log("Element trouvé via MutationObserver:", instructionsElement);
    sendInstructionsToBackground();
    obs.disconnect(); // Arrêter l'observation une fois l'élément trouvé
  }
});

// Configurer l'observateur pour surveiller les changements dans le corps de la page
observer.observe(document.body, { childList: true, subtree: true });

function createChatInterface() {
  // Création de la div principale du chat
  const chatDiv = document.createElement("div");
  chatDiv.id = "chatbotDiv";
  chatDiv.style.position = "fixed";
  chatDiv.style.left = "0";
  chatDiv.style.bottom = "0";
  chatDiv.style.width = "50%";
  chatDiv.style.height = "50vh";
  chatDiv.style.backgroundColor = "white";
  chatDiv.style.border = "1px solid black";
  chatDiv.style.overflow = "auto";

  // Barre de titre
  const titleBar = document.createElement("div");
  titleBar.id = "titleBar";
  titleBar.style.backgroundColor = "#4CAF50";
  titleBar.style.color = "white";
  titleBar.style.padding = "5px";
  titleBar.style.cursor = "pointer";

  // Boutons de la barre de titre
  const refreshButton = document.createElement("button");
  refreshButton.innerHTML = "&#x21bb;"; // Icône de rafraîchissement
  refreshButton.onclick = function () {
    // Appeler la fonction pour renvoyer les instructions
    sendInstructionsToBackground();
  };

  const minimizeButton = document.createElement("button");
  minimizeButton.innerHTML = "&#128469;"; // Icône de réduction
  let isMinimized = false;
  minimizeButton.onclick = function () {
    isMinimized = !isMinimized;
    chatDiv.style.height = isMinimized ? "30px" : "50vh";
  };
  const settingsButton = document.createElement("button");
  settingsButton.innerHTML = "&#9881;"; // Icône de paramétrage
  settingsButton.style.float = "right"; // Placer à l'extrême droite
  settingsButton.onclick = function () {
    openSettingsPopup(); // Fonction pour ouvrir le popup de paramétrage
  };
  const copyButton = document.createElement("button");
  copyButton.innerHTML = "&#128203;"; // Icône de copie
  copyButton.onclick = function () {
    // Copier la dernière réponse de ChatGPT
    navigator.clipboard.writeText(lastChatGPTResponse);
  };

  // Ajout des boutons à la barre de titre
  titleBar.appendChild(minimizeButton);
  titleBar.appendChild(copyButton);
  titleBar.appendChild(refreshButton);

  titleBar.appendChild(settingsButton);
  // Ajout de la barre de titre à la div principale
  chatDiv.appendChild(titleBar);
  document.body.appendChild(chatDiv);

  // Créer un conteneur pour les réponses
  const responsesContainer = document.createElement("div");
  responsesContainer.id = "responsesContainer";
  responsesContainer.style.overflowY = "auto"; // Rendre le conteneur défilable
  responsesContainer.style.maxHeight = "40vh"; // Hauteur maximale avant de défiler
  responsesContainer.style.padding = "5px";

  // Ajouter le conteneur de réponses à chatDiv
  chatDiv.appendChild(responsesContainer);

  document.body.appendChild(chatDiv);
}
function updateModelDisplay(model) {
  const titleBar = document.getElementById("titleBar"); // Assurez-vous que votre barre de titre a un ID 'titleBar'
  const modelDisplay =
    document.getElementById("modelDisplay") || document.createElement("span");
  modelDisplay.id = "modelDisplay";
  modelDisplay.textContent = `Modèle sélectionné: ${model}`;
  modelDisplay.style.marginLeft = "10px";

  titleBar.appendChild(modelDisplay);
}
let models = [];
function openSettingsPopup() {
  const savedModel =
    localStorage.getItem("chatGptModel") || "gpt-3.5-turbo-1106";
  // Création du conteneur principal du popup
  const popup = document.createElement("div");
  popup.style.backgroundColor = "white";
  popup.style.border = "1px solid #ddd";
  popup.style.padding = "20px";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.zIndex = "1000";

  // Titre du Popup
  const title = document.createElement("h2");
  title.textContent = "Paramètres de ChatGPT";
  title.style.textAlign = "center";
  popup.appendChild(title);

  // Sélecteur de modèle
  const selectModel = document.createElement("select");
  selectModel.style.width = "100%";
  selectModel.style.marginBottom = "20px";

  // Options pour chaque modèle
  models = [
    {
      name: "GPT-4 Turbo",
      value: "gpt-4-1106-preview",
      pricing: "$0.01 / $0.03 par 1K tokens",
    },
    { name: "GPT-4", value: "gpt-4", pricing: "$0.03 / $0.06 par 1K tokens" },
    {
      name: "GPT-4 (32k)",
      value: "gpt-4-32k",
      pricing: "$0.06 / $0.12 par 1K tokens",
    },
    {
      name: "GPT-3.5 Turbo",
      value: "gpt-3.5-turbo-1106",
      pricing: "$0.0010 / $0.0020 par 1K tokens",
      recommended: true,
    },
    {
      name: "GPT-3.5 Turbo Instruct",
      value: "gpt-3.5-turbo-instruct",
      pricing: "$0.0015 / $0.0020 par 1K tokens",
    },
  ];

  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.value;
    option.textContent = `${model.name} (${model.pricing})`;
    if (model.recommended) {
      option.style.fontWeight = "bold";
    }
    selectModel.appendChild(option);
  });

  selectModel.value = savedModel;

  popup.appendChild(selectModel);
  // Bouton Enregistrer
  const saveButton = document.createElement("button");
  saveButton.textContent = "Enregistrer";
  saveButton.style.backgroundColor = "#4CAF50";
  saveButton.style.color = "white";
  saveButton.style.padding = "10px 15px";
  saveButton.style.border = "none";
  saveButton.style.cursor = "pointer";

  saveButton.onclick = function () {
    const selectedModelValue = selectModel.value;
    localStorage.setItem("chatGptModel", selectedModelValue);
    updateModelDisplay(selectedModelValue);

    // Au chargement de l'extension
    document.addEventListener("DOMContentLoaded", () => {
      const savedModelValue =
        localStorage.getItem("chatGptModel") || "gpt-3.5-turbo-1106";
      updateModelDisplay(savedModelValue);
    });

   

    // Fermer le popup
    document.body.removeChild(popup);
  };

  popup.appendChild(saveButton);
  document.body.appendChild(popup);

  // Bouton Fermer
  const closeButton = document.createElement("button");
  closeButton.textContent = "Fermer";
  closeButton.style.backgroundColor = "red";
  closeButton.style.color = "white";
  closeButton.style.padding = "10px 15px";
  closeButton.style.border = "none";
  closeButton.style.cursor = "pointer";
  closeButton.style.marginLeft = "10px";

  closeButton.onclick = function () {
    document.body.removeChild(popup);
  };

  popup.appendChild(closeButton);

  window.onclick = function (event) {
    if (event.target === popup) {
      document.body.removeChild(popup);
    }
  };
}
function updateModelDisplay(modelValue) {
  const titleBar = document.getElementById("titleBar");
  const selectedModel = models.find((model) => model.value === modelValue);

  if (titleBar && selectedModel) {
    const modelDisplay =
      document.getElementById("modelDisplay") || document.createElement("span");
    modelDisplay.id = "modelDisplay";
    modelDisplay.textContent = `Modèle sélectionné: ${selectedModel.name}`;
    modelDisplay.style.marginLeft = "10px";

    titleBar.appendChild(modelDisplay);
  } else {
    console.error("Erreur : élément titleBar ou modèle introuvable.");
  }
}
// Variable pour stocker la dernière réponse de ChatGPT
let lastChatGPTResponse = "";

// Fonction pour afficher la réponse dans le chat
function displayResponseInChat(response) {
  const chatDiv = document.getElementById("chatbotDiv");
  const loadingMessage = document.getElementById("loadingMessage");

  // Supprimer le message d'attente
  if (loadingMessage) {
    chatDiv.removeChild(loadingMessage);
  }
  lastChatGPTResponse = response;
  const responsesContainer = document.getElementById("responsesContainer");

  if (responsesContainer) {
    // Vider les réponses précédentes
    responsesContainer.innerHTML = "";

    const responseDiv = document.createElement("div");
    responseDiv.innerHTML = marked(response);

    // Styles pour la réponse
    responseDiv.style.color = "black";
    responseDiv.style.marginBottom = "10px";
    responseDiv.style.borderBottom = "1px solid #ddd";

    responsesContainer.appendChild(responseDiv);
    responsesContainer.scrollTop = responsesContainer.scrollHeight;
  }
}

function showLoadingMessage() {
  const chatDiv = document.getElementById("chatbotDiv");
  if (chatDiv) {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loadingMessage";
    loadingDiv.textContent = "En attente d'une réponse...";
    loadingDiv.style.color = "grey";
    loadingDiv.style.fontStyle = "italic";
    loadingDiv.style.padding = "5px";

    chatDiv.appendChild(loadingDiv);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "CHAT_RESPONSE") {
    displayResponseInChat(message.data);
  }
});

// Initialiser l'interface de chat
createChatInterface();
