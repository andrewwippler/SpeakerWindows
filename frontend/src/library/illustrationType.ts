import { placeType } from "./placeType";
import { tagType } from "./tagtype";

export class UploadType {
  name: string | undefined;
  id: number | undefined;
  type: string | undefined;
}

export class illustrationType {
  uploads: Array<UploadType> = [];
  content!: string;
  tags: Array<tagType> = [];
  places: Array<placeType> = [];
  source!: string;
  author!: string ;
  title!: string ;
  id!: number ;
  userRole?: string;
  private: boolean = false;
  owner_id?: number;
  team_id?: number;

}
