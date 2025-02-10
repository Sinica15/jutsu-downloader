import fs from "fs";
import puppeteer from "puppeteer";

import links from "./jut_su_links.json";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  page.on("console", async (msg) => {
    const msgArgs = msg.args();
    const logs = await Promise.all(msgArgs.map((arg) => arg.jsonValue()));
    const logsJoined = logs.join(" ");
    if (logsJoined.includes("серия")) console.log(logsJoined);
  });

  for await (const episode of links) {
    console.log(episode.number, "started");

    await page.goto(episode.href, { waitUntil: "networkidle2" });

    console.log(episode.number, "page opened");

    const [videoBase64Data, fileName] = await page.evaluate(
      async (episodeJSON) => {
        const episode = JSON.parse(episodeJSON);

        const nodes = document.querySelectorAll("source");

        const resolutions = Array.from(nodes)
          .filter((n) => ["360", "480"].includes(n.attributes.res.textContent))
          .map((n) => parseInt(n.attributes.res.textContent));

        const resAttr = Math.max(...resolutions);

        console.log(episode.number, "found resolution", `${resAttr}p`);

        const fileName = [
          episode.number,
          episode.name,
          episode.filler ? "(F)" : null,
          `${resAttr}p`,
        ]
          .filter(Boolean)
          .join("_");

        const dwnldLink = Array.from(nodes).find(
          (n) => n.attributes.res.textContent === `${resAttr}`
        ).attributes.src.textContent;

        console.log(episode.number, "found link");

        const response = await fetch(dwnldLink);
        const blob = await response.blob();
        const data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.onprogress = (data) => {
            if (data.lengthComputable) {
              var progress = parseInt((data.loaded / data.total) * 100, 10);
              console.log(episode.number, progress);
            }
          };
          reader.readAsDataURL(blob);
        });

        console.log(episode.number, "data done");

        return [data, fileName];
      },
      JSON.stringify(episode)
    );

    if (videoBase64Data) {
      const buffer = Buffer.from(videoBase64Data, "base64");
      fs.writeFileSync(`./downloads/${fileName}.mp4`, buffer);

      console.log(episode.number, "writing finished\n");
    }
  }

  await browser.close();
})();
