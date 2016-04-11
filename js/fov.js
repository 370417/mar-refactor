const cubeDistance = (x1, y1, z1, x2, y2, z2) =>
    Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));

const cubeRound = ({x, y, z}) => {
    let [rx, ry, rz] = [x, y, z].map(Math.round);

    let [dx, dy, dz] = [rx - x, ry - y, rz - z].map(Math.abs);

    if (dx > dy && dx > dz) {
        rx = -ry - rz;
    } else if (dy > dz) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }
    return { x: rx, y: ry, z: rz };
};

const line = (x1, y1, x2, y2, callback, skip = 0) => {
    const z1 = -x1 - y1;
    const z2 = -x2 - y2;
    const dist = cubeDistance(x1, y1, z1, x2, y2, z2);
    let [x, y, z] = [x1, y1, z1];
    const [dx, dy, dz] = [x2 - x1, y2 - y1, z2 - z1].map(n => n / dist);
    for (let i = 0; i <= dist; i++) {
        if (i >= skip && callback(cubeRound({x, y, z}))) { break; }
        x += dx;
        y += dy;
        z += dz;
    }
};

const newfov = (ox, oy, width, height, transparent, reveal) => {
    reveal(ox, oy);

    const callback = ({x, y}) => {
        reveal(x, y);
        return !transparent(x, y);
    };

    for (let x = Math.floor(height / 2); x < width; x++) {
        line(ox, oy, x, 0, callback, 1);
        line(ox, oy, x - Math.floor(height / 2), height - 1, callback, 1);
    }

    for (let y = 0; y < height; y++) {
        line(ox, oy, Math.floor((height - y) / 2), y, callback, 1);
        line(ox, oy, width - Math.floor(y / 2), y, callback, 1);
    }
};

const xDir = [0, 1, 1, 0,-1,-1];
const yDir = [1, 0,-1,-1, 0, 1];

// displacement vector for moving tangent to a circle counterclockwise in a certain sector
const tangent = [
    [ 0,-1],//  \
    [-1, 0],//  -
    [-1, 1],//  /
    [ 0, 1],//  \
    [ 1, 0],//  -
    [ 1,-1],//  /
    [ 0,-1],//  \
];

// displacement vector for moving normal to a circle outward in a certain sector
const normal = [
    [ 1, 0],// -
    [ 1,-1],// /
    [ 0,-1],// \
    [-1, 0],// -
    [-1, 1],// /
    [ 0, 1],// \
    [ 1, 0],// -
];

// round a number, but round down if it ends in .5
const roundTieDown = n => Math.ceil(n - 0.5);

const fov = (ox, oy, transparent, reveal) => {
    reveal(ox, oy);

    const revealWall = (x, y) => {
        if (!transparent(x, y)) {
            reveal(x, y);
        }
    };

    for (let i = 0; i < 6; i++) {
        revealWall(ox + normal[i][0], oy + normal[i][1]);
    }

    const polar2rect = (radius, angle) => {
        const sector = Math.floor(angle);
        const arc = roundTieDown((angle - sector) * (radius - 0.5));
        return [
            ox + radius * normal[sector][0] + arc * tangent[sector][0],
            oy + radius * normal[sector][1] + arc * tangent[sector][1],
            radius * sector + arc,
        ];
    };

    // angles are measured from 0 to 6
    // radius - radius of arc
    // start & end - angles for start and end of arc
    const scan = (radius, start, end) => {
        let someRevealed = false;
        let [x, y, arc] = polar2rect(radius, start);
        let current = start;
        while (current < end) {
            if (transparent(x, y)) {
                current = arc / radius;
                if (current >= start && current <= end) {
                    reveal(x, y);
                    someRevealed = true;
                    if (current >= 0 && current <= 2) {
                        revealWall(x + 1, y - 1);
                    }
                    if (current >= 1 && current <= 3) {
                        revealWall(x, y - 1);
                    }
                    if (current >= 2 && current <= 4) {
                        revealWall(x - 1, y);
                    }
                    if (current >= 3 && current <= 5) {
                        revealWall(x - 1, y + 1);
                    }
                    if (current >= 4 && current <= 6) {
                        revealWall(x, y + 1);
                    }
                    if (current <= 1 || current >= 5) {
                        revealWall(x + 1, y);
                    }
                }
            } else {
                current = (arc + 0.5) / radius;
                if (someRevealed) {
                    scan(radius + 1, start, (arc - 0.5) / radius);
                }
                start = current;
            }
            // increment everything
            const displacement = tangent[Math.floor(arc / radius)];
            x += displacement[0];
            y += displacement[1];
            arc++;
        }
        if (someRevealed) {
            scan(radius + 1, start, end);
        }
    }
    scan(1, 0, 6);
};

export {fov};
