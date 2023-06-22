const { google } = require('googleapis');

async function fetchData(credentials) {

  const convertedData = {
    categories: []
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client});

  const spreadsheetId = '1gRYwfiReBDPaxzAlilPXD94EhU2ef4XfAOX4qzWjhuI';
  const range = 'Sheet1';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  const data = response.data.values

  for (let i = 1; i < data.length; i++) {
    const category = data[i][0];
    const heading = data[i][1];
    const subHeading = data[i][2];
    const iarl = data[i][3];
    const mrl = data[i][4];
    const lrl = data[i][5]
    const options = data[i].slice(6);
  
    const existingCategory = convertedData.categories.find(cat => cat.category === category);
  
    if (existingCategory) {
      existingCategory.questions.push({
        heading,
        subHeading,
        iarl,
        mrl,
        lrl,
        options
      });
    } else {
      convertedData.categories.push({
        category,
        questions: [{
          heading,
          subHeading,
          iarl,
          mrl,
          lrl,
          options
        }]
      });
    }
  }
  convertedData.lastUpdated = Date.now();

  return convertedData;
}
  

module.exports = fetchData;



  