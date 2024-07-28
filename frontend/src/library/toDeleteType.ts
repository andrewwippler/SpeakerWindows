export type toDeleteType = {
  redirect: boolean; // redirect to /
  path: string; // URI
  message: string; // Thing to say when item is deleted
  title: string; // Modal title
  delete_name: string; // Are you sure you want to delete <delete_name>
}