import { placeType } from "./placeType";
import { tagType } from "./tagtype";

export class UploadType {
  name: string | undefined;
  id: number | undefined;
  type: string | undefined;
}

// export class illustrationType {

//   source!: string;
//   author!: string ;
//   title!: string ;
//   id!: number ;
//   userRole?: string;
//   private: boolean = false;
//   owner_id?: number;
//   team_id?: number;

// }
export class illustrationType {
  id!: number;
  title!: string;
  content!: string;
  author!: string | "";   // Matches backend nullability
  source!: string | "";   // Matches backend nullability
  private: boolean = false;          // Default to false if not provided

  // Use camelCase to match standard JSON serialization
  userId!: number;
  teamId?: number | null;

  // Relations
  uploads: Array<UploadType> = [];
  tags: Array<tagType> = [];
  places: Array<placeType> = [];

  // UI-specific fields (calculated on frontend or appended by API)
  userRole?: string;
}