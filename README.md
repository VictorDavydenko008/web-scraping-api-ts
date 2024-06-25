# Web Scraping API

## Description

This project is a web scraping API that scrapes data from e-commerce websites and stores it in a database. It supports scraping data from online stores such as Rozetka and Telemart. The API provides endpoints to retrieve and manage the scraped data.

## Getting Started

## Prerequisites

- Node.js
- npm
- MongoDB

## Installation and launch

1. Clone the repository:
    ```bash
    git clone https://github.com/VictorDavydenko008/web-scraping-api.git
    cd web-scraping-api
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file based on the provided `.env.example`:
    ```bash
    cp .env.example .env
    ```

4. Compile TypeScript files:
     ```bash
        npm run build
    ```

5. Start the server:
    ```bash
    npm run start
    ```

## Additional Configuration
- Linting:
 Ensure you have ESLint installed and configured. Run linting with:
    ```bash
    npm run lint
    ```
    
- Docker:
 Use Docker to containerize the application. Make sure you have Docker installed. Build and run the Docker containers:
    ```
    docker-compose up

    ```

## Environment Variables
- `PORT`: Port for running the server.
- `DATABASE_URL`: URL of the MongoDB database.

## Endpoints
1. `POST /api/scrape/rozetka`
 Description:
Scrapes products data from multiple pages of a specified category starting from a given Rozetka URL.

 Example request body:
{
    "url": "https://rozetka.com.ua/ua/perfume/c2048522/",
    "pages_num": 2
}

 Parameters:
`url` (string): The starting Rozetka URL of the page to begin scraping.
`pages_num` (integer): The number of pages to scrape starting from the specified URL. If the provided `pages_num` exceeds the total available pages from the starting URL, scraping will stop at the last available page.

 Response: Scraped data in JSON format.

2. `POST /api/scrape/telemart`
 Description:
Scrapes products data from multiple pages of a specified category starting from a given Telemart URL.

 Example request body:
{
    "url": "https://telemart.ua/ua/city-1621/mouse/",
    "pages_num": 2
}

 Parameters:
`url` (string): The starting Telemart URL of the page to begin scraping.
`pages_num` (integer): The number of pages to scrape starting from the specified URL. If the provided `pages_num` exceeds the total available pages from the starting URL, scraping will stop at the last available page.

Response: Scraped data in JSON format.

3. `GET /api/`
 Description:
Retrieves all distinct product types from the database.

 Response: Distinct product types in JSON format.

4. `GET /api/all`
 Description:
Retrieves all products from the database.

 Response: All products stored in the database in JSON format.


5. `GET /api/items/:type`
 Description:
Retrieves all products of a specific type from the database.

 Parameters:
`type` (string): The type of products to retrieve from the database.

 Response: All products of a specific type stored in the database in JSON format.