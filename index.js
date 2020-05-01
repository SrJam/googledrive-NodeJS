
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');




const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = 'token.json';


fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);

  authorize(JSON.parse(content), listFiles, dirCreate);
});

/**
 * 
 * @param {Object} credentials 
 * @param {function} callback 
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * 
 * @param {google.auth.OAuth2} oAuth2Client
 * @param {getEventsCallback} callback 
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // quarda o token 
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

//Lstar aquivos Driver

/**
 * Lista de nomes dos arquivos
// @param {google.auth.OAuth2} auth 
//  */
async function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(` Nome: ${file.name} \n ID:${file.id} \n Tipo: ${file.mimeType} \n --------------------------------- \n `);
      });
    } else {
      console.log('No files found.');
    }
  });
}



async function dirCreate(auth, name) {
  const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
    'name': name,
    'mimeType': 'application/vnd.google-apps.folder'
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      console.error(err);
    } else {
      console.log('Folder Id: ', file.id);
    }
  });
}
