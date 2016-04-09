import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: "js/index.js",
    dest: "build/bundle.js",
    format: "es6",
    plugins: [
        babel({ exclude: "node_modules/**" }),
        nodeResolve(),
        commonjs()
    ]
};
