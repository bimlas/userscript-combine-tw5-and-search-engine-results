// ==UserScript==
// @name TiddlyWiki5: Combine TW5 and search engine results
// @description Combine TiddlyWiki and your preferred search engine to find your own answers more easily
// @author bimlas
// @supportURL https://github.com/bimlas/userscript-combine-tw5-and-search-engine-results
// @icon https://tiddlywiki.com/favicon.ico
// @namespace Violentmonkey Scripts
// @match https://www.google.com/search*
// @grant GM_xmlhttpRequest
// ==/UserScript==

const wikis = [
  'http://localhost:8080',
];

function getSearchResultsOfWiki(wiki, query, callback) {
  const urlEncodedQuery = encodeURIComponent(`[search[${query}]]`);
  const url = `${wiki}/recipes/default/tiddlers.json:${urlEncodedQuery}`;
  const ret = GM_xmlhttpRequest({
    method: "GET",
    headers: {
      "Origin": wiki,
    },
    url: url,
    onload: function(response) {
      callback(JSON.parse(response.responseText));
    }
  });
}

function getTiddlerLink(wiki, title) {
  const urlEncodedTitle = encodeURIComponent(title);
  const url = `${wiki}/${urlEncodedTitle}`;
  return `<a href="${url}">${title}</a>`;
}

function addToPage(text) {
  const searchEngineResults = document.querySelector('#center_col');
  const node = document.createElement('div');
  node.innerHTML = text;
  searchEngineResults.insertBefore(node, searchEngineResults.childNodes[0]);
}

window.addEventListener('load', () => {
  const query = document.querySelector('input[name=q]').value;
  let searchResults = '';
  wikis.forEach(wiki => {
    getSearchResultsOfWiki(wiki, query, results => {
      const wikiSearchResultsList = results.reduce((text, tiddler) => text + `<li>${getTiddlerLink(wiki, tiddler.title)}</li>`, '');
      addToPage(`<h3>${wiki}</h3><ul>${wikiSearchResultsList}</ul>`);
    });
  });
}, false);
