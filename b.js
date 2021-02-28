const fetch = require('node-fetch');

fetch('https://bi.wisconsin.gov/t/DHS/views/VaccinesAdministeredtoWIResidents/VaccinatedWisconsin-County?:isGuestRedirectFromVizportal=y&:embed=y')
.then(res=>{
  for(const header of res.headers){
    console.log(`Name: ${header[0]}, Value:${header[1]}`);
  }
});

fetch("https://bi.wisconsin.gov/vizql/t/DHS/w/VaccinesAdministeredtoWIResidents/v/VaccinatedWisconsin-County/bootstrapSession/sessions/01BF580C41D44D6B91EA53BFE09D53FD-5:5", {
  "headers": {
    "accept": "text/javascript",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    "pragma": "no-cache",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "x-tsi-active-tab": "VaccinatedWisconsin-County",
    "cookie": "_fbp=fb.1.1614054287443.1963897570; tableau_locale=en; workgroup_session_id=null"
  },
  "referrer": "https://bi.wisconsin.gov/t/DHS/views/VaccinesAdministeredtoWIResidents/VaccinatedWisconsin-County?:isGuestRedirectFromVizportal=y&:embed=y",
  "referrerPolicy": "no-referrer-when-downgrade",
  "body": "worksheetPortSize=%7B%22w%22%3A1000%2C%22h%22%3A900%7D&dashboardPortSize=%7B%22w%22%3A1000%2C%22h%22%3A900%7D&clientDimension=%7B%22w%22%3A1536%2C%22h%22%3A796%7D&renderMapsClientSide=true&isBrowserRendering=true&browserRenderingThreshold=100&formatDataValueLocally=false&clientNum=&navType=Reload&navSrc=Top&devicePixelRatio=1.25&clientRenderPixelLimit=25000000&allowAutogenWorksheetPhoneLayouts=true&sheet_id=VaccinatedWisconsin-County&showParams=%7B%22checkpoint%22%3Afalse%2C%22refresh%22%3Afalse%2C%22refreshUnmodified%22%3Afalse%7D&stickySessionKey=%7B%22dataserverPermissions%22%3A%225b64629134e7b69b62ce50670a3e17177b6cad7b1bd2e1b3e44a714f46264429%22%2C%22featureFlags%22%3A%22%7B%7D%22%2C%22isAuthoring%22%3Afalse%2C%22isOfflineMode%22%3Afalse%2C%22lastUpdatedAt%22%3A1613492550723%2C%22viewId%22%3A5001%2C%22workbookId%22%3A1366%7D&filterTileSize=200&locale=en_US&language=en&verboseMode=false&%3Asession_feature_flags=%7B%7D&keychain_version=1",
  "method": "POST",
  "mode": "cors"
});