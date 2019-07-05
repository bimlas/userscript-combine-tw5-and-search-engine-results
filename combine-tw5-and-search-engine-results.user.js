// ==UserScript==
// @name TiddlyWiki5: Combine TW5 and search engine results
// @description Combine TiddlyWiki and your preferred search engine to find your own answers more easily
// @version 0.2.0
// @author bimlas
// @supportURL https://github.com/bimlas/userscript-combine-tw5-and-search-engine-results
// @downloadURL https://gitlab.com/bimlas/userscript-combine-tw5-and-search-engine-results/raw/master/combine-tw5-and-search-engine-results.user.js
// @icon https://tiddlywiki.com/favicon.ico
// @namespace Violentmonkey Scripts
// @match *://www.google.com/search*
// @match *://www.startpage.com/do/search*
// @match *://duckduckgo.com/*
// @grant GM_xmlhttpRequest
// ==/UserScript==

const wikis = [
  'http://localhost:8080',
];
const subfilter = '[!is[system]]';

const searchEngineConfigs = {
  'www.google.com': {
    searchInputSelector: 'input[name=q]',
    searchResultsSelector: '#center_col'
  },
  // StartPage changes its URL and website structure, so the script does not work in all cases
  'www.startpage.com': {
    searchInputSelector: '#q',
    searchResultsSelector: 'div.mainline-results'
  },
  'duckduckgo.com': {
    searchInputSelector: 'input[name=q]',
    searchResultsSelector: '#links.results'
  },
}
const searchEngine = searchEngineConfigs[document.domain];

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
  const singleViewUrl = `${wiki}/${urlEncodedTitle}`;
  const normalViewUrl = `${wiki}/#${urlEncodedTitle}`;
  return `<a href="${singleViewUrl}">${title}</a> (<a href="${normalViewUrl}">#</a>)`;
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
  const searchEngineResults = document.querySelector(searchEngine.searchResultsSelector);
  const node = document.createElement('div');
  node.style.display = 'inline-flex';
  node.style.margin = '1em';
  node.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  node.innerHTML = text;
  searchEngineResults.insertBefore(node, searchEngineResults.childNodes[0]);
}

function makeHtmlListFromTiddlers(wiki, listOfTiddlers) {
  const htmlList = listOfTiddlers.reduce((text, tiddler) => {
    return text + `<li>${getTiddlerLink(wiki, tiddler.title)}</li>`;
  }, '');
  return `<ul>${htmlList}</ul>`;
}

const query = document.querySelector(searchEngine.searchInputSelector).value;
const urlEncodedQuery = encodeURIComponent(`${subfilter} +[search[${query}]]`);
let searchResults = '';
wikis.forEach(wiki => {
  const url = `${wiki}/recipes/default/tiddlers.json:${urlEncodedQuery}`;
  Promise.all([
    fetchJSON(wiki, url),
    getWikiTitle(wiki)
  ])
  .then(([results, wikiTitle]) => {
    if(!results.length) return;
    const wikiLink = `<small><a href="${wiki}">${wiki}</a></small>`;
    const header = `<h3>${wikiTitle}</h3>${wikiLink}<p>`;
    addToPage(`<div style="margin: 1em;">${header}<p>${makeHtmlListFromTiddlers(wiki, results)}</p><div>`);
  });
});
