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
    // const users = await Factory.model('App/Models/User').createMany(3)
    const illustrations = await Factory.model('App/Models/Illustration').createMany(5)
    const places = await Factory.model('App/Models/Place').makeMany(3)
    const tags = await Factory.model('App/Models/Tag').createMany(10)

    //TODO: code is not attaching to the pivot table properly. the tag_id is
    // first; user 1; all tags; third place
    await illustrations[0].places().save(places[2])
    const allTags = tags.map(tag => tag.id);
    // console.log(tags)
    await illustrations[0].tags().attach(allTags)

    // second; user 1; first 3 tags; second place
    await illustrations[1].tags().attach([tags[0].id, tags[1].id, tags[2].id])
    await illustrations[1].places().save(places[1])

    // third; user 2; next 3 tags; first place
    await illustrations[2].tags().attach([tags[3].id, tags[4].id, tags[5].id])
    await illustrations[2].places().save(places[0])

    // fourth; user 2; next 3 tags; third place
    await illustrations[3].tags().attach([tags[6].id, tags[7].id, tags[8].id])
    await illustrations[3].places().save(places[2])

    // fifth; user 3; last tag; first place
    await illustrations[4].tags().attach(tags[9].id)
    await illustrations[4].places().save(places[0])

  }
}

module.exports = Seeder
