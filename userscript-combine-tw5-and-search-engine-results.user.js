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
const subfilter = '[!is[system]]';

function fetchJSON(origin, url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      headers: {
        "Origin": origin,
      },
      url: url,
      onload: function(response) {
        resolve(JSON.parse(response.responseText));
      }
    });
  });
}

function getTiddlerLink(wiki, title) {
  const urlEncodedTitle = encodeURIComponent(title);
  const url = `${wiki}/${urlEncodedTitle}`;
  return `<a href="${url}">${title}</a>`;
}

function getWikiTitle(wiki) {
  return new Promise((resolve, reject) => {
    const urlEncodedQuery = encodeURIComponent('$:/SiteTitle');
    const url = `${wiki}/recipes/default/tiddlers/${urlEncodedQuery}`;
    fetchJSON(wiki, url)
    .then(results => {
      resolve(results.text);
    });
  });
}

function addToPage(text) {
  const searchEngineResults = document.querySelector('#center_col');
  const node = document.createElement('div');
  node.innerHTML = text;
  searchEngineResults.insertBefore(node, searchEngineResults.childNodes[0]);
}

const query = document.querySelector('input[name=q]').value;
const urlEncodedQuery = encodeURIComponent(`${subfilter} +[search[${query}]]`);
let searchResults = '';
wikis.forEach(wiki => {
  const url = `${wiki}/recipes/default/tiddlers.json:${urlEncodedQuery}`;
  Promise.all([
    fetchJSON(wiki, url),
    getWikiTitle(wiki)
  ])
  .then(([results, wikiTitle]) => {
    const wikiSearchResultsList = results.reduce((text, tiddler) => text + `<li>${getTiddlerLink(wiki, tiddler.title)}</li>`, '');
    addToPage(`<h3>${wikiTitle}</h3><small>${wiki}</small><p><ul>${wikiSearchResultsList}</ul></p>`);
  });
});