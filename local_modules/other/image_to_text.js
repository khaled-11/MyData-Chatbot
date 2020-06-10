// Text Async function
const rp = require('request-promise'),
textractScan = require("./textractDoc");
fs = require("fs");

module.exports = async (sender_psid, documents_length) => {
    var data = fs.readFileSync(`./files/${sender_psid}/${documents_length}.jpg`);
    var results;
    try {
      results = await textractScan(data);
    } catch (e) {
      throw e;
    } 
    let s = "";
    let t = 0;
    if (results){
    for (i = 0 ; i < results.Blocks.length ; ++i) {
      if (results.Blocks[i].Text && results.Blocks[i].BlockType === 'WORD'){
       s += results.Blocks[i].Text + " ";
       ++t;
       if (t % 10 == 0){
        s += '\n';
       }
  }}}
  fs.writeFile(`./files/${sender_psid}/${documents_length}.txt`, s, function (err) {
    if (err) {
          console.log("An error occured while writing JSON Object to File.");
          return console.log(err);
      }
      console.log("TXT file has been saved."); 
    });
    return s;
  }