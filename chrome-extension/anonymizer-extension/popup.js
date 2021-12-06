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

      lblSentiments.innerHTML = 'Main topics: <br/><p style="text-align: left; margin: 20px; font-size: 16px; font-family: arial;">' + request.mainSyncons + '</p>';
    }


    if (request.summary) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = 'Summary: <br/><p style="text-align: left; margin: 20px; font-size: 16px; font-family: arial;">' + request.summary + '</p>';
    }


    if (request.anonymizer) {
      gauge_canvas.style.display = 'none';
      radar_canvas.style.display = 'none';
      logo.style.display = 'none';

      lblSentiments.innerHTML = request.anonymizer + ' items hidden. <br/><p style="text-align: center; margin: 59px 0 59px 0; font-size: 30px;">🙈🙉🙊</p>';
    }


    if (request.emotions) {

      if (request.emotions.length > 0) {
        lblSentiments.innerHTML = 'Sentiments';

        gauge_canvas.style.display = 'none';
        radar_canvas.style.display = 'block';
        logo.style.display = 'none';

        const data_radar = {
          labels: [],
          datasets: [{
            label: 'Sentiments',
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
      success: async function (result) {
        const jobIdentifier = result.jobIdentifier;

        const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

        const getResults = async (jobIdentifier, TOKEN_EXPERT) => {
          let result;
          try {
            result = await $.ajax({
              url: 'https://app.modzy.com/api/results/' + jobIdentifier,
              type: 'GET',
              contentType: 'application/json',
              headers: {
                'Authorization': `ApiKey ${TOKEN_EXPERT}`,
              },
            });
        
            return result;
          } catch (error) {
            console.error(error);
            chrome.runtime.sendMessage({ debug: 90 }, function (response) {
              console.log('debug 90: ' + JSON.stringify(response));
            });
            return null;
          }
        };

        var finished = 0;
        let ret;
        while (finished == 0) {

          await wait(1000);

          ret = await getResults(jobIdentifier, TOKEN_EXPERT);

          if (ret.finished == true) {
            finished = 1;

            if (ret.completed == 1) {
              chrome.runtime.sendMessage({ debug: 777, ret }, function (response) {
                console.log('debug 777: ' + JSON.stringify(response));
              });
            }
          }
        }



        const topicsArray = ret.results['my-input']['results.json'];





        const mainSyncons = topicsArray;
        let maxSyncons = '';
        if (mainSyncons) {
          for (let one of mainSyncons) {
            maxSyncons += one + ', ';
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
      success: async function (result) {

        const jobIdentifier = result.jobIdentifier;

        const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

        const getResults = async (jobIdentifier, TOKEN_EXPERT) => {
          let result;
          try {
            result = await $.ajax({
              url: 'https://app.modzy.com/api/results/' + jobIdentifier,
              type: 'GET',
              contentType: 'application/json',
              headers: {
                'Authorization': `ApiKey ${TOKEN_EXPERT}`,
              },
            });
        
            return result;
          } catch (error) {
            console.error(error);
            chrome.runtime.sendMessage({ debug: 90 }, function (response) {
              console.log('debug 90: ' + JSON.stringify(response));
            });
            return null;
          }
        };

        var finished = 0;
        let ret;
        while (finished == 0) {

          await wait(1000);

          ret = await getResults(jobIdentifier, TOKEN_EXPERT);

          if (ret.finished == true) {
            finished = 1;

            if (ret.completed == 1) {
              chrome.runtime.sendMessage({ debug: 544, ret }, function (response) {
                console.log('debug 544: ' + JSON.stringify(response));
              });
            }
          }
        }



        const classPredictions = ret.results['my-input']['results.json'].data.result.classPredictions;

        chrome.runtime.sendMessage({ classPredictions }, function (response) {
          console.log('OK classPredictions response: ' + JSON.stringify(response));
        });





        const emotions = classPredictions;
        let true_categories = [];
        if (emotions) {
          for (let one of emotions) {
            true_categories.push({ label: one.class, score: one.score });
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
      success: async function (result) {

        const jobIdentifier = result.jobIdentifier;

        const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

        const getResults = async (jobIdentifier, TOKEN_EXPERT) => {
          let result;
          try {
            result = await $.ajax({
              url: 'https://app.modzy.com/api/results/' + jobIdentifier,
              type: 'GET',
              contentType: 'application/json',
              headers: {
                'Authorization': `ApiKey ${TOKEN_EXPERT}`,
              },
            });
        
            return result;
          } catch (error) {
            console.error(error);
            chrome.runtime.sendMessage({ debug: 90 }, function (response) {
              console.log('debug 90: ' + JSON.stringify(response));
            });
            return null;
          }
        };

        var finished = 0;
        let ret;
        while (finished == 0) {

          await wait(1000);

          ret = await getResults(jobIdentifier, TOKEN_EXPERT);

          if (ret.finished == true) {
            finished = 1;

            if (ret.completed == 1) {
              chrome.runtime.sendMessage({ debug: 999, ret }, function (response) {
                console.log('debug 999: ' + JSON.stringify(response));
              });
            }
          }
        }



        const summary = ret.results['my-input']['results.json'].summary;

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
  chrome.storage.sync.get(null, async (allData) => {

    let TOKEN_EXPERT = allData.TOKEN_EXPERT;
    let CURRENT_ENTITIES = allData.CURRENT_ENTITIES;

    console.log('start anonymizerText()');

    const clean = getCleanTextFromWeb();
    let allText = clean.allText;
    let nodesHTML = clean.nodesHTML;
    let nodesText = clean.nodesText;
    let ret = [];

    const data = {
      "model": {
        "identifier": "a92fc413b5",
        "version": "0.0.12"
      },
      "input": {
        "type": "text",
        "sources": {
          "my-input": {
            "input.txt": allText.substring(0, 200),
          }
        }
      }
    };

    chrome.runtime.sendMessage({ debug: 0 , data }, function (response) {
      console.log('debug 0: ' + JSON.stringify(data));
    });


    $.ajax({
      async: false,
      url: 'https://app.modzy.com/api/jobs',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `ApiKey ${TOKEN_EXPERT}`,
      },
      data: JSON.stringify(data),
      success: async function (result) {
        // CallBack(result);
        console.log('anonymizerText. API result: ' + JSON.stringify(result));

        const jobIdentifier = result.jobIdentifier;

        const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

        const getResults = async (jobIdentifier, TOKEN_EXPERT) => {
          let result;
          try {
            result = await $.ajax({
              url: 'https://app.modzy.com/api/results/' + jobIdentifier,
              type: 'GET',
              contentType: 'application/json',
              headers: {
                'Authorization': `ApiKey ${TOKEN_EXPERT}`,
              },
            });
        
            return result;
          } catch (error) {
            console.error(error);
            chrome.runtime.sendMessage({ debug: 90 }, function (response) {
              console.log('debug 90: ' + JSON.stringify(response));
            });
            return null;
          }
        };




        var finished = 0;
        while (finished == 0) {

          await wait(1000);

          chrome.runtime.sendMessage({ debug: 123 }, function (response) {
            console.log('debug 123: ' + JSON.stringify(response));
          });

          var ret = await getResults(jobIdentifier, TOKEN_EXPERT);

          if (ret.finished == true) {
            finished = 1;

            chrome.runtime.sendMessage({ debug: 40, ret }, function (response) {
              console.log('debug 40: ' + JSON.stringify(response));
            });

            if (ret.completed == 1) {
              enviarMensajeResultadosAnonimize(ret);
            }
          }
        }
      },
      error: function (error) {
        chrome.runtime.sendMessage({ error: error.status }, function (response) {
        });

        console.log('error: ' + JSON.stringify(error));
        if (error.status == 401) {
          chrome.runtime.sendMessage({ error: 401 }, function (response) {
          });
          return;
        }
      }
    });


  });
}


function enviarMensajeResultadosAnonimize(results) {

  chrome.runtime.sendMessage({ debug: 8 }, function (response) {
    console.log('debug 4: ' + JSON.stringify(response));
  });

  const entities = results.results["my-input"]['results.json'];
  if (entities) {
    for (let oneE of entities) {
      if (oneE[1] != 'O' && CURRENT_ENTITIES.includes(oneE[1])) {
        ret.push(oneE[0]);
      }
    }
  }

  chrome.runtime.sendMessage({ debug: 9 }, function (response) {
    console.log('debug 9: ' + JSON.stringify(response));
  });

  console.log('ENTITIES FILTERED: ' + JSON.stringify(ret));

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