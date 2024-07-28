import { placeType } from "./placeType";
import { tagType } from "./tagtype";

export class UploadType {
  name: string | undefined;
  id: number | undefined;
  type: string | undefined;
}

export class illustrationType {
  uploads: Array<UploadType> | undefined;
  content: string | undefined;
  tags: Array<tagType> | undefined;
  places: Array<placeType> | undefined;
  source: string | undefined;
  author: string | undefined;
  title: string | undefined;
  id: number | undefined;

}
