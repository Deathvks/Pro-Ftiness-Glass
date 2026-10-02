const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Profile.jsx", "utf8");

const splitIndex = content.indexOf("return (\\r\\n    <>\\r\\n      <Helmet>");
if (splitIndex !== -1) {
    console.log("Found CRLF");
} else {
    const lines = content.split("\\n");
    for (let i=0; i<lines.length; i++) {
        if (lines[i].includes("<Helmet>")) {
            console.log("Helmet on line", i, lines[i]);
            console.log("Previous line", lines[i-1]);
            console.log("Previous previous line", lines[i-2]);
        }
    }
}
