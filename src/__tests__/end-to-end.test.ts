require("../register");

import ApolloClient, { DefaultOptions } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import fetch from "cross-fetch";

import test from "ava";
import gql from "graphql-tag";

const link = new HttpLink({
  uri: "https://api.entur.io/journey-planner/v2/graphql",
  fetch,
});

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "ignore",
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
};

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions,
});

test("end-to-end test should not throw", async (t) => {
  const doc = require("./fixtures/f2.graphql");
  await t.notThrowsAsync(() =>
    client.query({
      query: doc,
      variables: {
        quayIds: ["NSR:StopPlace:41613"],
      },
    })
  );
});

test("end-to-end should not throw when using fragments", async (t) => {
  const doc = require("./fixtures/f1.gql");

  await t.notThrowsAsync(() => {
    const query = gql`
      query {
        ...noticeFields
      }
      ${doc.fragments.noticeFields}
    `;
    return client.query({
      query,
    });
  });
});

test("end-to-end should throw if fragment does not exist", async (t) => {
  const doc = require("./fixtures/f1.gql");

  await t.throwsAsync(() => {
    const query = gql`
      query {
        ...someOther
      }
      ${doc.fragments.noticeFields}
    `;
    return client.query({
      query,
    });
  });
});
