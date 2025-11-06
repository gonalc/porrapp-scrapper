import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import dayjs from 'dayjs';
import { UnidadEditorialService } from '../unidad-editorial';
import { UNIDAD_EDITORIAL_FORMAT } from '../../utils/dates';

const mockMatchData = [
  {
    id: 'match-1',
    lastUpdate: '2024-01-15T10:00:00Z',
    startDate: '2024-01-15T15:00:00Z',
    tournament: {
      id: '0101',
      name: 'LaLiga',
      alternateNames: { esES: 'LaLiga', enEN: 'LaLiga' },
      isNational: true
    },
    sportEvent: {
      name: 'Real Madrid vs Barcelona',
      alternateNames: { esES: 'Real Madrid vs Barcelona', enEN: 'Real Madrid vs Barcelona' },
      location: { name: 'Santiago Bernabéu', id: 'stadium-1' },
      competitors: {
        homeTeam: {
          id: 'team-1',
          abbName: 'RMA',
          fullName: 'Real Madrid CF',
          commonName: 'Real Madrid',
          alternateCommonNames: { esES: 'Real Madrid', enEN: 'Real Madrid' },
          country: 'ES',
          countryName: 'Spain',
          alternateCountryNames: { esES: 'España', enEN: 'Spain' },
          imageUrlSizes: { XS: '', S: '', M: '', L: '' },
          imageUrl: '',
          images: { urlLogo: [], urlFlag: [] },
          competitorEditorialInfo: {
            competitorId: 'team-1',
            urlsDataCenter: { otherUrls: [], url: '', site: '' }
          }
        },
        awayTeam: {
          id: 'team-2',
          abbName: 'BAR',
          fullName: 'FC Barcelona',
          commonName: 'Barcelona',
          alternateCommonNames: { esES: 'Barcelona', enEN: 'Barcelona' },
          country: 'ES',
          countryName: 'Spain',
          alternateCountryNames: { esES: 'España', enEN: 'Spain' },
          imageUrlSizes: { XS: '', S: '', M: '', L: '' },
          imageUrl: '',
          images: { urlLogo: [], urlFlag: [] },
          competitorEditorialInfo: {
            competitorId: 'team-2',
            urlsDataCenter: { otherUrls: [], url: '', site: '' }
          }
        }
      },
      matchDay: '15',
      season: { id: '2023-24', name: '2023/24' },
      phase: { id: 1, name: 'Regular Season', alternateNames: { esES: 'Temporada Regular', enEN: 'Regular Season' } },
      group: { id: 'group-1', name: 'Group A', alternateNames: { esES: 'Grupo A', enEN: 'Group A' } },
      status: { id: 3, name: 'Finished', alternateNames: { esES: 'Finalizado', enEN: 'Finished' } },
      referees: ['Referee 1']
    },
    score: {
      homeTeam: { totalScore: '2', subScore: '1' },
      awayTeam: { totalScore: '1', subScore: '0' },
      winner: { id: 'team-1', name: 'Real Madrid' },
      period: { id: 90, name: 'Full Time', alternateNames: { esES: 'Tiempo Completo', enEN: 'Full Time' } }
    }
  }
];

const mockApiResponse = {
  status: 'success',
  data: mockMatchData,
  timestamp: '2024-01-15T10:00:00Z'
};

let fetchMock: any;

describe("UnidadEditorialService", () => {
  beforeEach(() => {
    fetchMock = mock(() => Promise.resolve({
      json: () => Promise.resolve(mockApiResponse)
    }));
    global.fetch = fetchMock;

    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockRestore?.();
  });

  describe("getGames", () => {
    describe("successful API calls", () => {
      it("should fetch games for both LaLiga and Champions League tournaments", async () => {
        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockMatchData);

        const calledUrl = fetchMock.mock.calls[0][0];
        const url = new URL(calledUrl);

        expect(url.origin).toBe('https://api.unidadeditorial.es');
        expect(url.pathname).toBe('/sports/v1/events');
        expect(url.searchParams.get('site')).toBe('2');
        expect(url.searchParams.get('tournament')).toBe('0101,0103');
        expect(url.searchParams.get('fields')).toBe('sportEvent,score,tournament');
        expect(url.searchParams.get('timezoneOffset')).toBe('2');
        expect(url.searchParams.get('date')).toBe('2024-01-15');
      });

      it("should format date correctly using UNIDAD_EDITORIAL_FORMAT", async () => {
        const testDate = dayjs('2024-12-25');
        await UnidadEditorialService.getGames(testDate);

        const calledUrl = fetchMock.mock.calls[0][0];
        const url = new URL(calledUrl);
        expect(url.searchParams.get('date')).toBe('2024-12-25');
        expect(url.searchParams.get('date')).toBe(testDate.format(UNIDAD_EDITORIAL_FORMAT));
      });

      it("should handle different date formats correctly", async () => {
        const testCases = [
          { input: dayjs('2024-01-01'), expected: '2024-01-01' },
          { input: dayjs('2024-12-31'), expected: '2024-12-31' },
          { input: dayjs('2023-06-15'), expected: '2023-06-15' },
        ];

        for (const { input, expected } of testCases) {
          fetchMock.mockClear();
          await UnidadEditorialService.getGames(input);

          const calledUrl = fetchMock.mock.calls[0][0];
          const url = new URL(calledUrl);
          expect(url.searchParams.get('date')).toBe(expected);
        }
      });

      it("should construct URL with all required query parameters", async () => {
        const testDate = dayjs('2024-01-15');
        await UnidadEditorialService.getGames(testDate);

        const calledUrl = fetchMock.mock.calls[0][0];
        const url = new URL(calledUrl);

        expect(url.searchParams.get('site')).toBe('2');
        expect(url.searchParams.get('tournament')).toBe('0101,0103');
        expect(url.searchParams.get('fields')).toBe('sportEvent,score,tournament');
        expect(url.searchParams.get('timezoneOffset')).toBe('2');
        expect(url.searchParams.get('date')).toBe('2024-01-15');

        expect(url.origin).toBe('https://api.unidadeditorial.es');
        expect(url.pathname).toBe('/sports/v1/events');
      });

      it("should return empty array when API returns no data", async () => {
        const emptyResponse = {
          status: 'success',
          data: [],
          timestamp: '2024-01-15T10:00:00Z'
        };

        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve(emptyResponse)
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
      });

      it("should return empty array when API returns 204 No Content", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          status: 204,
          statusText: 'No Content',
          json: () => Promise.reject(new Error('No content to parse'))
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
      });
    });

    describe("error handling", () => {
      it("should handle network errors and return empty array", async () => {
        fetchMock.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });

      it("should handle fetch failure and return empty array", async () => {
        fetchMock.mockImplementationOnce(() => Promise.reject(new Error('Fetch failed')));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });

      it("should handle invalid JSON response and return empty array", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.reject(new SyntaxError('Invalid JSON'))
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(SyntaxError));
      });

      it("should handle response with malformed data structure", async () => {
        const malformedResponse = {
          status: 'success',
          // Missing data field
          timestamp: '2024-01-15T10:00:00Z'
        };

        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve(malformedResponse)
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toBeUndefined();
      });

      it("should handle HTTP error status codes", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.reject(new Error('404 Not Found'))
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });

      it("should handle server error (500)", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('500 Internal Server Error'))
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });

      it("should handle timeout errors", async () => {
        fetchMock.mockImplementationOnce(() => Promise.reject(new Error('Request timeout')));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
      });
    });

    describe("edge cases and corner cases", () => {
      it("should handle null response data", async () => {
        const nullResponse = {
          status: 'success',
          data: null,
          timestamp: '2024-01-15T10:00:00Z'
        };

        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve(nullResponse)
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toBeNull();
      });

      it("should handle empty response object", async () => {
        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve({})
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toBeUndefined();
      });

      it("should handle response with invalid status", async () => {
        const invalidStatusResponse = {
          status: 'error',
          data: mockMatchData,
          timestamp: '2024-01-15T10:00:00Z'
        };

        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve(invalidStatusResponse)
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toEqual(mockMatchData);
      });

      it("should handle date edge cases (leap year, month boundaries)", async () => {
        const edgeDateCases = [
          dayjs('2024-02-29'), // Leap year
          dayjs('2024-12-31'), // End of year
          dayjs('2024-01-01'), // Beginning of year
          dayjs('2024-06-30'), // End of month
          dayjs('2024-07-01')  // Beginning of month
        ];

        for (const testDate of edgeDateCases) {
          fetchMock.mockClear();
          await UnidadEditorialService.getGames(testDate);

          expect(fetchMock).toHaveBeenCalledTimes(1);
          const calledUrl = fetchMock.mock.calls[0][0];
          const url = new URL(calledUrl);
          expect(url.searchParams.get('date')).toBe(testDate.format(UNIDAD_EDITORIAL_FORMAT));
        }
      });

      it("should maintain consistency across multiple calls", async () => {
        const testDate = dayjs('2024-01-15');

        const result1 = await UnidadEditorialService.getGames(testDate);
        const result2 = await UnidadEditorialService.getGames(testDate);
        const result3 = await UnidadEditorialService.getGames(testDate);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(result1).toEqual(mockMatchData);
        expect(result2).toEqual(mockMatchData);
        expect(result3).toEqual(mockMatchData);

        const urls = fetchMock.mock.calls.map((call: any) => call[0]);
        expect(urls[0]).toBe(urls[1]);
        expect(urls[1]).toBe(urls[2]);
      });
    });

    describe("API response data structure validation", () => {
      it("should correctly parse and return match data", async () => {
        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);

        const match = result[0];
        expect(match).toHaveProperty('id', 'match-1');
        expect(match).toHaveProperty('tournament');
        expect(match).toHaveProperty('sportEvent');
        expect(match).toHaveProperty('score');
        expect(match?.tournament).toHaveProperty('id', '0101');
        expect(match?.sportEvent).toHaveProperty('competitors');
        expect(match?.score).toHaveProperty('homeTeam');
        expect(match?.score).toHaveProperty('awayTeam');
      });

      it("should handle multiple matches in response", async () => {
        const multipleMatchesResponse = {
          status: 'success',
          data: [mockMatchData[0], { ...mockMatchData[0], id: 'match-2' }],
          timestamp: '2024-01-15T10:00:00Z'
        };

        fetchMock.mockImplementationOnce(() => Promise.resolve({
          json: () => Promise.resolve(multipleMatchesResponse)
        }));

        const testDate = dayjs('2024-01-15');
        const result = await UnidadEditorialService.getGames(testDate);

        expect(result).toHaveLength(2);
        expect(result?.[0]?.id).toBe('match-1');
        expect(result?.[1]?.id).toBe('match-2');
      });
    });
  });
});
