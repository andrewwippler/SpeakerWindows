'use strict'

/*
|--------------------------------------------------------------------------
| Seeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

class Seeder {
  async run() {
    const users = await Factory.model('App/Models/User').createMany(3)
    const places = await Factory.model('App/Models/Place').makeMany(3)
    const tags = await Factory.model('App/Models/Tag').createMany(10)
    const illustrations = await Factory.model('App/Models/Illustration').createMany(5)

    // first; user 1; all tags; third place
    await illustrations[0].tags().attach(tags)
    await illustrations[0].places().save(places[2])

    // second; user 1; first 3 tags; second place
    await illustrations[1].tags().attach([tags[0], tags[1], tags[2]])
    await illustrations[1].places().save(places[1])

    // third; user 2; next 3 tags; first place
    await illustrations[2].tags().attach([tags[3], tags[4], tags[5]])
    await illustrations[2].places().save(places[0])

    // fourth; user 2; next 3 tags; third place
    await illustrations[3].tags().attach([tags[6], tags[7], tags[8]])
    await illustrations[3].places().save(places[2])

    // fifth; user 3; last tag; first place
    await illustrations[4].tags().attach(tags[9])
    await illustrations[4].places().save(places[0])

  }
}

module.exports = Seeder
