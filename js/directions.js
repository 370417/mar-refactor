// direction names are based on clock directions
const DIR1 = {
    dx: 1,
    dy:-1,
    dz: 0,
};
const DIR3 = {
    dx: 1,
    dy: 0,
    dz:-1,
};
const DIR5 = {
    dx: 0,
    dy: 1,
    dz:-1,
};
const DIR7 = {
    dx:-1,
    dy: 1,
    dz: 0,
};
const DIR9 = {
    dx:-1,
    dy: 0,
    dz: 1,
};
const DIR11 = {
    dx: 0,
    dy:-1,
    dz: 1,
};

DIR1.clockwise = DIR3;
DIR3.clockwise = DIR5;
DIR5.clockwise = DIR7;
DIR7.clockwise = DIR9;
DIR9.clockwise = DIR11;
DIR11.clockwise = DIR1;

DIR1.counterclockwise = DIR11;
DIR11.counterclockwise = DIR9;
DIR9.counterclockwise = DIR7;
DIR7.counterclockwise = DIR5;
DIR5.counterclockwise = DIR3;
DIR3.counterclockwise = DIR1;

export {DIR1, DIR3, DIR5, DIR7, DIR9, DIR11};
