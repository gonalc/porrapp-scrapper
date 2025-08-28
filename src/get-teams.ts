import type { Page } from "puppeteer/lib/types.d.ts";
import { getPuppeteer } from "./puppeteer";
import { slugify } from "./utils/sluggify";

const TEAMS_URL = "https://www.marca.com/futbol/primera/equipos.html";

type Team = {
  name: string;
  badgeUrl: string;
  slug: string;
};

async function getTeamsFromTeamsPage(page: Page) {
  console.log("Going to: ", TEAMS_URL);
  await page.goto(TEAMS_URL);

  const teamsSelector = "ul.ue-c-sports-card-list";
  const singleTeamSelector = "div.ue-c-sports-card__header";

  console.log("Awaiting for teams to load: ", teamsSelector);

  await page.waitForSelector(teamsSelector);

  const teams = await page.$$(singleTeamSelector);

  const parsedTeams: Team[] = [];

  for (const team of teams) {
    const teamBadgeUrl = await team.$eval("img", (el) =>
      el.getAttribute("src"),
    );

    const teamName = await team.$eval("h3", (el) => el.textContent);

    parsedTeams.push({
      name: teamName,
      badgeUrl: teamBadgeUrl,
      slug: slugify(teamName),
    });
  }

  return parsedTeams;
}

export async function getTeams() {
  const { page, browser } = await getPuppeteer();
  try {
    const teams = await getTeamsFromTeamsPage(page);

    return teams;
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}
