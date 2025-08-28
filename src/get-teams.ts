import type { Page } from "puppeteer/lib/types.d.ts";
import { getPuppeteer } from "./puppeteer";

const TEAMS_URL = "https://www.marca.com/futbol/primera/equipos.html";

async function getTeamsFromTeamsPage(page: Page) {
  console.log("Going to: ", TEAMS_URL);
  await page.goto(TEAMS_URL);

  const teamsSelector = "ul.ue-c-sports-card-list";
  const singleTeamSelector = "div.ue-c-sports-card__header";

  console.log("Awaiting for teams to load: ", teamsSelector);

  await page.waitForSelector(teamsSelector);

  const teams = await page.$$(singleTeamSelector);

  for (const team of teams) {
    const teamBadgeUrl = await team.$eval("img", (el) =>
      el.getAttribute("src"),
    );
    console.log("Team badge:", teamBadgeUrl);
    const teamName = await team.$eval("h3", (el) => el.textContent);
    console.log("Team name:", teamName);
  }
}

export async function getTeams() {
  const { page, browser } = await getPuppeteer();
  try {
    await getTeamsFromTeamsPage(page);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}
