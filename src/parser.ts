// Code based on Webpack Loader from apollographql/graphql-tag
// The MIT License (MIT)
// Copyright (c) 2020 Meteor Development Group, Inc.
// Changes Copyright (c) 2020 Mikael Brevik

import { readFileSync } from "fs";
import gql from "graphql-tag";
import {
  DocumentNode,
  DefinitionNode,
  ASTNode,
  ExecutableDefinitionNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  Location,
  print,
} from "graphql";

type WritableDocumentNode = {
  kind: "Document";
  loc?: Location;
  definitions: ReadonlyArray<DefinitionNode>;
};

const parse = (filename: string) => {
  const content = readFileSync(filename, "utf-8");

  const doc = gql`
    ${content}
  `;

  const wDoc = expandImports(content, doc as WritableDocumentNode);

  let operationCount = doc.definitions.reduce(function (accum, op) {
    return op.kind === "OperationDefinition" ? accum + 1 : accum;
  }, 0);

  var definitionRefs: { [name: string]: Set<string> } = {};
  wDoc.definitions.forEach(function (def: ASTNode) {
    if (isExecutableDefinitionNode(def)) {
      var refs = new Set<string>();
      collectFragmentReferences(def, refs);
      definitionRefs[def.name?.value ?? ""] = refs;
    }
  });

  let operations: { [name: string]: WritableDocumentNode } = {};
  let fragments: { [name: string]: WritableDocumentNode } = {};

  for (const op of wDoc.definitions) {
    if (op.kind === "OperationDefinition") {
      if (!op.name) {
        if (operationCount > 1) {
          throw "Query/mutation names are required for a document with multiple definitions";
        } else {
          continue;
        }
      }

      const opName = op.name.value;
      operations[opName] = oneQuery(definitionRefs, wDoc, opName);
    }

    if (op.kind === "FragmentDefinition") {
      const opName = op.name.value;
      // Print and reparse to nullify loc data
      // fragments[opName] = oneQuery(definitionRefs, wDoc, opName);
      fragments[opName] = gql`
        ${print(oneQuery(definitionRefs, wDoc, opName))}
      `;
    }
  }

  return {
    doc,
    content,
    fragments,
    operations,
  };
};

export default parse;

function isFragmentDefinitionNode(a: any): a is FragmentDefinitionNode {
  return "kind" in a && a.kind === "FragmentDefinition";
}
function isOperationDefinitionNode(a: any): a is OperationDefinitionNode {
  return "kind" in a && a.kind === "OperationDefinition";
}
function isExecutableDefinitionNode(a: any): a is ExecutableDefinitionNode {
  return "selectionSet" in a;
}
function isDocumentNode(a: any): a is DocumentNode {
  return "definitions" in a;
}

// Collect any fragment/type references from a node, adding them to the refs Set
function collectFragmentReferences(node: ASTNode, refs: Set<string>) {
  if (node.kind === "FragmentSpread") {
    refs.add(node.name.value);
  } else if (node.kind === "VariableDefinition") {
    var type = node.type;
    if (type.kind === "NamedType") {
      refs.add(type.name.value);
    }
  }
  if (isExecutableDefinitionNode(node)) {
    node.selectionSet?.selections?.forEach(function (selection) {
      collectFragmentReferences(selection, refs);
    });
  }
  if (isExecutableDefinitionNode(node)) {
    (node.variableDefinitions ?? []).forEach(function (def) {
      collectFragmentReferences(def, refs);
    });
  }
  if (isDocumentNode(node)) {
    node.definitions.forEach(function (def) {
      collectFragmentReferences(def, refs);
    });
  }
}

type Named = { name?: { value: string } };
function hasName(a: any): a is Named {
  return "name" in a;
}

function find(doc: WritableDocumentNode, name: string): DefinitionNode[] {
  for (var i = 0; i < doc.definitions.length; i++) {
    var element = doc.definitions[i];
    if (hasName(element) && element.name?.value == name) {
      return [element];
    }
  }
  return [];
}

function oneQuery(
  definitionRefs: { [name: string]: Set<string> },
  doc: WritableDocumentNode,
  operationName: string
) {
  // Copy the DocumentNode, but clear out the definitions
  var newDoc: WritableDocumentNode = {
    kind: doc.kind,
    definitions: find(doc, operationName),
    loc: doc.hasOwnProperty("loc") ? doc.loc : undefined,
  };

  // Now, for the operation we're running, find any fragments referenced by
  // it or the fragments it references
  var opRefs = definitionRefs[operationName] || new Set<string>();
  var allRefs = new Set<string>();
  var newRefs = new Set<string>(opRefs);

  while (newRefs.size > 0) {
    let prevRefs = newRefs;
    newRefs = new Set();
    prevRefs.forEach(function (refName) {
      if (!allRefs.has(refName)) {
        allRefs.add(refName);
        var childRefs = definitionRefs[refName] || new Set();
        childRefs.forEach(function (childRef) {
          newRefs.add(childRef);
        });
      }
    });
  }

  allRefs.forEach(function (refName) {
    var op = find(doc, refName)[0];
    if (op) {
      newDoc.definitions = newDoc.definitions.concat(op);
    }
  });
  return newDoc;
}

function expandImports(source: string, doc: WritableDocumentNode) {
  const lines = source.split(/\r\n|\r|\n/);

  lines.some((line) => {
    if (line[0] === "#" && line.slice(1).split(" ")[0] === "import") {
      const importFile = line.slice(1).split(" ")[1];
      const parseDocument = require(importFile) as DocumentNode;
      doc.definitions = doc.definitions.concat(
        unique(parseDocument.definitions)
      );
    }
    return line.length !== 0 && line[0] !== "#";
  });

  return doc;
}

function unique(defs: readonly DefinitionNode[]) {
  var names: { [name: string]: boolean } = {};

  return defs.filter(function (def) {
    if (def.kind !== "FragmentDefinition") return true;
    var name = def.name.value;
    if (names[name]) {
      return false;
    } else {
      names[name] = true;
      return true;
    }
  });
}
