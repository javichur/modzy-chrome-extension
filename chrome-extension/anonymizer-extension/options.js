let checkboxesDiv = document.getElementById("checkboxesDiv");
let btnFactoryRestore = document.getElementById("btnFactoryRestore");
btnFactoryRestore.addEventListener('click', factoryRestoreHandler);

let btnSaveToken = document.getElementById("btnSaveToken");
btnSaveToken.addEventListener('click', saveTokenCustom);

let CURRENT_ENTITIES = [];

const allEntityTypes = [
  { label: "ADR", description: "Street address" },
  { label: "ANM", description: "Animal" },
  { label: "BLD", description: "Building" },
  { label: "COM", description: "Company, business" },
  { label: "DAT", description: "Date" },
  { label: "DEV", description: "Device" },
  { label: "DOC", description: "Document" },
  { label: "EVN", description: "Event" },
  { label: "FDD", description: "Food, beverage" },
  { label: "GEA", description: "Physical geographic feature" },
  { label: "GEO", description: "Administrative geographic area" },
  { label: "GEX", description: "Extended geography" },
  { label: "HOU", description: "Hours" },
  { label: "LEN", description: "Legal entity" },
  { label: "MAI", description: "Email address" },
  { label: "MEA", description: "Measure" },
  { label: "MMD", description: "Mass media" },
  { label: "MON", description: "Money" },
  { label: "NPH", description: "Person" },
  { label: "NPR", description: "Unrecognized entity with a proper noun" },
  { label: "ORG", description: "Organization, institution, society" },
  { label: "PCT", description: "Percentage" },
  { label: "PHO", description: "Phone number" },
  { label: "PPH", description: "Physical phenomena" },
  { label: "PRD", description: "Product" },
  { label: "VCL", description: "Vehicle" },
  { label: "WEB", description: "Web address" },
  { label: "WRK", description: "Work of human intelligence" },
];

// Reacts to a button click by marking marking the selected button and saving
// the selection
function handleButtonClick(event) {
  event.stopPropagation();

  let current = event.target.parentElement.querySelector('input');
  if (current) {
    if (current.checked) { // pide marcarlo
      if (!CURRENT_ENTITIES.includes(current.id)) {
        CURRENT_ENTITIES.push(current.id);
      }
    } else { // pide quitarlo
      CURRENT_ENTITIES = CURRENT_ENTITIES.filter(function (value, index, arr) {
        return value != current.id;
      });

    }
  }

  console.log(JSON.stringify(CURRENT_ENTITIES));

  chrome.storage.sync.set({ CURRENT_ENTITIES });
}

function constructOptions(list) {
  chrome.storage.sync.get("CURRENT_ENTITIES", (data) => {

    CURRENT_ENTITIES = data.CURRENT_ENTITIES;

    checkboxesDiv.innerHTML = ''; // necesario para la restauración de factory.

    // For each entity...
    for (let one of list) {
      let label = document.createElement("label");
      let strChecked = '';
      if (CURRENT_ENTITIES.includes(one.label)) {
        strChecked = 'checked';
      }

      label.innerHTML = `<input id="${one.label}" type="checkbox" class="nes-checkbox" ${strChecked}/><span>${one.description} (${one.label})</span>`;

      label.addEventListener("click", handleButtonClick);
      checkboxesDiv.appendChild(label);
      checkboxesDiv.appendChild(document.createElement("br"));
    }
  });
}

function factoryRestoreHandler(event) {
  let ENTITIES_DEFAULT = ['NPH', 'DAT', 'COM', 'HOU', 'MAI', 'MON', 'ORG', 'PHO', 'VCL', 'WEB'];
  chrome.storage.sync.set({ CURRENT_ENTITIES: ENTITIES_DEFAULT }, () => {
    constructOptions(allEntityTypes);
    console.log('Factory restore config.');
    showDialog('Factory configuration restored!');
  });
}

function showDialog(txt) {
  let lbl = document.getElementById('lblGenericDialog');
  lbl.innerHTML = txt;
  document.getElementById('genericDialog').showModal();
}

function saveTokenCustom(event) {
  let txtToken = document.getElementById("txtToken");
  if (txtToken.value.length == 0) {
    showDialog('Error. Please paste your custom API token.');
  } else {
    chrome.storage.sync.set({ TOKEN_EXPERT: txtToken.value }, () => {
      showDialog('Custom API token saved. Please check the anonymizer and other features of the extension.');
    });
  }
}

chrome.storage.sync.get("TOKEN_EXPERT", ({ TOKEN_EXPERT }) => {
  document.getElementById("txtToken").value = TOKEN_EXPERT;
});

constructOptions(allEntityTypes);