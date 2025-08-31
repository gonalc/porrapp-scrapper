# PorrApp Scraper

A real-time La Liga match data collector built with Bun that fetches game information and stores it in Supabase.

## 🚀 Features

- **Real-time Match Monitoring**: Tracks live games with minute-by-minute updates
- **Automated Data Collection**: Daily scheduled tasks to fetch upcoming matches
- **Database Integration**: Stores all data in Supabase with proper conflict handling
- **Performance Optimized**: Uses Bun for fast execution

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Supabase account and project
- Node.js 18+ (for compatibility)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd porrapp-scrapper
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_PROJECT_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase tables**
   
   Create the following table in your Supabase project:

   **Games table:**
   ```sql
   CREATE TABLE games (
     id SERIAL PRIMARY KEY,
     code TEXT UNIQUE NOT NULL,
     home_team TEXT NOT NULL,
     away_team TEXT NOT NULL,
     home_score INTEGER DEFAULT 0,
     away_score INTEGER DEFAULT 0,
     status TEXT NOT NULL,
     start_date TIMESTAMP WITH TIME ZONE NOT NULL,
     last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## 🏃‍♂️ Usage

### Start the application
```bash
bun start
```

The application will automatically:
- Run a daily job at 3 AM to fetch the next 8 days of matches
- Monitor today's games every minute for live updates
- Update match scores and statuses in real-time

### Run tests
```bash
bun test
```

### Lint code
```bash
bun run lint
```

## 📁 Project Structure

```
src/
├── index.ts                    # Application entry point
├── next-games.ts              # Game data fetching and transformation
├── services/
│   ├── cron.ts                # Scheduled task management
│   ├── supabase.ts            # Database operations
│   └── unidad-editorial.ts    # La Liga API client
└── utils/
    ├── dates.ts               # Date utilities
    ├── sluggify.ts            # Text slugification
    └── __tests__/
        └── sluggify.test.ts   # Unit tests
```

## 🔄 How It Works

1. **Data Source**:
   - **Unidad Editorial API**: Official La Liga match data

2. **Scheduling**:
   - **Daily Job (3 AM)**: Fetches matches from yesterday to +8 days
   - **Real-time Jobs**: Monitors today's active games every minute

3. **Data Flow**:
   ```
   Unidad Editorial API → Transform Data → Supabase Storage
   ```

## 🤝 Contributing

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Run quality checks**
   ```bash
   bun run lint
   bun test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use meaningful variable names

### Development Tools

- **Bun**: Runtime and package manager
- **oxlint**: Fast linting
- **Husky**: Git hooks for quality checks
- **lint-staged**: Staged file linting

## 📊 API Endpoints

The application consumes data from:

- **Unidad Editorial API**: `https://api.unidadeditorial.es/sports/v1/events`

## 🐛 Troubleshooting

### Common Issues

**Environment Variables Not Loading**
- Ensure `.env` file is in the root directory
- Check that variable names match exactly

**Supabase Connection Issues**
- Verify your Supabase URL and service role key
- Check if your Supabase project is active

**Memory Issues**
- Monitor memory usage during long-running sessions

## 📝 License

This project is private and proprietary.

## 🙋‍♂️ Support

For questions or issues:
1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include error logs and environment details

---

**Built with ❤️ using Bun and TypeScript**