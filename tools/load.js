import { browser } from "k6/browser";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    ui: {
      executor: "shared-iterations",
      options: {
        browser: {
          type: "chromium",
        },
      },
      vus: 2,
      iterations: 1000000,
      maxDuration: "5m",
    },
  },
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://mldegrees.com/"); // Navigate to your website
    page.screenshot({ path: `screenshots/${__VU}-${__ITER}-homepage.png` });

    sleep(2);
    await page.waitForSelector("h2");

    const content = await page.content();
    check(page, {
      "page title is correct": page.title() == "ML Degrees",
      "page includes MIT in the list": content.includes("MIT"),
    });
  } finally {
    await page.close();
  }
}
