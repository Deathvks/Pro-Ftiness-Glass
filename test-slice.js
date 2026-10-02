const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Profile.jsx", "utf8");

const splitIndex = content.indexOf("return (\\n    <>\\n      <Helmet>");
if (splitIndex === -1) {
    const splitIndex2 = content.indexOf("  return (\\n    <>\\n      <Helmet>");
    console.log("Split index 2:", splitIndex2);
} else {
    console.log("Split index:", splitIndex);
}
