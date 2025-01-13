import fs from "node:fs";

const css = String.raw`
window.addEventListener("DOMContentLoaded", () => {
    const css = \`

\`;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
});
`;

const js = String.raw`
window.addEventListener("DOMContentLoaded", () => {

});
`;

fs.writeFileSync("inject.js", css + js);
