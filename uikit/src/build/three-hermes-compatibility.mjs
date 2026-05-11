import path from "node:path";
import { readFile } from "node:fs/promises";

const threeWebGPUNodeIndexGetterLoop = `// Set/get static properties for array elements (0-31).

for ( let i = 0; i < 32; i ++ ) {

\tproto[ i ] = {

\t\tget() {

\t\t\tthis._cache = this._cache || {};

\t\t\t//

\t\t\tlet element = this._cache[ i ];

\t\t\tif ( element === undefined ) {

\t\t\t\telement = new ArrayElementNode( this, new ConstNode( i, 'uint' ) );

\t\t\t\tthis._cache[ i ] = element;

\t\t\t}

\t\t\treturn element;

\t\t},

\t\tset( value ) {

\t\t\tthis[ i ].assign( nodeObject( value ) );

\t\t}

\t};

}`;

const threeWebGPUNodeIndexGetterFactory = `// Set/get static properties for array elements (0-31).

function createProtoElement( index ) {

\treturn {

\t\tget() {

\t\t\tthis._cache = this._cache || {};

\t\t\t//

\t\t\tlet element = this._cache[ index ];

\t\t\tif ( element === undefined ) {

\t\t\t\telement = new ArrayElementNode( this, new ConstNode( index, 'uint' ) );

\t\t\t\tthis._cache[ index ] = element;

\t\t\t}

\t\t\treturn element;

\t\t},

\t\tset( value ) {

\t\t\tthis[ index ].assign( nodeObject( value ) );

\t\t}

\t};

}

for ( let i = 0; i < 32; i ++ ) {

\tproto[ i ] = createProtoElement( i );

}`;

function patchThreeWebGPUForHermes(source, filePath, cwd) {
  const patched = source.replace(threeWebGPUNodeIndexGetterLoop, threeWebGPUNodeIndexGetterFactory);

  if (patched === source) {
    throw new Error(`Failed to patch Three WebGPU for Hermes: ${path.relative(cwd, filePath)}`);
  }

  return patched;
}

export function createUikitThreeHermesCompatibilityPlugin(cwd) {
  return {
    name: "uikit-three-hermes-compatibility",
    setup(esbuild) {
      esbuild.onLoad({ filter: /node_modules[/\\]three[/\\]build[/\\]three\.webgpu\.js$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");

        // Hermes bytecode captures the final loop value in Three's numeric Node accessors.
        return {
          loader: "js",
          contents: patchThreeWebGPUForHermes(source, args.path, cwd),
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}
