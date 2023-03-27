import { placeType } from "./placeType";
import { tagType } from "./tagtype";

export type illustrationType = {
  content: string;
  tags: Array<tagType>;
  places: Array<placeType>;
  source: string;
  author: string;
  title: string;
  id: number;

}
