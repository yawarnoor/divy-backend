export function cleanAndProcessStockData(fetchedData) {
    if (!fetchedData || !Array.isArray(fetchedData.rows)) {
      return { error: "Invalid or empty data received", stocks: {}, portfolio: {} };
    }
  
    const cleanedData = {};
    let portfolioData = {
      value: 'N/A',
      gain: 'N/A',
      dividendPayoutNow: 'N/A',
      futureDividendPayout3Years: 'N/A',
      futureDividendPayout5Years: 'N/A',
      futureDividendPayout10Years: 'N/A'
    };
  
    let dividendPayouts = [];
  
    fetchedData.rows.forEach((row, index) => {
      if (typeof row !== 'object' || row === null || Object.keys(row).length === 0) return; // Skip empty rows
  
      // Extract portfolio value and gain from the first row
      if (index === 0) {
        if (isString(row['Portfolio Value ']) && row['Portfolio Value '].startsWith('$')) {
          portfolioData.value = row['Portfolio Value ']; // Portfolio value
        }
        if (isString(row['Portfolio Gain']) && row['Portfolio Gain'].startsWith('$')) {
          portfolioData.gain = row['Portfolio Gain']; // Portfolio gain
        }
      }
  
      const stockTicker = row['Stock Ticker'] || '';
      if (!stockTicker) {
        if (isString(row['Portfolio Gain']) && row['Portfolio Gain'].startsWith('$')) {
          dividendPayouts.push(row['Portfolio Gain']); // Collect payout values
        }
        return;
      }
  
      // Extract stock data
      cleanedData[stockTicker] = {
        industry: row['Sector of Industry'] || 'N/A',
        piecePrice: parseFloat(row['Price']) || 0,
        buyPrice: parseFloat(row['Buy Price']) || 0,
        totalGainUSD: parseFloat(row['Gain (USD)']) || 0,
        dividend: isString(row['Dividend']) ? parseFloat(row['Dividend'].split(' ')[0]) || 0 : 0,
        dividendIncrease: isString(row['Dividnend Inc']) ? parseFloat(row['Dividnend Inc'].replace('%', '').trim()) || 0 : 0,
        industryAverage: row['Industry Avarage'] || 'N/A',
        dividendGrowth3Years: isString(row['Dividend Growth in 3 years']) ? parseFloat(row['Dividend Growth in 3 years'].replace('%', '').trim()) || 0 : 0,
        dividendGrowth5Years: isString(row['Dividend Growth in 5 years']) ? parseFloat(row['Dividend Growth in 5 years'].replace('%', '').trim()) || 0 : 0,
        dividendGrowth10Years: isString(row['Dividend Growth in 10 Years']) ? parseFloat(row['Dividend Growth in 10 Years'].replace('%', '').trim()) || 0 : 0,
        sumGrowth3Years: parseFloat(row['Sum Growth 3 Years']) || 0,
        sumGrowth5Years: parseFloat(row['Sum Growth 5 Years']) || 0,
        sumGrowth10Years: parseFloat(row['Sum Growth 10 Years']) || 0,
      };
    });
  
    // Assign future dividend payout values
    portfolioData.dividendPayoutNow = dividendPayouts[0] || 'N/A'; // First value is the current payout
    portfolioData.futureDividendPayout3Years = dividendPayouts[1] || 'N/A'; // Second value is for 3 years
    portfolioData.futureDividendPayout5Years = dividendPayouts[2] || 'N/A'; // Third value is for 5 years
    portfolioData.futureDividendPayout10Years = dividendPayouts[3] || 'N/A'; // Fourth value is for 10 years
  
    return {
      stocks: cleanedData,
      stockCount: Object.keys(cleanedData).length,
      portfolio: portfolioData,
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Helper function to check if value is a string
  function isString(value) {
    return typeof value === 'string' || value instanceof String;
  }
  