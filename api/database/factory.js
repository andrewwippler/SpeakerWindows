'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const _ = require('lodash')


Factory.blueprint('App/Models/User', (faker, i, data) => {
  let same_password = _.get(data, 'password', faker.password())
  return {
    email: _.get(data, 'email', faker.email()),
    password: same_password,
    password_confirmation: same_password,
  }
})

Factory.blueprint('App/Models/Tag', (faker, i ,data) => {
  return {
    name: _.get(data, 'name', faker.word()),
    user_id: _.get(data, 'user_id', faker.integer({ min: 1, max: 22 }))
  }
})

Factory.blueprint('App/Models/Place', (faker, i ,data) => {
  return {
    place: _.get(data, 'place', faker.company()),
    location: _.get(data, 'location', faker.city() + ', ' + faker.state()),
    used: _.get(data, 'used', faker.birthday()),
    user_id: _.get(data, 'user_id', faker.integer({ min: 1, max: 22 }))
  }
})

Factory.blueprint('App/Models/Upload', (faker, i, data) => {
  const textArray = ['image', 'video']
  const randomIndex = Math.floor(Math.random() * textArray.length);
  const randomElement = textArray[randomIndex];

  const imageArray = ['jpg', 'jpeg', 'pdf', 'webm', 'webp', 'mp4', 'png', 'gif']
  const randomImageIndex = Math.floor(Math.random() * imageArray.length);
  const randomImageElement = faker.word() + imageArray[randomImageIndex];
  return {
    name: _.get(data, 'name', randomImageElement),
    type: _.get(data, 'type', randomElement),
  }
})

Factory.blueprint('App/Models/Illustration', (faker, i ,data) => {
  return {
    title: _.get(data, 'title', faker.sentence()),
    author: _.get(data, 'author', faker.name()),
    source: _.get(data, 'source', faker.url()),
    content: _.get(data, 'content', faker.paragraph()),
    user_id: _.get(data, 'user_id', faker.integer({ min: 1, max: 22 }))
  }
})
