require("../register");

import { print, parse } from "graphql";
import gql from "graphql-tag";

import { readFileSync } from "fs";
import { join } from "path";

import test from "ava";

const fixtures = ["f1.gql", "f2.graphql"].map((f) =>
  join(__dirname, "fixtures", f)
);

test("should parse fixtures", (t) => {
  fixtures.forEach(function (fixture) {
    const doc = require(fixture);
    const source = readFileSync(fixture, "utf-8");
    t.deepEqual(print(doc), print(parse(source)));
    t.is(doc.content, source);
  });
});

test("should fetch named queries", (t) => {
  const doc = require(fixtures[0]);
  t.truthy(doc.operations.ById);
  t.truthy(doc.operations.ByBBox);
});

test("should fetch fragments", (t) => {
  const doc = require(fixtures[0]);
  t.truthy(doc.fragments.estimatedCallFields);
  t.notThrows(() => print(doc.fragments.estimatedCallFields));
});

test("should export compilable fragments", (t) => {
  const doc = require(fixtures[0]);
  t.notThrows(
    () =>
      gql`
        query {
          ...noticeFields
        }
        ${doc.fragments.noticeFields}
      `
  );
});
