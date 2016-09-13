Math.random = undefined;

// generate a random integer in the interval [min, max]
const randInt = (min, max, prng) => {
    if (min > max) {
        console.error('randInt: min > max');
        return NaN;
    }
    return min + Math.floor((max - min + 1) * prng());
}

export {randInt};
