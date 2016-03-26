# Many a Rogue refactor
This is a refactor of Many a Rogue. I made a separate rep because I swtiched from webpack to rollup, and I didn't want to go through the hassle of reconfiguring everything in node without messing up.

## How to build
In case you'd like to fork this, or if I forget how to do it myself.

This project requires node.js and npm, so install them if you don't have them.

To install all dependencies, go to the project folder and run

    $ npm install

To build the source, run

    $ npm run build

This will create or update the `build/bundle.js` file.
