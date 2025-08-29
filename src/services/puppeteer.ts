import puppeteer from "puppeteer";

type GetPuppeteerOptions = {
  includeImages?: boolean;
};

export const getPuppeteer = async (
  { includeImages = false }: GetPuppeteerOptions = { includeImages: false },
) => {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  console.log('Browser launched');

  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 800 });

  await page.setRequestInterception(true);

  page.on("request", (req) => {
    if (
      req.resourceType() == "stylesheet" ||
      (!includeImages && req.resourceType() == "image") ||
      req.resourceType() == "font"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  return { browser, page };
};
