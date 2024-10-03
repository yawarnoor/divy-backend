import "dotenv/config";
import axios from "axios";

// Function to fetch portfolio data from Google Sheets using gsx2json
export async function fetchPortfolioData() {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME;
    const url = `http://localhost:3333/api?id=${spreadsheetId}&sheet=${sheetName}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return null;
  }
}
