import { tagType } from "./tagtype";

export type illustrationType = {
  content: string;
  tags: Array<tagType>;
  source: string;
  author: string;
  title: string;
  id: number;

}
