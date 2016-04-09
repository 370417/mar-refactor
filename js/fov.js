/*   1
   _____
2 /\___/\ 0
 / /\ /\ \
|-|--@--|-|
 \ \/_\/ /
3 \/___\/ 5
     4
*/

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

export default (ox, oy, transparent, reveal) => {
    reveal(ox, oy);

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
                }
            } else {
                current = (arc + 0.5) / radius;
                reveal(x, y);
                someRevealed = true;
                scan(radius + 1, start, (arc - 0.5) / radius);
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

/*
export default (ox, oy, transparent, reveal) => {
    reveal(ox, oy);

    const rotate = ([x, y], transform) => ([
        ox + x * transform.xx + y * transform.yx,
        oy + x * transform.xy + y * transform.yy,
    ]);

    const scan = (y, start, end, transform) => {
        if (start >= end) {
            return;
        }
        let someTilesRevealed = false;
        const xmin = Math.round((y - 0.5) * start);
        const xmax = Math.ceil((y + 0.5) * end - 0.5);
        for (let x = xmin; x <= xmax; x++) {
            const [realx, realy] = rotate([x, y], transform);
            const currTransparent = transparent(realx, realy);
            if (currTransparent) {
                if (x >= y * start && x <= y * end) {
                    reveal(realx, realy);
                    someTilesRevealed = true;
                }
            } else {
                //if (x >= (y - 0.5) * start && x - 0.5 <= y * end) {
                //if (x >= y * start && x <= y * end) {
                    reveal(realx, realy);
                    someTilesRevealed = true;
                //}
                scan(y + 1, start, (x - 0.5) / (y + 0.5), transform);
                start = (x + 0.5) / (y - 0.5);
                if (start >= end) {
                    return;
                }
            }
        }
        if (someTilesRevealed) {
            scan(y + 1, start, end, transform);
        }
    };

    [
        { xx:-1, xy: 1, yx: 1, yy: 0 },
        { xx: 0, xy:-1, yx: 1, yy: 0 },
        { xx: 0, xy: 1, yx: 1, yy:-1 },
        { xx:-1, xy: 0, yx: 1, yy:-1 },
        { xx: 1, xy: 0, yx: 0, yy:-1 },
        { xx:-1, xy: 1, yx: 0, yy:-1 },
        { xx: 1, xy:-1, yx:-1, yy: 0 },
        { xx: 0, xy: 1, yx:-1, yy: 0 },
        { xx: 0, xy:-1, yx:-1, yy: 1 },
        { xx: 1, xy: 0, yx:-1, yy: 1 },
        { xx:-1, xy: 0, yx: 0, yy: 1 },
        { xx: 1, xy:-1, yx: 0, yy: 1 },
    ].forEach(scan.bind(null, 1, 0, 0.5));
};
*/
