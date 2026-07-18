import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  'email.required': 'The email field is required',
  'email.email': 'Enter a valid email address',
  'email.database.unique': 'Email already exists',
  'password.required': 'The password field is required',
  'password.regex':
    'The password field must be at least 8 characters with one of the following: a number, uppercase character, and lowercase character.',
  'password.confirmed': 'The password fields do not match',
  'name.database.unique': 'Cannot update tag with the same name of an existing tag',
  'reason.required': 'The reason field is required',
  'message.required': 'The message field is required',
  'title.required': 'The title field is required',
  'title.maxLength': 'The title must not exceed 255 characters',
  'content.required': 'The content field is required',
  'content.maxLength': 'The content must not exceed 10000 characters',
})
