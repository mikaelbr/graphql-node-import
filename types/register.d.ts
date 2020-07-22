declare module "*.graphql" {
  import { DocumentNode } from "graphql";
  interface Operations {
    [names: string]: DocumentNode;
  }
  interface Fragments {
    [names: string]: DocumentNode;
  }

  const value: DocumentNode;
  const content: string;
  const operations: Operations;
  const fragments: Fragments;

  export default value;
  export { operations, content, fragments };
}

declare module "*.gql" {
  import { DocumentNode } from "graphql";
  interface Operations {
    [names: string]: DocumentNode;
  }
  interface Fragments {
    [names: string]: DocumentNode;
  }

  const value: DocumentNode;
  const content: string;
  const operations: Operations;
  const fragments: Fragments;

  export default value;
  export { operations, content, fragments };
}
