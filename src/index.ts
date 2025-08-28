import { getTeams } from "./get-teams";

const teams = await getTeams();

console.log('Teams: ', teams);
