# [WIP] `graphql-node-import`

Import `.graphql` and `.gql` files directly in Node. Access entire files, queries and fragments, making reusable structures. You can also import fragments from other GraphQL files.

This plays really well with the [VSCode GraphQL](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql) extension where you can run queries and get code completions directly in your editor.

Currently very much Work In Progress

## Usage

Using in node

```sh
node -r @mikaelb/graphql-node-import myFile.js
```

Or at the top of your entry file:

```ts
import "@mikaelb/graphql-node-import"; // This wil also include typings for the file types

// Or

require("@mikaelb/graphql-node-import");
```

## Examples

### Simple use

```graphql
# query.gql
query {
  someField
  anotherField
}
```

```ts
import query from "./query.gql";

// using something like apollo client
client.query({
  query,
});
```

### Multiple queries

```graphql
# query.gql
query Foo {
  someField
}

query Bar {
  otherField
}
```

```ts
import { operations } from "./query.gql";

// using something like apollo client
client.query({
  query: operations.Foo,
});
client.query({
  query: operations.Bar,
});
```

### Using fragments

```graphql
# fragments.gql
fragment fragName on SomeType {
  someField
}
```

```ts
import { fragments } from "./query.gql";
import gql from "graphql-tag";

const query = qgl`
query {
  ...fragName
}
${fragments.fragName}
`;

// using something like apollo client
client.query({
  query: operations.Foo,
});
client.query({
  query: operations.Bar,
});
```
