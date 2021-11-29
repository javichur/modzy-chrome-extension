function getCleanTextFromWeb() {
  const nodesHTML = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, caption, a, figcaption'); // , span, div, i, b');
  let nodesText = []; // version texto
  let allText = '';
  for (let one of nodesHTML) {
    nodesText.push(one.textContent);
    let textAux = one.textContent.replace('\n', '');
    textAux = textAux.replace('\t', '');
    if (textAux.length > 0 && allText.includes(textAux) == false && textAux.includes('font-style') == false) {
      allText += textAux + '. ';
    }
  }

  // limit 10K chars:
  allText = allText.substring(0, 9999);

  /*
  const text = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, caption, span, a'); // , div, i, b');

  let allText = '';
  for (let one of text) {
    if(one.innerHTML.length > 0) { // && one.innerHTML.includes('<') == false){
      allText += one.innerHTML + '. ';
    }
  }
  */
  // let allText = document.getElementsByTagName("BODY")[0].textContent;

  return {
    nodesHTML,
    nodesText,
    allText,
  };
}