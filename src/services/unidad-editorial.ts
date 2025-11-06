import type { Dayjs } from "dayjs";
import { UNIDAD_EDITORIAL_FORMAT } from "../utils/dates";

// Alternative names interface for internationalization
interface AlternateNames {
  esES: string;
  enEN: string;
  itIT?: string;
  ptBR?: string;
}

// Image URL sizes for different resolutions
interface ImageUrlSizes {
  XS: string;
  S: string;
  M: string;
  L: string;
}

// Images with logo and flag URLs
interface Images {
  urlLogo: string[];
  urlFlag: string[];
}

// Editorial info URLs for different sections
interface EditorialUrl {
  tag: string;
  url: string;
}

interface UrlsDataCenter {
  otherUrls: EditorialUrl[];
  url: string;
  site: string;
}

interface CompetitorEditorialInfo {
  competitorId: string;
  urlsDataCenter: UrlsDataCenter;
}

// Team/Competitor information
interface Team {
  id: string;
  abbName: string;
  fullName: string;
  commonName: string;
  alternateCommonNames: AlternateNames;
  country: string;
  countryName: string;
  alternateCountryNames: AlternateNames;
  imageUrlSizes: ImageUrlSizes;
  imageUrl: string;
  images: Images;
  competitorEditorialInfo: CompetitorEditorialInfo;
}

// Match competitors (home and away teams)
interface Competitors {
  homeTeam: Team;
  awayTeam: Team;
}

// Match location/venue information
interface Location {
  name: string;
  id: string;
  address?: string;
  image?: string;
  url?: string;
}

// Season information
interface Season {
  id: string;
  name: string;
}

// Tournament phase information
interface Phase {
  id: number;
  name: string;
  alternateNames: AlternateNames;
}

// Tournament group information
interface Group {
  id: string;
  name: string;
  alternateNames: AlternateNames;
}

// Match status
interface Status {
  id: number;
  name: string;
  alternateNames: AlternateNames;
}

// Sport information
export interface Sport {
  id: string;
  name: string;
  alternateNames: AlternateNames;
  type: string;
}

// Tournament information
interface Tournament {
  id: string;
  name: string;
  alternateNames: AlternateNames;
  isNational: boolean;
}

// Sport event details
interface SportEvent {
  name: string;
  alternateNames: AlternateNames;
  location: Location;
  competitors: Competitors;
  matchDay: string;
  season: Season;
  phase: Phase;
  group: Group;
  status: Status;
  referees: string[];
}

// Team score information
interface TeamScore {
  totalScore: string;
  subScore: string;
}

// Match winner information
interface Winner {
  id: string;
  name: string;
}

// Match period information
interface Period {
  id: number;
  name: string;
  alternateNames: AlternateNames;
  startTime?: string | null;
}

// Complete score information
export interface Score {
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  winner: Winner;
  period: Period;
}

// Main match data interface
interface MatchData {
  id: string;
  lastUpdate: string;
  startDate: string;
  // sport: Sport;
  tournament: Tournament;
  sportEvent: SportEvent;
  score: Score;
  // editorialInfo: EditorialInfo;
}

// Root API response interface
interface LaLigaApiResponse {
  status: string;
  data: MatchData[];
  timestamp: string;
}

enum Tournaments {
  LaLiga = "0101",
  ChampionsLeague = "0103",
}

export class UnidadEditorialService {
  private static baseUrl = "https://api.unidadeditorial.es";
  private static NO_CONTENT_STATUS = 204;

  static async getGames(date: Dayjs) {
    try {
      const url = new URL("/sports/v1/events", this.baseUrl);
      url.searchParams.set("site", "2");
      url.searchParams.set("tournament", [Tournaments.LaLiga, Tournaments.ChampionsLeague].join(','));
      // url.searchParams.set('fields', 'sport,tournament,sportEvent,score,tv,editorialInfo');
      url.searchParams.set("fields", "sportEvent,score,tournament");
      url.searchParams.set("timezoneOffset", "2");
      url.searchParams.set("date", date.format(UNIDAD_EDITORIAL_FORMAT));

      const response = await fetch(url.toString());

      if (response.status === this.NO_CONTENT_STATUS) {
        return [];
      }

      const { data }: LaLigaApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  }
}
