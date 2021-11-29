let changeColor = document.getElementById("changeColor");
let btnAnonymizer = document.getElementById("btnAnonymizer");
let btnSummarization = document.getElementById("btnSummarization");
let btnEmotions = document.getElementById("btnEmotions");
let btnSyncons = document.getElementById("btnSyncons");
let btnSettings = document.getElementById("btnSettings");
btnSettings.addEventListener('click', openOptionsPage);

let logo = document.getElementById("logo");

let lblSentiments = document.getElementById("lblSentiments");

var gauge_canvas = document.getElementById('gauge_canvas');
var radar_canvas = document.getElementById('radar_canvas');
var radar = null; // chart de emotions. Lo guardamos para hacer destroy antes de reusar.

let CURRENT_ENTITIES = null; // for anonymizer
chrome.storage.sync.get("CURRENT_ENTITIES", (data) => {
  CURRENT_ENTITIES = data.CURRENT_ENTITIES;
  console.log('Entities loaded: ' + JSON.stringify(CURRENT_ENTITIES));
});

var opts = {
  angle: -0.2, // The span of the gauge arc
  lineWidth: 0.2, // The line thickness
  radiusScale: 1, // Relative radius
  pointer: {
    length: 0.6, // // Relative to gauge radius
    strokeWidth: 0.035, // The thickness
    color: '#000000' // Fill color
  },
  limitMax: false,     // If false, max value increases automatically if value > maxValue
  limitMin: false,     // If true, the min value of the gauge will be fixed
  colorStart: '#6FADCF',   // Colors
  colorStop: '#8FC0DA',    // just experiment with them
  strokeColor: '#E0E0E0',  // to see which ones work best for you
  generateGradient: true,
  highDpiSupport: true,     // High resolution support
  staticZones: [
    { strokeStyle: "#f44336", min: -100, max: 0 },
    { strokeStyle: "#4caf50", min: 0, max: 100 },
  ]
};

function openOptionsPage(event) {
  chrome.runtime.openOptionsPage();
}

function drawSentimentChart(value) {
  gauge_canvas.style.display = 'block';
  radar_canvas.style.display = 'none';
  logo.style.display = 'none';

  var gauge = new Gauge(gauge_canvas).setOptions(opts); // create sexy gauge!
  gauge.maxValue = 100; // set max gauge value
  gauge.setMinValue(-100);  // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
  gauge.set(value); // set actual value
}

// console.log('btnAnonymizer: ' + JSON.stringify(btnAnonymizer));

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    sendResponse({ farewell: "goodbye" });

    if (request.error == 401) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = '<label style="color:red;">(Invalid MODZY token. Please check Settings)</label>';
    }

    if (request.sentiment) {
      lblSentiments.innerHTML = 'Sentiment score: ' + request.sentiment;

      drawSentimentChart(request.sentiment);
    }


    if (request.mainSyncons) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = 'Main syncon: <br/><p style="text-align: center; margin: 20px; font-size: 22px;">' + request.mainSyncons + '</p>';
    }


    if (request.summary) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = 'Summary: <br/><p style="text-align: center; margin: 20px; font-size: 22px;">' + request.summary + '</p>';
    }


    if (request.anonymizer) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = request.anonymizer + ' items hidden. <br/><p style="text-align: center; margin: 59px 0 59px 0; font-size: 30px;">🙈🙉🙊</p>';
    }


    if (request.emotions) {

      if (request.emotions.length > 0) {
        lblSentiments.innerHTML = 'Emotions';

        gauge_canvas.style.display = 'none';
        radar_canvas.style.display = 'block';
        logo.style.display = 'none';

        const data_radar = {
          labels: [],
          datasets: [{
            label: 'Emotions',
            data: [],
            fill: true,
            backgroundColor: '#2196f333',
            borderColor: '#2196f3',
            pointBackgroundColor: '#2196f3',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#2196f3'
          }]
        };

        for (const one of request.emotions) {
          data_radar.labels.push(one.label);
          data_radar.datasets[0].data.push(one.score);
        }

        const config_radar = {
          type: 'radar',
          data: data_radar,
          options: {
            elements: {
              line: {
                borderWidth: 3
              }
            }
          },
        };

        if (radar) {
          radar.destroy();
        }
        radar = new Chart(radar_canvas, config_radar);


      } else {
        lblSentiments.innerHTML = 'no emotions';
      }

      sendResponse({ farewell: "goodbye" });
    }
  }
);

btnAnonymizer.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: anonymizerText,
  });
});

btnSummarization.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getSummarization,
  });
});

btnSentiments.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getSentiments,
  });
});

btnSyncons.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getMainSyncon,
  });
});

function getMainSyncon() {
  chrome.storage.sync.get("TOKEN_EXPERT", ({ TOKEN_EXPERT }) => {
    console.log('start getSentiment()');

    const clean = getCleanTextFromWeb();
    let allText = clean.allText;
    let nodesHTML = clean.nodesHTML;
    let nodesText = clean.nodesText;

    const data = {
      "model": {
        "identifier": "m8z2mwe3pt",
        "version": "0.0.1"
      },
      "input": {
        "type": "text",
        "sources": {
          "my-input": {
             "input.txt": allText,
          }
        }
      }
    };

    let ret = null;

    $.ajax({
      async: false,
      url: 'https://app.modzy.com/api/jobs',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `ApiKey ${TOKEN_EXPERT}`,
      },
      data: JSON.stringify(data),
      success: function (result) {
        const mainSyncons = result.data;
        let maxSyncons = '';
        if (mainSyncons) {
          for (let one of mainSyncons) {
            maxSyncons += one + ',';
          }

          ret = {
            maxSyncons,
          }

          chrome.runtime.sendMessage({ mainSyncons: maxSyncons }, function (response) {
            console.log('OK sentiment response: ' + JSON.stringify(response));
          });
        }
      },
      error: function (error) {
        console.log('error sentiments: ' + JSON.stringify(error));

        chrome.runtime.sendMessage({ mainSyncons: '(no detected)' }, function (response) {
          console.log('OK response: ' + JSON.stringify(response));
        });
      }
    });
  });
}


function getSentiments() {
  chrome.storage.sync.get("TOKEN_EXPERT", ({ TOKEN_EXPERT }) => {
    console.log('start getSentiments()');

    const clean = getCleanTextFromWeb();
    let allText = clean.allText;
    let nodesHTML = clean.nodesHTML;
    let nodesText = clean.nodesText;

    const data = {
      "model": {
        "identifier": "ed542963de",
        "version": "1.0.1"
      },
      "input": {
        "type": "text",
        "sources": {
          "my-input": {
             "input.txt": allText,
          }
        }
      }
    };

    let ret = null;

    $.ajax({
      async: false,
      url: 'https://app.modzy.com/api/jobs',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `ApiKey ${TOKEN_EXPERT}`,
      },
      data: JSON.stringify(data),
      success: function (result) {
        const emotions = result.data.data.result.classPredictions;
        let true_categories = [];
        if (emotions) {
          for (let one of emotions) {
            true_categories.push({ label: one.label, score: one.score });
            console.log('added ' + one.class + '. score: ' + one.score);
          }
        }

        // sort by score
        true_categories = true_categories.sort(function (a, b) {
          return b.score - a.score;
        });

        chrome.runtime.sendMessage({ emotions: true_categories }, function (response) {
          console.log('OK emotions response: ' + JSON.stringify(response));
        });
      },
      error: function (error) {
        console.log('error sentiments: ' + JSON.stringify(error));

        chrome.runtime.sendMessage({ emotions: '(no detected)' }, function (response) {
          console.log('OK response: ' + JSON.stringify(response));
        });
      }
    });
  });
}

function getSummarization() {
  chrome.storage.sync.get("TOKEN_EXPERT", ({ TOKEN_EXPERT }) => {
    console.log('start getSummarization()');

    const clean = getCleanTextFromWeb();
    let allText = clean.allText;
    let nodesHTML = clean.nodesHTML;
    let nodesText = clean.nodesText;

    const data = {
      "model": {
        "identifier": "rs2qqwbjwb",
        "version": "0.0.2"
      },
      "input": {
        "type": "text",
        "sources": {
          "my-input": {
             "input.txt": allText,
          }
        }
      }
    };
  

    let ret = null;

    $.ajax({
      async: false,
      url: 'https://app.modzy.com/api/jobs',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `ApiKey ${TOKEN_EXPERT}`,
      },
      data: JSON.stringify(data),
      success: function (result) {
        const summary = result.data.summary;

        chrome.runtime.sendMessage({ summary }, function (response) {
          console.log('OK summary response: ' + JSON.stringify(response));
        });
      },
      error: function (error) {
        console.log('error summary: ' + JSON.stringify(error));

        chrome.runtime.sendMessage({ summary: '(no detected)' }, function (response) {
          console.log('OK response: ' + JSON.stringify(response));
        });
      }
    });
  });
}



function anonymizerText() {
  chrome.storage.sync.get(null, (allData) => {

    let TOKEN_EXPERT = allData.TOKEN_EXPERT;
    let CURRENT_ENTITIES = allData.CURRENT_ENTITIES;
    
    console.log('start anonymizerText()');

    const clean = getCleanTextFromWeb();
    let allText = clean.allText;
    let nodesHTML = clean.nodesHTML;
    let nodesText = clean.nodesText;

    const data = {
      "model": {
        "identifier": "a92fc413b5",
        "version": "0.0.12"
      },
      "input": {
        "type": "text",
        "sources": {
          "my-input": {
             "input.txt": allText,
          }
        }
      }
    };

    let ret = [];

    $.ajax({
      async: false,
      url: 'https://app.modzy.com/api/jobs',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `ApiKey ${TOKEN_EXPERT}`,
      },
      data: JSON.stringify(data),
      success: function (result) {
        // CallBack(result);
        // console.log('result: ' + JSON.stringify(result));

        const entities = result.data; // .text.text['results.json'];
        if (entities) {
          for (let oneE of entities) {
            if (oneE[1] != 'O' && CURRENT_ENTITIES.includes(oneE[1])) {
              ret.push(oneE[0]);
            }
          }
        }

        console.log('ENTITIES FILTERED: ' + JSON.stringify(ret));
      },
      error: function (error) {
        console.log('error: ' + JSON.stringify(error));
        if (error.status == 401) {
          chrome.runtime.sendMessage({ error: 401 }, function (response) {
          });
          return;
        }
      }
    });

    // order by len:
    ret = ret.sort(function (a, b) {
      return b.length - a.length;
    });
    console.log('ENTITIES FILTERED SORTED: ' + JSON.stringify(ret));

    let i = 0;
    // let totalHidden = 0;
    for (let oneText of nodesText) {
      for (let oneEntity of ret) {
        // console.log('searching...');
        if (oneText.includes(oneEntity)) {
          // console.log('FOUND: ' + oneText.innerHTML);
          nodesHTML[i].innerHTML = nodesHTML[i].innerHTML.replace(oneEntity, '*****');
        }
      }
      // totalHidden += nodesHTML[i].innerHTML.split('*****').length - 1;
      i += 1;
    }

    const totalTextAfterHidden = document.body.textContent;
    const totalHidden = totalTextAfterHidden.split('*****').length - 1;;

    chrome.runtime.sendMessage({ anonymizer: totalHidden }, function (response) {
      console.log('OK anonymizer response: ' + JSON.stringify(response));
    });
  });
}

/*
chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});
*/
/*
// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}
*/