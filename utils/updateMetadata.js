const fs = require("fs");
const path = require("path");

const directoryPath = "ipfs/metadata";
const numberOfFilesToProcess = 2000;

for (let i = 0; i < numberOfFilesToProcess; i++) {
  const filePath = path.join(directoryPath, `${i}`);
  
  let tknType = "";
  let tknLevel = 0;

  if (i >= 0 && i <= 199) {
    tknType = "Común"; 
    tknLevel = 1; 
  }
  else if (i >= 200 && i <= 499) {
    tknType = "Raro";
    tknLevel = 2; 
  }
  else if (i >= 500 && i <= 699) {
    tknType = "Legendario";
    tknLevel = 3; 
  }
  else if (i >= 700 && i <= 999) {
    tknType = "Místico";
    tknLevel = 4; 
  }
  else if (i >= 1000 && i <= 1999) {
    tknType = "Whitelist";
    tknLevel = 5; 
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(data);

    // Modify the name property
    if (jsonData.hasOwnProperty("name")) {
      jsonData.name = `MOCHE#${i} - ${tknType}`;
    }

    if (jsonData.hasOwnProperty("attributes")) {
      jsonData.attributes.push(
        {
          trait_type: "Family",
          value: `${tknType}`
        }
      ); 
      jsonData.attributes.push(
        {
          trait_type: "Size",
          value: "276 x 372"
        }
      ); 
      jsonData.attributes.push(
        {
          trait_type: "Level",
          value: tknLevel
        }
      ); 
      jsonData.attributes.push(
        {
          display_type: "date", 
          trait_type: " Birthday", 
          value: 1696032000
        }
      ); 
    }

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
    // console.log(`Modified and saved ${filePath}`);
  } catch (err) {
    // console.error(`Error processing file ${filePath}: ${err.message}`);
  }
}