import { RepositoryConstructProps } from "../construct/repository.construct";

export type Repository = RepositoryConstructProps & {
  id: string;
  owner: string;
};
