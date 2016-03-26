//import {rollup} from 'rollup';
import babel from 'rollup-plugin-babel';

export default {
    entry: "js/index.js",
    dest: "build/bundle.js",
    format: "es6",
    plugins: [
        babel({
            exclude: "node_modules/**"
        })
    ]
};