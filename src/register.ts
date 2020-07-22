import parse from "./parser";

const EXTENSIONS = ["graphql", "gql"];
EXTENSIONS.forEach((ext) => {
  require.extensions[`.${ext}`] = moduleResolution;
});

function moduleResolution(m: NodeJS.Module, filename: string) {
  const { doc, fragments, operations, content } = parse(filename);
  m.exports = doc;
  m.exports.content = content;
  m.exports.fragments = fragments;
  m.exports.operations = operations;
}
