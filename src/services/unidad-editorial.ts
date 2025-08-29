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
interface Sport {
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
interface Score {
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  winner: Winner;
  period: Period;
}

// Editorial information for the match
interface EditorialInfo {
  site: string;
  url: string;
  otherUrls: EditorialUrl[];
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

export type {
  LaLigaApiResponse,
  MatchData,
  Sport,
  Tournament,
  SportEvent,
  Team,
  Competitors,
  Location,
  Season,
  Phase,
  Group,
  Status,
  Score,
  TeamScore,
  Winner,
  Period,
  EditorialInfo,
  AlternateNames,
  ImageUrlSizes,
  Images,
  CompetitorEditorialInfo,
  UrlsDataCenter,
  EditorialUrl
};

export class UnidadEditorialService {
  private static baseUrl = "https://api.unidadeditorial.es";

  static async getGames() {
    const url = new URL("/sports/v1/events", this.baseUrl);
    url.searchParams.set("site", "2");
    url.searchParams.set("tournament", "0101");
    // url.searchParams.set('fields', 'sport,tournament,sportEvent,score,tv,editorialInfo');
    url.searchParams.set("fields", "sportEvent,score,tournament");
    url.searchParams.set("timezoneOffset", "2");
    url.searchParams.set("date", "2025-8-29");

    const response = await fetch(url.toString());
    const { data }: LaLigaApiResponse = await response.json();
    return data;
  }
}
