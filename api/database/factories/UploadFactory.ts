import Upload from 'App/Models/Upload'
import Factory from '@ioc:Adonis/Lucid/Factory'

export default Factory.define(Upload, ({ faker }) => {
  const textArray = ['image', 'video']
  const randomIndex = Math.floor(Math.random() * textArray.length);
  const randomElement = textArray[randomIndex];

  const imageArray = ['jpg', 'jpeg', 'pdf', 'webm', 'webp', 'mp4', 'png', 'gif']
  const randomImageIndex = Math.floor(Math.random() * imageArray.length);
  const randomImageElement = faker.lorem.word() + imageArray[randomImageIndex];
  return {
    name: randomImageElement,
    type: randomElement,
  }
}).build()
