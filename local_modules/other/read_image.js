//////////////////////////////////////////////
// Function to read the Image from the link //
//////////////////////////////////////////////
const rp = require('request-promise'),
fs = require("fs");
module.exports = async (sender_psid, attachmentUrl, documents_length) => {
  var results;
  try{
    var options = {
      uri: attachmentUrl,
      headers: {
          'User-Agent': 'Request-Promise'
      },
      jpg: true
    };
    filePath = `./files/${sender_psid}/${documents_length}.jpg`;
    results = await (rp(options).pipe(fs.createWriteStream(filePath)));
  }
  catch (e){
  console.log(e);
  }
  return results;  
}