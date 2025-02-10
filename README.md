# jut.su downloader

get links list on season page like this (https://jut.su/naruuto/season-2/)

```js
Array.from(document.querySelectorAll("#dle-content > div > div:nth-child(2) > div.watch_list_item > ul > li")).map((node) => {
    const [,sp,,ln] = node.childNodes
    const [ser_num, filler] = sp.childNodes
    return {number:ser_num.textContent, filler: !!filler.attributes.title, href:ln.attributes.href.textContent, name: ln.innerText}
})
```

put links list to `jut_su_links.json`

```sh
npx tsx downloader.js
```
