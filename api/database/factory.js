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

Factory.blueprint('App/Models/User', (faker) => {
  return {
    email: faker.email(),
    password: faker.password()
  }
})

Factory.blueprint('App/Models/Tag', (faker) => {
  return {
    name: faker.word()
  }
})

Factory.blueprint('App/Models/Place', (faker) => {
  return {
    place: faker.company(),
    location: faker.city() + ', ' + faker.state(),
    used: faker.birthday()
  }
})

Factory.blueprint('App/Models/Illustration', (faker) => {
  return {
    title: faker.sentence(),
    author: faker.name(),
    source: faker.url(),
    content: faker.paragraph()
  }
})
