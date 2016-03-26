import createGame from "./game";
import createDisplay from "./display";

const display = createDisplay({
    root: document.getElementById("game"),
});

let game = createGame({
    display: display,
});
